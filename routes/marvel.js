const express = require('express');
const router = express.Router();
const {getFromMarvel} = require('../func.js');
require('dotenv').config();

const publicKey = process.env.marvel_public_key;
const privateKey = process.env.marvel_private_key;

const timestamp = process.env.timestamp;
const hash = process.env.MD5;

router.post('/marvellous', (req, res) => {
    /*
    #swagger.tags = ['Marvel']
    #swagger.summary = 'Effettua una richiesta sulle API Marvel'
    #swagger.description = 'Utilizza una query per ricercare le informazioni messe a disposizione dalla Marvel' 
    */
    const { url, query } = req.body;

    getFromMarvel(url, query, publicKey, privateKey)
        .then((result) => {
            res.json({
                success: true,
                data: result,
            });
        })
        .catch((error) => {
            console.error('Errore nella richiesta Marvel:', error);
            res.status(500).json({
                success: false,
                message: 'Errore durante la richiesta alle API Marvel',
                error: error.message || 'Errore sconosciuto',
            });
        });
});


module.exports = router;