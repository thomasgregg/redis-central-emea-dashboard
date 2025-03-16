// Simple script to start both servers
const { spawn, exec } = require('child_process');
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
  
  // Reset Redis database
  console.log('Resetting Redis database...');
  const resetRedis = spawn('node', ['reset-redis.js'], { 
    cwd: path.join(baseDir, 'backend'),
    stdio: 'inherit'
  });
  
  resetRedis.on('close', (code) => {
    console.log(`Reset Redis process exited with code ${code}`);
    
    // Update partner data
    console.log('Updating partner data...');
    const updatePartners = spawn('node', ['direct-update-partners.js'], { 
      cwd: path.join(baseDir, 'backend'),
      stdio: 'inherit'
    });
    
    updatePartners.on('close', (code) => {
      console.log(`Update partners process exited with code ${code}`);
      
      // Start backend server
      console.log('Starting backend server...');
      const backendServer = spawn('node', ['server.js'], { 
        cwd: path.join(baseDir, 'backend'),
        stdio: 'inherit',
        detached: true
      });
      
      backendServer.unref();
      
      // Wait for backend to start
      setTimeout(() => {
        // Start frontend server
        console.log('Starting frontend server...');
        const frontendServer = spawn('npm', ['start'], { 
          cwd: path.join(baseDir, 'frontend'),
          stdio: 'inherit',
          detached: true
        });
        
        frontendServer.unref();
        
        console.log('Both servers should be running now.');
        console.log('You can access the application at http://localhost:3000');
        console.log('Login credentials:');
        console.log('  - Email: thomas.gregg@redis.com / Password: password123');
        console.log('  - OR -');
        console.log('  - Email: admin@redis.com / Password: admin123');
      }, 5000);
    });
  });
}); 