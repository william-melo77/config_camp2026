import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Jóvenes con Un Próposito - Microservicio de Configuración",
            version: "1.0.0",
            description: `
                Sistema de configuración para Jóvenes con Un Próposito con el patrón MVC + Clean Code
                Este microservicio permite gestionar la configuración de asistentes,
                proporcionando herramientas para la gestión del campamento.
            `,
            contact: {
                name: "Jóvenes con Un Próposito",
                email: "jovenesconunproposito@teams.com",
            },
            license: {
                name: "ISC",
            },
        },
        servers: [
            {
                url: "http://localhost:3001",
                description: "Servidor de desarrollo",
            },
            {
                url: "https://api.jovenesconunproposito.com",
                description: "Servidor de producción",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Token JWT para autenticación",
                },
            },
            schemas: {
                Error: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "Error en la operación",
                        },
                        errors: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            example: ["Campo requerido", "Formato inválido"],
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            example: "2025-10-21T03:16:50.047Z",
                        },
                    },
                },
                Success: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        message: {
                            type: "string",
                            example: "Operación exitosa",
                        },
                        data: {
                            type: "object",
                            description: "Datos de respuesta",
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            example: "2025-10-21T03:16:50.047Z",
                        },
                    },
                },
            },
            responses: {
                BadRequest: {
                    description: "Solicitud incorrecta",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                Unauthorized: {
                    description: "No autorizado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                Forbidden: {
                    description: "Sin permisos",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                NotFound: {
                    description: "Recurso no encontrado",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                Conflict: {
                    description: "Conflicto - recurso ya existe",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                UnprocessableEntity: {
                    description: "Error de validación",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
                InternalServerError: {
                    description: "Error interno del servidor",
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Error",
                            },
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: "Health",
                description: "Endpoints de salud del sistema",
            },
            {
                name: "Tenants",
                description:
                    "Gestión de tenants (agentes/organizaciones) del sistema",
            },
        ],
    },
    apis: [
        // Incluir archivos de rutas que contengan documentación Swagger
        path.join(__dirname, "../routes/*.ts"),
        path.join(__dirname, "../controllers/*.ts"),
    ],
};

// Generar especificación de Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configurar Swagger UI
const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #2c3e50; }
        .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    `,
    customSiteTitle: "Jovenes con Un Próposito - API Documentation",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
    },
};

// Función para configurar Swagger en la aplicación Express
export function setupSwagger(app: any): void {
    // Servir la documentación de Swagger
    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, swaggerUiOptions)
    );

    // Endpoint para obtener la especificación JSON
    app.get("/api/docs.json", (req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });

    console.log(
        `📚 Swagger UI disponible en: http://localhost:${process.env.PORT}/api/docs`
    );
    console.log(
        `📄 Especificación JSON disponible en: http://localhost:${process.env.PORT}/api/docs.json`
    );
}

export default swaggerSpec;
