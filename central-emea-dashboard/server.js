// Simple script to start both servers
const { exec } = require('child_process');
const path = require('path');

console.log('Starting servers...');

// Get the base directory
const baseDir = __dirname;
console.log('Base directory:', baseDir);

// Kill any running Node processes
console.log('Killing any running Node processes...');
exec('pkill -f node || true', (error) => {
  if (error) {
    console.error('Error killing Node processes:', error);
  }
  
  console.log('Starting backend server...');
  const backendProcess = exec('cd ' + path.join(baseDir, 'backend') + ' && node server.js', 
    (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting backend server:', error);
        return;
      }
      console.log('Backend output:', stdout);
      if (stderr) {
        console.error('Backend errors:', stderr);
      }
    }
  );
  
  backendProcess.stdout.on('data', (data) => {
    console.log('Backend:', data.toString());
  });
  
  backendProcess.stderr.on('data', (data) => {
    console.error('Backend error:', data.toString());
  });
  
  // Wait a bit for backend to start
  setTimeout(() => {
    console.log('Starting frontend server...');
    const frontendProcess = exec('cd ' + path.join(baseDir, 'frontend') + ' && npm start',
      (error, stdout, stderr) => {
        if (error) {
          console.error('Error starting frontend server:', error);
          return;
        }
        console.log('Frontend output:', stdout);
        if (stderr) {
          console.error('Frontend errors:', stderr);
        }
      }
    );
    
    frontendProcess.stdout.on('data', (data) => {
      console.log('Frontend:', data.toString());
    });
    
    frontendProcess.stderr.on('data', (data) => {
      console.error('Frontend error:', data.toString());
    });
    
    console.log('Both servers should be running now.');
    console.log('You can access the application at http://localhost:3000');
    console.log('Login credentials:');
    console.log('  - Email: thomas.gregg@redis.com / Password: password123');
    console.log('  - OR -');
    console.log('  - Email: admin@redis.com / Password: admin123');
  }, 5000);
}); 