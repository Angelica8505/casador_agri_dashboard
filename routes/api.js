const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'casador_agri_market',
    waitForConnections: true,
    connectionLimit: 10
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

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
router.get('/sales', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            DATE(transaction_date) as transaction_date,
            SUM(total_amount) as total_amount,
            COUNT(*) as transaction_count
        FROM sales_transactions
        WHERE transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(transaction_date)
        ORDER BY transaction_date
    `);
    res.json(rows);
}));

// GET /api/products - Product inventory data
router.get('/products', asyncHandler(async (req, res) => {
    // First get all products to see what we're dealing with
    const [allProducts] = await pool.query(`
        SELECT 
            product_id,
            product_name,
            category,
            quantity_in_stock
        FROM products
        WHERE quantity_in_stock > 0
        ORDER BY product_name, product_id
    `);
    
    console.log('All products:', JSON.stringify(allProducts, null, 2));

    // Now get the aggregated data with proper grouping
    const [rows] = await pool.query(`
        SELECT 
            product_name,
            category,
            SUM(quantity_in_stock) as quantity_in_stock
        FROM products 
        WHERE quantity_in_stock > 0
        GROUP BY LOWER(TRIM(product_name))
        ORDER BY quantity_in_stock DESC
        LIMIT 10
    `);
    
    console.log('Aggregated products:', JSON.stringify(rows, null, 2));
    
    sendResponse(res, rows);
}));

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
router.get('/deliveries', asyncHandler(async (req, res) => {
    const [rows] = await pool.query(`
        SELECT 
            delivery_status,
            COUNT(*) as count
        FROM delivery_records
        WHERE delivery_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY delivery_status
        ORDER BY FIELD(delivery_status, 'Pending', 'In Transit', 'Delivered')
    `);
    res.json(rows);
}));

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