const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {addNewTrade, findUser, profileCards, countOccurrences} = require('../func.js');

/* 
Impostazione del trade
const trade = {
    id,
    user1: { id: user1Id, offered_cards: [ cards offered by user1 ] },
    user2: { id: user2Id, offered_cards: [ cards offered by user2 ] },
    status: 'pending' | 'completed' | 'cancelled'
}; 
*/

router.post('/add', async (req, res) => {
    const { cards } = req.body;
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(403).send({ error: "Accesso non autorizzato" });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: "Token non valido" });
        }

        try {
            const user = await findUser(decoded.username);
            if (!user.found) {
                return res.status(404).send({ error: "Utente non trovato" });
            }

            const occurrences = await Promise.all(cards.map(card => countOccurrences(user.data.username, card)));
            if (!occurrences.every(count => count >= 2)) {
                return res.status(400).send({ message: "Non puoi offrire carte di cui hai meno di 2 copie" });
            }

            const result = await addNewTrade(user.data.username, cards);
            if (result.success) {
                return res.status(200).send({ message: "Trade inserito con successo" });
            } else {
                return res.status(500).send({ message: "Errore durante l'inserimento del trade." });
            }
        } catch (error) {
            console.error("Errore nell'elaborazione del trade:", error);
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});


router.get('/show', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Mostra le offerte per gli scambi'
    #swagger.description = 'Fornisce tutte le offerte per i possbili scambi' 
    #swagger.path = '/trade/show'
    */
})

module.exports = router;



