import { jobService } from '../services/job.service.js';
import { NotFoundError, ValidationError } from '../errors/custom.errors.js';
import logger from '../utils/logger.js';

export const createJob = async (request, reply) => {
    const { messages, max_tokens, temperature } = request.body;

    // 임시 userId (인증 구현 전까지)
    const tempUserId = 1;

    // 입력 데이터 검증
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ValidationError('messages는 필수이며 배열 형태여야 합니다.');
    }

    // LLM 요청을 위한 inputData 구성
    const inputData = {
        prompt: messages[0].content, // 첫 번째 메시지의 content를 prompt로 사용
        max_tokens: max_tokens || 256,
        temperature: temperature || 0.7
    };

    logger.info('새 작업 생성 요청:', {
        userId: tempUserId,
        inputData
    });

    const job = await jobService.createJob(tempUserId, inputData);
    return reply.code(201).send(job);
};

export const getJob = async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const job = await jobService.getJobById(id);
    return reply.send(job);
};

export const getUserJobs = async (request, reply) => {
    const { userId } = request.params;
    const jobs = await jobService.getJobsByUserId(userId);
    return reply.send(jobs);
};

export const updateJobStatus = async (request, reply) => {
    const id = parseInt(request.params.id, 10);
    const { status, resultData, errorMessage } = request.body;
    const job = await jobService.updateJobStatus(id, status, resultData, errorMessage);
    return reply.send(job);
};

export const getNextJob = async (request, reply) => {
    const job = await jobService.getNextJob();
    if (!job) {
        throw new NotFoundError('No jobs available');
    }
    return reply.send(job);
}; 