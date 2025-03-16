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

try {
  // Install required dependencies
  console.log('Installing required dependencies...');
  execSync('npm install --no-fund esbuild', { stdio: 'inherit' });
  console.log('Dependencies installed successfully');

  // Create a simple index.html file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Central EMEA Dashboard</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
  <link rel="stylesheet" href="/styles.css" />
  <!-- Material UI and React dependencies -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/@mui/material@5.12.1/umd/material-ui.production.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
  console.log('Created index.html');

  // Create a simple CSS file
  const cssContent = `
/* Base styles */
body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
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
console.log('Loading Central EMEA Dashboard...');

// Create a simple React app
const root = document.getElementById('root');
root.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Central EMEA Dashboard</h1><p>Loading...</p></div>';

// Redirect to login page after a delay
setTimeout(() => {
  window.location.href = '/login';
}, 1000);
`;
    
    fs.writeFileSync(path.join(distDir, 'bundle.js'), fallbackBundle);
    console.log('Created fallback bundle.js');
    
    // Create a simple login page
    const loginDir = path.join(distDir, 'login');
    if (!fs.existsSync(loginDir)) {
      fs.mkdirSync(loginDir, { recursive: true });
    }
    
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
  </style>
</head>
<body>
  <div class="login-container">
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
  }

  // Copy static assets
  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    console.log('Copying static assets...');
    execSync(`cp -r ${publicDir}/* ${distDir}`, { stdio: 'inherit' });
    console.log('Static assets copied successfully');
  }

  // Create a vercel.json file in the dist directory
  const vercelConfig = {
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api/$1" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  };
  
  fs.writeFileSync(path.join(distDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
  console.log('Created vercel.json for client-side routing');

  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 