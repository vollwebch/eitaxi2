const { spawn } = require('child_process');
const path = require('path');

const STANDALONE_DIR = path.join(__dirname, '.next', 'standalone');

function start() {
  const child = spawn('node', ['server.js'], {
    cwd: STANDALONE_DIR,
    env: {
      ...process.env,
      DATABASE_URL: 'file:/home/z/my-project/eitaxi-project/db/custom.db',
      NEXTAUTH_SECRET: 'eitaxi-secret-key-2024',
      NEXTAUTH_URL: 'http://localhost:3000',
      NODE_ENV: 'production'
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  child.on('exit', (code) => {
    console.log(`Server exited with code ${code}, restarting in 1s...`);
    setTimeout(start, 1000);
  });
  child.on('error', (err) => {
    console.error('Server error:', err);
    setTimeout(start, 1000);
  });
}

start();
