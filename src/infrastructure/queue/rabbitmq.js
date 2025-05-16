import amqp from 'amqplib';
import config from '../../config/index.js';
import { processJob } from '../../services/job.processor.js';
import { DatabaseError, QueueError } from '../../errors/custom.errors.js';
import logger from '../../utils/logger.js';

let connection = null;
let channel = null;

// RabbitMQ 연결 함수
export const connectRabbitMQ = async () => {
    try {
        logger.info('RabbitMQ 서버에 연결 시도', { url: config.rabbitmq.url });

        connection = await amqp.connect(config.rabbitmq.url);

        connection.on('error', (err) => {
            logger.error('RabbitMQ 연결이 끊어졌습니다. 재연결 필요', { error: err.message });
            throw new QueueError('RabbitMQ 연결 오류', undefined, { originalError: err });
        });

        connection.on('close', (err) => {
            if (!err) {
                logger.info('RabbitMQ 연결이 정상적으로 종료되었습니다.');
                return;
            }
            logger.error('RabbitMQ 연결 에러 발생', { error: err?.message });
            throw new QueueError('RabbitMQ 연결 종료', undefined, { originalError: err });
        });

        channel = await connection.createChannel();
        await channel.assertQueue(config.rabbitmq.queues.job.name, config.rabbitmq.queues.job.options);

        logger.info('RabbitMQ 연결 성공', {
            queue: config.rabbitmq.queues.job.name,
            options: config.rabbitmq.queues.job.options
        });
    } catch (error) {
        logger.error('RabbitMQ 연결 실패', { error: error.message });
        throw new QueueError('RabbitMQ 연결 실패', undefined, { originalError: error });
    }
};

// RabbitMQ 연결 종료 함수
export const closeRabbitMQ = async () => {
    try {
        logger.info('RabbitMQ 연결 종료 시도');

        if (channel) {
            await channel.close();
            logger.info('RabbitMQ 채널 종료');
        }

        if (connection) {
            await connection.close();
            logger.info('RabbitMQ 연결 종료');
        }
    } catch (error) {
        logger.error('RabbitMQ 연결 종료 실패', { error: error.message });
        throw new QueueError('RabbitMQ 연결 종료 실패', undefined, { originalError: error });
    }
};

// 작업 발행 함수
export const publishJob = async (job) => {
    if (!channel) {
        throw new QueueError('RabbitMQ 채널이 초기화되지 않았습니다');
    }

    try {
        const queueName = config.rabbitmq.queues.job.name;
        const priorityLevel = job.priority || 0;

        logger.info('작업 발행 시도', {
            queueName,
            priorityLevel,
            jobId: job.id
        });

        const success = channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify(job)),
            {
                persistent: true,
                priority: priorityLevel
            }
        );

        if (!success) {
            throw new QueueError('작업 발행 실패: 큐가 가득 찼습니다');
        }

        logger.info('작업 발행 요청 완료', { jobId: job.id });
    } catch (error) {
        logger.error('작업 발행 실패', {
            error: error.message,
            jobId: job.id
        });
        throw new QueueError('작업 발행 실패', undefined, {
            originalError: error,
            jobId: job.id
        });
    }
};

// 작업 소비 함수
export const consumeJobs = async (queueName = config.rabbitmq.queues.job.name) => {
    if (!channel) {
        throw new QueueError('RabbitMQ 채널이 초기화되지 않았습니다');
    }

    try {
        logger.info('작업 소비 시작 대기', { queueName });

        await channel.consume(queueName, async (msg) => {
            if (!msg) return;

            logger.info('메시지 수신', {
                deliveryTag: msg.fields.deliveryTag,
                queueName
            });

            try {
                const job = JSON.parse(msg.content.toString());
                logger.info('작업 내용 파싱 성공, 처리 시작', {
                    jobId: job.id,
                    status: job.status
                });

                await processJob(job);
                channel.ack(msg);

                logger.info('작업 처리 성공', {
                    jobId: job.id,
                    deliveryTag: msg.fields.deliveryTag
                });
            } catch (error) {
                logger.error('작업 처리 실패', {
                    error: error.message,
                    jobId: job?.id,
                    deliveryTag: msg.fields.deliveryTag
                });

                // 실패한 메시지는 재큐
                channel.nack(msg, false, true);
                logger.error('실패 메시지 재큐', {
                    deliveryTag: msg.fields.deliveryTag,
                    jobId: job?.id
                });
            }
        }, {
            noAck: false,
            prefetch: 1
        });

        logger.info('작업 소비 설정 완료', {
            queueName,
            prefetch: 1
        });
    } catch (error) {
        logger.error('작업 소비 설정 실패', {
            error: error.message,
            queueName
        });
        throw new QueueError('작업 소비 설정 실패', undefined, {
            originalError: error,
            queueName
        });
    }
};
