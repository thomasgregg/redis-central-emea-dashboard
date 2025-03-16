import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'pipe',
    env: {
        ...process.env,
        NODE_ENV: 'development',
        DEBUG: '*'
    }
});

serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data}`);
});

serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data}`);
});

serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
});

serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
}); 