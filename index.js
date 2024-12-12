const express = require('express')
const {connectToDatabase} = require('./db');
const {addUser, findUser, deleteUser} = require('./func.js');

require('dotenv').config();

const app = express()
const port = process.env.port;

const swaggerUi = require('swagger-ui-express');
//const swaggerDocument = require('./swagger-output.json');
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/users/findAll', async (req, res) => {
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

app.post('/users/add', async (req, res) => {
    const { username, name, surname, email, password, fav_hero } = req.body;

    if (!username || !name || !surname || !email || !password || !fav_hero) {
        return res.status(400).send({ error: "Tutti i campi sono obbligatori" });
    }
    await addUser(null, res, username, name, surname, email, password, fav_hero);
});

app.post('/users/update', async (req, res) => {
    const {username, name, surname, email, password, fav_hero} = req.body;
    await updateUser(null, res, username, name, surname, email, password, fav_hero);
})

app.get('/user/find', async (req, res) => {
  const{ username } = req.body;
  await findUser(req);
})

app.delete('/user/delete', async (req,res) =>{
  const{ username, password} = req.body;
  await deleteUser(req);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

