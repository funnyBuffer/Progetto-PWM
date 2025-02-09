const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const {findUser, updateUser} = require('../func.js');

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
        updateUser(user.data.username , null,null,null,null,null,null, updated_credits, null);
        console.log(updated_credits);
        res.send({result: true, credits: updated_credits});
    });
})

module.exports = router;