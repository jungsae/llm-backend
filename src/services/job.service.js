import prisma from '../infrastructure/database/prisma.js';
import { publishJob } from '../infrastructure/queue/rabbitmq.js';
import { ValidationError, NotFoundError, BusinessError, DatabaseError } from '../errors/custom.errors.js';

export const jobService = {
    async createJob(userId, inputData, priority = 0) {
        if (!inputData) {
            throw new ValidationError('inputData는 필수입니다.');
        }

        try {
            const job = await prisma.job.create({
                data: {
                    userId: userId.toString(), // 임시로 문자열로 변환
                    inputData,
                    priority: priority || 0,
                    status: 'QUEUED'
                }
            });

            // RabbitMQ에 작업 발행
            await publishJob(job);

            return job;
        } catch (error) {
            throw new DatabaseError('작업 생성 중 오류가 발생했습니다', undefined, {
                originalError: error.message
            });
        }
    },

    async getJobById(id) {
        try {
            const job = await prisma.job.findUnique({
                where: { id: parseInt(id) }
            });

            if (!job) {
                throw new NotFoundError(`ID가 ${id}인 작업을 찾을 수 없습니다.`);
            }

            return job;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('작업 조회 중 오류가 발생했습니다', undefined, {
                originalError: error.message
            });
        }
    },

    async getJobsByUserId(userId) {
        return prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    },

    async updateJobStatus(id, status, resultData = null, errorMessage = null) {
        try {
            const job = await this.getJobById(id);

            const validStatuses = ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'];
            if (!validStatuses.includes(status)) {
                throw new ValidationError(`유효하지 않은 상태입니다: ${status}`);
            }

            if (job.status === 'COMPLETED' || job.status === 'FAILED') {
                throw new BusinessError('이미 완료된 작업의 상태는 변경할 수 없습니다.');
            }

            const updateData = {
                status,
                resultData,
                errorMessage,
                updatedAt: new Date()
            };

            if (status === 'PROCESSING') {
                updateData.startedAt = new Date();
            } else if (status === 'COMPLETED' || status === 'FAILED') {
                updateData.completedAt = new Date();
            }

            return await prisma.job.update({
                where: { id: parseInt(id) },
                data: updateData
            });
        } catch (error) {
            if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError('작업 상태 업데이트 중 오류가 발생했습니다', undefined, {
                originalError: error.message
            });
        }
    },

    async getNextJob() {
        try {
            return await prisma.job.findFirst({
                where: { status: 'QUEUED' },
                orderBy: { priority: 'desc' }
            });
        } catch (error) {
            throw new DatabaseError('다음 작업 조회 중 오류가 발생했습니다', undefined, {
                originalError: error.message
            });
        }
    }
}; 