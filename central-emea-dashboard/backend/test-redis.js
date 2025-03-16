import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRedis() {
    const client = createClient({
        url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    client.on('error', (err) => {
        console.error('Redis error:', err);
    });

    try {
        console.log('Connecting to Redis...');
        await client.connect();
        console.log('Connected to Redis');

        console.log('Testing ping...');
        const pingResult = await client.ping();
        console.log('Ping result:', pingResult);

        console.log('Testing set/get...');
        await client.set('test-key', 'test-value');
        const value = await client.get('test-key');
        console.log('Get result:', value);

        await client.quit();
        console.log('Redis test completed successfully');
    } catch (error) {
        console.error('Redis test failed:', error);
        process.exit(1);
    }
}

testRedis(); 