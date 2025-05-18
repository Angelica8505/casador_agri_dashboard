const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user_id) return next();
  res.redirect('/login');
}

router.get('/', isAuthenticated, dashboardController.getDashboardData);

module.exports = router;
