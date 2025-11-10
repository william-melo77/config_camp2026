import logger from "../../utils/logger";
import {
    AIProviderConfig,
    VectorStoreInfo,
    CreateVectorStoreParams,
    UpdateVectorStoreParams,
    FileInfo,
    AddFileToVectorStoreParams,
    PaginatedResult,
    OperationResult,
    LogOptions,
    UpdateVectorStoreFileParams,
} from "./types";

/**
 * Clase abstracta base para todos los proveedores de IA
 * Define la interfaz que todos los proveedores deben implementar
 */
export abstract class AIProvider {
    protected config: AIProviderConfig;
    protected isInitialized: boolean = false;
    protected providerName: string;

    constructor(config: AIProviderConfig, providerName: string) {
        this.config = config;
        this.providerName = providerName;
    }

    /**
     * Inicializar el proveedor
     * Cada proveedor debe implementar su propia lógica de inicialización
     */
    protected abstract initialize(): Promise<void>;

    /**
     * Validar que el proveedor esté inicializado
     * @throws Error si no está inicializado
     */
    protected validateInitialized(): void {
        if (!this.isInitialized) {
            const error = `${this.providerName} no está inicializado`;
            logger.error(error);
            throw new Error(error);
        }
    }

    /**
     * Verificar si el proveedor está listo para usarse
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Obtener nombre del proveedor
     */
    public getProviderName(): string {
        return this.providerName;
    }

    /**
     * Log helper con contexto del proveedor
     */
    protected log(
        level: "info" | "error" | "warn" | "debug",
        message: string,
        options?: LogOptions
    ): void {
        const logData = {
            provider: this.providerName,
            ...options,
        };

        switch (level) {
            case "info":
                logger.info(message, logData);
                break;
            case "error":
                logger.error(message, logData);
                break;
            case "warn":
                logger.warn(message, logData);
                break;
            case "debug":
                logger.debug(message, logData);
                break;
        }
    }

    // ============================================
    // MÉTODOS ABSTRACTOS - Vector Stores
    // ============================================

    /**
     * Crear un vector store
     */
    abstract createVectorStore(
        params: CreateVectorStoreParams
    ): Promise<VectorStoreInfo>;

    /**
     * Obtener información de un vector store
     */
    abstract getVectorStore(vectorStoreId: string): Promise<VectorStoreInfo>;

    /**
     * Actualizar un vector store
     */
    abstract updateVectorStore(
        vectorStoreId: string,
        params: UpdateVectorStoreParams
    ): Promise<VectorStoreInfo>;

    /**
     * Eliminar un vector store
     */
    abstract deleteVectorStore(
        vectorStoreId: string
    ): Promise<OperationResult<{ deleted: boolean }>>;

    /**
     * Listar archivos en un vector store
     */
    abstract listVectorStoreFiles(
        vectorStoreId: string
    ): Promise<PaginatedResult<FileInfo>>;

    /**
     * Agregar archivo a un vector store
     */
    abstract addFileToVectorStore(
        params: AddFileToVectorStoreParams
    ): Promise<FileInfo>;

    /**
     * Eliminar archivo de un vector store
     */
    abstract removeFileFromVectorStore(
        vectorStoreId: string,
        fileId: string
    ): Promise<OperationResult<{ deleted: boolean }>>;

    // === NUEVOS MÉTODOS: API moderna de Vector Store Files ===
    /**
     * Subir archivo y bloquear hasta que se procese (upload_and_poll)
     */
    abstract uploadVectorStoreFileAndPoll(
        vectorStoreId: string,
        file: Buffer,
        filename: string,
        mimeType: string
    ): Promise<FileInfo>;

    /**
     * Adjuntar archivo ya subido (file_id) y bloquear hasta que se procese (create_and_poll)
     */
    abstract createAndPollVectorStoreFile(
        vectorStoreId: string,
        fileId: string
    ): Promise<FileInfo>;

    /**
     * Actualizar atributos de un archivo en el vector store
     */
    abstract updateVectorStoreFile(
        params: UpdateVectorStoreFileParams
    ): Promise<FileInfo>;

    /**
     * Eliminar archivo del vector store (alias de removeFileFromVectorStore)
     */
    abstract deleteVectorStoreFile(
        vectorStoreId: string,
        fileId: string
    ): Promise<OperationResult<{ deleted: boolean }>>;

    /**
     * Subir archivo a la API de archivos del proveedor
     */
    abstract uploadFile(
        file: Buffer,
        filename: string,
        mimeType: string,
        purpose?: string
    ): Promise<any>;

    // ============================================
    // MÉTODOS DE UTILIDAD
    // ============================================

    /**
     * Manejar errores de manera consistente
     */
    protected handleError(
        operation: string,
        error: any,
        options?: LogOptions
    ): never {
        const errorMessage =
            error?.message || error?.error?.message || "Error desconocido";
        const errorType = error?.type || error?.error?.type || "unknown_error";
        const statusCode = error?.status || error?.statusCode || 500;

        this.log("error", `Error en ${operation}`, {
            error: errorMessage,
            errorType,
            statusCode,
            ...options,
        });

        const customError: any = new Error(
            `${this.providerName}: ${errorMessage}`
        );
        customError.type = errorType;
        customError.statusCode = statusCode;
        customError.originalError = error;

        throw customError;
    }

    /**
     * Retry logic para operaciones que pueden fallar temporalmente
     */
    protected async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        delayMs: number = 1000
    ): Promise<T> {
        let lastError: any;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;

                // No reintentar si es error de cliente (4xx)
                if (error.statusCode && error.statusCode < 500) {
                    throw error;
                }

                if (attempt < maxRetries) {
                    this.log(
                        "warn",
                        `Reintentando operación (${attempt}/${maxRetries})`,
                        {
                            error: error.message,
                        }
                    );
                    await this.sleep(delayMs * attempt);
                }
            }
        }

        throw lastError;
    }

    /**
     * Helper para delay
     */
    protected sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Sanitizar metadata para asegurar compatibilidad
     */
    protected sanitizeMetadata(
        metadata?: Record<string, any>
    ): Record<string, any> | undefined {
        if (!metadata) return undefined;

        // Convertir valores que no sean string/number/boolean a string
        const sanitized: Record<string, any> = {};
        for (const [key, value] of Object.entries(metadata)) {
            if (
                typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"
            ) {
                sanitized[key] = value;
            } else if (value === null || value === undefined) {
                // Omitir valores null/undefined
                continue;
            } else {
                // Convertir objetos/arrays a JSON string
                sanitized[key] = JSON.stringify(value);
            }
        }

        return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    }
}

export default AIProvider;
