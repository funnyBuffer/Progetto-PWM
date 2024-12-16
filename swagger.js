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
            email: 'valerio.bellandi@unimi.it'
        }
    }
  },
  host: 'localhost:3000'
};

const outputFile = './swagger-output.json';
const routes = ['API.js'];

swaggerAutogen(outputFile, routes, doc);
