-- Create database if not exists
CREATE DATABASE IF NOT EXISTS casador_agri;
USE casador_agri;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS delivery_routes;
DROP TABLE IF EXISTS delivery_records;
DROP TABLE IF EXISTS sales_transactions;
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS forecast_reports;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create tables
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role_id INT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit_price DECIMAL(10,2),
    quantity_in_stock INT DEFAULT 0
);

CREATE TABLE inventory_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    user_id INT,
    action_type ENUM('add', 'remove', 'adjust') NOT NULL,
    quantity INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE sales_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    quantity_sold INT NOT NULL,
    total_amount DECIMAL(10,2),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recorded_by INT,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);

CREATE TABLE delivery_records (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT,
    delivery_personnel_id INT,
    delivery_date DATE,
    delivery_status ENUM('Pending', 'In Transit', 'Delivered') DEFAULT 'Pending',
    delivery_notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES sales_transactions(transaction_id),
    FOREIGN KEY (delivery_personnel_id) REFERENCES users(user_id)
);

CREATE TABLE forecast_reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE,
    created_by INT,
    report_data TEXT, -- JSON or plain text
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE TABLE delivery_routes (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_id INT,
    route_path TEXT, -- Store coordinates or route name
    geojson_data TEXT, -- For integration with Leaflet or Mapbox
    FOREIGN KEY (delivery_id) REFERENCES delivery_records(delivery_id)
);

-- Insert initial roles
INSERT INTO roles (role_name) VALUES
('Admin'), ('Warehouse Man'), ('Secretary'), ('Delivery Personnel');

-- Insert a default admin user (password: admin123)
INSERT INTO users (username, password, full_name, role_id) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'System Administrator', 1);

-- Insert sample products
INSERT INTO products (product_name, category, unit_price, quantity_in_stock) VALUES
('Rice', 'Grains', 45.00, 1000),
('Corn', 'Grains', 35.00, 800),
('Tomatoes', 'Vegetables', 25.00, 500),
('Potatoes', 'Vegetables', 30.00, 600),
('Carrots', 'Vegetables', 20.00, 400),
('Apples', 'Fruits', 15.00, 300),
('Bananas', 'Fruits', 10.00, 700),
('Oranges', 'Fruits', 12.00, 400);

-- Insert sample sales data for the past week
INSERT INTO sales_transactions (product_id, quantity_sold, total_amount, recorded_by) VALUES
(1, 50, 2250.00, 1),
(2, 30, 1050.00, 1),
(3, 40, 1000.00, 1),
(4, 25, 750.00, 1),
(5, 35, 700.00, 1),
(6, 45, 675.00, 1),
(7, 60, 600.00, 1),
(8, 40, 480.00, 1);

-- Insert sample delivery records
INSERT INTO delivery_records (transaction_id, delivery_personnel_id, delivery_date, delivery_status) VALUES
(1, 1, CURDATE(), 'Pending'),
(2, 1, CURDATE(), 'In Transit'),
(3, 1, CURDATE(), 'Delivered'),
(4, 1, CURDATE(), 'Pending'),
(5, 1, CURDATE(), 'In Transit'),
(6, 1, CURDATE(), 'Delivered'),
(7, 1, CURDATE(), 'Pending'),
(8, 1, CURDATE(), 'In Transit');

-- Insert sample forecast report
INSERT INTO forecast_reports (report_date, created_by, report_data) VALUES
(CURDATE(), 1, '{"sales_growth": 15.5, "inventory_turnover": 2.3, "delivery_efficiency": 89.5}'); 