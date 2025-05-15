import { publishJob, consumeJobs } from '../infrastructure/queue/rabbitmq.js';

export const queueService = {
    async publishJob(job) {
        await publishJob(job);
    },

    async consumeJobs(handler) {
        await consumeJobs(handler);
    }
}; 