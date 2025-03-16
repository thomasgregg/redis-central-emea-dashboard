// Start servers and check logs
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  console.log('Starting servers and checking logs...');
  
  // Get the base directory
  const baseDir = __dirname;
  console.log('Base directory:', baseDir);
  
  // Kill any running Node processes
  console.log('Killing any running Node processes...');
  try {
    execSync('pkill -f node || true');
    console.log('Node processes killed');
  } catch (error) {
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
  
  // Start backend server with output to log file
  console.log('Starting backend server...');
  const backendLogPath = path.join(baseDir, 'backend.log');
  execSync(`node server.js > ${backendLogPath} 2>&1 &`, { 
    cwd: path.join(baseDir, 'backend'),
    shell: '/bin/bash'
  });
  
  // Wait for backend to start
  console.log('Waiting for backend to start...');
  execSync('sleep 5');
  
  // Start frontend server with output to log file
  console.log('Starting frontend server...');
  const frontendLogPath = path.join(baseDir, 'frontend.log');
  execSync(`npm start > ${frontendLogPath} 2>&1 &`, { 
    cwd: path.join(baseDir, 'frontend'),
    shell: '/bin/bash'
  });
  
  // Wait for frontend to start
  console.log('Waiting for frontend to start...');
  execSync('sleep 10');
  
  // Check if servers are running
  console.log('\nChecking running Node processes:');
  try {
    const ps = execSync('ps aux | grep node | grep -v grep');
    console.log(ps.toString());
    console.log('Servers are running!');
  } catch (error) {
    console.log('No Node processes found running. Servers may have failed to start.');
  }
  
  // Check backend log
  console.log('\nChecking backend log:');
  try {
    if (fs.existsSync(backendLogPath)) {
      // Read the last 20 lines of the log
      const backendLog = execSync(`tail -n 20 ${backendLogPath}`).toString();
      console.log(backendLog);
    } else {
      console.log('Backend log file not found');
    }
  } catch (error) {
    console.log('Error reading backend log:', error.message);
  }
  
  // Check frontend log
  console.log('\nChecking frontend log:');
  try {
    if (fs.existsSync(frontendLogPath)) {
      // Read the last 20 lines of the log
      const frontendLog = execSync(`tail -n 20 ${frontendLogPath}`).toString();
      console.log(frontendLog);
    } else {
      console.log('Frontend log file not found');
    }
  } catch (error) {
    console.log('Error reading frontend log:', error.message);
  }
  
  console.log('\nServers should be running now.');
  console.log('You can access the application at http://localhost:3000');
  console.log('Login credentials:');
  console.log('  - Email: thomas.gregg@redis.com / Password: password123');
  console.log('  - OR -');
  console.log('  - Email: admin@redis.com / Password: admin123');
  
} catch (error) {
  console.error('Error starting servers:', error);
} 