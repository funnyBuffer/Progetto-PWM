const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const {findUser, updateUser} = require('../func.js');


router.post('/updatecredits', (req, res) => {

    /*
    #swagger.tags = ['Credits']
    #swagger.summary = 'Aggiorna i crediti di un utente'
    #swagger.description = 'Permette di aggiornare il numero di crediti di un utente.' 
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

        updateUser(res, user.data.username , null,null,null,null,null,null, updated_credits);
    });
})

module.exports = router;