const express = require('express')
const cookieParser = require('cookie-parser');

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

app.use('/users', userRoutes);      
app.use('/auth', authRoutes);       
app.use('/credits', creditRoutes);  

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta: ${port}`)
})

