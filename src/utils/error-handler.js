import config from '../config/index.js';

export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const handleError = (error, request, reply) => {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            status: error.status,
            message: error.message
        });
    }

    // 개발 환경에서만 스택 트레이스 표시
    const isDevelopment = config.env === 'development';

    return reply.status(500).send({
        status: 'error',
        message: 'Internal Server Error',
        ...(isDevelopment && { stack: error.stack })
    });
}; 