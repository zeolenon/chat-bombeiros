module.exports = {
  apps: [{
    name: 'chat-bombeiros',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      QDRANT_URL: 'http://localhost:6333',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'chat_bombeiros',
      DB_USER: 'zenon',
      DB_PASSWORD: 'akpaloha'
    }
  }]
}; 