import 'dotenv/config';
import { connectRabbitMQ, closeRabbitMQ, consumeJobs } from './rabbitmq.js';
import { QueueError } from '../../errors/custom.errors.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

// 환경 변수 로드 확인
logger.info('환경 변수 로드 상태:', {
    config: config,
    llm: config.llm,
    env: process.env.NODE_ENV
});

// 워커 프로세스 초기화
const initializeWorker = async () => {
    try {
        await connectRabbitMQ();
        logger.info('Worker: RabbitMQ 연결 성공 및 작업 소비 대기 중');

        await consumeJobs();
        logger.info('Worker: 작업 소비 설정 완료');

    } catch (error) {
        logger.error('Worker: 초기화 중 에러 발생', { error: error.message });
        throw new QueueError('워커 초기화 실패', undefined, { originalError: error });
    }
};

// 종료 처리
const cleanup = async () => {
    try {
        logger.info('Worker: 종료 신호 수신, 정리 시작');

        await closeRabbitMQ();
        logger.info('Worker: RabbitMQ 연결 종료 완료');

        // 추가 정리 작업이 필요한 경우 여기에 구현
        // 예: DB 연결 종료, 임시 파일 정리 등

        logger.info('Worker: 정리 완료, 프로세스 종료');
        process.exit(0);
    } catch (error) {
        logger.error('Worker: 정리 중 에러 발생', { error: error.message });
        process.exit(1);
    }
};

// 종료 시그널 처리
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// 워커 시작
initializeWorker().catch((error) => {
    logger.error('Worker: 초기화 실패', { error: error.message });
    process.exit(1);
});
