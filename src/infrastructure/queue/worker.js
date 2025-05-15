import { connectRabbitMQ, closeRabbitMQ, consumeJobs } from './rabbitmq.js';
import { processJob } from '../../services/job.processor.js';

const startWorker = async () => {
    try {
        // RabbitMQ 연결 수립
        // connectRabbitMQ 함수는 큐 선언까지 함께 수행합니다.
        await connectRabbitMQ();
        console.log('Worker: RabbitMQ 연결 성공 및 작업 소비 대기 중;'); // LLM 규칙: 작은따옴표, 세미콜론

        // RabbitMQ 큐에서 작업 소비 시작
        // consumeJobs 함수는 메시지를 받으면 processJob 콜백을 실행합니다.
        // prefetch: 1 설정으로 한 번에 하나씩만 처리합니다.
        await consumeJobs(processJob);

        // consumeJobs는 소비 설정을 완료하고 바로 반환하므로,
        // 이 라인은 소비가 시작되었음을 나타냅니다.
        console.log('Worker: 작업 소비 설정 완료;'); // LLM 규칙: 작은따옴표, 세미콜론

    } catch (error) {
        // RabbitMQ 연결 또는 소비 설정 중 에러 발생 시
        console.error('Worker: 초기화 중 에러 발생:', error); // LLM 규칙: 작은따옴표, 세미콜론
        // TODO: [2025-MM-DD] 초기화 실패 시 적절한 에러 처리 및 종료 (LLM 규칙: TODO 형식)
        process.exit(1); // 오류 발생 시 프로세스 종료
    }
};

const shutdownWorker = async () => {
    console.log('Worker: 종료 신호 수신, 정리 시작;');
    try {
        // RabbitMQ 연결 안전하게 종료
        await closeRabbitMQ();
        console.log('Worker: RabbitMQ 연결 종료 완료;');

        // TODO: [2025-MM-DD] 현재 처리 중인 작업이 있다면 완료될 때까지 대기하는 로직 추가 (LLM 규칙: TODO 형식)
        // 현재 consumeJobs는 메시지 처리 완료 후 ack를 보내므로,
        // SIGINT/SIGTERM 수신 시 RabbitMQ는 처리 중인 메시지를 다른 워커에게 재전달하지 않습니다.
        // 하지만 워커가 종료되기 전에 현재 작업을 마칠 수 있도록 대기하는 것이 더 안전합니다.

        console.log('Worker: 정리 완료, 프로세스 종료;');
        process.exit(0); // 정상 종료
    } catch (error) {
        console.error('Worker: 정리 중 에러 발생:', error);
        process.exit(1); // 오류 종료
    }
};

// 프로세스 종료 신호에 이벤트 리스너 등록
process.on('SIGINT', shutdownWorker); // Ctrl+C 등으로 프로세스 종료 시
process.on('SIGTERM', shutdownWorker); // kill 명령 등으로 프로세스 종료 시

// 워커 시작 함수 호출
startWorker();
