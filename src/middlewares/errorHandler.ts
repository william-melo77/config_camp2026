import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/handleError";
import ResponseHandler from "../utils/responseHandler";
import logger from "../utils/logger";

// Middleware para manejar errores de aplicación
export const errorHandler = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = "Error interno del servidor";

    // Si es un AppError, usar sus propiedades
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // Log del error
    logger.error("Error en la aplicación", {
        error: error.message,
        stack: error.stack,
        statusCode,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });

    // Respuesta limpia sin stack trace (solo para logs internos)
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response) => {
    return ResponseHandler.notFound(
        res,
        `Ruta ${req.originalUrl} no encontrada`
    );
};

// Middleware para manejar promesas rechazadas no capturadas
export const unhandledRejectionHandler = (
    reason: any,
    promise: Promise<any>
) => {
    logger.error("Promesa rechazada no manejada", {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString(),
    });
};

// Middleware para manejar excepciones no capturadas
export const uncaughtExceptionHandler = (error: Error) => {
    logger.error("Excepción no capturada", {
        error: error.message,
        stack: error.stack,
    });
    process.exit(1);
};
