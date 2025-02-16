const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {login} = require('../func.js');

router.post('/login', async (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Effettua il login'
    #swagger.description = 'Verifica le credenziali e permette l\'accesso.'
    #swagger.path = '/auth/login'
    */

    const { username, password } = req.body;

    const loginResult = await login(username, password);

    if (loginResult.success) {
        res.cookie('authToken', loginResult.token, {
            httpOnly: true, // Il cookie è accessibile solo dal server
            secure: true, // Usa `true` se utilizzi HTTPS
            sameSite: 'Strict', // Protegge contro CSRF
            maxAge: 60 * 180 * 1000, // Durata di 3 ore
        });
        return res.status(loginResult.status).send({ message: loginResult.message });
    } else {
        return res.status(loginResult.status).send({ message: loginResult.message });
    }
});

router.get('/valid', (req, res) => {

    /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Verifica autenticazione'
    #swagger.description = 'Verifica se l'utente è autenticato.' 
    #swagger.path = '/auth/valid'
    */

    const token = req.cookies.authToken;

    if (!token) {
        return res.status(403).send({ error: 'Accesso non autorizzato' });
    }
    try {
        const decoded = jwt.verify(token, process.env.secret_key);
        // Controlla se il token è scaduto
        const currentTime = Date.now() / 1000; 
        if (decoded.exp < currentTime) {
            return res.status(401).send({ error: 'Token scaduto', valid: false });
        }
        return res.status(200).send({ valid: true, user: decoded });
    } catch (err) {
        return res.status(401).send({ error: 'Token non valido', valid: false });
    }
});

router.delete('/logout', async (req, res) => {
    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Effettua il logout'
    #swagger.description = 'Rimuove il token di autenticazione dal cookie e disconnette l\'utente.'
    #swagger.path = '/auth/logout'
    */

    res.cookie('authToken', '', {
        httpOnly: true,
        secure: true, 
        sameSite: 'Strict',
        expires: new Date(0), // Imposta la data di scadenza nel passato
        path: '/'
    });

    return res.status(200).send({ message: 'Logout effettuato con successo' });
});


module.exports = router;