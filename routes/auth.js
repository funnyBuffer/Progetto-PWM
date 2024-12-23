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
            maxAge: 60 * 60 * 1000, // Durata di 1 ora
        });
        return res.status(loginResult.status).send({ message: loginResult.message });
    } else {
        return res.status(loginResult.status).send({ message: loginResult.message });
    }
});

router.get('/auth', (req, res) => {

    /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Verifica autenticazione'
    #swagger.description = 'Verifica se l'utente è autenticato.' 
    #swagger.path = '/auth/auth'
    */

    const token = req.cookies.authToken;

    if (!token) {
        return res.status(403).send({ error: 'Accesso non autorizzato' });
    }
    try {
        const decoded = jwt.verify(token, process.env.secret_key);
        return res.status(200).send({ message: 'Accesso consentito', user: decoded });
    } catch (err) {
        return res.status(401).send({ error: 'Token non valido' });
    }
});

module.exports = router;