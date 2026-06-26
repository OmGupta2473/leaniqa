export interface ApiErrorDetails {
  code: string;
  message: string;
  retryable: boolean;
  status: number;
  details?: any;
}

export class AppError extends Error {
  public code: string;
  public retryable: boolean;
  public status: number;
  public details?: any;

  constructor(error: ApiErrorDetails) {
    super(error.message);
    this.name = 'AppError';
    this.code = error.code;
    this.retryable = error.retryable;
    this.status = error.status;
    this.details = error.details;
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export function handleApiError(error: any): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  console.error('[Unhandled Error]', error);

  return new AppError({
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: error?.message || 'An unexpected error occurred.',
    retryable: false,
    status: error?.status || 500,
    details: error,
  });
}
