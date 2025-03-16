// Simple script to check backend status
const { execSync } = require('child_process');

try {
  // Check if backend server is running
  console.log('Checking backend server status...');
  const ps = execSync('ps aux | grep node | grep -v grep');
  console.log('Running Node processes:', ps.toString());
  
  // Check backend logs
  console.log('\nChecking backend logs:');
  const logs = execSync('tail -n 20 backend.log');
  console.log(logs.toString());
} catch (error) {
  console.error('Error:', error);
} 