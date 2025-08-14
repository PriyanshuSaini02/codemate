const express = require('express');
const cookieParser = require("cookie-parser");

require('dotenv').config();
const connectDB = require('./config/database');

const userRoutes = require('./routes/userRoute');
const errorHandler = require('./middleware/errorHandler');
const profileRouter = require('./routes/profile');

const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/',profileRouter);

// Error Handling Middleware
app.use(errorHandler);

// Start server after DB connects
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
