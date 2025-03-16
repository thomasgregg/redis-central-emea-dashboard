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
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
  console.log('Created index.html');

  // Create a simple entry point file
  const entryFile = path.resolve(__dirname, 'src', 'index.js');
  
  // Bundle the React app using esbuild
  console.log('Bundling React app with esbuild...');
  execSync(`npx esbuild ${entryFile} --bundle --outfile=${path.join(distDir, 'bundle.js')} --platform=browser --target=es2015 --define:process.env.NODE_ENV=\\"production\\"`, { stdio: 'inherit' });
  console.log('React app bundled successfully');

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