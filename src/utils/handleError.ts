import { Response } from "express";
import ResponseHandler from "./responseHandler";

// Función legacy para compatibilidad hacia atrás
export const handleHttpError = (
    res: Response,
    message: string = "algo anda mal",
    code: number = 403
) => {
    return ResponseHandler.error(res, message, code);
};

// Nueva clase para errores de aplicación
export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(
        message: string,
        statusCode: number,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Funciones helper específicas
export const handleUnauthorized = (
    res: Response,
    message: string = "No autorizado"
) => {
    return ResponseHandler.unauthorized(res, message);
};

export const handleForbidden = (
    res: Response,
    message: string = "Acceso prohibido"
) => {
    return ResponseHandler.forbidden(res, message);
};

export const handleNotFound = (
    res: Response,
    message: string = "Recurso no encontrado"
) => {
    return ResponseHandler.notFound(res, message);
};

export const handleValidationError = (
    res: Response,
    message: string = "Datos inválidos",
    errors: any = null
) => {
    return ResponseHandler.unprocessableEntity(res, message, errors);
};
