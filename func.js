const crypto = require('crypto');

const {connectToDatabase} = require('./db');

async function addUser(db, res, username, name, surname, email, password, fav_hero) {

    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        /////////// Controlli sulle credenziali ///////////
        if (name.length < 3) {
            res.status(400).send("Nome troppo corto");
            return;
        } 
        if (surname.length < 3) {
            res.status(400).send("Cognome troppo corto");
            return;
        }
        if(password.length < 8){
            res.status(400).send("Password troppo corta");
            return;
        }
        if((await findUser(username)).found){
            res.status(400).send("Username già esistente");
            return;
        }
        if((await findEmail(email)).found){
            res.status(400).send("Email già usata");
            return;
        }

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

async function updateUser(db, res, userId, old_username, username, name, surname, email, password, fav_hero) {
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        const userResult = await findUser(old_username);

        if (!userResult.found) {
            return res.status(404).send({ error: "Utente non trovato" });
        } 

        const existingUser = userResult.data;  

        const updates = {
            username,
            name,
            surname,
            email,
            password,
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
        if(user.found){
            if(user.data.password == crypto.createHash('sha256').update(password).digest('hex')){

            } else {
                res.send(400).send
                return; 
            }
        } else{
            res.status(404).send({message:"Utente non esistente"});
            return;
        }

    } catch(error){
        console.log("Errore durante il login:",error);
        return res.status(500).send({message:"Errore interno del server"})
    } finally {
        await client.close();
    }
}

module.exports = { addUser, updateUser, findUser, deleteUser, login };
