const {TG_TOKEN, MONGO_URI} = require("./config/config");

module.exports = {
  apps: [
    {
      name: 'secret-santa-api',
      script: './dist/index.js',
      watch: true,
      ignore_watch: ['node_modules'],
      env: {
        NODE_ENV: 'production',
        TG_TOKEN: TG_TOKEN,
        MONGO_URI: MONGO_URI,
      },
    },
  ],
};

// Запуск - pm2 start ecosystem.config.js
