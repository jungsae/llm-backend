//실행법 : node src/test/rabbitmq.test.js
import { connectRabbitMQ, publishJob, consumeJobs, closeRabbitMQ } from '../infrastructure/rabbitmq.js';

const testJob = {
    id: 1,
    userId: 'test_user',
    inputData: { text: '테스트 메시지' },
    priority: 1
};

const testConsumer = async (job) => {
    console.log('받은 작업:', job);
    // 작업 처리 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('작업 처리 완료');
};

const runTest = async () => {
    try {
        // RabbitMQ 연결
        console.log('RabbitMQ 연결 시도...');
        await connectRabbitMQ();

        // 작업 발행
        console.log('작업 발행 시도...');
        await publishJob(testJob);
        console.log('작업 발행 완료');

        // 작업 소비 시작
        console.log('작업 소비 시작...');
        await consumeJobs(testConsumer);

        // 5초 후 종료
        setTimeout(async () => {
            console.log('테스트 종료');
            await closeRabbitMQ();
            process.exit(0);
        }, 5000);

    } catch (error) {
        console.error('테스트 실패:', error);
        await closeRabbitMQ();
        process.exit(1);
    }
};

runTest(); 