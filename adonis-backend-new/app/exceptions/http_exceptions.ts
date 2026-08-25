import { inject } from '@adonisjs/fold';
import { RuntimeException } from '@adonisjs/core/exceptions';

@inject()
export class BadRequestException extends RuntimeException {
  constructor(message = 'Bad request') {
    super(message);
    this.status = 400;
  }
}

@inject()
export class UnauthorizedException extends RuntimeException {
  constructor(message = 'Unauthorized') {
    super(message);
    this.status = 401;
  }
}

@inject()
export class ForbiddenException extends RuntimeException {
  constructor(message = 'Forbidden') {
    super(message);
    this.status = 403;
  }
}

@inject()
export class NotFoundException extends RuntimeException {
  constructor(message = 'Resource not found') {
    super(message);
    this.status = 404;
  }
}

@inject()
export class ConflictException extends RuntimeException {
  constructor(message = 'Conflict') {
    super(message);
    this.status = 409;
  }
}

@inject()
export class UnprocessableEntityException extends RuntimeException {
  constructor(message = 'Unprocessable entity') {
    super(message);
    this.status = 422;
  }
}
