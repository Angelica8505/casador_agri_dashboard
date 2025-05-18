-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    quantity_in_stock INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    quantity_sold INT NOT NULL,
    product_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Create delivery_records table
CREATE TABLE IF NOT EXISTS delivery_records (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_id INT,
    delivery_date TIMESTAMP,
    delivery_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES sales_transactions(transaction_id)
);

-- Create forecast_reports table
CREATE TABLE IF NOT EXISTS forecast_reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    report_date DATE NOT NULL,
    report_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO roles (role_name) VALUES ('admin'), ('user');

INSERT INTO users (role_id, username, password_hash, full_name, email) 
VALUES (1, 'admin', '$2b$10$xxxxxxxxxxx', 'Admin User', 'admin@example.com');

INSERT INTO products (product_name, description, quantity_in_stock, unit_price, category) VALUES 
('Rice', 'Premium quality rice', 1000, 50.00, 'Grains'),
('Corn', 'Fresh sweet corn', 500, 30.00, 'Grains'),
('Tomatoes', 'Fresh red tomatoes', 200, 25.00, 'Vegetables'),
('Potatoes', 'Fresh potatoes', 300, 35.00, 'Vegetables'),
('Mangoes', 'Sweet mangoes', 150, 45.00, 'Fruits');

-- Insert sample sales transactions
INSERT INTO sales_transactions (user_id, total_amount, payment_status, quantity_sold, product_id) VALUES 
(1, 500.00, 'Completed', 10, 1),
(1, 300.00, 'Completed', 10, 2),
(1, 250.00, 'Completed', 10, 3);

-- Insert sample delivery records
INSERT INTO delivery_records (transaction_id, delivery_status) VALUES 
(1, 'Delivered'),
(2, 'In Transit'),
(3, 'Pending');

-- Insert sample forecast report
INSERT INTO forecast_reports (report_date, report_data) VALUES 
(CURRENT_DATE, '{"Sales Growth": 15.5, "Market Share": 25.3, "Customer Base": 1200, "Product Range": 85.0, "Supply Chain": 92.0}'); 