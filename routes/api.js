const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'gondola.proxy.rlwy.net',
    port: process.env.MYSQL_PORT || 45889,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'IAGZWBpPwSouBnKaNURJhaXYrNoMJddF',
    database: process.env.MYSQL_DATABASE || 'railway',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: false
    }
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(error => {
        console.error('Error connecting to the database:', error);
    });

// Log database connection details (excluding sensitive info)
console.log('Database connection config:', {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user
});

// Error handler middleware
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Response handler middleware
const sendResponse = (res, data, status = 200) => {
    res.status(status).json({
        status: status >= 200 && status < 300 ? 'success' : 'error',
        data,
        timestamp: new Date().toISOString()
    });
};

// Health check endpoint
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// GET /api/overview - Dashboard overview stats
router.get('/overview', async (req, res) => {
     try {
        const conn = await pool.getConnection();
        try {
            // Get total sales for current month
            const [salesResult] = await conn.query(`
                SELECT COALESCE(SUM(total_amount), 0) as total 
                FROM sales_transactions 
                WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE())
                AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
            `);

            // Get total products quantity in stock
            const [productsResult] = await conn.query(`
                SELECT COALESCE(SUM(quantity_in_stock), 0) as total 
                FROM products
            `);

            // Get pending deliveries count
            const [deliveriesResult] = await conn.query(`
                SELECT COUNT(*) as total 
                FROM delivery_records 
                WHERE delivery_status = 'Pending'
            `);

            // Get latest growth rate from forecast reports
            const [growthResult] = await conn.query(`
                SELECT report_data
                FROM forecast_reports
                WHERE report_date <= CURRENT_DATE
                ORDER BY report_date DESC, report_id DESC
                LIMIT 1
            `);

            let growthRate = 0;
            if (growthResult.length > 0 && growthResult[0].report_data) {
                try {
                    const reportData = JSON.parse(growthResult[0].report_data);
                    growthRate = reportData['Sales Growth'] || 0;
                } catch (e) {
                    console.error('Error parsing growth data:', e);
                }
            }

            res.json({
                totalSales: parseFloat(salesResult[0].total) || 0,
                totalProducts: parseInt(productsResult[0].total) || 0,
                pendingDeliveries: parseInt(deliveriesResult[0].total) || 0,
                growthRate: parseFloat(growthRate) || 0
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
     }
   });

// GET /api/sales - Sales data for chart
router.get('/sales', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            console.log('Executing sales query...');
            const [rows] = await conn.query(`
                SELECT 
                    DATE(transaction_date) as transaction_date,
                    SUM(total_amount) as total_amount,
                    COUNT(*) as transaction_count
                FROM sales_transactions
                WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(transaction_date)
                ORDER BY transaction_date
            `);
            
            console.log('Sales data retrieved:', rows);
            res.json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('Sales query error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch sales data: ' + error.message
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed: ' + error.message
        });
    }
});

// GET /api/products - Product inventory data
router.get('/products', async (req, res) => {
    try {
        console.log('[Products API] Attempting to connect to database...');
        console.log('[Products API] Database config:', {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            user: dbConfig.user
        });
        
        const conn = await pool.getConnection();
        
        try {
            console.log('[Products API] Connected successfully, executing query...');
            
            // First, check if the products table exists
            const [tables] = await conn.query(`
                SELECT TABLE_NAME 
                FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'products'
            `, [dbConfig.database]);

            if (tables.length === 0) {
                throw new Error('Products table does not exist');
            }

            // Then check the table structure
            const [columns] = await conn.query(`
                SHOW COLUMNS FROM products
            `);
            console.log('[Products API] Table structure:', columns);

            const query = `
                SELECT 
                    product_id,
                    product_name,
                    category,
                    COALESCE(quantity_in_stock, 0) as quantity_in_stock
                FROM products 
                WHERE quantity_in_stock >= 0
                ORDER BY quantity_in_stock DESC
                LIMIT 10
            `;
            console.log('[Products API] Query:', query);
            
            const [rows] = await conn.query(query);
            console.log('[Products API] Query results count:', rows?.length);
            console.log('[Products API] Sample data:', rows?.slice(0, 2));
            
            // Ensure we're returning an array
            if (!Array.isArray(rows)) {
                throw new Error('Database did not return an array of products');
            }

            if (rows.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No products found',
                    timestamp: new Date().toISOString()
                });
            }

            // Format the data for the chart
            const formattedData = rows.map(row => ({
                product_id: row.product_id,
                product_name: row.product_name || 'Unknown Product',
                category: row.category || 'Uncategorized',
                quantity_in_stock: parseInt(row.quantity_in_stock) || 0
            }));

            console.log('[Products API] Formatted data count:', formattedData.length);

            res.json({
                success: true,
                data: formattedData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Products API] Query error:', error);
            console.error('[Products API] Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                error: {
                    message: 'Failed to fetch products data',
                    details: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                }
            });
        } finally {
            console.log('[Products API] Releasing connection...');
            conn.release();
        }
    } catch (error) {
        console.error('[Products API] Database connection error:', error);
        console.error('[Products API] Stack trace:', error.stack);
        res.status(500).json({
            success: false,
            error: {
                message: 'Database connection failed',
                details: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// GET /api/debug/products - Show raw product data
router.get('/debug/products', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT * FROM products 
        WHERE quantity_in_stock > 0 
        ORDER BY product_name, product_id
    `);
    sendResponse(res, rows);
}));

// GET /api/deliveries - Delivery status data
router.get('/deliveries', async (req, res) => {
    try {
        console.log('Attempting to fetch delivery data...');
        const conn = await pool.getConnection();
        
        try {
            const [rows] = await conn.query(`
                SELECT 
                    delivery_status,
                    COUNT(*) as count
                FROM delivery_records
                WHERE delivery_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY delivery_status
                ORDER BY FIELD(delivery_status, 'Pending', 'In Transit', 'Delivered')
            `);
            
            console.log('Delivery data retrieved:', {
                rowCount: rows.length,
                sampleData: rows.slice(0, 2)
            });
            
            res.json({
                success: true,
                data: rows,
                message: 'Delivery data retrieved successfully'
            });
        } catch (error) {
            console.error('Database query error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch delivery data: ' + error.message
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            error: 'Database connection failed: ' + error.message
        });
    }
});

// GET /api/forecasts - Growth forecast data
router.get('/forecasts', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            report_date,
            report_data,
            u.full_name as created_by_name
        FROM forecast_reports f
        JOIN users u ON f.created_by = u.user_id
        WHERE report_date <= CURRENT_DATE
        ORDER BY report_date DESC, report_id DESC
        LIMIT 1
    `);

    if (rows.length > 0) {
        try {
            const reportData = JSON.parse(rows[0].report_data);
            // Convert snake_case to Title Case for display
            const formattedData = {};
            for (const [key, value] of Object.entries(reportData)) {
                const formattedKey = key
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                formattedData[formattedKey] = parseFloat(value) || 0;
            }
            rows[0].report_data = formattedData;
        } catch (e) {
            console.error('Error parsing forecast data:', e);
            rows[0].report_data = {
                'Sales Growth': 0,
                'Market Share': 0,
                'Customer Base': 0,
                'Product Range': 0,
                'Supply Chain': 0
            };
        }
    }

    res.json(rows);
}));

// GET /api/inventory-logs - Recent inventory activities
router.get('/inventory-logs', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            il.log_date,
            p.product_name,
            il.action_type,
            il.quantity,
            u.full_name as performed_by
        FROM inventory_logs il
        JOIN products p ON il.product_id = p.product_id
        JOIN users u ON il.user_id = u.user_id
        ORDER BY il.log_date DESC
        LIMIT 10
    `);
    res.json(rows);
}));

// GET /api/top-products - Top selling products
router.get('/top-products', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            p.product_name,
            p.category,
            COUNT(s.transaction_id) as total_sales,
            SUM(s.quantity_sold) as units_sold,
            SUM(s.total_amount) as revenue
        FROM products p
        JOIN sales_transactions s ON p.product_id = s.product_id
        WHERE s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY p.product_id, p.product_name, p.category
        ORDER BY revenue DESC
        LIMIT 5
    `);
    res.json(rows);
}));

// GET /api/category-sales - Sales by category
router.get('/category-sales', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            p.category,
            COUNT(s.transaction_id) as total_sales,
            SUM(s.quantity_sold) as units_sold,
            SUM(s.total_amount) as revenue
        FROM products p
        JOIN sales_transactions s ON p.product_id = s.product_id
        WHERE s.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY p.category
        ORDER BY revenue DESC
    `);
    res.json(rows);
}));

// GET /api/stats/total-sales - Detailed sales statistics
router.get('/stats/total-sales', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            SUM(total_amount) as total_sales,
            COUNT(*) as total_transactions,
            AVG(total_amount) as average_sale,
            MAX(total_amount) as highest_sale,
            MIN(total_amount) as lowest_sale
        FROM sales_transactions
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    sendResponse(res, rows[0]);
}));

// GET /api/stats/inventory-summary - Detailed inventory statistics
router.get('/stats/inventory-summary', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            COUNT(*) as total_products,
            SUM(quantity_in_stock) as total_stock,
            AVG(quantity_in_stock) as average_stock,
            COUNT(CASE WHEN quantity_in_stock <= reorder_level THEN 1 END) as low_stock_items
        FROM products
    `);
    sendResponse(res, rows[0]);
}));

// GET /api/stats/delivery-metrics - Detailed delivery performance metrics
router.get('/stats/delivery-metrics', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            delivery_status,
            COUNT(*) as count,
            AVG(TIMESTAMPDIFF(HOUR, created_at, 
                CASE 
                    WHEN delivery_status = 'Delivered' THEN delivery_date
                    ELSE CURRENT_TIMESTAMP
                END
            )) as avg_delivery_time
        FROM delivery_records
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY delivery_status
    `);
    sendResponse(res, rows);
}));

// Test route to verify API is working
router.get('/test', (req, res) => {
    res.json({ message: 'API is working' });
});

// Test route to verify database connection
router.get('/test-connection', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [result] = await conn.query('SELECT 1 as test');
            res.json({
                success: true,
                message: 'Database connection successful',
                data: result
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Database connection test error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Database connection failed',
                details: error.message,
                code: error.code
            }
        });
    }
});

// Test route to check tables
router.get('/test-tables', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        try {
            const [tables] = await conn.query('SHOW TABLES');
            const tableData = {};
            
            for (const table of tables) {
                const tableName = table[Object.keys(table)[0]];
                const [rows] = await conn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
                tableData[tableName] = rows[0].count;
            }
            
            res.json({
                success: true,
                message: 'Tables found',
                data: tableData
            });
        } finally {
            conn.release();
        }
    } catch (error) {
        console.error('Table test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check tables: ' + error.message
        });
    }
});

// Error handling middleware with detailed error responses
router.use((err, req, res, next) => {
    console.error('API Error:', err);
    
    // Determine error status code
    const statusCode = err.statusCode || 500;
    
    // Create error response
    const errorResponse = {
        status: 'error',
        error: {
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred while processing your request',
            code: err.code || 'INTERNAL_SERVER_ERROR',
            timestamp: new Date().toISOString()
        }
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
     }

    res.status(statusCode).json(errorResponse);
   });

   module.exports = router;