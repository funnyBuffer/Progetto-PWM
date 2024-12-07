const { MongoClient } = require('mongodb');

require('dotenv').config();

const uri = process.env.Cluster

async function connectToDatabase(){
    const client = new MongoClient(uri);
    try{
        await client.connect();
        console.log("Connesso a MongoDB");
        const db = client.db("PWM");
        return {db, client}
    }catch(err){
        console.error("Errore con la connessione col database", err);
    }
}

module.exports = { connectToDatabase };