import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import config from './config/index.js';
import { connectRabbitMQ, closeRabbitMQ, consumeJobs } from './infrastructure/rabbitmq.js';
import { processJob } from './services/job.processor.js';
import fastifyFormbody from '@fastify/formbody';

const server = Fastify({
    logger: true
});

// CORS 설정
await server.register(cors, config.cors);

// Form Body Parser 설정
await server.register(fastifyFormbody);

// 전역 에러 핸들러
server.setErrorHandler(errorHandler);

// 라우트 등록
await server.register(routes);

// 서버 시작
const start = async () => {
    try {
        // RabbitMQ 연결
        await connectRabbitMQ();

        // 작업 소비 시작
        await consumeJobs(processJob);
        console.log('MQ작업 대기중');

        // 서버 시작
        await server.listen({
            port: config.port,
            host: config.host
        });

        // 종료 시 정리
        const close = async () => {
            await closeRabbitMQ();
            await server.close();
            process.exit(0);
        };

        process.on('SIGINT', close);
        process.on('SIGTERM', close);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();