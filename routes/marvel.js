const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {getFromMarvel, openPack, updateUser, findUser, profileCards, mergeCards} = require('../func.js');
require('dotenv').config();

router.post('/marvellous', (req, res) => {
    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Effettua una richiesta sulle API Marvel'
    #swagger.description = 'Utilizza una query per ricercare le informazioni messe a disposizione dalla Marvel' 
    #swagger.path = '/marvel/marvellous'
    */
    const { url, query } = req.body;

    getFromMarvel(url, query)
        .then(result => res.json({ success: true, data: result }))
        .catch(error => res.status(500).json({ success: false, message: error.message }));
});

router.post('/unpack', async (req, res) => {

    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Apre un pacchetto'
    #swagger.description = 'Fornisce a un utente autenticato delle carte casuali da aggiungere alla collezione' 
    #swagger.path = '/marvel/unpack'
    */

    const { quantity } = req.body;

    const token = req.cookies.authToken;
    if (!token) {
        return res.status(403).send({ error: 'Accesso non autorizzato' });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido' });
        }

        try {
            const user = await findUser(decoded.username);
            const cards = openPack(quantity); 
            await mergeCards(user.data.username, cards);

            return res.status(200).send({ cards: cards });
        } catch (error) {
            console.error("Errore durante l'elaborazione:", error);
            return res.status(500).send({ error: "Errore interno del server" });
        }
    });
});


module.exports = router;