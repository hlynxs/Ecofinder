const express = require('express');
const cors = require('cors');
const users = require('./routes/user');
const itemRoutes = require('./routes/item');
const dashboardRoutes = require('./routes/dashboard');
const categoryRoutes = require('./routes/category');
const orderRoutes = require('./routes/order');  // 👈 Add this line


require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static folders
app.use(express.static('public'));       
app.use('/uploads', express.static('uploads')); 

// Routes
app.use('/api/users', users);               
app.use('/api/item', itemRoutes);           
app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/category', categoryRoutes);
app.use('/api/orders', orderRoutes);  


// Export app
module.exports = app;
