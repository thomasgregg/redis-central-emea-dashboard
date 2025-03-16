// Start servers immediately
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting servers immediately...');
  
  // Get the base directory
  const baseDir = __dirname;
  console.log('Base directory:', baseDir);
  
  // Run bash directly on the run-all.sh script
  console.log('Running bash on run-all.sh...');
  execSync('bash ' + path.join(baseDir, 'run-all.sh'), { 
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Error starting servers:', error);
}

// This script is being executed directly
if (require.main === module) {
  console.log('Starting servers now...');
} 