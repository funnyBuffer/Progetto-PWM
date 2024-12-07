const express = require('express')
const {connectToDatabase} = require('./db');

require('dotenv').config();

const app = express()
const port = process.env.port;

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get('/users', async (req, res) => {
  try{
    const connection = await connectToDatabase();
    const db = connection.db;
    client = connection.client;
    const users = await db.collection("Users").find({}).toArray();
    res.send(users);
  } catch(err){
    console.error("Errore nel recupero degli utenti", err);
    res.status(500).send("Errore interno del server");
  } finally{
    if(client){
      await client.close();
      console.log("Connessione a MongoDB chiusa");
    }
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

