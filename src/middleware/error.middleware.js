import { ValidationError, NotFoundError, BusinessError } from '../errors/custom.error.js';

export const errorHandler = (error, request, reply) => {
    // 커스텀 에러 처리
    if (error instanceof ValidationError) {
        return reply.code(error.statusCode).send({
            error: {
                name: error.name,
                message: error.message
            }
        });
    }

    if (error instanceof NotFoundError) {
        return reply.code(error.statusCode).send({
            error: {
                name: error.name,
                message: error.message
            }
        });
    }

    if (error instanceof BusinessError) {
        return reply.code(error.statusCode).send({
            error: {
                name: error.name,
                message: error.message
            }
        });
    }

    // Prisma 에러 처리
    if (error.code === 'P2002') {
        return reply.code(400).send({
            error: {
                name: 'ValidationError',
                message: 'Unique constraint violation'
            }
        });
    }

    // 기본 에러 처리
    request.log.error(error);
    return reply.code(500).send({
        error: {
            name: 'InternalServerError',
            message: 'Something went wrong'
        }
    });
}; 