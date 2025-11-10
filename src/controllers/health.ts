import { Request, Response } from "express";
import ResponseHandler from "../utils/responseHandler";
import { ProviderFactory, AIProviderType } from "../providers";
import logger from "../utils/logger";
import { testDatabaseConnection } from "../config/database";
import { serverConfig } from "../config/env";

/**
 * Health check completo del sistema
 */
export const healthCheck = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Probar conexión a la base de datos
        await testDatabaseConnection();

        // Verificar proveedores de IA
        const providers = ProviderFactory.getAvailableProviders();
        const providerInfo = ProviderFactory.getProvidersInfo();

        const healthData = {
            uptime: process.uptime(),
            environment: serverConfig.nodeEnv,
            database: "connected",
            timestamp: new Date().toISOString(),
        };

        ResponseHandler.success(
            res,
            healthData,
            "Microservicio de Configuración Jóvenes con Un Próposito funcionando correctamente"
        );
    } catch (error) {
        logger.error("Error en health check", { error });
        ResponseHandler.error(res, "Error en el health check", 500, {
            database: "disconnected",
        });
    }
};
