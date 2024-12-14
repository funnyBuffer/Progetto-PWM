const express = require('express')
const {connectToDatabase} = require('./db');
const {addUser, findUser, deleteUser, updateUser} = require('./func.js');

require('dotenv').config();

const app = express()
const port = process.env.port;

const swaggerUi = require('swagger-ui-express');
//const swaggerDocument = require('./swagger-output.json');
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const bodyParser = require('body-parser');

app.use(bodyParser.json());

//testata
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

//testata
app.post('/users/add', async (req, res) => {
    const { username, name, surname, email, password, fav_hero } = req.body;

    if (!username || !name || !surname || !email || !password || !fav_hero) {
        return res.status(400).send({ error: "Tutti i campi sono obbligatori" });
    }
    await addUser(null, res, username, name, surname, email, password, fav_hero);
});

//testato
app.post('/users/update', async (req, res) => {
  const { userId, old_username, username, name, surname, email, password, fav_hero } = req.body;
  
  const userResult = await findUser(old_username);
  if (userResult.found) {
      await updateUser(null, res, userId, old_username, username, name, surname, email, password, fav_hero);
  } else {
      return res.status(404).send({ error: "Utente non esistente" });
  }
});

//testata
app.get('/users/find', async (req, res) => {
  const{ username } = req.body;
  const userResult = await findUser(username);
  if(userResult.found){
      res.status(200).send({
        message: "Utente trovato",
        username: userResult.data.username,
        userId: userResult.data._id
    })
  } else{
      res.status(404).send({ message: "Utente non trovato" });
  }
})

//testata
app.delete('/users/delete', async (req,res) =>{
  const{ username, password} = req.body;
  await deleteUser(res, username, password);
})

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta: ${port}`)
})

