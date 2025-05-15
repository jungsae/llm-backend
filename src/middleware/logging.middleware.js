import logger from '../utils/logger.js';

// 로깅 미들웨어
export const loggingMiddleware = async (request, reply) => {
    const startTime = Date.now();

    reply.raw.on('finish', () => {
        const responseTime = Date.now() - startTime;

        const logMessage = `${request.method} ${request.url} ${reply.statusCode} ${responseTime}ms`;
        logger.info(logMessage);
    });
}; 