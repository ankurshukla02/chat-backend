class AppError extends Error {
  status: number;
  cause?: unknown;

  constructor(message: string, status = 500, cause?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.cause = cause;
  }
}

const handleError = (message: string, statusCode = 500): never => {
  throw new AppError(message, statusCode);
};

const throwHttpError = (error: unknown, message?: string): never => {
  if (error instanceof AppError) {
    throw error;
  }

  const detailMessage = error instanceof Error ? error.message : 'Something went wrong';
  const finalMessage = message ? `${message}: ${detailMessage}` : detailMessage;

  throw new AppError(finalMessage, 500, error);
};

export { AppError, handleError, throwHttpError };
