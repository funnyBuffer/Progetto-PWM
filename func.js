const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');

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
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

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

        if (result.acknowledged) {
            return { success: true };
        } else { 
            return { success: false };
        }
    } catch (err) {
        console.error("Errore durante l'aggiunta dell'utente:", err);
    } finally {
        if (client) {
            await client.close();
        }
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
    
    try {

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
    } 
}

async function profileCards(username) {
    const user = await findUser(username);
    if (user.found) {
        let cards = user.data.cards;

        if (Array.isArray(cards)) {
            return cards;
        } else {
            console.error("L'utente non ha ancora cards");
            return [];
        }
    } else {
        console.error("Utente non trovato.");
        return [];
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
    return [700, 700, 700, 450, 450]
    return pack
}

async function mergeCards(username, newCards) {
    // Conta le occorrenze di ciascuna carta
    const cardCount = newCards.reduce((acc, card) => {
        const cardString = card.toString();
        acc[cardString] = (acc[cardString] || 0) + 1;
        return acc;
    }, {});

    const userCardProfile = await profileCards(username); 
    const connection = await connectToDatabase();
    const database = connection.db;

    try {
        // Scorri tutte le nuove carte e le occorrenze
        for (const [cardString, count] of Object.entries(cardCount)) {
            // Verifica se la carta esiste già nel profilo dell'utente
            const existingCardIndex = userCardProfile.findIndex(item => item.card === cardString);

            if (existingCardIndex !== -1) {
                // Se la carta esiste già, incrementa la quantità
                await database.collection("Users").updateOne(
                    { username: username, "cards.card": cardString },
                    { $inc: { "cards.$.quantity": count } }
                );
            } else {
                // Se la carta non esiste, la aggiungi con la quantità corrispondente
                await database.collection("Users").updateOne(
                    { username: username },
                    { $push: { cards: { card: cardString, quantity: count } } }
                );
            }
        }
    } catch (error) {
        console.error("Errore durante la fusione delle carte:", error);
    } 
}

async function addNewTrade(user1, cards) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        const trade = {
            user1: { 
                username: user1, 
                offered_cards: [cards] 
            },
            user2: [
                {
                    username: null,
                    offered_cards: []
                }
            ],
            status: 'pending'
        };

        const result = await database.collection("Trades").insertOne(trade); 

        await updateCards(user1, cards);

        if (result.acknowledged) {
            return { success: true };
        } else {
            return { success: false };
        }
    } catch (error) {
        console.error("Errore durante la creazione del trade:", error);
        return { success: false, message: "Errore interno del server." };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function updateCards(user, cards){
    try{
        const connection = connectToDatabase();
        const database = connection.db;
        for (const card of cards) {
            const cardString = card.toString();

                // Decremento la quantità della carta
            const updateResult = await database.collection("Users").updateOne(
                { username: user, "cards.card": cardString },
                { $inc: { "cards.$.quantity": -1 } }
            );

            // Se la quantità arriva a 0, rimuovo completamente la carta
            if (updateResult.modifiedCount > 0) {
                await database.collection("Users").updateOne(
                    { username: user, "cards.card": cardString, "cards.quantity": 0 },
                    { $pull: { cards: { card: cardString } } }
                );
            }
        }
        // Aggiungo le carte dentro offer cards
        for (const card of cards) {
            const cardString = card.toString();
            await database.collection("Users").updateOne(
                { username: user },
                { $push: { offer_cards: { card: cardString, quantity: 1 } } }
            );
        } 
    } catch (error){
        return { success: false, message: "Errore interno del server." };  
    }
} 

async function countOccurrences(username, card) {
    const cardProfile = await profileCards(username);  
    const targetCard = cardProfile.find(item => item.card === card.toString());
    return targetCard ? targetCard.quantity : 0;
}

async function addOffer(user2, cards, trade_id) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const trade = await findTrade(trade_id);

        if (!trade.found) {
            console.log("Trade non trovato");
            return { success: false, message: "Trade non trovato" };
        }

        // Verifica che `user2` sia un array
        if (!Array.isArray(trade.data.user2)) {
            trade.data.user2 = [];
        }

        // Controlla se l'utente esiste già nell'array `user2`
        const userAlreadyExists = trade.data.user2.some(user => user.username === user2);

        if (userAlreadyExists) {
            return { success: false, message: "Il secondo utente è già presente in questo trade" };
        }

        // Crea il nuovo utente da aggiungere
        const newUser = {
            username: user2,
            offered_cards: cards
        };

        // Aggiorna il trade nel database
        const tradeObjectId = new ObjectId(trade_id);
        const updateResult = await database.collection("Trades").updateOne(
            { _id: tradeObjectId },
            { $push: { user2: newUser } } // Aggiunge il nuovo utente all'array `user2`
        );

        // Aggiorna le carte dell'utente
        await updateCards(user2, cards);

        // Controlla se l'aggiornamento è andato a buon fine
        if (updateResult.modifiedCount > 0) {
            return { success: true, message: "Trade aggiornato con successo" };
        } else {
            return { success: false, message: "Impossibile aggiornare il trade" };
        }
    } catch (error) {
        console.error("Errore:", error);
        return { success: false, message: "Errore interno del server." };
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function findTrade(trade_id) {
    try{
        const connection = await connectToDatabase();
        const database = connection.db;
        const tradeObjectId = ObjectId.createFromHexString(trade_id);
        const trade = await database.collection("Trades").findOne({ _id: tradeObjectId });

        if(trade){
            return {found: true, data: trade}
        } else {
            return {found: false}
        }
    } catch(error){
        console.log("Errore:", error);
        return {found: false, message: "Errore durante la ricerca del trade"}
    } 
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
                   profileCards,
                   addNewTrade,
                   countOccurrences,
                   mergeCards,
                   addOffer
                };
