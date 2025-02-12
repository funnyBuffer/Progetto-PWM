const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {addNewTrade, findUser, countOccurrences, addOffer, confirmOffer, removeTrade, showTrades, rejectOffer, checkCard} = require('../func.js');

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
    #swagger.summary = 'Propone delle carte per uno scambio'
    #swagger.description = 'Viene caricato online uno scambio con le carte proposte dall'utente aspettando una proposta da un secondo utente' 
    #swagger.path = '/trade/add'
    */
    const { cards } = req.body;
    console.log("Carte ricevute:", cards);
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
            //Creo una mappa dove per ogni carta che voglio inserire nel trade restituisco la quantità
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

router.post('/offer', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Effettua una proposta a uno degli scambi già esistesti'
    #swagger.description = 'Permette di effettuare una proposta per uno degli scambi già esistenti' 
    #swagger.path = '/trade/offer'
    */
    const { cards, trade_id } = req.body;
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
            console.log(cards);
            const occurrences = await Promise.all(cards.map(card => countOccurrences(user.data.username, card)));
            if (!occurrences.every(count => count >= 2)) {
                return res.status(400).send({ message: "Non puoi offrire carte di cui hai meno di 2 copie" });
            }

            const result = await addOffer(user.data.username, cards, trade_id);
            if (result.success) {
                return res.status(200).send({ message: "Offerta effettuata" });
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante l'inserimento dell'offerta, riprovare" });
            }
        } catch (error) {
            console.error("Errore nell'elaborazione del trade:", error);
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

router.post('/accept', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Accetta una proposta di scambio'
    #swagger.description = 'Permette di accettare una proposta di scambio da parte di un utente che ha effettuato la proposta' 
    #swagger.path = '/trade/accept'
    */
    const { trade_id, user2 } = req.body;
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(403).send({ message: "Accesso non autorizzato" });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: "Token non valido" });
        }

        try {
            const user1 = await findUser(decoded.username);
            if (!user1.found) {
                return res.status(404).send({ message: "Utente non trovato" });
            }

            const result = await confirmOffer(trade_id, user2);
            if (result.success) {
                return res.status(200).send({ message: "Offerta accettata" });
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante l'accettazione dell'offerta: " + result.message });
            }
        } catch (error) {
            console.error("Errore nell'accettazione del trade:", error);
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

router.delete('remove', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Rimuove una proposta di scambio'
    #swagger.description = 'Permette di rimuovere una proposta di scambio pubblicata da un utente' 
    #swagger.path = '/trade/remove'
    */
    const { trade_id } = req.body;
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(403).send({ error: "Accesso non autorizzato" });
    }

    jwt.verify(token, process.env.secret_key, async (err, decoded) => {
        if (err) {
            return res.status(403).send({ error: "Token non valido" });
        }

        try {
            const user1 = await findUser(decoded.username);
            if (!user1.found) {
                return res.status(404).send({ error: "Utente non trovato" });
            }
            const result = await removeTrade(trade_id);
            if (result.success) {
                return res.status(200).send({ message: "Trade rimosso" });
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante la rimozione del trade, riprovare" });
            }
        } catch (error) {
            console.error("Errore nella rimozione del trade:", error);
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

router.get('/showOffer', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Mostra le offerte per gli scambi'
    #swagger.description = 'Fornisce tutte le offerte per i possibili scambi' 
    #swagger.path = '/trade/show'
    */
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

            const trades = await showTrades(user.data.username);

            if (trades.success) {
                return res.status(200).send({ trades: trades});
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante il caricamento delle offerte, riprovare" });
            }
        } catch (error) {
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

router.get('/showProposal', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Mostra le offerte per gli scambi'
    #swagger.description = 'Fornisce tutte le offerte per i possibili scambi' 
    #swagger.path = '/trade/show'
    */
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

            const trades = await showTrades();

            if (trades.success) {
                return res.status(200).send({ trades: trades});
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante il caricamento delle offerte, riprovare" });
            }
        } catch (error) {
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

router.delete('/rejection', async (req, res) => {
    /*
    #swagger.tags = ['Trade']
    #swagger.summary = 'Rifiuta una proposta di scambio'
    #swagger.description = 'Rifiuta singolarmente le proposte di scambio da parte di un utente' 
    #swagger.path = '/trade/rejection'
    */
    const { trade_id, user2 } = req.body;
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

            const trades = await rejectOffer(trade_id, user2);

            if (trades.success) {
                return res.status(200).send({ message:"Offerta rifiutata" });
            } else {
                console.log(result.message);
                return res.status(500).send({ message: "Errore durante il rifiuto dell'offerta, riprovare" });
            }
        } catch (error) {
            return res.status(500).send({ message: "Errore interno del server." });
        }
    });
});

module.exports = router;



