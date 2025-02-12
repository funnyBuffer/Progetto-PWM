const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {getFromMarvel, openPack, findUser, profileCards, mergeCards, addPack, getPacks} = require('../func.js');
require('dotenv').config();

router.get('/favHero', (req, res) => {
    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Restituisce l'id dell'eroe preferito'
    #swagger.description = 'Restituisce l'id dell'eroe preferito dell'utente autenticato'
    #swagger.path = '/marvel/favHero'
    */
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(403).json({ message: 'Accesso non autorizzato' });
    } else {
        jwt.verify(token, process.env.secret_key, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token non valido' });
            }

            try {
                const user = await findUser(decoded.username);
                return res.status(200).json({ name: user.data.fav_hero });
            } catch (error) {
                console.error("Errore durante l'elaborazione:", error);
                return res.status(500).json({ error: "Errore interno del server" });
            }
        });
    }
});

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

router.post('/addPack', async (req, res) => {

    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Apre un pacchetto'
    #swagger.description = 'Fornisce a un utente autenticato delle carte casuali da aggiungere alla collezione' 
    #swagger.path = '/marvel/unpack'
    */

    const { quantity, cost, expiryTime } = req.body;

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
            if(user.data.username != "admin") return;
            else{    
                addPack(quantity, cost, expiryTime);
            }

            return res.status(200).send({ message:"Pacchetto inserito"});
        } catch (error) {
            console.error("Errore durante l'elaborazione:", error);
            return res.status(500).send({ message: "Errore interno del server" });
        }
    });
});

router.get('/getPacks', async (req, res) => {
    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Restituisce i pacchetti special'
    #swagger.description = 'Restituisce tutti i pacchetti creati dall'admin che sono a tempo limitato'
    #swagger.path = '/marvel/favHero'
    */
    try {
        const packs = await getPacks();
        return res.status(200).json({ packs:packs});
    } catch (error) {
        console.error("Errore durante l'elaborazione:", error);
        return res.status(500).json({ error: "Errore interno del server" });
    } 
});

module.exports = router;