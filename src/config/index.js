export default {
    port: process.env.PORT,
    host: process.env.HOST,
    env: process.env.NODE_ENV || 'development',
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    },
    rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost',
        queues: {
            job: {
                name: 'job_queue',
                options: {
                    durable: true,
                    arguments: {
                        'x-max-priority': 10
                    }
                }
            }
        }
    }
}; 