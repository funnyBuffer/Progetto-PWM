const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const path = require('path');
const fs = require('fs');

const {connectToDatabase} = require('./config/db');

const jwt = require('jsonwebtoken');

const publicApiKey = '7b6a018198f54a575f355e4641226908';
const privateApiKey = '1f48c7f19021c0a03bd329a8d9247471135fdf1e';


//////////////////////////////////////////////
/*                  UTENTE                  */
//////////////////////////////////////////////

function isInvalidEmail(email){
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailRegex.test(email); 
}

async function addUser(username, name, surname, email, password, fav_hero) {

    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        // cifratura password //

        password = crypto.createHash('sha256')
                         .update(password)
                         .digest('hex');

        const user = {
            username,
            name,
            surname,
            email,
            password,
            credits: 0,
            cards: [],
            fav_hero,
            offer_cards: []
        };

        const result = await database.collection("Users").insertOne(user);

        client.close();
    } catch (err) {
        console.error("Errore durante l'aggiunta dell'utente:", err);
    }
}

async function updateUser(old_username, username, name, surname, email, password, fav_hero, credits, cards, offer_cards) {
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        const userResult = await findUser(old_username);
        const existingUser = userResult.data;

        const updates = {
            username,
            name,
            surname,
            email,
            password,
            credits,
            cards,
            fav_hero,
            offer_cards
        };

        const filteredUpdates = Object.fromEntries(
            Object.entries(updates).filter(([key, value]) => value != null)
        );

        const updateDoc = {
            $set: {
                ...existingUser,
                ...filteredUpdates
            }
        };

        const result = await database.collection("Users").updateOne(
            { _id: userResult.data._id },
            updateDoc
        );

        client.close();

        return result.modifiedCount > 0;
    } catch (err) {
        console.error("Errore durante l'aggiornamento dell'utente:", err);
        throw new Error("Errore con la connessione al database");
    }
}


async function findUser(username) { 
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        // Cerca l'utente
        const user = await database.collection("Users").findOne({ username: username });

        if (user) {
            return { found: true, data: user }; 
        } else {
            return { found: false }; 
        }
    } catch (error) {
        console.error("Errore durante la ricerca:", error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

//il filter è eseguito sulla mail
async function findEmail(filter) { 
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        // Cerca l'utente
        const user = await database.collection("Users").findOne({ email: filter });

        if (user) {
            return { found: true }; 
        } else {
            return { found: false }; 
        }
    } catch (error) {
        console.error("Errore durante la ricerca:", error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function deleteUser(username) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const deleteResult = await database.collection("Users").deleteOne({ username });

        if (deleteResult.deletedCount === 1) {
            return true; // Utente eliminato con successo
        } else {
            return false; // Nessuna eliminazione effettuata
        }
    } catch (error) {
        console.error("Errore durante la cancellazione dell'utente:", error);
        return;
    } finally {
        if (client) {
            try {
                await client.close();
            } catch (closeError) {
                console.error("Errore durante la chiusura del client:", closeError);
            }
        }
    }
}

async function login(username, password) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const user = await findUser(username);

        if (!user.found) {
            return { success: false, status: 404, message: "Utente non esistente" };
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        if (user.data.password !== hashedPassword) {
            return { success: false, status: 400, message: "Credenziali errate" };
        }

        const payload = { username };
        const token = jwt.sign(payload, process.env.secret_key, { expiresIn: '1h' });

        return { success: true, status: 200, message: "Autenticazione effettuata", token };

    } catch (error) {
        console.error("Errore durante il login:", error);
        return { success: false, status: 500, message: "Errore interno del server" };
    } finally {
        if (client) {
            await client.close();
        }
    }
}


async function profileCards(username){
    let client;
    try{
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const user = await findUser(username)
            
        if (user.found) {
            let cards = user.data.cards;

            if (Array.isArray(cards)) {
                return cards;
            } else if (typeof cards === "string") {
                try {
                    const parsedCards = JSON.parse(cards);
                    if (Array.isArray(parsedCards)) {
                        return parsedCards;
                    }
                } catch (err) {
                    console.error("Errore nel parsing delle card:", err);
                }
            } else if (typeof cards === "object" && cards !== null) {
                return Object.values(cards);
            }

            console.error("Le card non sono un array valido:", cards);
            return [];
        }
 
    } catch(error){
        console.log("Errore interno del server");
        return; 
    } finally {
        await client.close();
    }
}

/////////////////////////////////////////////
/*                 MARVEL                  */
/////////////////////////////////////////////

function MD5(string){
    return CryptoJS.MD5(string).toString(CryptoJS.enc.Hex);
}

function getFromMarvel(url, query) {
    try {
        var timestamp = Date.now();
        var parameters = `ts=${timestamp}&apikey=${publicApiKey}&hash=${MD5(timestamp+privateApiKey+publicApiKey)}&`
        return fetch(`http://gateway.marvel.com/v1/${url}?${parameters}${query}`)
        .then(response => response.json())
        .catch(error => console.log('error', error));
    } catch (error) {
        console.error("Errore durante la fetch:", error);
    }
}

async function fetchCharacterIds() {
    const limit = 100; 
    let offset = 0;
    let total = 0;
    const characterIds = [];

    try {
        do {
            const result = await getFromMarvel(
                'public/characters',
                `limit=${limit}&offset=${offset}`,
            );

            if (result && result.data && result.data.results) {
                const data = result.data;
                total = data.total;
                offset += limit;

                data.results.forEach(character => {
                    characterIds.push(character.id);
                });
            } else {
                console.error('Nessun dato trovato o errore nella risposta');
                break;
            }
        } while (offset < total);

        // Salvo gli ID nel file JSON
        const filePath = path.join(__dirname, 'cardsID.json');
        fs.writeFileSync(filePath, JSON.stringify(characterIds, null, 2));
    } catch (error) {
        console.error('Errore durante il recupero degli ID dei personaggi:', error);
        throw error;
    }
}

function getCharacterIds() {
    const filePath = path.join(__dirname, 'cardsID.json');

    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const characterIds = JSON.parse(fileContent);
            return characterIds; 
        } else {
            console.error('Il file cardsID.json non esiste.');
            return []; 
        }
    } catch (error) {
        console.error('Errore durante la lettura del file cardsID.json:', error);
        throw error;
    }
}

function scheduleFetchCharacterIds() {
    fetchCharacterIds(); 
    const twelveHours = 12 * 60 * 60 * 1000; 
    setInterval(fetchCharacterIds, twelveHours);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function openPack(){
    AllCards = getCharacterIds();
    const pack = [];
    let i = 0;
    for(;i < 5; i++){
        pack[i] = AllCards[getRandomInt(0, AllCards.length)];
    }
    return pack
}

async function addNewTrade(user1, cards){
    
    
    
}

async function confirmTrade(){

}

module.exports = { addUser,
                   updateUser,
                   findUser,
                   findEmail, 
                   deleteUser, 
                   login, 
                   isInvalidEmail,
                   getFromMarvel,
                   scheduleFetchCharacterIds,
                   getCharacterIds, 
                   openPack,
                   profileCards
                };
