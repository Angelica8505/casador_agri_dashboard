const db = require('../db');

exports.getDashboardData = async (req, res) => {
  const role = req.session.role;
  const userId = req.session.user_id;

  try {
    const [products] = await db.query('SELECT * FROM products');
    const [sales] = await db.query(`
      SELECT DATE(transaction_date) as date, SUM(total_amount) as total
      FROM sales_transactions GROUP BY DATE(transaction_date)
    `);

    const [inventory] = await db.query(`
      SELECT p.product_name, SUM(l.quantity) as movement
      FROM inventory_logs l
      JOIN products p ON l.product_id = p.product_id
      GROUP BY l.product_id
    `);

    res.render('dashboard', {
      role,
      products,
      sales,
      inventory
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Dashboard loading failed');
  }
};
