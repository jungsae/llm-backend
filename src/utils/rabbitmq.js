// import amqp from 'amqplib';
// import config from '../config/index.js';

// let connection = null;
// let channel = null;

// export const connect = async () => {
//     try {
//         connection = await amqp.connect(config.rabbitmq.url);
//         channel = await connection.createChannel();

//         // 큐 선언
//         await channel.assertQueue(
//             config.rabbitmq.queues.job.name,
//             config.rabbitmq.queues.job.options
//         );
//         console.log('RabbitMQ 연결 성공');

//         return { connection, channel };
//     } catch (error) {
//         console.error('RabbitMQ 연결 실패:', error);
//         throw error;
//     }
// };

// export const close = async () => {
//     try {
//         if (channel) await channel.close();
//         if (connection) await connection.close();
//         console.log('RabbitMQ 연결 종료');
//     } catch (error) {
//         console.error('RabbitMQ 연결 종료 실패:', error);
//         throw error;
//     }
// };

// export const publishJob = async (job) => {
//     try {
//         if (!channel) {
//             throw new Error('RabbitMQ 채널이 초기화되지 않았습니다.');
//         }

//         const message = Buffer.from(JSON.stringify(job));
//         return channel.sendToQueue(config.rabbitmq.queues.job.name, message, {
//             persistent: true
//         });
//     } catch (error) {
//         console.error('작업 발행 실패:', error);
//         throw error;
//     }
// };

// export const consumeJobs = async (callback) => {
//     try {
//         if (!channel) {
//             throw new Error('RabbitMQ 채널이 초기화되지 않았습니다.');
//         }

//         await channel.consume(config.rabbitmq.queues.job.name, async (msg) => {
//             if (msg !== null) {
//                 try {
//                     const job = JSON.parse(msg.content.toString());
//                     await callback(job);
//                     channel.ack(msg);
//                 } catch (error) {
//                     console.error('작업 처리 실패:', error);
//                     // 실패한 작업은 큐에 다시 넣기
//                     channel.nack(msg, false, true);
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('작업 소비 설정 실패:', error);
//         throw error;
//     }
// }; 

import amqp from 'amqplib';
import config from '../config/index.js'; // 설정 파일 경로 확인 (src/config/index.js 등)

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => { // 함수명 camelCase (LLM 규칙)
    try {
        // LLM 규칙: 작은따옴표, 세미콜론
        console.log('RabbitMQ 서버에 연결 시도;', config.rabbitmq.url);

        connection = await amqp.connect(config.rabbitmq.url);
        channel = await connection.createChannel();

        // 큐 선언 (우선 순위 설정은 config 파일에서 관리)
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

export const closeRabbitMQ = async () => { // 함수명 camelCase (LLM 규칙)
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

// job 객체에 우선 순위 정보 포함 또는 priorityLevel 인자 추가 필요
// 예시: job 객체 안에 { ..., priorityLevel: 5 } 형태로 정보가 있다고 가정
export const publishJob = async (job) => { // LLM 규칙: camelCase, job 객체에 priorityLevel 있다고 가정
    try {
        if (!channel) {
            // LLM 규칙: 작은따옴표, 세미코론
            throw new Error('RabbitMQ 채널이 초기화되지 않았습니다;');
        }

        const message = Buffer.from(JSON.stringify(job));
        const queueName = config.rabbitmq.queues.job.name; // LLM 규칙: camelCase, 세미코론

        // 메시지 발행 (priority 속성 추가)
        // job 객체에 priorityLevel 속성이 있다고 가정
        const priorityLevel = job.priorityLevel; // LLM 규칙: camelCase, 세미코론

        // LLM 규칙: 작은따옴표, 세미코론
        console.log(`작업 발행 시도: ${queueName}, priority: ${priorityLevel};`);

        // sendToQueue 메서드의 options 객체에 priority 속성 추가
        const publishResult = channel.sendToQueue(queueName, message, {
            persistent: true,
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
        // LLM 규칙: 에러 전파
        throw error;
    }
};

// 이 함수는 워커 프로세스에서 사용될 것입니다.
export const consumeJobs = async (callback) => { // LLM 규칙: camelCase, async 사용
    try {
        if (!channel) {
            // LLM 규칙: 작은따옴표, 세미코론
            throw new Error('RabbitMQ 채널이 초기화되지 않았습니다;');
        }

        const queueName = config.rabbitmq.queues.job.name; // LLM 규칙: camelCase, 세미코론

        // LLM 규칙: 작은따옴표, 세미코론
        console.log(`작업 소비 시작 대기: ${queueName};`);

        // 소비 시작. 메시지 올 때마다 콜백 실행
        await channel.consume(queueName, async (msg) => { // LLM 규칙: async 사용
            // LLM 규칙: 작은따옴표
            console.log('메시지 수신;');
            if (msg !== null) {
                // LLM 규칙: 작은따옴표, 세미코론
                console.log('메시지 내용:', msg.content.toString());
                try {
                    const job = JSON.parse(msg.content.toString()); // LLM 규칙: camelCase, 세미코론
                    // const priority = msg.properties.priority; // 메시지 속성에서 우선 순위 값 확인 가능 (필요 시)
                    // LLM 규칙: 작은따옴표, 세미코론
                    console.log('작업 내용 파싱 성공, 처리 시작;', job);
                    // LLM 규칙: async/await 사용
                    await callback(job); // 전달받은 콜백 함수 실행 (실제 비즈니스 로직 처리)
                    // LLM 규칙: 작은따옴표, 세미코론
                    console.log('작업 처리 성공, 메시지 ack;', msg.fields.deliveryTag);
                    channel.ack(msg); // 성공적으로 처리했음을 알림 (RabbitMQ에서 메시지 삭제)
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
                    // LLM 규칙: async/await 사용
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
            noAck: false // 자동 확인 응답 비활성화 (수동 ack/nack 사용)
        });

        // 이 함수 자체는 소비 설정을 완료하고 바로 반환하므로,
        // 소비가 시작되었음을 알리는 로그를 남깁니다.
        // LLM 규칙: 작은따옴표, 세미코론
        console.log('작업 소비 설정 완료;');

    } catch (error) { // LLM 규칙: 변수명 camelCase
        // LLM 규칙: 작은따옴표, 세미코론
        console.error('작업 소비 설정 실패:', error);
        // LLM 규칙: 에러 전파
        throw error;
    }
};