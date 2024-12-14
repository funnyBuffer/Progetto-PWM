const { MongoClient } = require('mongodb');

// URI del database (locale o remoto)
//const uri = 'mongodb://localhost:3000';

// Nome del database
const dbName = 'PWM';

// Crea il client
//const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

/* async function connectToDatabase() {
  try {
    // Connessione al server MongoDB
    await client.connect();
    console.log('Connesso al database MongoDB!');

    // Accedi al database
    const db = client.db(dbName);

    // Ritorna l'oggetto del database per altre operazioni
    return db;
  } catch (err) {
    console.error('Errore di connessione al database:', err);
  }
} */

// Esporta il client e la funzione di connessione
module.exports = { connectToDatabase, client };


const fs = require('fs')
const express = require('express')
var bodyParser = require('body-parser')


const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

const { MongoClient, ObjectId } = require('mongodb');
const uri = "mongodb+srv://davidpizzolato1:dezLNNLcj1eL5LBk@clusteresame.iilpiih.mongodb.net/?retryWrites=true&w=majority&appName=ClusterEsame";
const client = new MongoClient(uri);

const app = express()
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const port = 3000

app.listen(port, () => console.log(`Porta in ascolto ${port}`))


///////////////  REGISTER  ///////////////

function register(req, res) {

}

/////////////// LOGIN  /////////////////


async function login(req, res) {
    var email = body.email
    var password = body.password

    const client = await client.connect();
    try {
        var user = await pwmClient.db("Database").collection("Utenti").find({
            '$and': [
                { 'email': email },
                { 'password': password }
            ]
        }).toArray();

        
    } catch (e) {
        res.status(401).send("Credenziali errate")
    } finally {
        client.close()
    }
}

app.post("/register", async (req, res) => {
    login(req, res)
})

app.post("/login", async (req, res) => {
    login(req, res)
})

