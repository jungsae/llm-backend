import { createJob, getJob, getUserJobs, updateJobStatus, getNextJob } from '../controllers/job.controller.js';

export default async function (fastify, opts) {
    // 작업 생성
    fastify.post('/', createJob);

    // 특정 작업 조회
    fastify.get('/:id', getJob);

    // 사용자의 모든 작업 조회
    fastify.get('/user/:userId', getUserJobs);

    // 작업 상태 업데이트
    fastify.patch('/:id/status', updateJobStatus);

    // 다음 처리할 작업 조회
    fastify.get('/next', getNextJob);
} 