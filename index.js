const express = require('express');
require('dotenv').config();
const connectDB = require('./config/database');

const userRoutes = require('./routes/userRoute');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', userRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Start server after DB connects
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
