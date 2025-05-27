import axios from 'axios';
import { jobService } from './job.service.js';
import { JobError } from '../errors/custom.errors.js';
import { BusinessError } from '../errors/custom.errors.js';
import { ERROR_CODES } from '../errors/error.codes.js';
import logger from '../utils/logger.js';
import config from '../config/index.js';

const LLM_API_URL = config.llm.apiUrl;
const LLM_MODEL = config.llm.model;
const LLM_MAX_TOKENS = config.llm.maxTokens;
const LLM_TEMPERATURE = config.llm.temperature;

logger.info('LLM 설정 로드 확인:', {
    apiUrl: LLM_API_URL,
    model: LLM_MODEL,
    maxTokens: LLM_MAX_TOKENS,
    temperature: LLM_TEMPERATURE
});

const TIMEOUT = 540000; // 9분
const JOB_TIMEOUT = 5 * 60 * 1000; // 5분
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 타임아웃 처리를 위한 Promise 래퍼
const withTimeout = async (promise, timeoutMs, jobId) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new JobError('작업 처리 시간 초과', undefined, {
                timeout: timeoutMs,
                jobId
            }));
        }, timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
};

// 작업 처리 함수
const processJobWithRetry = async (job, retryCount = 0) => {
    try {
        // 작업 상태를 PROCESSING으로 변경
        await jobService.updateJobStatus(job.id, 'PROCESSING');

        // 실제 작업 처리 로직
        const processPromise = (async () => {
            // LLM API 요청 데이터 준비
            const llmPayload = {
                model: LLM_MODEL,
                user_id: job.userId,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant.'
                    },
                    {
                        role: 'user',
                        content: job.inputData.prompt
                    }
                ],
                max_tokens: LLM_MAX_TOKENS,
                temperature: LLM_TEMPERATURE,
                priority: job.priority
            };

            logger.info(`작업 ${job.id} LLM API 요청 시작:`, {
                prompt: job.inputData.prompt,
                apiUrl: LLM_API_URL,
                payload: llmPayload
            });

            // LLM API 호출
            const response = await axios.post(LLM_API_URL, llmPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: TIMEOUT
            });

            // 응답 데이터 검증
            if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
                throw new BusinessError('LLM API 응답이 유효하지 않습니다', ERROR_CODES.JOB_PROCESSING_FAILED);
            }

            const result = {
                id: response.data.id,
                model: response.data.model,
                created: response.data.created,
                content: response.data.choices[0].message.content,
                finish_reason: response.data.choices[0].finish_reason,
                usage: response.data.usage
            };

            await jobService.updateJobStatus(job.id, 'COMPLETED', result);
            logger.info(`작업 ${job.id} 완료`, {
                jobId: job.id,
                content: result.content,
                finish_reason: result.finish_reason,
                usage: result.usage
            });
        })();

        // 타임아웃 적용
        await withTimeout(processPromise, JOB_TIMEOUT, job.id);

    } catch (error) {
        // 재시도 가능한 경우 재시도
        if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return processJobWithRetry(job, retryCount + 1);
        }

        // 최대 재시도 횟수 초과 시 실패 처리
        let errorMessage = 'LLM 처리 중 오류가 발생했습니다';
        let errorCode = ERROR_CODES.JOB_PROCESSING_FAILED;

        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNREFUSED') {
                errorMessage = 'LLM 서버에 연결할 수 없습니다';
            } else if (error.code === 'ETIMEDOUT' || error.response?.status === 504) {
                errorMessage = 'LLM 요청이 시간 초과되었습니다';
                errorCode = ERROR_CODES.JOB_TIMEOUT;
            } else if (error.response) {
                errorMessage = `LLM API 오류: ${error.response.status}`;
            }
        }

        await jobService.updateJobStatus(
            job.id,
            'FAILED',
            null,
            errorMessage
        );

        throw new JobError(errorMessage, undefined, {
            originalError: error.message,
            retryCount,
            jobId: job.id
        });
    }
};

// 메인 작업 처리 함수
export const processJob = async (job) => {
    await processJobWithRetry(job);
}; 