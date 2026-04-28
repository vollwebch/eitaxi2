module.exports = {
  apps: [{
    name: 'eitaxi',
    script: '.next/standalone/server.js',
    cwd: '/home/z/my-project',
    
    // Auto-restart settings
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Retry policy: restart up to 99 times, with exponential backoff
    exp_backoff_restart_delay: 100,
    max_restarts: 99,
    restart_delay: 3000,
    
    // Keep alive: restart even if stopped manually
    // (only stops with pm2 stop/delete)
    
    // Logging
    error_file: '/home/z/.pm2/logs/eitaxi-error.log',
    out_file: '/home/z/.pm2/logs/eitaxi-out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Env
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Kill timeout before force kill
    kill_timeout: 5000,
    
    // Listen timeout
    listen_timeout: 10000,
    
    // Shutdown with message
    shutdown_with_message: true,
  }]
};
