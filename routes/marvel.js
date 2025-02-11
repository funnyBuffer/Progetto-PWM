const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {getFromMarvel, openPack, updateUser, findUser, profileCards, mergeCards} = require('../func.js');
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

router.post('/getImages', async (req, res) => {
    const { quantity } = req.body;

    try {
        const images = [];
        
        while (images.length < 3) { // Finché non ho almeno 3 immagini valide
            let cards = openPack(quantity); // Richiedi un pack di carte
            let i = 0;
            let validImages = 0;
            
            // Prova a recuperare 3 immagini dal pack di carte
            while (validImages < quantity && i < cards.length) {
                try {
                    const result = await getFromMarvel(`public/characters/${cards[i]}`, "");
                    const image = result.data.results[0].thumbnail.path + "." + result.data.results[0].thumbnail.extension;

                    // Verifica se l'immagine è valida
                    if (image && image !== 'http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available.jpg') {
                        images.push(image);
                        validImages++;
                    }
                } catch (error) {
                    console.error("Errore nel recupero dell'immagine per il personaggio", cards[i]);
                }
                i++;
            }
        }

        // Restituisce le immagini valide
        return res.json({ success: true, data: images });
    } catch (error) {
        console.error("Errore durante l'elaborazione:", error);
        return res.status(500).send({ error: "Errore interno del server" });
    }
});




module.exports = router;