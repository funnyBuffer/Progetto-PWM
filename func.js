const user = {
    username: "",
    name: "",
    surname: "",
    email: "",
    password: "",
    credits: 0,
    cards: [],
    fav_hero: ""
};

const {connectToDatabase} = require('./db');

async function addUser(db, res, username, name, surname, email, password, fav_hero) {

    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        /////////// Controlli sulle credenziali /////////////////

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

        // Trova l'utente esistente
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

async function OldupdateUser(db, res, username, name, surname, email, password, fav_hero) {
    
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        result = findUser(username); 

        const filter = { username: result.username};

        const options = { upsert: false }; 

        const updateDoc = {
            $set: Object.fromEntries(
                Object.entries(updates).filter(([key, value]) => value !== null)
            )
        };

        const result = await collection.updateMany(filter, updateDoc, options);

        res.status(201).send({
            message: "Utente aggiornato con successo!",
            userId: result.insertedId,
        });

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

async function deleteUser(username, password){

    try{
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        const user = await collection.deleteMany(filter);

    } catch(error){
        console.log("Errore durante la cancellazione dell'utente", error);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = { addUser, updateUser, findUser, deleteUser};
