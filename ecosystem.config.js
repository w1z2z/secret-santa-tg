module.exports = {
  apps: [
    {
      name: 'secret-santa-api',
      script: './dist/index.js',
      watch: true,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
        TG_TOKEN: process.env.TG_TOKEN,
        MONGO_URI: process.env.MONGO_URI,
      },
    },
  ],
};

// Запуск - pm2 start ecosystem.config.js
