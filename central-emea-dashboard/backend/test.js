import express from 'express';
import { createClient } from 'redis';
import dotenv from 'dotenv';

console.log('Starting test...');

dotenv.config();

console.log('Environment loaded');

const app = express();
console.log('Express app created');

const client = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

console.log('Redis client created');

client.on('error', (err) => console.error('Redis Client Error:', err));
client.on('connect', () => console.log('Connected to Redis'));

try {
    await client.connect();
    console.log('Redis connection attempt completed');
} catch (error) {
    console.error('Failed to connect to Redis:', error);
}

const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 