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
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Crea una offerta per lo scambio'
    #swagger.description = 'Verifica che le carte da scambiare non siano già impiegate in altri scambi e poi crea l'offerta per lo scambio' 
    #swagger.path = '/trade/add'
    */
    const {cards} = req.body;
    const token = req.cookies.authToken;
    if(!token){
        return res.status(403).send({ error: "Accesso non autorizzato" });
    }
    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        const user = await findUser(decoded.username);
        const user_cards = await profileCards(user.data.username);
        // Controlli sulle carte da scambiare
        // Devo controllare che l'utente possa offrire solo carte di cui ha almeno 2 copie
        if(!cards.every(card =>  countOccurrences(user_cards, card) >= 2)){
            return res.status(400).send({ message: "Non puoi offrire carte di cui hai meno di 2 copie" });
        }


        await addNewTrade(user.data.username, cards).then((result) => {
            if(result.success){
                return res.status(200).send({ message: "Trade inserito con successo" });
            } else {
                return res.status(500).send({ message: "Errore durante l'inserimento del trade." });
            }
        }); 

    })   
})

router.get('/show', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Mostra le offerte per gli scambi'
    #swagger.description = 'Fornisce tutte le offerte per i possbili scambi' 
    #swagger.path = '/trade/show'
    */
})

module.exports = router;



