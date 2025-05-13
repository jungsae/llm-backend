import fastify from 'fastify';
import jobRoutes from './job.routes.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function routes(fastify) {
    // 헬스 체크 라우트
    fastify.get('/health', async (request, reply) => {
        return { status: 'ok' };
    });

    // DB 연결 체크 라우트
    fastify.get('/health/db', async (request, reply) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            return { status: 'ok', db: 'connected' };
        } catch (e) {
            reply.code(500);
            return { status: 'fail', db: 'disconnected', error: e.message };
        }
    });

    // job 라우트 등록
    await fastify.register(jobRoutes, { prefix: '/api/jobs' });

    // 여기에 다른 라우트들을 추가할 수 있습니다
    // 예: fastify.register(require('./auth.routes'));
} 