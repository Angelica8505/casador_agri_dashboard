const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 3000;

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'casador_agri_market',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Use API routes
app.use('/api', apiRoutes);

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Verify database connection before starting server
async function testDatabaseConnection() {
    try {
        const pool = mysql.createPool(dbConfig).promise();
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        console.log('Connected to database:', dbConfig.database);
        console.log('Host:', dbConfig.host);

        // Test queries
        const queries = [
            'SELECT COUNT(*) as count FROM roles',
            'SELECT COUNT(*) as count FROM users',
            'SELECT COUNT(*) as count FROM products',
            'SELECT COUNT(*) as count FROM sales_transactions',
            'SELECT COUNT(*) as count FROM delivery_records',
            'SELECT COUNT(*) as count FROM forecast_reports'
        ];

        for (const query of queries) {
            try {
                const [result] = await connection.query(query);
                console.log(`${query}: ${result[0].count} rows`);
            } catch (error) {
                console.error(`Query failed: ${query}`, error.message);
            }
        }

        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        console.error('Database config:', {
            host: dbConfig.host,
            user: dbConfig.user,
            database: dbConfig.database
        });
        return false;
    }
}

// Start server
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
        console.error('Warning: Server started but database connection failed');
        console.error('Please check your database configuration and make sure MySQL is running');
    }
});
   