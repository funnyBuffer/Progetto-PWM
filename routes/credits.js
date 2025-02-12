const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const {findUser, updateUser, removeCards} = require('../func.js');

router.get('/getcredits', (req, res) => {

    /*
    #swagger.tags = ['Credits']
    #swagger.summary = 'Ottieni i crediti di un utente'
    #swagger.description = 'Restituisce il numero di crediti di un utente.' 
    #swagger.path = '/credits/getcredits'
    */

    const token = req.cookies.authToken;
    if(!token){
        return res.status(403).send({ error: 'Accesso non autorizzato' });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido' });
        }
        const user = await findUser(decoded.username)
        res.send({credits: user.data.credits});
    });

});


router.post('/updatecredits', (req, res) => {

    /*
    #swagger.tags = ['Credits']
    #swagger.summary = 'Aggiorna i crediti di un utente'
    #swagger.description = 'Permette di aggiornare il numero di crediti di un utente.' 
    #swagger.path = '/credits/updatecredits'
    */

    const token = req.cookies.authToken;
    const {credits} = req.body;
    if(!token){
        return res.status(403).send({ error: 'Accesso non autorizzato' });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token non valido' });
        }
        const user = await findUser(decoded.username)

        const updated_credits = Number(user.data.credits) + Number(credits)
        updateUser(user.data.username , null,null,null,null,null, updated_credits, null);
        res.send({result: true, credits: updated_credits});
    });
})

router.post('/sell', async (req, res) => {
    /*
    #swagger.tags = ['Credits']
    #swagger.summary = 'Vende una carta per un credito'
    #swagger.description = 'Ogni carta può essere venduta per acquistare un credito' 
    #swagger.path = '/credits/sell'
    */

    const { card } = req.body; // Assumiamo che "card" sia un array
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
            const cardsArray = Array.isArray(card) ? card : [card];
            // Aggiungi un credito per ogni carta venduta
            const updated_credits = Number(user.data.credits) + 1;
            await updateUser(user.data.username, null, null, null, null, null, updated_credits, null);

            // Rimuovi le carte vendute
            const removeResult = await removeCards(user.data.username, cardsArray);
            if (!removeResult.success) {
                return res.status(500).send({ error: removeResult.message });
            }

            return res.status(200).send({ message: "Carta venduta con successo e credito aggiunto" });

        } catch (error) {
            console.error("Errore durante l'elaborazione:", error);
            return res.status(500).send({ error: "Errore interno del server" });
        }
    });
});


module.exports = router;