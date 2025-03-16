#!/usr/bin/env node

console.log('Starting minimal build process...');

const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Create a simple index.html file
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
  <script>
    // Redirect to login page
    window.location.href = '/login';
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
console.log('Created index.html');

// Create a simple bundle.js file
const jsContent = `// Minimal bundle
console.log('Central EMEA Dashboard loaded');
// Redirect to login page
window.location.href = '/login';`;

fs.writeFileSync(path.join(distDir, 'bundle.js'), jsContent);
console.log('Created bundle.js');

// Create a simple login page
const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .login-container {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      text-align: center;
      color: #db3c3c;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #db3c3c;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 1rem;
    }
    button:hover {
      background-color: #c62828;
    }
    .logo {
      text-align: center;
      margin-bottom: 1rem;
    }
    .logo img {
      max-width: 150px;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">
      <img src="https://redis.com/wp-content/themes/wpx/assets/images/logo-redis.svg" alt="Redis Logo">
    </div>
    <h1>Central EMEA Dashboard</h1>
    <form id="login-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Simple login logic - in a real app, this would call the API
      if (email.includes('@redis.com')) {
        alert('Login successful! Redirecting to dashboard...');
        // In a real app, this would redirect to the dashboard
        window.location.href = '/dashboard';
      } else {
        alert('Invalid credentials. Please try again.');
      }
    });
  </script>
</body>
</html>`;

// Create login directory
const loginDir = path.join(distDir, 'login');
if (!fs.existsSync(loginDir)) {
  fs.mkdirSync(loginDir, { recursive: true });
}
fs.writeFileSync(path.join(loginDir, 'index.html'), loginHtml);
console.log('Created login page');

// Create a simple dashboard page
const dashboardDir = path.join(distDir, 'dashboard');
if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true });
}

const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .header {
      background-color: #db3c3c;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .logo img {
      height: 40px;
    }
    .container {
      padding: 2rem;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card h2 {
      margin-top: 0;
      color: #333;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      text-align: center;
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #db3c3c;
      margin: 0.5rem 0;
    }
    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }
    .nav {
      background-color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .nav ul {
      display: flex;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav li {
      margin-right: 2rem;
    }
    .nav a {
      text-decoration: none;
      color: #333;
      font-weight: 500;
    }
    .nav a.active {
      color: #db3c3c;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <img src="https://redis.com/wp-content/themes/wpx/assets/images/logo-redis.svg" alt="Redis Logo">
    </div>
    <h1>Central EMEA Dashboard</h1>
    <div>
      <span id="user-email">user@redis.com</span>
    </div>
  </div>
  
  <div class="nav">
    <ul>
      <li><a href="#" class="active">Dashboard</a></li>
      <li><a href="#">Events</a></li>
      <li><a href="#">BDR Campaigns</a></li>
    </ul>
  </div>
  
  <div class="container">
    <div class="card">
      <h2>Dashboard Overview</h2>
      <p>Welcome to the Central EMEA Dashboard. This is a placeholder page.</p>
      
      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">42</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">18</div>
          <div class="stat-label">Active Campaigns</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">156</div>
          <div class="stat-label">Leads Generated</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">€2.4M</div>
          <div class="stat-label">Pipeline Generated</div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>Recent Events</h2>
      <p>No events to display. This is a placeholder.</p>
    </div>
    
    <div class="card">
      <h2>Active BDR Campaigns</h2>
      <p>No campaigns to display. This is a placeholder.</p>
    </div>
  </div>
  
  <script>
    // Set user email from URL or localStorage in a real app
    document.getElementById('user-email').textContent = 'thomas.gregg@redis.com';
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(dashboardDir, 'index.html'), dashboardHtml);
console.log('Created dashboard page');

console.log('Build completed successfully!');
process.exit(0); 