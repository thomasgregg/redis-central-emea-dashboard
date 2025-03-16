// Direct start script without relying on shell scripts
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Starting servers directly...');
  
  // Get the base directory
  const baseDir = __dirname;
  console.log('Base directory:', baseDir);
  
  // Kill any running Node processes
  console.log('Killing any running Node processes...');
  try {
    execSync('pkill -f node || true');
  } catch (error) {
    // Ignore errors from pkill
    console.log('Note: pkill may have returned non-zero exit code, but we can continue');
  }
  
  // Reset Redis database
  console.log('Resetting Redis database...');
  execSync('node reset-redis.js', { 
    cwd: path.join(baseDir, 'backend'),
    stdio: 'inherit'
  });
  
  // Update partner data
  console.log('Updating partner data...');
  execSync('node direct-update-partners.js', { 
    cwd: path.join(baseDir, 'backend'),
    stdio: 'inherit'
  });
  
  // Start backend server
  console.log('Starting backend server...');
  const backendCmd = 'node server.js > backend.log 2>&1 &';
  execSync(backendCmd, { 
    cwd: path.join(baseDir, 'backend'),
    shell: '/bin/bash'
  });
  
  // Wait for backend to start
  console.log('Waiting for backend to start...');
  execSync('sleep 5');
  
  // Start frontend server
  console.log('Starting frontend server...');
  const frontendCmd = 'npm start > frontend.log 2>&1 &';
  execSync(frontendCmd, { 
    cwd: path.join(baseDir, 'frontend'),
    shell: '/bin/bash'
  });
  
  console.log('Both servers should be running now.');
  console.log('You can access the application at http://localhost:3000');
  console.log('Login credentials:');
  console.log('  - Email: thomas.gregg@redis.com / Password: password123');
  console.log('  - OR -');
  console.log('  - Email: admin@redis.com / Password: admin123');
  
  // Show running Node processes
  console.log('\nChecking running Node processes:');
  try {
    const ps = execSync('ps aux | grep node | grep -v grep');
    console.log(ps.toString());
  } catch (error) {
    console.log('No Node processes found running');
  }
  
} catch (error) {
  console.error('Error starting servers:', error);
} 