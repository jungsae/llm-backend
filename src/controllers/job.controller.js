import { jobService } from '../services/job.service.js';
import { NotFoundError } from '../errors/custom.error.js';

export const createJob = async (request, reply) => {
    const { userId, inputData, priority } = request.body;
    const job = await jobService.createJob(userId, inputData, priority);
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