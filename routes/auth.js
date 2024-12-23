const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {login} = require('../func.js');

router.post('/login', async (req, res) =>{

    /*
    #swagger.tags = ['Auth']
    #swagger.summary = 'Effettua il login'
    #swagger.description = 'Verifica le credenziali e permette l'accesso.' 
    */

    const {username, password} = req.body;
  
    await login(res, username, password);
})

router.get('/auth', (req, res) => {

    /* 
    #swagger.tags = ['Auth']
    #swagger.summary = 'Verifica autenticazione'
    #swagger.description = 'Verifica se l'utente è autenticato.' 
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