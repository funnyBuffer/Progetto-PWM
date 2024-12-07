const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
  info: {
    title: 'Gestione Utenti',
    description: 'Una semplice API per la gestione degli utenti'
  },
  components: {
    schemas:{
        userSchema:{
            $name: 'Valerio',
            $surname: 'Bellandi',
            $password: 'password',
            email: 'valerio.bellandi@unimi.it',
            $film_preferiti: []
        }
    }
  },
  host: 'localhost:3000'
};

const outputFile = './swagger-output.json';
const routes = ['index.js'];

swaggerAutogen(outputFile, routes, doc);
