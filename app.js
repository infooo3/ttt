const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require("express-rate-limit");
const matchsRoutes = require('./routes/matchs');



mongoose.connect('mongodb+srv://'+process.env.DB_ID+':'+process.env.DB_PWD+'@cluster0.qmhdffb.mongodb.net/tiktactoeDB?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();

const limiter = rateLimit({
  max: 60,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP"
})
app.use(limiter)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(bodyParser.json());



app.use('/api/matchs', matchsRoutes); //3001/api/matchs ...
//app.use('/images', express.static(path.join(__dirname, 'images')));



module.exports = app;
