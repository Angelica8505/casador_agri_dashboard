module.exports = {
  apps: [{
    name: 'casador-agri-dashboard',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_USER: 'root',
      DB_PASSWORD: '',
      DB_NAME: 'casador_agri_market'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80,
      DB_HOST: 'localhost',
      DB_USER: 'production_user',
      DB_PASSWORD: 'secure_password',
      DB_NAME: 'casador_agri_market'
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-production-server',
      ref: 'origin/main',
      repo: 'git@github.com:username/casador_agri_dashboard.git',
      path: '/var/www/casador_agri_dashboard',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    development: {
      user: 'local',
      host: 'localhost',
      ref: 'origin/develop',
      repo: 'git@github.com:username/casador_agri_dashboard.git',
      path: '/var/www/development/casador_agri_dashboard',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env development'
    }
  }
}; 