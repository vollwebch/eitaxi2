const { spawn } = require('child_process');
const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
  stdio: 'inherit',
  cwd: '/home/z/my-project'
});
child.on('exit', (code) => {
  console.log('Server exited with code:', code);
  process.exit(code);
});
