// Run the start-and-check.js script
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running start-and-check.js script...');
  
  // Get the base directory
  const baseDir = __dirname;
  console.log('Base directory:', baseDir);
  
  // Run the start-and-check.js script
  console.log('Starting servers and checking logs...');
  execSync('node start-and-check.js', { 
    cwd: baseDir,
    stdio: 'inherit'
  });
  
} catch (error) {
  console.error('Error running start-and-check.js script:', error);
} 