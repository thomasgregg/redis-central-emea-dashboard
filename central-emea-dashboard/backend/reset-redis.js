const redis = require('redis');
const { promisify } = require('util');

async function resetRedis() {
    try {
        console.log('Connecting to Redis...');
        const client = redis.createClient();
        
        // Handle Redis connection errors
        client.on('error', (err) => {
            console.error('Redis connection error:', err);
            process.exit(1);
        });
        
        // Wait for connection
        client.on('connect', async () => {
            try {
                console.log('Connected to Redis');
                
                // Promisify Redis commands
                const flushAllAsync = promisify(client.flushall).bind(client);
                const quitAsync = promisify(client.quit).bind(client);
                
                // Flush all data
                console.log('Flushing all Redis data...');
                await flushAllAsync();
                console.log('Redis database reset successfully');
                
                // Create test users
                console.log('Creating test users...');
                const setAsync = promisify(client.set).bind(client);
                
                // Create admin user
                await setAsync('user:admin@redis.com', JSON.stringify({
                    email: 'admin@redis.com',
                    password: 'admin123',
                    name: 'Admin User',
                    role: 'admin'
                }));
                
                // Create regular user
                await setAsync('user:thomas.gregg@redis.com', JSON.stringify({
                    email: 'thomas.gregg@redis.com',
                    password: 'password123',
                    name: 'Thomas Gregg',
                    role: 'user'
                }));
                
                console.log('Test users created successfully');
                
                // Close the connection
                await quitAsync();
                console.log('Redis connection closed');
                process.exit(0);
            } catch (error) {
                console.error('Error in Redis operations:', error);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Error resetting Redis:', error);
        process.exit(1);
    }
}

// Execute the reset function
resetRedis(); 