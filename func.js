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
    

    /////////// Controlli sulle credenziali /////////////////

    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

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

async function updateUser(db, res, username, name, surname, email, password, fav_hero) {
    
    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        result = findUser(username); 

        const filter = { username: username };

        const options = { upsert: false }; 

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

    try {
        const connection = await connectToDatabase();
        const database = connection.db;
        const client = connection.client;

        // Cerca l'utente in base al filtro
        const user = await collection.findMany(filter);

        if (user) {
            return { found: true, data: user }; // Restituisci true e i dati dell'utente
        } else {
            return { found: false }; // Restituisci false se l'utente non esiste
        }
    } catch (error) {
        console.error("Errore durante la ricerca:", error);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = { addUser, updateUser, findUser };
