# Casador Agricultural Market Dashboard

## Project Objectives
This academic project aims to strengthen full-stack development skills through:
- Creating a web-based dashboard for agricultural market data visualization
- Implementing Chart.js for dynamic front-end visualizations
- Building a Node.js backend with MySQL database integration
- Developing a RESTful API for data communication
- Applying modern UI/UX design principles using Bootstrap

## Project Description
An interactive dashboard application that visualizes agricultural market data through four distinct chart types:
1. **Line Chart**: Sales trends over time
2. **Bar Chart**: Product inventory levels
3. **Pie Chart**: Delivery status distribution
4. **Radar Chart**: Growth metrics and forecasting

### Core Features
- 📊 Real-time data visualization with Chart.js
- 📦 Dynamic inventory management system
- 🚚 Delivery tracking and route optimization
- 📈 Sales analytics and reporting
- 📋 Market growth forecasting
- 👥 Role-based user management

## Technical Implementation

### Frontend Technologies
- **HTML5/CSS3**
  - Semantic markup
  - Responsive design
  - Flexbox/Grid layouts
  
- **Bootstrap 5.3**
  - Mobile-first approach
  - Component styling
  - Utility classes

- **JavaScript/Chart.js**
  - Dynamic data fetching
  - Interactive visualizations
  - Real-time updates

### Backend Architecture
- **Node.js/Express**
  - RESTful API endpoints
  - Modular routing
  - Error handling middleware

- **MySQL Database**
  - Relational data model
  - Foreign key relationships
  - Optimized queries

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### 1. Sales Data
```http
GET /sales
```
- **Description**: Retrieve sales trend data over time
- **Query Parameters**:
  - `start_date` (optional): YYYY-MM-DD
  - `end_date` (optional): YYYY-MM-DD
  - `limit` (optional): Number of records (default: 50)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "transaction_id": "string",
        "date": "timestamp",
        "amount": "number",
        "product_id": "string",
        "quantity": "number"
      }
    ]
  }
  ```

#### 2. Product Inventory
```http
GET /products
```
- **Description**: Get current inventory levels
- **Query Parameters**:
  - `category` (optional): Filter by product category
  - `in_stock` (optional): Boolean to filter available items
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "product_id": "string",
        "name": "string",
        "quantity": "number",
        "category": "string",
        "unit_price": "number"
      }
    ]
  }
  ```

#### 3. Delivery Status
```http
GET /deliveries
```
- **Description**: Track delivery status and routes
- **Query Parameters**:
  - `status` (optional): pending/in-transit/delivered
  - `date` (optional): YYYY-MM-DD
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "delivery_id": "string",
        "status": "string",
        "estimated_arrival": "timestamp",
        "current_location": "string",
        "transaction_id": "string"
      }
    ]
  }
  ```

#### 4. Growth Forecasts
```http
GET /forecasts
```
- **Description**: Retrieve market growth predictions
- **Query Parameters**:
  - `period` (optional): daily/weekly/monthly
  - `forecast_range` (optional): number of periods
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "predictions": [
        {
          "date": "timestamp",
          "predicted_value": "number",
          "confidence_interval": "number"
        }
      ],
      "accuracy_metrics": {
        "mape": "number",
        "rmse": "number"
      }
    }
  }
  ```

#### 5. Dashboard Overview
```http
GET /overview
```
- **Description**: Get aggregated dashboard statistics
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "total_sales": "number",
      "active_deliveries": "number",
      "low_stock_items": "number",
      "revenue_growth": "number"
    }
  }
  ```

#### 6. Inventory Logs
```http
GET /inventory-logs
```
- **Description**: Recent inventory activities and changes
- **Query Parameters**:
  - `action_type` (optional): addition/reduction/adjustment
  - `limit` (optional): Number of records (default: 20)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "log_id": "string",
        "product_id": "string",
        "action_type": "string",
        "quantity_change": "number",
        "timestamp": "timestamp"
      }
    ]
  }
  ```

#### 7. Top Products
```http
GET /top-products
```
- **Description**: List of best-selling products
- **Query Parameters**:
  - `timeframe` (optional): daily/weekly/monthly
  - `limit` (optional): Number of products (default: 10)
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "product_id": "string",
        "name": "string",
        "total_sales": "number",
        "revenue": "number",
        "rank": "number"
      }
    ]
  }
  ```

#### 8. Category Sales
```http
GET /category-sales
```
- **Description**: Sales breakdown by product category
- **Query Parameters**:
  - `period` (optional): YYYY-MM
  - `sort_by` (optional): revenue/volume
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "category": "string",
        "total_sales": "number",
        "revenue": "number",
        "product_count": "number"
      }
    ]
  }
  ```

### Error Responses
All endpoints follow the same error response format:
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

Common error codes:
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error

## API Endpoints
/api/sales -Sales trend data
/api/products - Inventory levels
/api/deliveries - Delivery status
/api/forecasts - Growth metrics
/api/overview - Dashboard stats
/api/inventory-logs - Recent inventory activities
/api/top-products - Top selling products
/api/category-sales - Sales by category

## Database Schema

### Entity Relationship Diagram (ERD)
![ERD Diagram](docs/erd_diagram.png)

#### Tables Structure
- **roles**
  ├── role_id (PK)
  ├── role_name
  └── created_at

- **users**
  ├── user_id (PK)
  ├── role_id (FK)
  ├── username
  ├── password_hash
  ├── full_name
  ├── email
  └── created_at

- **products**
  ├── product_id (PK)
  ├── product_name
  ├── description
  ├── quantity_in_stock
  ├── unit_price
  ├── category
  └── created_at

- **sales_transactions**
├── transaction_id (PK)
├── user_id (FK)
├── transaction_date
├── total_amount
└── payment_status

**delivery_records**
├── delivery_id (PK)
├── transaction_id (FK)
├── delivery_date
├── delivery_status
└── created_at

**forecast_reports**
├── report_id (PK)
├── report_date
├── report_data (JSON)
└── created_at

## Setup Instructions

### Prerequisites
1. **Development Tools**
   - Visual Studio Code or preferred IDE
   - Git for version control
   - Postman for API testing

2. **Runtime Environment**
   - Node.js (v14 or higher)
   - npm (Node Package Manager)

3. **Database**
   - XAMPP (v8.0 or higher)
   - MySQL Workbench (optional)

### Step-by-Step Setup

1. **Install Dependencies**
   - Required Software:
     1. Node.js (v14 or higher) - JavaScript runtime environment
        - Download from: https://nodejs.org/
        - Verify installation: `node -v`
     
     2. XAMPP (v8.0 or higher) - Local development environment
        - Download from: https://www.apachefriends.org/
        - Includes: Apache, MySQL, PHP
        - Required for database management
     
     3. Git (latest version) - Version control system
        - Download from: https://git-scm.com/
        - Verify installation: `git --version`
   
     # Core dependencies
     npm install express mysql2 

2. **Database Setup**
   # Start XAMPP
   1. Open XAMPP Control Panel
   2. Start Apache and MySQL
   3. Visit http://localhost/phpmyadmin
   4. Create database 'casador_agri_market'
   5. Create tables(roles.products,sales_transactions,delivery_records,forecast_reports)

3. **System Set up**
   1. Use VSCode to open the project
   2. Key System Files:
      - `server.js`: Main application entry point that sets up Express server and middleware
      - `config/database.js`: Database connection configuration
      - `routes/`: Directory containing API route definitions
         - `api/sales.js`: Sales data endpoints
         - `api/products.js`: Product management endpoints
         - `api/deliveries.js`: Delivery tracking endpoints
         - `api/forecasts.js`: Growth forecasting endpoints
      - `controllers/`: Business logic implementation
         - `salesController.js`: Sales data processing
         - `productController.js`: Inventory management
         - `deliveryController.js`: Delivery status handling
         - `forecastController.js`: Market predictions
      - `models/`: Database models and queries
      - `public/`: Frontend assets
         - `css/`: Stylesheets including Bootstrap customization
         - `js/`: Chart.js implementations and dashboard logic
      - `views/`: Frontend templates and components
      - `ecosystem.config.js`: PM2 deployment configuration
      - `.env`: Environment variables (create from .env.example)

4. **Start Application**
   1. Download Node
   2. Open git bash on any terminal
   3. Check for the version(node -v)
   4. Type node "server.js" 
   5. Go to any browser and type you access points(http://localhost:3000)

## Dependencies

### Backend
{
  "dependencies": {
    "express": "^4.17.1",
    "mysql2": "^2.3.0",
    "dotenv": "^10.0.0",
    "cors": "^2.8.5",
    "helmet": "^4.6.0",
    "compression": "^1.7.4",
    "express-validator": "^6.12.0",
    "jsonwebtoken": "^8.5.1",
    "bcrypt": "^5.0.1",
    "winston": "^3.3.3",
    "chart.js": "^3.7.0",
    "bootstrap": "^5.3.0",
    "@fortawesome/fontawesome-free": "^5.15.4"
  }
}

### Development Dependencies
{
  "devDependencies": {
    "nodemon": "^2.0.12",
    "jest": "^27.0.6",
    "supertest": "^6.1.3",
    "eslint": "^7.32.0",
    "prettier": "^2.3.2"
  }
}

## Project Structure
casador_agri_dashboard/
├── public/                 # Static files
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side scripts
│   └── assets/            # Images and fonts
├── views/                 # EJS templates
├── routes/                # API routes
├── controllers/           # Business logic
├── models/               # Database models
├── middleware/           # Custom middleware
├── utils/               # Helper functions
├── config/              # Configuration files
├── docs/                # Documentation
└── tests/              # Test files

## Access Points
- Development: http://localhost:3000

## Contributors
Group Members:
- Angelica Nicole D. Aguilar
- May Trixie Manumbali
- Princess Jhaymie Manalo
- Raven Landicho

Course: BSIT-BA-3203
Batangas State University
College of Informatics and Computing Sciences

## License
This project is created for academic purposes at Batangas State University.
All rights reserved © 2024