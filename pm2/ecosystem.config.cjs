/** @type {import('pm2').EcosystemConfig} */
module.exports = {
  apps: [
    {
      name: 'strainspotter-backend',
      script: 'backend/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      watch: ['backend', 'env'],
      ignore_watch: ['node_modules', 'logs']
    }
  ]
};
