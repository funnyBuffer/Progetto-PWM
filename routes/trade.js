const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {addTrade} = require('../func.js');

/* 
Impostazione del trade
const trade = {
    id,
    user1: { id: user1Id, offered_cards: [ cards offered by user1 ] },
    user2: { id: user2Id, offered_cards: [ cards offered by user2 ] },
    status: 'pending' | 'completed' | 'cancelled',
    // Altri dettagli, come la data di creazione, eventuali messaggi, ecc.
}; 
*/

router.post('/add', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Crea una offerta per lo scambio'
    #swagger.description = 'Verifica che le carte da scambiare non siano già impiegate in altri scambi e poi crea l'offerta per lo scambio' 
    */
    const {cards} = req.body;
    const token = req.cookies.authToken;
    if(!token){
        return res.status(403).send({ error: "Accesso non autorizzato" });
    }
    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        await addTrade(res, decoded.username, cards) 
    })   
})

router.get('/show', async (req, res) => {

})

module.exports = router;



