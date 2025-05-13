export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
    }
}

export class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

export class BusinessError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BusinessError';
        this.statusCode = 400;
    }
} 