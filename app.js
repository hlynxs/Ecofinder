const express = require('express');
const cors = require('cors');
const users = require('./routes/user'); // ✅ Import user routes
const itemRoutes = require('./routes/item');
const dashboardRoutes = require('./routes/dashboard');
const categoryRoutes = require('./routes/category');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 

// Routes
app.use('/api/users', users);             // ✅ Users route
app.use('/api/item', itemRoutes);         // ✅ Items route
app.use('/api/dashboard', dashboardRoutes); // ✅ Dashboard route
app.use('/api/category', categoryRoutes);

module.exports = app;
