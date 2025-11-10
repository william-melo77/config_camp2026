import { Response } from "express";

export class ResponseHandler {
    static success(
        res: Response,
        data: any = null,
        message: string = "Operación exitosa",
        statusCode: number = 200
    ) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString(),
        });
    }

    static error(
        res: Response,
        message: string = "Error interno del servidor",
        statusCode: number = 500,
        errors: any = null
    ) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        });
    }

    static created(
        res: Response,
        data: any,
        message: string = "Recurso creado exitosamente"
    ) {
        return this.success(res, data, message, 201);
    }

    static noContent(res: Response) {
        return res.status(204).send();
    }

    static badRequest(
        res: Response,
        message: string = "Datos de entrada inválidos",
        errors: any = null
    ) {
        return this.error(res, message, 400, errors);
    }

    static unauthorized(res: Response, message: string = "No autorizado") {
        return this.error(res, message, 401);
    }

    static forbidden(res: Response, message: string = "Acceso prohibido") {
        return this.error(res, message, 403);
    }

    static notFound(res: Response, message: string = "Recurso no encontrado") {
        return this.error(res, message, 404);
    }

    static conflict(
        res: Response,
        message: string = "Conflicto en la operación"
    ) {
        return this.error(res, message, 409);
    }

    static unprocessableEntity(
        res: Response,
        message: string = "Entidad no procesable",
        errors: any = null
    ) {
        return this.error(res, message, 422, errors);
    }
}

export default ResponseHandler;
