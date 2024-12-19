const express = require('express')
const cookieParser = require('cookie-parser');
const path = require('path');

require('dotenv').config();

const app = express()
const port = process.env.port;

/////////////// DA SISTEMARE/SPOSTARE  ////////////////
const {fetchMarvelCharacters} = require('./func.js');
const publicKey = process.env.marvel_public_key;
const privateKey = process.env.marvel_private_key;

const timestamp = process.env.timestamp;
const hash = process.env.MD5;

const apiUrl = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${publicKey}&hash=${hash}`;

fetchMarvelCharacters(apiUrl);

////////////////////////////////////////////////////////

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const creditRoutes = require('./routes/credits');
const tradeRoutes = require('./routes/trade');

app.use('/users', userRoutes);      
app.use('/auth', authRoutes);       
app.use('/credits', creditRoutes);  
app.use('/trade', tradeRoutes);

app.use(express.static(path.join(__dirname, 'public')));

//// Pagina login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

//// Pagina registrer
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html'));
});

//// Pagina homepage
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'homepage.html'));
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta: ${port}`)
})

