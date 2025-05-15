import { ERROR_CODES } from './error.codes.js';
import { AppError } from './error.handler.js';

export class JobError extends AppError {
    constructor(message, code = ERROR_CODES.JOB_PROCESSING_FAILED, details = {}) {
        super(message, 400);
        this.name = 'JobError';
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends AppError {
    constructor(message, code = ERROR_CODES.INVALID_INPUT, details = {}) {
        super(message, 400);
        this.name = 'ValidationError';
        this.code = code;
        this.details = details;
    }
}

export class DatabaseError extends AppError {
    constructor(message, code = ERROR_CODES.DATABASE_ERROR, details = {}) {
        super(message, 500);
        this.name = 'DatabaseError';
        this.code = code;
        this.details = details;
    }
}

export class NotFoundError extends AppError {
    constructor(message, code = ERROR_CODES.JOB_NOT_FOUND, details = {}) {
        super(message, 404);
        this.name = 'NotFoundError';
        this.code = code;
        this.details = details;
    }
}

export class BusinessError extends AppError {
    constructor(message, code = ERROR_CODES.BUSINESS_ERROR, details = {}) {
        super(message, 400);
        this.name = 'BusinessError';
        this.code = code;
        this.details = details;
    }
}

export class QueueError extends AppError {
    constructor(message, code = ERROR_CODES.QUEUE_ERROR, details = {}) {
        super(message, 500);
        this.name = 'QueueError';
        this.code = code;
        this.details = details;
    }
}
