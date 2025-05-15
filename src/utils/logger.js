import winston from 'winston';
import config from '../config/index.js';

// 로그 레벨 정의
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// 로그 레벨 색상 정의
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// 색상 포맷 추가
winston.addColors(colors);

// 로그 포맷 정의
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SSS' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        // HTTP 요청/응답 로깅을 위한 특별 포맷
        if (meta.request) {
            const { method, url, statusCode, responseTime, ip } = meta.request;
            return `${timestamp} ${level}: ${method} ${url} ${statusCode} ${responseTime}ms - ${ip}`;
        }
        // 일반 로그 포맷
        return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
);

// 콘솔 전용 포맷 (색상 포함)
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    logFormat
);

// 개발 환경과 프로덕션 환경의 로그 레벨 설정
const level = () => {
    const env = config.env || 'development';
    return env === 'development' ? 'debug' : 'warn';
};

// 로거 생성
const logger = winston.createLogger({
    level: level(),
    levels,
    format: logFormat,
    transports: [
        // 콘솔 출력 (색상 포함)
        new winston.transports.Console({
            format: consoleFormat
        }),
        // 에러 로그 파일
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // 모든 로그 파일
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
});

// 에러 로깅 헬퍼 함수
export const logError = (error, context = {}) => {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name,
        statusCode: error.statusCode,
        details: error.details,
        context,
        timestamp: new Date().toISOString(),
    };

    logger.error(JSON.stringify(errorLog, null, 2));
};

// HTTP 요청 로깅 헬퍼 함수
export const logHttpRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
    };

    logger.http(JSON.stringify(logData, null, 2));
};

export default logger; 