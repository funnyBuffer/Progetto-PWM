const crypto = require('crypto');
const CryptoJS = require("crypto-js");

const {connectToDatabase} = require('./config/db');

const jwt = require('jsonwebtoken');

function isInvalidEmail(email){
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailRegex.test(email); 
}

async function addUser(res, username, name, surname, email, password, fav_hero) {

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
            fav_hero
        };

        const result = await database.collection("Users").insertOne(user);

        res.status(201).send({
            message: "Utente aggiunto con successo!",
            userId: result.insertedId,
        });

        client.close();
    } catch (err) {
        console.error("Errore durante l'aggiunta dell'utente:", err);
        res.status(500).send({ error: "Errore con la connessione al database" });
    }
}

async function updateUser(res, old_username, username, name, surname, email, password, fav_hero, credits) {
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        const userResult = await findUser(old_username);

        if (!userResult.found) {
            return res.status(404).send({ error: "Utente non trovato" });
        } 
        ///Controllo nuove credenziali
        if(email != null){
            if(await findEmail(email)) return res.status(409).send({ message: "Email già in uso" });
        }
        if(username != null){
            if(await findUser(username)) return res.status(409).send({ message: "Username già preso" });
        }
        if(password != null){
            if(userResult.data.password == password) return res.status(409).send({ message: "La password nuova deve essere diversa da quella precedente" });
        }

        const existingUser = userResult.data;  

        const updates = {
            username,
            name,
            surname,
            email,
            password,
            fav_hero,
            credits
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

        if (result.modifiedCount > 0) {
            res.status(200).send({
                message: "Utente aggiornato con successo!"
            });
        } else {
            res.status(404).send({ error: "Nessun aggiornamento effettuato" });
        }

        client.close();
    } catch (err) {
        console.error("Errore durante l'aggiornamento dell'utente:", err);
        res.status(500).send({ error: "Errore con la connessione al database" });
    }
}


//il filter è eseguita sull'username
async function findUser(filter) { 
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;
        
        // Cerca l'utente
        const user = await database.collection("Users").findOne({ username: filter });

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

async function deleteUser(res, username, password) {
    let client;
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const user = await database.collection("Users").findOne({ username });

        if (!user) {
            return res.status(404).send({ message: "Utente non trovato" });
        }

        isPasswordValid = user.password == crypto.createHash('sha256').update(password).digest('hex');

        if (!isPasswordValid) {
            return res.status(401).send({ message: "Password non valida" });
        }

        const deleteResult = await database.collection("Users").deleteOne({ username });

        if (deleteResult.deletedCount === 1) {
            return res.status(200).send({ message: "Utente eliminato con successo" });
        } else {
            return res.status(500).send({ message: "Errore durante l'eliminazione dell'utente" });
        }
    } catch (error) {
        console.error("Errore durante la cancellazione dell'utente:", error);
        return res.status(500).send({ message: "Errore interno del server" });
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

async function login(res, username, password){
    let client;
    try{
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const user = await findUser(username);
        let token; 

        if(user.found){
            if(user.data.password == crypto.createHash('sha256').update(password).digest('hex')){
                //generazione di un token
                const payload = {username}
                token = jwt.sign(payload, process.env.secret_key, { expiresIn: '1h' });
            } else {
                res.status(400).send({message:"Credenziali errate"})
                return; 
            }
        } else{
            res.status(404).send({message:"Utente non esistente"});
            return;
        }
        res.cookie('authToken', token, {
            httpOnly: true, // Il cookie è accessibile solo dal server
            secure: true, // Usa `true` se utilizzi HTTPS
            sameSite: 'Strict', // Protegge contro CSRF
            maxAge: 60 * 60 * 1000, // Durata di 1 ora
          });
        return res.status(200).send({
            message:"Autenticazione effettuata"
        });

    } catch(error){
        console.log("Errore durante il login:",error);
        return res.status(500).send({message:"Errore interno del server"})
    } finally {
        await client.close();
    }
}
  
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* 
        DA TESTARE
    */
async function profileCards(){
    let client;
    try{
        const connection = await connectToDatabase();
        const database = connection.db;
        client = connection.client;

        const token = req.cookies.authToken;

        if(!token){
            return res.status(403).send({ error: "Accesso non autorizzato" });
        }
    
        jwt.verify(token, process.env.secret_key, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Token non valido" });
            }
            const user = await findUser(decoded.username)
            
            if(user.found){
                res.status(200).send({message:"Carte del profilo fornite con successo"})
                return user.data.cards;
            }
        });
        
    } catch(error){
        return res.status(500).message({message:"Errore interno del server"})
    } finally {
        await client.close();
    }
}

//Bisogna capire come tirare fuori 5 eroi casuali
/* 
    DA CONTINUAREEEEEEEEEEEEEEEEEEEEEEEEEEEE
     */
function openPack(){
    const numbers = new Set();
    
    while (numbers.size < 5) {
        const randomNumber = Math.floor(Math.random() * 100) + 1; 
        numbers.add(randomNumber);
    }

    return [...numbers]; 
}

async function addNewTrade(res, user1, cards){

    

}

async function confirmTrade(){

}

function MD5(string){
    const hash = CryptoJS.MD5(string).toString(CryptoJS.enc.Hex);
    return hash;
}

function getFromMarvel(url, query, publicApiKey, privateApiKey) {
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

module.exports = { addUser,
                   updateUser,
                   findUser,
                   findEmail, 
                   deleteUser, 
                   login, 
                   isInvalidEmail,
                   getFromMarvel
                };
