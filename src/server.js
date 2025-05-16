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
import prisma from './infrastructure/database/prisma.js';

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

// 라우트 등록
server.register(routes);

// 에러 핸들러 등록
server.setErrorHandler(errorHandler);

// 서버 시작
const start = async () => {
    try {
        // 데이터베이스 연결
        await prisma.$connect();
        logger.info('데이터베이스 연결 성공');

        // RabbitMQ 연결
        await connectRabbitMQ();
        logger.info('RabbitMQ 연결 성공');

        await server.listen({ port: config.port, host: config.host });
        logger.info(`서버가 ${config.host}:${config.port}에서 실행 중입니다.`);
    } catch (err) {
        logger.error('서버 시작 중 오류 발생:', err);
        process.exit(1);
    }
};

// 서버 종료 처리
const shutdown = async () => {
    try {
        await server.close();
        await prisma.$disconnect();
        await closeRabbitMQ();
        logger.info('서버가 정상적으로 종료되었습니다.');
        process.exit(0);
    } catch (err) {
        logger.error('서버 종료 중 오류 발생:', err);
        process.exit(1);
    }
};

// 종료 시그널 처리
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();