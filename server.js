const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self' https: data:",
        "img-src 'self' https: data:",
        "style-src 'self' https: 'unsafe-inline'",
        "script-src 'self' https: 'unsafe-inline' 'unsafe-eval'",
        "font-src 'self' https: data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'"
    ].join('; '));

    next();
});

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://casadoragridashboard-production.up.railway.app'
        : 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory with proper headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
        // Ensure all static files are served with correct cache control
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const apiRoutes = require('./routes/api');

// Use API routes
app.use('/api', apiRoutes);

// Serve dashboard
app.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Casador Agricultural Dashboard',
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Root route error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal Server Error',
                code: error.code || 'INTERNAL_SERVER_ERROR',
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        success: false,
        error: {
            message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
            code: err.code || 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString()
        }
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.NODE_ENV === 'production') {
        console.log('Production URL: https://casadoragridashboard-production.up.railway.app');
    } else {
        console.log(`Development URL: http://localhost:${PORT}`);
    }
}); 