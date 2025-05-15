import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import config from './config/index.js';
import { connectRabbitMQ, closeRabbitMQ } from './infrastructure/queue/rabbitmq.js';
import fastifyFormbody from '@fastify/formbody';
import logger from './utils/logger.js';

// Fastify 인스턴스 생성
const server = Fastify({
    logger: false,
    bodyLimit: 30 * 1024 * 1024,  // 30MB
    keepBodyOnError: true         // 에러 시 원본 본문 유지
});

// CORS 설정
await server.register(cors, config.cors);

// Form Body Parser 설정
await server.register(fastifyFormbody);

// 로깅 미들웨어
server.addHook('onRequest', loggingMiddleware);

// 전역 에러 핸들러
server.setErrorHandler(errorHandler);

// 라우트 등록
await server.register(routes);

// 서버 시작
const start = async () => {
    try {
        // RabbitMQ 연결
        await connectRabbitMQ();
        logger.info('RabbitMQ 연결 성공');

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
        logger.error('서버 시작 실패:', err);
        process.exit(1);
    }
};

start();