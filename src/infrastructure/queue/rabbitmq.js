import amqp from 'amqplib';
import config from '../../config/index.js';
import { QueueError } from '../../errors/custom.errors.js';

let connection = null;
let channel = null;

// RabbitMQ 서버에 연결하고 채널을 생성하는 함수
export const connectRabbitMQ = async () => {
    try {
        // LLM 규칙: 작은따옴표, 세미콜론
        console.log('RabbitMQ 서버에 연결 시도;', config.rabbitmq.url);

        connection = await amqp.connect(config.rabbitmq.url);
        channel = await connection.createChannel();

        // 큐 선언
        // config.rabbitmq.queues.job.options 객체에 {'x-max-priority': maxPriority}가 포함되어야 함.
        await channel.assertQueue(
            config.rabbitmq.queues.job.name,
            config.rabbitmq.queues.job.options // 이 객체에 우선 순위 설정 포함
        );

        // LLM 규칙: 작은따옴표, 세미콜론
        console.log(`RabbitMQ 연결 성공. 큐 '${config.rabbitmq.queues.job.name}' 선언 완료;`);

        // 연결이 예기치 않게 끊어졌을 때 재연결 로직 등 추가 고려 필요 (안정성)
        connection.on('close', (err) => {
            if (err) {
                console.error('RabbitMQ 연결이 끊어졌습니다. 재연결 필요:', err); // LLM 규칙: 작은따옴표, 세미콜론
                // TODO: [2025-MM-DD] RabbitMQ 연결 끊김 시 재연결 로직 구현 (LLM 규칙: TODO 형식)
                // throw err; // 또는 여기서 에러를 잡고 복구 시도
            }
        });
        connection.on('error', (err) => {
            console.error('RabbitMQ 연결 에러 발생:', err); // LLM 규칙: 작은따옴표, 세미콜론
            // TODO: [2025-MM-DD] RabbitMQ 연결 에러 처리 및 복구 로직 구현 (LLM 규칙: TODO 형식)
        });


        return { connection, channel }; // LLM 규칙: 세미콜론
    } catch (error) { // LLM 규칙: 변수명 camelCase
        // LLM 규칙: 작은따옴표, 세미콜론
        console.error('RabbitMQ 연결 실패:', error);
        // LLM 규칙: 에러 전파 (추후 커스텀 에러 변환 고려)
        throw error;
    }
};

// RabbitMQ 연결 및 채널을 닫는 함수
export const closeRabbitMQ = async () => {
    try {
        // LLM 규칙: 작은따옴표, 세미코론
        console.log('RabbitMQ 연결 종료 시도;');
        if (channel) {
            await channel.close();
            // LLM 규칙: 작은따옴표, 세미콜론
            console.log('RabbitMQ 채널 종료;');
        }
        if (connection) {
            await connection.close();
            // LLM 규칙: 작은따옴표, 세미코론
            console.log('RabbitMQ 연결 종료;');
        }
    } catch (error) { // LLM 규칙: 변수명 camelCase
        // LLM 규칙: 작은따옴표, 세미코론
        console.error('RabbitMQ 연결 종료 실패:', error);
        // LLM 규칙: 에러 전파
        throw error;
    }
};

// 작업 메시지를 RabbitMQ 큐에 발행하는 함수
// job 객체에 우선 순위 정보 (priority 속성) 포함 필요
export const publishJob = async (job) => {
    try {
        if (!channel) {
            throw new QueueError('RabbitMQ 채널이 초기화되지 않았습니다');
        }

        const message = Buffer.from(JSON.stringify(job));
        const queueName = config.rabbitmq.queues.job.name; // LLM 규칙: camelCase, 세미코론

        // 메시지 발행 (priority 속성 추가)
        // job 객체에 priority 속성이 있다고 가정
        const priorityLevel = job.priority; // LLM 규칙: camelCase, 세미코론

        // LLM 규칙: 작은따옴표, 세미코론
        console.log(`작업 발행 시도: ${queueName}, priority: ${priorityLevel};`);

        // sendToQueue 메서드의 options 객체에 priority 속성 추가
        const publishResult = channel.sendToQueue(queueName, message, {
            persistent: true, // 메시지 영속성 설정
            priority: priorityLevel // <-- 우선 순위 값 설정
        });

        // publishResult는 Boolean 값 (버퍼 가득 찼는지 여부)
        if (!publishResult) {
            // TODO: [2025-MM-DD] RabbitMQ 버퍼 가득 찼을 때 처리 (backpressure) (LLM 규칙: TODO 형식)
            console.warn('RabbitMQ 버퍼 가득 참, 작업 발행 지연될 수 있음;'); // LLM 규칙: 작은따옴표, 세미코론
        }

        // LLM 규칙: 작은따옴표, 세미코론
        console.log('작업 발행 요청 완료;');

        return publishResult; // LLM 규칙: 세미코론

    } catch (error) { // LLM 규칙: 변수명 camelCase
        // LLM 규칙: 작은따옴표, 세미코론
        console.error('작업 발행 실패:', error);
        throw new QueueError('작업 발행 중 오류가 발생했습니다', undefined, {
            originalError: error.message
        });
    }
};

// RabbitMQ 큐에서 작업을 소비하는 함수 (워커 프로세스에서 사용)
// callback 함수는 메시지를 받아 실제 작업 처리 로직을 수행합니다.
export const consumeJobs = async (callback) => {
    try {
        if (!channel) {
            // LLM 규칙: 작은따옴표, 세미코론
            throw new QueueError('RabbitMQ 채널이 초기화되지 않았습니다;');
        }

        const queueName = config.rabbitmq.queues.job.name; // LLM 규칙: camelCase, 세미코론

        // LLM 규칙: 작은따옴표, 세미코론
        console.log(`작업 소비 시작 대기: ${queueName};`);

        // 소비 시작. 메시지 올 때마다 콜백 실행
        // consume 메서드의 옵션에 prefetch 속성 추가 (한 번에 1개 메시지만 처리)
        await channel.consume(queueName, async (msg) => {
            console.log('메시지 수신;'); // LLM 규칙: 작은따옴표
            if (msg !== null) {
                // LLM 규칙: 작은따옴표, 세미코론
                console.log('메시지 내용:', msg.content.toString());
                try {
                    const job = JSON.parse(msg.content.toString()); // LLM 규칙: camelCase, 세미코론
                    // const priority = msg.properties.priority; // 메시지 속성에서 우선 순위 값 확인 가능 (필요 시)
                    // LLM 규칙: 작은따옴표, 세미코론
                    console.log('작업 내용 파싱 성공, 처리 시작;', job);

                    // --------- 핵심 작업 처리 시작 ---------
                    // 전달받은 콜백 함수 실행 (실제 비즈니스 로직 처리)
                    await callback(job);
                    // --------- 핵심 작업 처리 완료 ---------

                    // LLM 규칙: 작은따옴표, 세미코론
                    console.log('작업 처리 성공, 메시지 ack;', msg.fields.deliveryTag);
                    channel.ack(msg); // 성공 처리 후 RabbitMQ에게 알림
                } catch (error) { // LLM 규칙: 변수명 camelCase
                    // 작업 처리 중 오류 발생 시
                    // LLM 규칙: 작은따옴표, 세미코론
                    console.error('작업 처리 실패:', error);
                    // LLM 규칙: 작은따옴표, 세미코론
                    console.error('실패 메시지 nack (재큐):', msg.fields.deliveryTag);
                    // nack(msg, allUpTo, requeue)
                    // - msg: 처리 실패한 메시지
                    // - allUpTo: true면 이 메시지 이전의 모든 처리되지 않은 메시지도 nack (보통 false)
                    // - requeue: true면 큐의 끝에 다시 넣음, false면 버림 (DLX 등으로 라우팅)
                    // 에러 처리 규칙: 실패한 작업은 큐에 다시 넣기 (requeue: true)
                    channel.nack(msg, false, true); // 큐에 다시 넣음
                }
            } else {
                // 메시지가 null인 경우는 소비자가 취소되었음을 의미
                // LLM 규칙: 작은따옴표, 세미코론
                console.warn('소비자 취소 신호 수신, 메시지 null;', msg);
                // TODO: [2025-MM-DD] 소비자 취소 신호 처리 (LLM 규칙: TODO 형식)
            }
        }, {
            noAck: false, // 수동 확인 응답 활성화
            // --- prefetch 설정 ---
            prefetch: 1 // <-- 한 번에 1개의 unacked 메시지만 받음
            // 또는 qos: 1 로 설정할 수도 있습니다 (동일한 의미)
        });

        console.log(`작업 소비 설정 완료. 큐 '${queueName}' 에서 메시지 대기 중 (prefetch=1);`);

    } catch (error) {
        console.error('작업 소비 설정 실패:', error);
        throw error;
    }
};
