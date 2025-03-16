// Simple script to start servers using bash
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting servers using bash...');
  
  // Get the base directory
  const baseDir = __dirname;
  console.log('Base directory:', baseDir);
  
  // Run the run-all.sh script using bash directly
  console.log('Running run-all.sh with bash...');
  const output = execSync('bash ' + path.join(baseDir, 'run-all.sh'), { 
    stdio: 'inherit'
  });
  
  console.log('Servers should be running now.');
} catch (error) {
  console.error('Error starting servers:', error);
} 