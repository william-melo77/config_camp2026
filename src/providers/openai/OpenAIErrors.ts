/**
 * Clases de error personalizadas para OpenAI
 */

// Clase base para errores de OpenAI
export class OpenAIError extends Error {
    public readonly type: string;
    public readonly statusCode: number;
    public readonly originalError?: any;

    constructor(
        message: string,
        type: string = "openai_error",
        statusCode: number = 500,
        originalError?: any
    ) {
        super(message);
        this.name = "OpenAIError";
        this.type = type;
        this.statusCode = statusCode;
        this.originalError = originalError;

        // Mantener el stack trace correcto
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// Error de autenticación (API Key inválida)
export class OpenAIAuthenticationError extends OpenAIError {
    constructor(
        message: string = "API Key de OpenAI inválida o no configurada",
        originalError?: any
    ) {
        super(message, "authentication_error", 401, originalError);
        this.name = "OpenAIAuthenticationError";
    }
}

// Error de límite de rate
export class OpenAIRateLimitError extends OpenAIError {
    constructor(
        message: string = "Límite de rate de OpenAI excedido",
        originalError?: any
    ) {
        super(message, "rate_limit_error", 429, originalError);
        this.name = "OpenAIRateLimitError";
    }
}

// Error de cuota (sin créditos)
export class OpenAIQuotaError extends OpenAIError {
    constructor(
        message: string = "Cuota de OpenAI excedida o sin créditos",
        originalError?: any
    ) {
        super(message, "insufficient_quota", 429, originalError);
        this.name = "OpenAIQuotaError";
    }
}

// Error de recurso no encontrado
export class OpenAINotFoundError extends OpenAIError {
    constructor(
        message: string = "Recurso no encontrado en OpenAI",
        originalError?: any
    ) {
        super(message, "not_found_error", 404, originalError);
        this.name = "OpenAINotFoundError";
    }
}

// Error de validación de entrada
export class OpenAIValidationError extends OpenAIError {
    constructor(
        message: string = "Datos de entrada inválidos para OpenAI",
        originalError?: any
    ) {
        super(message, "invalid_request_error", 400, originalError);
        this.name = "OpenAIValidationError";
    }
}

// Error de timeout
export class OpenAITimeoutError extends OpenAIError {
    constructor(
        message: string = "Timeout en la petición a OpenAI",
        originalError?: any
    ) {
        super(message, "timeout_error", 408, originalError);
        this.name = "OpenAITimeoutError";
    }
}

// Error de servidor (5xx de OpenAI)
export class OpenAIServerError extends OpenAIError {
    constructor(
        message: string = "Error en el servidor de OpenAI",
        originalError?: any
    ) {
        super(message, "server_error", 500, originalError);
        this.name = "OpenAIServerError";
    }
}

// Error de configuración
export class OpenAIConfigurationError extends OpenAIError {
    constructor(
        message: string = "Error de configuración de OpenAI",
        originalError?: any
    ) {
        super(message, "configuration_error", 500, originalError);
        this.name = "OpenAIConfigurationError";
    }
}

/**
 * Mapear errores del SDK de OpenAI a nuestros errores personalizados
 */
export function mapOpenAIError(error: any): OpenAIError {
    const errorMessage =
        error?.message ||
        error?.error?.message ||
        "Error desconocido de OpenAI";
    const errorType = error?.type || error?.error?.type;
    const statusCode = error?.status || error?.statusCode;

    // Mapear por tipo de error
    switch (errorType) {
        case "invalid_api_key":
        case "authentication_error":
            return new OpenAIAuthenticationError(errorMessage, error);

        case "rate_limit_exceeded":
            return new OpenAIRateLimitError(errorMessage, error);

        case "insufficient_quota":
            return new OpenAIQuotaError(errorMessage, error);

        case "invalid_request_error":
            return new OpenAIValidationError(errorMessage, error);

        case "not_found":
            return new OpenAINotFoundError(errorMessage, error);

        default:
            break;
    }

    // Mapear por código de status
    if (statusCode) {
        if (statusCode === 401) {
            return new OpenAIAuthenticationError(errorMessage, error);
        }
        if (statusCode === 404) {
            return new OpenAINotFoundError(errorMessage, error);
        }
        if (statusCode === 429) {
            return new OpenAIRateLimitError(errorMessage, error);
        }
        if (statusCode === 408) {
            return new OpenAITimeoutError(errorMessage, error);
        }
        if (statusCode >= 400 && statusCode < 500) {
            return new OpenAIValidationError(errorMessage, error);
        }
        if (statusCode >= 500) {
            return new OpenAIServerError(errorMessage, error);
        }
    }

    // Error genérico si no pudimos mapear
    return new OpenAIError(
        errorMessage,
        errorType || "unknown_error",
        statusCode || 500,
        error
    );
}
