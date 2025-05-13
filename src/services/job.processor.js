import { jobService } from './job.service.js';

export const processJob = async (job) => {
    try {
        // 작업 상태를 PROCESSING으로 변경
        await jobService.updateJobStatus(job.id, 'PROCESSING');

        // TODO: 실제 작업 처리 로직 구현
        // 여기서는 간단한 시뮬레이션만 수행
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 작업 완료 처리
        const resultData = {
            processedAt: new Date().toISOString(),
            message: '작업이 성공적으로 처리되었습니다.'
        };

        await jobService.updateJobStatus(job.id, 'COMPLETED', resultData);
    } catch (error) {
        // 작업 실패 처리
        await jobService.updateJobStatus(
            job.id,
            'FAILED',
            null,
            error.message || '작업 처리 중 오류가 발생했습니다.'
        );
        throw error;
    }
}; 