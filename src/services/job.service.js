import prisma from '../infrastructure/database/prisma.js';
import { publishJob } from '../infrastructure/queue/rabbitmq.js';
import { ValidationError, NotFoundError, BusinessError, DatabaseError } from '../errors/custom.errors.js';
import logger from '../utils/logger.js';

export const jobService = {
    async createJob(userId, inputData, priority) {
        if (!inputData) {
            throw new ValidationError('inputData는 필수입니다.');
        }
        logger.info('작업 생성 시작', { userId, inputData, priority });

        try {
            // 트랜잭션 시작
            const result = await prisma.$transaction(async (tx) => {
                // 작업 생성
                const job = await tx.job.create({
                    data: {
                        userId: userId,
                        inputData,
                        priority: priority,
                        status: 'QUEUED'
                    }
                });

                // RabbitMQ에 작업 발행
                await publishJob(job);

                return job;
            }, {
                maxWait: 10000, // 최대 대기 시간 10초
                timeout: 15000  // 트랜잭션 타임아웃 15초
            });

            logger.info('작업 생성 완료', { jobId: result.id });
            return result;
        } catch (error) {
            logger.error('작업 생성 실패', {
                error: error.message,
                userId,
                inputData
            });
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
        try {
            return await prisma.job.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            throw new DatabaseError('사용자 작업 목록 조회 중 오류가 발생했습니다', undefined, {
                originalError: error.message
            });
        }
    },

    async updateJobStatus(id, status, resultData = null, errorMessage = null) {
        try {
            // 트랜잭션 시작
            return await prisma.$transaction(async (tx) => {
                const job = await tx.job.findUnique({
                    where: { id: parseInt(id) }
                });

                if (!job) {
                    throw new NotFoundError(`ID가 ${id}인 작업을 찾을 수 없습니다.`);
                }

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

                const updatedJob = await tx.job.update({
                    where: { id: parseInt(id) },
                    data: updateData
                });

                logger.info('작업 상태 업데이트 완료', {
                    jobId: id,
                    oldStatus: job.status,
                    newStatus: status
                });

                return updatedJob;
            }, {
                maxWait: 10000,
                timeout: 15000
            });
        } catch (error) {
            if (error instanceof ValidationError || error instanceof BusinessError || error instanceof NotFoundError) {
                throw error;
            }
            logger.error('작업 상태 업데이트 실패', {
                error: error.message,
                jobId: id,
                status
            });
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