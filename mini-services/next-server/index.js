const { spawn } = require('child_process');
const path = require('path');

const projectDir = '/home/z/my-project';

function startServer() {
  console.log('Starting Next.js server...');
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: false
  });
  
  child.on('error', (err) => {
    console.error('Failed to start server:', err);
  });
  
  child.on('exit', (code, signal) => {
    console.log(`Server exited with code ${code}, signal ${signal}`);
    setTimeout(startServer, 2000);
  });
  
  return child;
}

startServer();
