// PM2 süreç yapılandırması — VPS'te `pm2 start deploy/ecosystem.config.cjs`
module.exports = {
  apps: [
    {
      name: 'bozkir-next',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: __dirname + '/..',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
