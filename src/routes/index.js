import jobRoutes from './job.routes.js';

export default async function routes(fastify) {
    // 헬스 체크 라우트
    fastify.get('/health', async (request, reply) => {
        return { status: 'ok' };
    });

    // job 라우트 등록
    await fastify.register(jobRoutes, { prefix: '/api/jobs' });

    // 여기에 다른 라우트들을 추가할 수 있습니다
    // 예: fastify.register(require('./auth.routes'));
} 