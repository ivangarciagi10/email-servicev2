/**
 * Tipos de errores personalizados
 */
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SHOPIFY_ERROR = 'SHOPIFY_ERROR',
  SENDGRID_ERROR = 'SENDGRID_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Clase de error personalizada
 */
export class AppError extends Error {
  public type: ErrorType;
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Maneja errores de validación
 */
export function handleValidationError(message: string): AppError {
  return new AppError(message, ErrorType.VALIDATION_ERROR, 400);
}

/**
 * Maneja errores de Shopify
 */
export function handleShopifyError(message: string, originalError?: any): AppError {
  console.error('Error de Shopify:', originalError);
  return new AppError(message, ErrorType.SHOPIFY_ERROR, 500);
}

/**
 * Maneja errores de SendGrid
 */
export function handleSendGridError(message: string, originalError?: any): AppError {
  console.error('Error de SendGrid:', originalError);
  return new AppError(message, ErrorType.SENDGRID_ERROR, 500);
}

/**
 * Maneja errores de configuración
 */
export function handleConfigurationError(message: string): AppError {
  return new AppError(message, ErrorType.CONFIGURATION_ERROR, 500);
}

/**
 * Log de errores estructurado
 */
export function logError(error: AppError | Error, context?: any): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    type: error instanceof AppError ? error.type : ErrorType.UNKNOWN_ERROR,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    context,
    timestamp: new Date().toISOString(),
  };

  console.error('Error del sistema:', JSON.stringify(errorInfo, null, 2));
}

/**
 * Respuesta de error para HTTP
 */
export function createErrorResponse(error: AppError | Error): any {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const type = error instanceof AppError ? error.type : ErrorType.UNKNOWN_ERROR;

  return {
    error: {
      message: error.message,
      type,
      statusCode,
    },
  };
} 