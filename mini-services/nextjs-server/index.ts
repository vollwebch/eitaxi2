import { spawn } from 'child_process';
import path from 'path';

const projectDir = '/home/z/my-project';

while (true) {
  console.log('Starting Next.js server...');
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: projectDir,
    stdio: 'inherit',
    shell: true
  });
  
  child.on('exit', (code) => {
    console.log(`Next.js exited with code ${code}. Restarting in 2 seconds...`);
  });
  
  // Keep running
  await new Promise(resolve => {
    child.on('exit', resolve);
  });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
}
