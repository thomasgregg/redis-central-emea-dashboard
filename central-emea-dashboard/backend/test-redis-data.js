import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRedisData() {
    const client = createClient({
        url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    try {
        console.log('Connecting to Redis...');
        await client.connect();
        console.log('Connected to Redis');

        // Test basic operations
        console.log('\nTesting basic operations...');
        await client.set('test:string', 'test value');
        const stringValue = await client.get('test:string');
        console.log('String operation:', stringValue);

        // Test hash operations
        console.log('\nTesting hash operations...');
        await client.hSet('test:hash', {
            field1: 'value1',
            field2: 'value2'
        });
        const hashValue = await client.hGetAll('test:hash');
        console.log('Hash operation:', hashValue);

        // Test existing data
        console.log('\nChecking existing data...');
        const salesDataExists = await client.get('sales:data');
        console.log('Sales data exists:', salesDataExists);

        const meddpiccDataExists = await client.get('meddpicc:data');
        console.log('MEDDPICC data exists:', meddpiccDataExists);

        // Test MEDDPICC data structure
        if (meddpiccDataExists) {
            console.log('\nChecking MEDDPICC data structure...');
            const meddpiccRecord = await client.get('meddpicc:1');
            console.log('MEDDPICC record 1:', meddpiccRecord);
        }

        // Test sales data structure
        if (salesDataExists) {
            console.log('\nChecking sales data structure...');
            const salesKeys = await client.keys('sales:*');
            console.log('Sales keys:', salesKeys);
            if (salesKeys.length > 0) {
                const sampleSalesData = await client.hGetAll(salesKeys[0]);
                console.log('Sample sales data:', sampleSalesData);
            }
        }

        // Clean up test data
        await client.del('test:string');
        await client.del('test:hash');

        await client.quit();
        console.log('\nRedis test completed successfully');
    } catch (error) {
        console.error('Redis test failed:', error);
        process.exit(1);
    }
}

testRedisData(); 