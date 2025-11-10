import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Importar configuración de variables de entorno
import {
    loadEnvironmentVariables,
    validateRequiredEnvVars,
    corsConfig,
    rateLimitConfig,
    serverConfig,
} from "./config/env";

// Importar y inicializar modelos para asegurar asociaciones
import "./models";

// Importar configuración de base de datos
import { testDatabaseConnection, syncDatabase } from "./config/database";

// Importar middlewares
import requestLogger from "./utils/requestLogger";
import customHeader from "./middlewares/customHeader";
import {
    errorHandler,
    notFoundHandler,
    unhandledRejectionHandler,
    uncaughtExceptionHandler,
} from "./middlewares/errorHandler";

// Importar utilidades
import logger from "./utils/logger";
import ResponseHandler from "./utils/responseHandler";

// Importar rutas
import rolesRouter from "./routes/roles";
import campAttendeesRouter from "./routes/campAttendees";
import uploadRouter from "./routes/upload";

// Importar controllers de health
import { healthCheck } from "./controllers/health";

// Importar configuración de Swagger
import { setupSwagger } from "./docs/swagger";

export class App {
    public app: Application;

    constructor() {
        // Cargar variables de entorno primero
        loadEnvironmentVariables();
        validateRequiredEnvVars();

        this.app = express();

        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeSwagger();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Request logging (debe ir primero para capturar todas las requests)
        this.app.use(requestLogger);

        // Headers personalizados
        this.app.use(customHeader);

        // Seguridad básica
        this.app.use(helmet());

        // CORS
        this.app.use(cors(corsConfig));
        // Responder preflight OPTIONS de forma genérica sin patrones incompatibles
        this.app.use((req: Request, res: Response, next: NextFunction): void => {
            if (req.method === "OPTIONS") {
                const origin = req.headers.origin ? String(req.headers.origin).replace(/\/+$/, "") : "";
                const allowedOrigins = Array.isArray(corsConfig.origin)
                    ? (corsConfig.origin as string[])
                    : [];
                if (origin && allowedOrigins.includes(origin)) {
                    res.header("Access-Control-Allow-Origin", origin);
                    res.header("Vary", "Origin");
                }
                res.header("Access-Control-Allow-Credentials", "true");
                res.header(
                    "Access-Control-Allow-Methods",
                    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
                );
                res.header(
                    "Access-Control-Allow-Headers",
                    (req.headers["access-control-request-headers"] as string) ||
                        "Content-Type, Authorization"
                );
                res.status(204).end();
                return;
            }
            next();
        });

        // Rate limiting
        const limiter = rateLimit(rateLimitConfig);
        this.app.use("/api", limiter);

        // Body parsing
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes(): void {
        // Ruta de health check general
        this.app.get("/health", healthCheck);

        // Ruta de prueba para verificar la base de datos

        this.app.get("/test-db", async (req: Request, res: Response) => {
            try {
                const { sequelize } = await import("./config/database.js");

                // Probar consulta simple
                const [results] = await sequelize.query("SELECT 1 as test");

                // Probar consulta a tablas principales
                const [rolesCount] = await sequelize.query(
                    "SELECT COUNT(*) as count FROM roles"
                );
                const [attendeesCount] = await sequelize.query(
                    "SELECT COUNT(*) as count FROM camp_attendees"
                );

                const testData = {
                    connection: "ok",
                    simpleQuery: results,
                    rolesCount,
                    campAttendeesCount: attendeesCount,
                    timestamp: new Date().toISOString(),
                };

                return ResponseHandler.success(
                    res,
                    testData,
                    "Prueba de base de datos exitosa"
                );
            } catch (error) {
                logger.error("Error en test-db", { error });
                return ResponseHandler.error(
                    res,
                    `Error en prueba de base de datos: ${
                        error instanceof Error
                            ? error.message
                            : "Error desconocido"
                    }`,
                    500
                );
            }
        });

        // Ruta principal con información de la API
        this.app.get("/", (req: Request, res: Response) => {
            const apiInfo = {
                version: "1.0.0",
                description:
                    "Sistema de configuración para Jóvenes con Un Próposito",
                architecture: "MVC + Clean Code",
                endpoints: {
                    health: "/health",
                    api: "/api",
                    docs: "/api/docs",
                    roles: "/api/roles",
                    campAttendees: "/api/camp-attendees",
                    uploadUrl: "/api/upload-url",
                },
                features: ["Gestión Jóvenes con Un Próposito"],
                documentation: {
                    healthCheck: "GET /health",
                    apiBase: "GET /api",
                    swaggerDocs: "GET /api/docs",
                },
            };

            return ResponseHandler.success(
                res,
                apiInfo,
                "⛪ Bienvenido al Microservicio de Configuración de Jóvenes con Un Próposito"
            );
        });

        // Ruta base de la API
        this.app.get("/api", (req: Request, res: Response) => {
            const apiData = {
                version: "1.0.0",
                availableEndpoints: [
                    "GET /health - Health check del sistema",
                    "GET /health/openai - Health check de OpenAI",
                    "GET /api - Información de la API",
                    "GET /api/docs - Documentación Swagger",
                    "GET /api/roles - Lista de roles",
                    "POST /api/roles - Crear rol",
                    "GET /api/roles/:id - Obtener rol por ID",
                    "GET /api/roles/code/:code - Obtener rol por código",
                    "PUT /api/roles/:id - Actualizar rol",
                    "DELETE /api/roles/:id - Eliminar rol",
                    "GET /api/camp-attendees - Lista de asistentes",
                    "POST /api/camp-attendees - Crear asistente",
                    "GET /api/camp-attendees/:id - Obtener asistente por ID",
                    "PUT /api/camp-attendees/:id - Actualizar asistente",
                    "DELETE /api/camp-attendees/:id - Eliminar asistente",
                    "POST /api/upload-url - Generar URL firmada para R2",
                ],
                status: "active",
            };

            return ResponseHandler.success(
                res,
                apiData,
                "API del Microservicio de Configuración Jóvenes con Un Próposito"
            );
        });

        // API routes
        this.app.use("/api/roles", rolesRouter);
        this.app.use("/api/camp-attendees", campAttendeesRouter);
        this.app.use("/api", uploadRouter);
    }

    private initializeSwagger(): void {
        // Configurar Swagger UI
        setupSwagger(this.app);
    }

    private initializeErrorHandling(): void {
        // 404 handler (debe ir antes del error handler)
        this.app.use(notFoundHandler);

        // Error handling middleware
        this.app.use(errorHandler);

        // Manejo de promesas rechazadas no capturadas
        process.on("unhandledRejection", unhandledRejectionHandler);

        // Manejo de excepciones no capturadas
        process.on("uncaughtException", uncaughtExceptionHandler);
    }

    // Método para inicializar la base de datos
    public async initializeDatabase(): Promise<void> {
        try {
            await testDatabaseConnection();
            await syncDatabase();
            console.log("✅ Base de datos inicializada correctamente");
        } catch (error) {
            console.error("❌ Error al inicializar la base de datos:", error);
            throw error;
        }
    }

    public getApp(): Application {
        return this.app;
    }
}
