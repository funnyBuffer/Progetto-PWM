const express = require('express');
const router = express.Router();
const {addUser, findUser, findEmail, deleteUser, updateUser, isInvalidEmail} = require('../func.js');
const {connectToDatabase} = require('../config/db');

router.get('/findAll', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Ottieni tutti gli utenti'
    #swagger.description = 'Restituisce una lista di tutti gli utenti registrati.'
    #swagger.path = '/users/findAll'
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
    #swagger.path = '/users/add'
    */

    const { username, name, surname, email, password, fav_hero } = req.body;

    if (!username || !name || !surname || !email || !password || !fav_hero) {
        return res.status(400).send({ error: "Tutti i campi sono obbligatori" });
    }
    /////////// Controlli sulle credenziali ///////////
    if (name.length < 3) {
        res.status(400).send({message:"Nome troppo corto"});
        return;
    } 
    if (surname.length < 3) {
        res.status(400).send({message:"Cognome troppo corto"});
        return;
    }
    if(password.length < 8){
        res.status(400).send({message:"Password troppo corta"});
        return;
    }
    if((await findUser(username)).found){
        res.status(400).send({message:"Username già esistente"});
        return;
    }
    if((await findEmail(email)).found){
        res.status(400).send({message:"Email già usata"});
        return;
    }
    if (isInvalidEmail(email)) {
    res.status(400).send({message:"Email non valida"});
    return;
    }
    await addUser(username, name, surname, email, password, fav_hero).then((result) => {
        if(result.success){
            res.status(200).send({message:"Utente aggiunto con successo"});
        } else {
            res.status(500).send({message:"Errore durante l'aggiunta dell'utente"});
        }
    });
});

router.post('/update', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Modifica un utente'
    #swagger.description = 'Modifica un utente con i dati forniti.'
    #swagger.path = '/users/update'
    */
    const { old_username, username, name, surname, password, fav_hero } = req.body;

    try {
        const userResult = await findUser(old_username);

        if (!userResult.found) {
            return res.status(404).send({ error: "Utente non esistente" });
        }

        if (username != null && username !== old_username) {
            if(await findUser(username).found){
                return res.status(409).send({ message: `L'username ${username} è già preso` });
            }
        }

        if (password != null && userResult.data.password === password) {
            return res.status(409).send({ message: "La password nuova deve essere diversa da quella precedente" });
        }

        // Aggiornamento dell'utente
        const updateResult = await updateUser(
            old_username, username, name, surname, email, password, fav_hero, 0, null
        );

        if (updateResult) {
            return res.status(200).send({ message: "Utente aggiornato con successo!" });
        } else {
            return res.status(500).send({ error: "Nessun aggiornamento effettuato" });
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento dell'utente:", error);
        return res.status(500).send({ error: "Errore interno del server" });
    }
});

router.get('/find', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Trova un utente'
    #swagger.description = 'Trova un utente attraverso l'username.'
    #swagger.path = '/users/find'
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

router.post('/info', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Trova un utente'
    #swagger.description = 'Trova un utente attraverso l'username.'
    #swagger.path = '/users/find'
    */
    const{ username } = req.body;
    const userResult = await findUser(username);
    
    if(userResult.found){
        res.status(200).send({
            message: "Utente trovato",
            username: userResult.data.username,
            userId: userResult.data._id,
            userEmail: userResult.data.email,
            userFavHero: userResult.data.fav_hero,
            userName: userResult.data.name,
            userSurname: userResult.data.surname,
            userPassword: userResult.data.password,
            userCardsCount: userResult.data.cards.length,
            userCards: userResult.data.cards
        })
    } else{
        res.status(404).send({ message: "Utente non trovato" });
    }
})

router.delete('/delete', async (req, res) => {
    /*
    #swagger.tags = ['Users']
    #swagger.summary = 'Elimina un utente'
    #swagger.description = 'Elimina un utente fornendo l'username e la password.'
    #swagger.path = '/users/delete'
    */
    const { username, password } = req.body;

    try {
        const userResult = await findUser(username);

        if (!userResult.found) {
            return res.status(404).send({ message: "Utente non trovato" });
        }

        const user = userResult.data;
        const isPasswordValid = user.password === crypto.createHash('sha256').update(password).digest('hex');

        if (!isPasswordValid) {
            return res.status(401).send({ message: "Password non valida" });
        }

        const deleteSuccess = await deleteUser(username);

        if (deleteSuccess) {
            return res.status(200).send({ message: "Utente eliminato con successo" });
        } else {
            return res.status(500).send({ message: "Errore durante l'eliminazione dell'utente" });
        }
    } catch (error) {
        console.error("Errore durante la richiesta di eliminazione:", error);
        return res.status(500).send({ message: "Errore interno del server" });
    }
});

module.exports = router;