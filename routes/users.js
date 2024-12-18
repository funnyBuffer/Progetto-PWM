const express = require('express');
const router = express.Router();
const {addUser, findUser, findEmail, deleteUser, updateUser, isInvalidEmail} = require('../func.js');

router.get('/findAll', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Ottieni tutti gli utenti'
    #swagger.description = 'Restituisce una lista di tutti gli utenti registrati.'
    */
    let client;
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
  
router.post('/add', async (req, res) => {

    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Aggiungi un nuovo utente'
    #swagger.description = 'Aggiunge un utente con i dati forniti.'
    */

    const { username, name, surname, email, password, fav_hero } = req.body;

    if (!username || !name || !surname || !email || !password || !fav_hero) {
        return res.status(400).send({ error: "Tutti i campi sono obbligatori" });
    }
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
    if (isInvalidEmail(email)) {
    res.status(400).send("Email non valida");
    return;
    }
    await addUser(null, res, username, name, surname, email, password, fav_hero);
});

router.post('/update', async (req, res) => {

    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Modifica un utente'
    #swagger.description = 'Modifica un utente con i dati forniti.'
    */
    const { userId, old_username, username, name, surname, email, password, fav_hero } = req.body;

    const userResult = await findUser(old_username);
    if (userResult.found) {
        await updateUser(res, userId, old_username, username, name, surname, email, password, fav_hero, 0);
    } else {
        return res.status(404).send({ error: "Utente non esistente" });
    }
});

router.get('/find', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Trova un utente'
    #swagger.description = 'Trova un utente attraverso l'username.'
    */
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

router.delete('/delete', async (req,res) =>{
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Elimina un utente'
    #swagger.description = 'Elimina un utente fornendo l'username e la password.'
    */
    const{ username, password} = req.body;
    await deleteUser(res, username, password);
})

module.exports = router;