import dotenv from "dotenv";
import { z } from "zod";

// Cargar variables de entorno
dotenv.config();

// Esquema de validación para las variables de entorno
const envSchema = z
    .object({
        NODE_ENV: z
            .enum(["development", "production", "test"])
            .default("development"),
        PORT: z.string().transform(Number).default(3001),
        HOST: z.string().default("localhost"),

        // Configuración de MySQL
        MYSQL_HOST: z.string().default("localhost"),
        MYSQL_DATABASE: z.string(),
        MYSQL_USER: z.string(),
        MYSQL_PASSWORD: z.string(),
        MYSQL_PORT: z.string().transform(Number).default(3306),

        // Configuración de CORS
        ALLOWED_ORIGINS: z
            .string()
            .default("http://localhost:3000,http://localhost:3001"),

        // Configuración de rate limiting
        RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
        RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(100),

        // Configuración de logging
        LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

        // Configuración de OpenAI
        OPENAI_API_KEY: z.string().optional(),
        OPENAI_ORGANIZATION: z.string().optional(),

        // Configuración de Cloudflare R2 (S3 API)
        R2_ENABLED: z.coerce.boolean().default(false),
        R2_BUCKET: z.string().default("agentik"),
        // Indica si el bucket expone lectura pública (para construir publicUrl)
        R2_BUCKET_PUBLIC: z.coerce.boolean().default(false),
        R2_ENDPOINT: z.string().optional(),
        R2_ACCESS_KEY_ID: z.string().optional(),
        R2_SECRET_ACCESS_KEY: z.string().optional(),
        // URL pública base opcional para construir enlaces accesibles
        // Ej: https://mi-dominio.com o https://<account-id>.r2.cloudflarestorage.com
        R2_PUBLIC_BASE_URL: z.string().optional(),

        // Configuración de SMTP para envío de correos
        SMTP_HOST: z.string().default("localhost"),
        SMTP_PORT: z.string().transform(Number).default(587),
        SMTP_USER: z.string().optional(),
        SMTP_PASS: z.string().optional(),
        SMTP_FROM: z.string().default("noreply@example.com"),
    })
    .superRefine((env, ctx) => {
        // Si R2 está habilitado, exigir endpoint y credenciales
        if (env.R2_ENABLED) {
            if (!env.R2_ENDPOINT) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["R2_ENDPOINT"],
                    message: "R2_ENDPOINT es requerido cuando R2_ENABLED=true",
                });
            }
            if (!env.R2_ACCESS_KEY_ID) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["R2_ACCESS_KEY_ID"],
                    message:
                        "R2_ACCESS_KEY_ID es requerido cuando R2_ENABLED=true",
                });
            }
            if (!env.R2_SECRET_ACCESS_KEY) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["R2_SECRET_ACCESS_KEY"],
                    message:
                        "R2_SECRET_ACCESS_KEY es requerido cuando R2_ENABLED=true",
                });
            }
        }
    });

// Validar y exportar las variables de entorno
export const env = envSchema.parse(process.env);

// Función para cargar variables de entorno
export function loadEnvironmentVariables(): void {
    dotenv.config();
    console.log("✅ Variables de entorno cargadas correctamente");
}

// Función para validar variables requeridas
export function validateRequiredEnvVars(): void {
    const requiredVars = ["MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"];
    // Si R2 está habilitado, validar también sus variables
    try {
        const isR2Enabled = env.R2_ENABLED;
        if (isR2Enabled) {
            requiredVars.push(
                "R2_ENDPOINT",
                "R2_ACCESS_KEY_ID",
                "R2_SECRET_ACCESS_KEY"
            );
        }
    } catch (e) {
        // Si env aún no está parseado, omitir (superRefine ya validará luego)
    }
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        throw new Error(
            `❌ Variables de entorno requeridas faltantes: ${missingVars.join(
                ", "
            )}`
        );
    }

    console.log("✅ Variables de entorno validadas correctamente");
}

// Configuración de la base de datos
export const dbConfig = {
    host: env.MYSQL_HOST,
    database: env.MYSQL_DATABASE,
    username: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    port: env.MYSQL_PORT,
    dialect: "mysql" as const,
    logging: env.NODE_ENV === "development" ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: false, // No usar snake_case para evitar conflictos
        freezeTableName: true, // Mantener nombres de tabla exactos
        // No hacer cambios automáticos en la estructura
        paranoid: false, // Se define por modelo individualmente
    },
};

// Configuración del servidor
export const serverConfig = {
    port: env.PORT,
    host: env.HOST,
    nodeEnv: env.NODE_ENV,
};

// Configuración de CORS
export const corsConfig = {
    // Normalizar orígenes: quitar espacios y slashes finales para evitar mismatches
    origin: env.ALLOWED_ORIGINS.split(",")
        .map((o) => o.trim().replace(/\/+$/, ""))
        .filter((o) => o.length > 0),
    credentials: true,
};

// Configuración de rate limiting
export const rateLimitConfig = {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: "Demasiadas peticiones, intenta de nuevo más tarde",
    },
};

// Configuración de OpenAI
export const openaiConfig = {
    apiKey: env.OPENAI_API_KEY,
    organization: env.OPENAI_ORGANIZATION,
};

export const r2Config = {
    bucket: env.R2_BUCKET,
    endpoint: env.R2_ENDPOINT,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: "auto" as const,
    enabled: env.R2_ENABLED,
    bucketPublic: env.R2_BUCKET_PUBLIC,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL,
};

// Configuración de SMTP
export const smtpConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true para puerto 465, false para otros
    auth:
        env.SMTP_USER && env.SMTP_PASS
            ? {
                  user: env.SMTP_USER,
                  pass: env.SMTP_PASS,
              }
            : undefined,
    from: env.SMTP_FROM,
};
