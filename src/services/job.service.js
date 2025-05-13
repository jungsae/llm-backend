import { Job } from '../models/job.model.js';
import { ValidationError, NotFoundError, BusinessError } from '../errors/custom.error.js';
import { publishJob } from '../utils/rabbitmq.js';

export const jobService = {
    createJob: async (userId, inputData, priority = 0) => {
        // 입력 데이터 검증
        if (!userId || !inputData) {
            throw new ValidationError('userId and inputData are required');
        }

        // 작업 생성
        const job = await Job.create({
            userId,
            inputData,
            priority
        });

        // RabbitMQ에 작업 등록
        await publishJob(job);

        return job;
    },

    getJobById: async (id) => {
        if (isNaN(id)) {
            throw new ValidationError('Invalid job ID format');
        }

        const job = await Job.findById(id);
        if (!job) {
            throw new NotFoundError('Job not found');
        }
        return job;
    },

    getJobsByUserId: async (userId) => {
        if (!userId) {
            throw new ValidationError('userId is required');
        }
        return Job.findByUserId(userId);
    },

    updateJobStatus: async (id, status, resultData = null, errorMessage = null) => {
        if (isNaN(id)) {
            throw new ValidationError('Invalid job ID format');
        }

        const job = await Job.findById(id);
        if (!job) {
            throw new NotFoundError('Job not found');
        }

        // 상태 변경 검증
        const validTransitions = {
            'QUEUED': ['PROCESSING'],
            'PROCESSING': ['COMPLETED', 'FAILED'],
            'COMPLETED': [],
            'FAILED': []
        };

        if (!validTransitions[job.status].includes(status)) {
            throw new BusinessError(`Invalid status transition from ${job.status} to ${status}`);
        }

        return Job.updateStatus(id, status, resultData, errorMessage);
    },

    getNextJob: async () => {
        return Job.findNextJob();
    }
}; 