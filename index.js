const express = require('express');
const cookieParser = require("cookie-parser");

require('dotenv').config();
const connectDB = require('./config/database');

const userRoutes = require('./routes/userRoute');
const errorHandler = require('./middleware/errorHandler');
const profileRouter = require('./routes/profile');
const sessionRoutes = require('./routes/sessionRoute');
const handRaiseRoute = require('./routes/handRaiseRoute');
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/',profileRouter);
app.use('/api/session', sessionRoutes);
app.use('/api/hand',handRaiseRoute);
// Error Handling Middleware
app.use(errorHandler);

// Start server after DB connects
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
