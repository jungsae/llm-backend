import jwt from 'jsonwebtoken';
import { ValidationError } from '../errors/custom.errors.js';
import config from '../config/index.js';

export const authenticate = async (request, reply) => {
    try {
        const token = request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new ValidationError('인증 토큰이 필요합니다.');
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        request.user = decoded;

        return;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new ValidationError('유효하지 않은 토큰입니다.');
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new ValidationError('만료된 토큰입니다.');
        }
        throw error;
    }
}; 