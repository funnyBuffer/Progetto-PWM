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
            fav_hero
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

async function updateUser(old_username, username, name, surname, email, password, fav_hero, credits, cards) {
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
            fav_hero
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

function openPack(quantity){
    AllCards = getCharacterIds();
    const pack = [];
    let i = 0;
    for(;i < quantity; i++){
        pack[i] = AllCards[getRandomInt(0, AllCards.length)];
    }
   // return [633, 633, 800, 800]
    return pack
}

/////////////////////////////////////////////
/*                 TRADES                  */
/////////////////////////////////////////////

// Mi permette di aggiungere le carte dentro la collezione dell'utente

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

// Mi aggiunge un nuovo trade nel database 

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

        await removeCards(user1, cards);

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

// Mi permette di decrementare la quantità delle carte dell'utente

async function removeCards(user, cards) {
    let connection;
    try {
        connection = await connectToDatabase();
        const database = connection.db;
        const usersCollection = database.collection("Users");

        for (const card of cards) {
            const cardString = card.toString();

            // Controllo la quantità attuale della carta prima di modificarla
            const userDoc = await usersCollection.findOne(
                { username: user, "cards.card": cardString },
                { projection: { "cards.$": 1 } }
            );

            if (!userDoc || !userDoc.cards || userDoc.cards.length === 0) {
                console.warn(`Carta ${cardString} non trovata per l'utente ${user}`);
                continue; 
            }

            const currentQuantity = userDoc.cards[0].quantity;

            // Decremento la quantità della carta
            if (currentQuantity > 0) {
                await usersCollection.updateOne(
                    { username: user, "cards.card": cardString },
                    { $inc: { "cards.$.quantity": -1 } }
                );
            }

            // Se la quantità diventa 0, rimuovo completamente la carta
            if (currentQuantity === 1) {
                await usersCollection.updateOne(
                    { username: user },
                    { $pull: { cards: { card: cardString } } }
                );
            }
        }

        return { success: true, message: "Carte rimosse con successo" };
    } catch (error) {
        console.error("Errore:", error);
        return { success: false, message: "Errore interno del server." };
    } finally {
        if (connection && connection.client) {
            await connection.client.close();
        }
    }
}


// Conta la quantità di ogni carta per un utente
async function countOccurrences(username, card) {
    if (!card) {
        return 0;
    }
    const cardProfile = await profileCards(username);
    if (!Array.isArray(cardProfile)) {
        return 0;
    }
    const targetCard = cardProfile.find(item => item.card && item.card.toString() === card.toString());
    if (!targetCard) {
        return 0;
    }
    return targetCard.quantity;
}


// Aggiunge un'offerta al trade
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
            { $push: { user2: newUser } } 
        );

        // Aggiorna le carte dell'utente
        await removeCards(user2, cards);

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

// Cerca un trade nel database
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

// Conferma un trade
async function confirmOffer(trade_id, user2Id) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        const trades = database.collection("Trades");

        const trade = await findTrade(trade_id);

        if (!trade.found) {
            return { success: false, message: "Trade non trovato" };
        }

        const currentTrade = trade.data;

        if (!currentTrade.user2.some(user => user.username === user2Id)) {
            return { success: false, message: "Utente che ha accettato non valido" };
        }

        // si restituisce le carte agli utenti scartati
        const excludedUsers = currentTrade.user2.filter(user => user.username !== user2Id);
        for (const excludedUser of excludedUsers) {
            await mergeCards(excludedUser.id, excludedUser.offered_cards);
        }

        const acceptedUser = currentTrade.user2.find(user => user.username === user2Id);
        user1_offeredCards = currentTrade.user1.offered_cards.flat();
        
        const updatedTrade = {
            id: trade_id,
            user1: { username: currentTrade.user1.username, offered_cards: acceptedUser.offered_cards },
            user2: { username: acceptedUser.username, offered_cards: user1_offeredCards },
            status: 'completed'
        };
        

        await mergeCards(updatedTrade.user1.username, updatedTrade.user1.offered_cards);
        await mergeCards(updatedTrade.user2.username, updatedTrade.user2.offered_cards);

        const tradeObjectId = new ObjectId(trade_id);
        const updateResult = await trades.updateOne(
            { _id: tradeObjectId },
            { $set: updatedTrade }
        );

        if (updateResult.modifiedCount > 0) {
            return { success: true, message: "Trade completato con successo" };
        } else {
            return { success: false, message: "Impossibile completare il trade" };
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

async function removeTrade(trade_id) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        const trade = await findTrade(trade_id);

        if (!trade.found) {
            return { success: false, message: "Trade non trovato" };
        }

        const currentTrade = trade.data;

        await mergeCards(currentTrade.user1.username, currentTrade.user1.offered_cards);        
        const allUsers = currentTrade.user2; 
        for (const user of allUsers) {
            await mergeCards(user.username, user.offered_cards);
        }

        const updatedTrade = {
            id: trade_id,
            status: 'cancelled'
        };

        if (deleteResult.deletedCount === 1) {
            return { success: true };
        } else {
            return { success: false };
        }
    } catch (error) {
        console.error("Errore durante la cancellazione del trade:", error);
        return { success: false, message: "Errore interno del server." };
    } finally {
        if (client) {
            await client.close();
        }
    }
}   

async function showTrades(username) {  
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        const trades = await database.collection('trades').find({ "user1.username": username }).toArray();
        return { success: true, trades: trades };
    
    } catch (error) {
        return { success: false, message: "Errore interno del server." };
    } finally {
        if (client) {
            await client.close();
        }
    }
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
                   addOffer,
                   confirmOffer,
                   removeTrade,
                   showTrades
                };
