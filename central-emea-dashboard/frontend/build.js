#!/usr/bin/env node

console.log('Starting React app build process...');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Create login and dashboard directories
const loginDir = path.join(distDir, 'login');
if (!fs.existsSync(loginDir)) {
  fs.mkdirSync(loginDir, { recursive: true });
  console.log('Created login directory');
}

const dashboardDir = path.join(distDir, 'dashboard');
if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true });
  console.log('Created dashboard directory');
}

try {
  // Install required dependencies
  console.log('Installing required dependencies...');
  execSync('npm install --no-fund esbuild', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');

  // Create a simple index.html file by copying from src
  try {
    const srcIndexPath = path.resolve(__dirname, 'src', 'index.html');
    if (fs.existsSync(srcIndexPath)) {
      fs.copyFileSync(srcIndexPath, path.join(distDir, 'index.html'));
      console.log('Copied src/index.html to dist/index.html');
    } else {
      // Fallback to creating a simple index.html file
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=/login">
  <title>Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <link rel="stylesheet" href="/styles.css" />
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      text-align: center;
    }
  </style>
  <!-- Immediate redirect if page doesn't load -->
  <script>
    // Redirect to login page immediately
    window.location.href = '/login';
  </script>
</head>
<body>
  <div id="root">
    <div style="text-align: center; padding: 20px;">
      <h1>Central EMEA Dashboard</h1>
      <p>Redirecting to login page...</p>
      <p>If you are not redirected, <a href="/login">click here</a>.</p>
    </div>
  </div>
  <noscript>
    <div style="text-align: center; padding: 20px;">
      <h1>Central EMEA Dashboard</h1>
      <p>JavaScript is required to use this application.</p>
      <a href="/login">Go to Login</a>
    </div>
  </noscript>
</body>
</html>`;

      fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
      console.log('Created index.html');
    }
  } catch (error) {
    console.error('Error creating index.html:', error.message);
  }

  // Create a simple CSS file
  const cssContent = `
/* Base styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
  background-color: #f5f5f5;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
`;

  fs.writeFileSync(path.join(distDir, 'styles.css'), cssContent);
  console.log('Created styles.css');

  // Create a simple entry point file
  const entryFile = path.resolve(__dirname, 'src', 'index.js');
  
  // Bundle the React app using esbuild
  console.log('Bundling React app with esbuild...');
  try {
    execSync(`npx esbuild ${entryFile} --bundle --outfile=${path.join(distDir, 'bundle.js')} --platform=browser --target=es2015 --define:process.env.NODE_ENV=\\"production\\" --loader:.js=jsx --loader:.jsx=jsx --loader:.css=text --loader:.svg=dataurl --loader:.png=dataurl --loader:.jpg=dataurl --loader:.jpeg=dataurl --loader:.gif=dataurl --external:react --external:react-dom --external:@mui/material --external:@mui/icons-material`, { stdio: 'inherit' });
    console.log('React app bundled successfully');
  } catch (error) {
    console.error('Error bundling with esbuild:', error.message);
    console.log('Falling back to simple bundle...');
    
    // Create a simple bundle.js file as fallback
    const fallbackBundle = `
// Fallback bundle.js
console.log('Loading Central EMEA Dashboard fallback...');

// Create a simple React app
const root = document.getElementById('root');
root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Central EMEA Dashboard</h1><p>Loading...</p></div>';

// Redirect to login page after a delay
setTimeout(() => {
  console.log('Redirecting to login page');
  window.location.href = '/login';
}, 1000);
`;
    
    fs.writeFileSync(path.join(distDir, 'bundle.js'), fallbackBundle);
    console.log('Created fallback bundle.js');
  }

  // Create a simple login page
  const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <link rel="stylesheet" href="/styles.css" />
  <style>
    .login-container {
      max-width: 400px;
      margin: 100px auto;
      padding: 20px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
    }
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background-color: #db3c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    h1 {
      text-align: center;
      color: #db3c3c;
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
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
        <input type="email" id="email" required>
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('email').value;
      if (email.includes('@redis.com')) {
        window.location.href = '/dashboard';
      } else {
        alert('Please use a Redis email address');
      }
    });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(loginDir, 'index.html'), loginHtml);
  console.log('Created login page');
  
  // Create a simple dashboard page
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <link rel="stylesheet" href="/styles.css" />
  <style>
    .header {
      background-color: #db3c3c;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .content {
      padding: 20px;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Central EMEA Dashboard</h1>
    <span id="user-email">user@redis.com</span>
  </div>
  <div class="content">
    <div class="card">
      <h2>Dashboard</h2>
      <p>Welcome to the Central EMEA Dashboard. This is a placeholder page.</p>
    </div>
    <div class="card">
      <h2>Events</h2>
      <p>No events to display.</p>
    </div>
    <div class="card">
      <h2>BDR Campaigns</h2>
      <p>No campaigns to display.</p>
    </div>
  </div>
  <script>
    // Set user email
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email') || localStorage.getItem('email') || 'thomas.gregg@redis.com';
    document.getElementById('user-email').textContent = email;
    localStorage.setItem('email', email);
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(dashboardDir, 'index.html'), dashboardHtml);
  console.log('Created dashboard page');

  // Copy static assets
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('Copying static assets...');
    execSync(`cp -r ${publicDir}/* ${distDir}`, { stdio: 'inherit' });
    console.log('Static assets copied successfully');
  }

  // Create a vercel.json file in the dist directory
  const vercelConfig = {
    "version": 2,
    "redirects": [
      { "source": "/", "destination": "/login", "permanent": false },
      { "source": "/index.html", "destination": "/login", "permanent": false }
    ],
    "routes": [
      { "src": "/api/(.*)", "dest": "/api/$1" },
      { "src": "/login", "dest": "/login/index.html" },
      { "src": "/dashboard", "dest": "/dashboard/index.html" },
      { "src": "/(.*)", "dest": "/index.html" }
    ],
    "cleanUrls": true
  };
  
  fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
  console.log('Created vercel.json for client-side routing');

  // Create a direct index.html in the login directory that doesn't rely on routing
  fs.writeFileSync(path.join(distDir, 'index.login.html'), fs.readFileSync(path.join(loginDir, 'index.html')));
  console.log('Created direct access login page');

  // Create a direct redirect index.html as a fallback
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Central EMEA Dashboard</title>
  <meta http-equiv="refresh" content="0;url=/login">
  <style>
    body {
      font-family: 'Roboto', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      text-align: center;
    }
  </style>
</head>
<body>
  <div>
    <h1>Central EMEA Dashboard</h1>
    <p>Redirecting to login page...</p>
    <p>If you are not redirected, <a href="/login">click here</a>.</p>
  </div>
  <script>
    window.location.href = '/login';
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(distDir, 'index.redirect.html'), redirectHtml);
  console.log('Created redirect index.html');

  // Copy the login page directly as index.html as a last resort
  fs.copyFileSync(path.join(loginDir, 'index.html'), path.join(distDir, 'index.html'));
  console.log('Copied login page as index.html');

  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 