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


module.exports = { addUser };
