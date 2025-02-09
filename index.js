const express = require('express')
const cookieParser = require('cookie-parser');
const path = require('path');
const {scheduleFetchCharacterIds} = require('./func.js');

require('dotenv').config();

const app = express()
const port = process.env.port;

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
const marvelRouter = require('./routes/marvel');

app.use('/users', userRoutes);      
app.use('/auth', authRoutes);       
app.use('/credits', creditRoutes);  
app.use('/trade', tradeRoutes);
app.use('/marvel', marvelRouter);

app.use(express.static(path.join(__dirname, 'public')));

//// Pagina login
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

//// Pagina registrer
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'signup.html'));
});

//// Pagina homepage
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'homepage.html'));
});

//// Pagina profilo utente
app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'profile.html'));
});

//// Pagina shop 
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'shop.html'));
});

//// Pagine per i trade
// pagina per le offerte
app.get('/offers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'trades', 'offers.html'));
});
// pagina per mettere un nuovo trade
app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'trades', 'post.html'));
});
//pagina per vedere le proposte di altri utenti
app.get('/proposals', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'trades', 'proposals.html'));
});

//Collezione di carte per ogni utente
app.get('/collection', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'collection.html'));
});

//Collezione di carte per ogni utente
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'test.html'));
});

//Collezione di carte per ogni utente
app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'error.html'));
});

//// Aggiornamento ogni 12 ore del file cardsID
scheduleFetchCharacterIds();

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta: ${port}`)
})

