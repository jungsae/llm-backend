import { ERROR_CODES } from '../errors/error.codes.js';
import { AppError } from '../errors/error.handler.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export const errorHandler = (error, request, reply) => {
    // 원본 요청 본문 가져오기
    let rawBody = '';
    if (request.raw && request.raw.body) {
        rawBody = request.raw.body;
    } else if (request.body) {
        rawBody = request.body;
    }

    // 에러 로깅
    const errorContext = {
        method: request.method,
        url: request.url,
        body: request.body,
        rawBody: rawBody,
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode
        }
    };

    // JSON 파싱 에러인 경우 위치 정보 추가
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
        errorContext.error.position = error.message.match(/position (\d+)/)?.[1];
        errorContext.error.line = error.message.match(/line (\d+)/)?.[1];
        errorContext.error.column = error.message.match(/column (\d+)/)?.[1];
    }

    // 커스텀 에러 처리
    if (error instanceof AppError) {
        logger.error('애플리케이션 에러 발생:', errorContext);
        return reply.status(error.statusCode).send({
            status: error.status,
            message: error.message,
            code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
            details: error.details || {}
        });
    }

    // 개발 환경에서만 스택 트레이스 표시
    const isDevelopment = config.env === 'development';

    // 시스템 에러 처리
    logger.error('시스템 에러 발생:', errorContext);
    return reply.status(500).send({
        status: 'error',
        message: 'Internal Server Error',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        ...(isDevelopment && { stack: error.stack })
    });
};