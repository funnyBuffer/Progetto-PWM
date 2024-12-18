const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    version:'1.0.0',
    title: 'Gestione Utenti',
    description: 'Documentazione per le API utilizzate per il sito Marvel'
  },
  tags: [
    { name: 'Users', description: 'Gestione degli utenti' },
    { name: 'Auth', description: 'Autenticazione e Login' },
    { name: 'Credits', description: 'Gestione dei crediti utente' },
    { name: 'Trade', description: 'Gestione degli scambi delle carte'}
  ],
  components: {
    schemas: {
      Users: {
        $username: 'Superhero1',
        $name: 'David',
        $surname: 'Pizzolato',
        $password: 'PwMoltoBella12345',
        $email: 'david.pizzolato1@studenti.unimi.it',
        $fav_hero: 'Superman',
        $credits: '7040'
      }
    }
  },
  host: 'localhost:3000'
};


const outputFile = './swagger-output.json';
const routes = ['./routes/users.js','./routes/auth.js','./routes/credits.js'];

swaggerAutogen(outputFile, routes, doc);
