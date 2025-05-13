import prisma from '../infrastructure/database.js';

export class Job {
    static async create(data) {
        return prisma.job.create({
            data: {
                ...data,
                status: 'QUEUED',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }

    static async findById(id) {
        return prisma.job.findUnique({
            where: { id }
        });
    }

    static async findByUserId(userId) {
        return prisma.job.findMany({
            where: { userId },
            orderBy: [
                { createdAt: 'desc' }
            ]
        });
    }

    static async updateStatus(id, status, resultData = null, errorMessage = null) {
        return prisma.job.update({
            where: { id },
            data: {
                status,
                resultData,
                errorMessage,
                updatedAt: new Date()
            }
        });
    }

    static async findNextJob() {
        return prisma.job.findFirst({
            where: {
                status: 'QUEUED'
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ]
        });
    }
} 