const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const passport = require('passport');
const app = express();

require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

//Login & signup
app.use('/Login',require('./AccountManager/Login/login'));
app.use('/Signup',require('./AccountManager/Signup/signup'));

//OAuth
app.use('/OAuth',require('./OAuth/index'));

//Load feeds
app.use('/LoadContent', require('./LoadContent/load'));

module.exports = app;