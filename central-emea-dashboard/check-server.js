// Check if servers are running
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Checking if servers are running...');
  
  // Check running Node processes
  console.log('\nRunning Node processes:');
  try {
    const ps = execSync('ps aux | grep node | grep -v grep');
    console.log(ps.toString());
    console.log('Node processes found running.');
  } catch (error) {
    console.log('No Node processes found running. Servers may not be started.');
  }
  
  // Check if backend server is responding
  console.log('\nChecking if backend server is responding:');
  try {
    const response = execSync('curl -s http://localhost:5001/api/health || echo "Backend server is not responding"');
    console.log(response.toString());
  } catch (error) {
    console.log('Error checking backend server:', error.message);
  }
  
  // Check if frontend server is responding
  console.log('\nChecking if frontend server is responding:');
  try {
    const response = execSync('curl -s http://localhost:3000 || echo "Frontend server is not responding"');
    console.log('Frontend server response received (too large to display)');
  } catch (error) {
    console.log('Error checking frontend server:', error.message);
  }
  
  // Check backend log if it exists
  const baseDir = __dirname;
  const backendLogPath = path.join(baseDir, 'backend.log');
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
  
  // If servers are not running, start them
  console.log('\nIf servers are not running, you can start them with:');
  console.log('node start-and-check.js');
  
} catch (error) {
  console.error('Error checking servers:', error);
} 