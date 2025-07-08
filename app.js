const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use(express.static('public')); 
const itemRoutes = require('./routes/item');
app.use('/api/item', itemRoutes);



module.exports = app;
