import OpenAI from "openai";
import { AIProvider } from "../base/AIProvider";
import {
    VectorStoreInfo,
    CreateVectorStoreParams,
    UpdateVectorStoreParams,
    FileInfo,
    AddFileToVectorStoreParams,
    PaginatedResult,
    OperationResult,
    UpdateVectorStoreFileParams,
} from "../base/types";
import OpenAIConfigManager, { OpenAIProviderConfig } from "./OpenAIConfig";
import { mapOpenAIError, OpenAIConfigurationError } from "./OpenAIErrors";
import { AppError } from "../../utils/handleError";

/**
 * Implementación del proveedor OpenAI usando Singleton pattern
 */ export class OpenAIProvider extends AIProvider {
    private static instance: OpenAIProvider | null = null;
    private client: OpenAI | null = null;
    private configManager: OpenAIConfigManager | null = null;

    /**
     * Constructor privado para Singleton
     */
    private constructor(config: Partial<OpenAIProviderConfig>) {
        super(config as any, "OpenAI");

        try {
            this.configManager = new OpenAIConfigManager(config);
            this.initializeSync();
        } catch (error) {
            this.log("error", "Error al configurar OpenAI Provider", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }

    /**
     * Obtener instancia única (Singleton)
     */
    public static getInstance(
        config?: Partial<OpenAIProviderConfig>
    ): OpenAIProvider {
        if (!OpenAIProvider.instance) {
            if (!config) {
                throw new OpenAIConfigurationError(
                    "Se requiere configuración para inicializar OpenAI Provider"
                );
            }
            OpenAIProvider.instance = new OpenAIProvider(config);
        }
        return OpenAIProvider.instance;
    }

    /**
     * Resetear instancia (útil para testing)
     */
    public static resetInstance(): void {
        OpenAIProvider.instance = null;
    }

    /**
     * Verificar si hay una instancia creada
     */
    public static hasInstance(): boolean {
        return OpenAIProvider.instance !== null;
    }

    /**
     * Inicialización síncrona del cliente
     */
    private initializeSync(): void {
        if (!this.configManager) {
            throw new OpenAIConfigurationError(
                "Config Manager no inicializado"
            );
        }

        const config = this.configManager.getConfig();

        this.client = new OpenAI({
            apiKey: config.apiKey,
            organization: config.organization,
            baseURL: config.baseURL,
            timeout: config.timeout,
            maxRetries: config.maxRetries,
            defaultHeaders: config.defaultHeaders,
        });

        this.isInitialized = true;

        this.log("info", "OpenAI Provider inicializado correctamente", {
            apiKey: this.configManager.getMaskedApiKey(),
            organization: config.organization || "default",
            baseURL: config.baseURL,
        });
    }

    /**
     * Implementación abstracta requerida (ya se hace en initializeSync)
     */
    protected async initialize(): Promise<void> {
        // Ya inicializado en constructor de manera síncrona
        return Promise.resolve();
    }

    /**
     * Obtener cliente de OpenAI (con validación)
     */
    private getClient(): OpenAI {
        this.validateInitialized();
        if (!this.client) {
            throw new OpenAIConfigurationError(
                "Cliente de OpenAI no disponible"
            );
        }
        return this.client;
    }

    // ============================================
    // IMPLEMENTACIÓN DE MÉTODOS - Vector Stores
    // ============================================

    /**
     * Crear un vector store en OpenAI
     */
    public async createVectorStore(
        params: CreateVectorStoreParams
    ): Promise<VectorStoreInfo> {
        const client = this.getClient();

        try {
            this.log("info", "Creando vector store en OpenAI", {
                name: params.name,
                hasMetadata: !!params.metadata,
            });

            const sanitizedMetadata = this.sanitizeMetadata(params.metadata);

            // Preparar parámetros para OpenAI
            const createParams: any = {};

            if (params.name) createParams.name = params.name;
            if (sanitizedMetadata) createParams.metadata = sanitizedMetadata;
            if (params.file_ids && params.file_ids.length > 0) {
                createParams.file_ids = params.file_ids;
            }
            if (params.expires_after) {
                createParams.expires_after = params.expires_after;
            }
            if (params.chunking_strategy) {
                createParams.chunking_strategy = params.chunking_strategy;
            }

            const vectorStore = await this.retryOperation(
                async () => await client.vectorStores.create(createParams),
                this.configManager!.getConfig().maxRetries
            );

            const result: VectorStoreInfo = {
                id: vectorStore.id,
                name: vectorStore.name || undefined,
                status: vectorStore.status,
                fileCount: vectorStore.file_counts?.total || 0,
                fileCounts: {
                    in_progress: vectorStore.file_counts?.in_progress || 0,
                    completed: vectorStore.file_counts?.completed || 0,
                    failed: vectorStore.file_counts?.failed || 0,
                    cancelled: vectorStore.file_counts?.cancelled || 0,
                    total: vectorStore.file_counts?.total || 0,
                },
                usageBytes: vectorStore.usage_bytes || 0,
                metadata: vectorStore.metadata as
                    | Record<string, any>
                    | undefined,
                expiresAfter: vectorStore.expires_after
                    ? {
                          anchor: vectorStore.expires_after
                              .anchor as "last_active_at",
                          days: vectorStore.expires_after.days,
                      }
                    : undefined,
                expiresAt: vectorStore.expires_at || undefined,
                lastActiveAt: vectorStore.last_active_at || undefined,
                createdAt: vectorStore.created_at,
            };

            this.log("info", "Vector store creado exitosamente en OpenAI", {
                id: result.id,
                status: result.status,
                fileCount: result.fileCount,
            });

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al crear vector store", {
                error: mappedError.message,
                type: mappedError.type,
            });
            throw mappedError;
        }
    }

    /**
     * Obtener información de un vector store
     */
    public async getVectorStore(
        vectorStoreId: string
    ): Promise<VectorStoreInfo> {
        const client = this.getClient();

        try {
            this.log("info", "Obteniendo vector store de OpenAI", {
                vectorStoreId,
            });

            const vectorStore = await client.vectorStores.retrieve(
                vectorStoreId
            );

            const result: VectorStoreInfo = {
                id: vectorStore.id,
                name: vectorStore.name || undefined,
                status: vectorStore.status,
                fileCount: vectorStore.file_counts?.total || 0,
                fileCounts: {
                    in_progress: vectorStore.file_counts?.in_progress || 0,
                    completed: vectorStore.file_counts?.completed || 0,
                    failed: vectorStore.file_counts?.failed || 0,
                    cancelled: vectorStore.file_counts?.cancelled || 0,
                    total: vectorStore.file_counts?.total || 0,
                },
                usageBytes: vectorStore.usage_bytes || 0,
                metadata: vectorStore.metadata as
                    | Record<string, any>
                    | undefined,
                expiresAfter: vectorStore.expires_after
                    ? {
                          anchor: vectorStore.expires_after
                              .anchor as "last_active_at",
                          days: vectorStore.expires_after.days,
                      }
                    : undefined,
                expiresAt: vectorStore.expires_at || undefined,
                lastActiveAt: vectorStore.last_active_at || undefined,
                createdAt: vectorStore.created_at,
            };

            this.log("info", "Vector store obtenido exitosamente", {
                id: result.id,
                fileCount: result.fileCount,
            });

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al obtener vector store", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Actualizar un vector store
     */
    public async updateVectorStore(
        vectorStoreId: string,
        params: UpdateVectorStoreParams
    ): Promise<VectorStoreInfo> {
        const client = this.getClient();

        try {
            this.log("info", "Actualizando vector store en OpenAI", {
                vectorStoreId,
                name: params.name,
            });

            const sanitizedMetadata = this.sanitizeMetadata(params.metadata);

            // Preparar parámetros para actualizar
            const updateParams: any = {};
            if (params.name) updateParams.name = params.name;
            if (sanitizedMetadata) updateParams.metadata = sanitizedMetadata;
            if (params.expires_after) {
                updateParams.expires_after = params.expires_after;
            }

            const vectorStore = await client.vectorStores.update(
                vectorStoreId,
                updateParams
            );

            const result: VectorStoreInfo = {
                id: vectorStore.id,
                name: vectorStore.name || undefined,
                status: vectorStore.status,
                fileCount: vectorStore.file_counts?.total || 0,
                fileCounts: {
                    in_progress: vectorStore.file_counts?.in_progress || 0,
                    completed: vectorStore.file_counts?.completed || 0,
                    failed: vectorStore.file_counts?.failed || 0,
                    cancelled: vectorStore.file_counts?.cancelled || 0,
                    total: vectorStore.file_counts?.total || 0,
                },
                usageBytes: vectorStore.usage_bytes || 0,
                metadata: vectorStore.metadata as
                    | Record<string, any>
                    | undefined,
                expiresAfter: vectorStore.expires_after
                    ? {
                          anchor: vectorStore.expires_after
                              .anchor as "last_active_at",
                          days: vectorStore.expires_after.days,
                      }
                    : undefined,
                expiresAt: vectorStore.expires_at || undefined,
                lastActiveAt: vectorStore.last_active_at || undefined,
                createdAt: vectorStore.created_at,
            };

            this.log("info", "Vector store actualizado exitosamente", {
                id: result.id,
                fileCount: result.fileCount,
            });

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al actualizar vector store", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Eliminar un vector store
     */
    public async deleteVectorStore(
        vectorStoreId: string
    ): Promise<OperationResult<{ deleted: boolean }>> {
        const client = this.getClient();

        try {
            this.log("info", "Eliminando vector store de OpenAI", {
                vectorStoreId,
            });

            const result = await client.vectorStores.delete(vectorStoreId);

            this.log("info", "Vector store eliminado exitosamente", {
                vectorStoreId,
                deleted: result.deleted,
            });

            return {
                success: true,
                data: { deleted: result.deleted },
            };
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al eliminar vector store", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Listar archivos en un vector store
     */
    public async listVectorStoreFiles(
        vectorStoreId: string
    ): Promise<PaginatedResult<FileInfo>> {
        const client = this.getClient();

        try {
            this.log("info", "Listando archivos del vector store", {
                vectorStoreId,
            });

            const files = await client.vectorStores.files.list(vectorStoreId);

            const fileInfos: FileInfo[] = files.data.map((file) => ({
                id: file.id,
                name: "", // OpenAI no retorna el nombre en esta API
                size: 0,
                status: file.status,
                createdAt: file.created_at,
            }));

            this.log("info", "Archivos listados exitosamente", {
                vectorStoreId,
                fileCount: fileInfos.length,
            });

            return {
                data: fileInfos,
                hasMore: files.has_more || false,
            };
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al listar archivos del vector store", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Agregar archivo a un vector store
     * Delega al método createAndPollVectorStoreFile
     */
    public async addFileToVectorStore(
        params: AddFileToVectorStoreParams
    ): Promise<FileInfo> {
        return this.createAndPollVectorStoreFile(
            params.vectorStoreId,
            params.fileId
        );
    }

    /**
     * Subir archivo y hacer polling hasta completarse (upload_and_poll)
     */
    public async uploadVectorStoreFileAndPoll(
        vectorStoreId: string,
        file: Buffer,
        filename: string,
        mimeType: string
    ): Promise<FileInfo> {
        const client = this.getClient();

        try {
            this.log("info", "Subiendo archivo con uploadAndPoll", {
                vectorStoreId,
                filename,
                size: file.length,
            });

            const OpenAI = await import("openai");
            const fileToUpload = await OpenAI.toFile(file, filename, {
                type: mimeType,
            });

            // Sintaxis del SDK de TypeScript de OpenAI (2 parámetros separados)
            const fileRef = await client.vectorStores.files.uploadAndPoll(
                vectorStoreId,
                fileToUpload
            );

            const result: FileInfo = {
                id: fileRef.id,
                name: "",
                size: 0,
                status: fileRef.status,
                createdAt: fileRef.created_at,
            };

            this.log("info", "Archivo procesado con uploadAndPoll", {
                vectorStoreId,
                fileId: fileRef.id,
                status: fileRef.status,
            });

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error en uploadVectorStoreFileAndPoll", {
                vectorStoreId,
                filename,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Adjuntar un file_id existente al vector store
     * Usa create sin polling para evitar race conditions
     */
    public async createAndPollVectorStoreFile(
        vectorStoreId: string,
        fileId: string
    ): Promise<FileInfo> {
        const client = this.getClient();

        try {
            this.log("info", "Adjuntando file_id al vector store", {
                vectorStoreId,
                fileId,
            });

            // Usar create (SIN AndPoll) para evitar race conditions
            // El archivo ya está subido en Files API, solo lo adjuntamos
            const file = await client.vectorStores.files.create(vectorStoreId, {
                file_id: fileId,
            });

            this.log("info", "Archivo adjuntado al vector store", {
                vectorStoreId,
                fileId: file.id,
                status: file.status,
            });

            // Si necesitamos esperar a que se procese, hacer polling manual
            if (file.status === "in_progress") {
                this.log("info", "Archivo en procesamiento, esperando...", {
                    vectorStoreId,
                    fileId: file.id,
                });

                const processedFile = await this.waitForVectorStoreFile(
                    vectorStoreId,
                    file.id
                );

                const result: FileInfo = {
                    id: processedFile.id,
                    name: "",
                    size: 0,
                    status: processedFile.status,
                    createdAt: processedFile.created_at,
                };

                return result;
            }

            const result: FileInfo = {
                id: file.id,
                name: "",
                size: 0,
                status: file.status,
                createdAt: file.created_at,
            };

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al adjuntar archivo al vector store", {
                vectorStoreId,
                fileId,
                error: mappedError.message,
                originalError: error?.message || String(error),
                errorType: error?.constructor?.name,
                errorCode: error?.code,
                errorStatus: error?.status,
                stack: error?.stack,
            });
            throw mappedError;
        }
    }

    /**
     * Esperar a que un archivo termine de procesarse en el vector store
     * Polling manual con backoff para evitar rate limiting
     */
    private async waitForVectorStoreFile(
        vectorStoreId: string,
        fileId: string,
        maxAttempts: number = 60,
        initialDelayMs: number = 1000
    ): Promise<any> {
        const client = this.getClient();
        let delayMs = initialDelayMs;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            // Esperar antes de cada intento (excepto el primero)
            if (attempt > 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
                // Backoff exponencial hasta 5 segundos máximo
                delayMs = Math.min(delayMs * 1.5, 5000);
            }

            try {
                const file = await client.vectorStores.files.retrieve(fileId, {
                    vector_store_id: vectorStoreId,
                });

                this.log("debug", "Polling estado del archivo", {
                    vectorStoreId,
                    fileId,
                    status: file.status,
                    attempt,
                    maxAttempts,
                    nextDelayMs: delayMs,
                });

                if (file.status === "completed") {
                    this.log("info", "Archivo procesado exitosamente", {
                        vectorStoreId,
                        fileId,
                        attempts: attempt,
                    });
                    return file;
                }

                if (file.status === "failed") {
                    const errorMsg =
                        (file as any).last_error?.message || "Unknown error";
                    throw new Error(`Archivo falló al procesarse: ${errorMsg}`);
                }

                if (file.status === "cancelled") {
                    throw new Error("Procesamiento del archivo fue cancelado");
                }
            } catch (error: any) {
                // Si es un error 404, el archivo aún no está disponible (race condition)
                if (error.status === 404 && attempt < maxAttempts) {
                    this.log(
                        "warn",
                        "Archivo no encontrado aún, reintentando...",
                        {
                            vectorStoreId,
                            fileId,
                            attempt,
                            maxAttempts,
                            nextDelayMs: delayMs,
                        }
                    );
                    continue;
                }
                throw error;
            }
        }

        throw new Error(
            `Timeout: Archivo no completó procesamiento después de ${maxAttempts} intentos`
        );
    }

    /**
     * Actualizar atributos del archivo en el vector store
     *
     * NOTA: La API de OpenAI VectorStores.Files NO tiene método update.
     * Este método está aquí por compatibilidad con la interfaz AIProvider,
     * pero lanzará un error indicando que la operación no está soportada.
     */
    public async updateVectorStoreFile(
        params: UpdateVectorStoreFileParams
    ): Promise<FileInfo> {
        this.log(
            "warn",
            "updateVectorStoreFile no está soportado por OpenAI API",
            {
                vectorStoreId: params.vectorStoreId,
                fileId: params.fileId,
            }
        );

        throw new AppError(
            "La API de OpenAI no soporta actualización de archivos en vector stores. " +
                "Para cambiar un archivo, elimínalo y vuelve a subirlo.",
            501 // Not Implemented
        );
    }
    /**
     * Alias: eliminar archivo (delete) usando removeFileFromVectorStore
     */
    public async deleteVectorStoreFile(
        vectorStoreId: string,
        fileId: string
    ): Promise<OperationResult<{ deleted: boolean }>> {
        return this.removeFileFromVectorStore(vectorStoreId, fileId);
    }

    /**
     * Eliminar archivo de un vector store
     */
    public async removeFileFromVectorStore(
        vectorStoreId: string,
        fileId: string
    ): Promise<OperationResult<{ deleted: boolean }>> {
        const client = this.getClient();

        try {
            this.log("info", "Eliminando archivo del vector store", {
                vectorStoreId,
                fileId,
            });

            // Sintaxis del SDK de TypeScript de OpenAI
            // delete(fileID: string, params: FileDeleteParams)
            const result = await client.vectorStores.files.delete(fileId, {
                vector_store_id: vectorStoreId,
            });

            this.log("info", "Archivo eliminado exitosamente", {
                vectorStoreId,
                fileId,
                deleted: result.deleted,
            });

            return {
                success: true,
                data: { deleted: result.deleted },
            };
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al eliminar archivo del vector store", {
                vectorStoreId,
                fileId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    // ============================================
    // MÉTODOS DE UTILIDAD ESPECÍFICOS DE OPENAI
    // ============================================

    /**
     * Listar todos los vector stores
     */
    public async listVectorStores(
        limit: number = 20,
        after?: string
    ): Promise<PaginatedResult<VectorStoreInfo>> {
        const client = this.getClient();

        try {
            this.log("info", "Listando vector stores", { limit, after });

            const response = await client.vectorStores.list({
                limit,
                after,
            });

            const vectorStores: VectorStoreInfo[] = response.data.map((vs) => ({
                id: vs.id,
                name: vs.name || undefined,
                status: vs.status,
                fileCount: vs.file_counts?.total || 0,
                fileCounts: {
                    in_progress: vs.file_counts?.in_progress || 0,
                    completed: vs.file_counts?.completed || 0,
                    failed: vs.file_counts?.failed || 0,
                    cancelled: vs.file_counts?.cancelled || 0,
                    total: vs.file_counts?.total || 0,
                },
                usageBytes: vs.usage_bytes || 0,
                metadata: vs.metadata as Record<string, any> | undefined,
                expiresAfter: vs.expires_after
                    ? {
                          anchor: vs.expires_after.anchor as "last_active_at",
                          days: vs.expires_after.days,
                      }
                    : undefined,
                expiresAt: vs.expires_at || undefined,
                lastActiveAt: vs.last_active_at || undefined,
                createdAt: vs.created_at,
            }));

            this.log("info", "Vector stores listados exitosamente", {
                count: vectorStores.length,
                hasMore: response.has_more,
            });

            return {
                data: vectorStores,
                hasMore: response.has_more || false,
            };
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al listar vector stores", {
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Subir archivo a OpenAI Files API
     */
    public async uploadFile(
        file: Buffer,
        filename: string,
        mimeType: string,
        purpose: "assistants" = "assistants"
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Subiendo archivo a OpenAI", {
                filename,
                purpose,
                size: file.length,
            });

            // Convertir Buffer a File usando toFile del SDK
            const OpenAI = await import("openai");
            const fileToUpload = await OpenAI.toFile(file, filename, {
                type: mimeType,
            });

            const uploadedFile = await client.files.create({
                file: fileToUpload,
                purpose: purpose,
            });

            this.log("info", "Archivo subido exitosamente a OpenAI", {
                fileId: uploadedFile.id,
                filename: uploadedFile.filename,
                bytes: uploadedFile.bytes,
            });

            return uploadedFile;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al subir archivo a OpenAI", {
                filename,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Subir archivo y adjuntarlo a Vector Store con polling (método recomendado)
     * Espera hasta que el archivo esté completamente procesado
     */
    public async uploadAndPollToVectorStore(
        vectorStoreId: string,
        file: Buffer,
        filename: string,
        mimeType: string
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Subiendo archivo con polling a vector store", {
                vectorStoreId,
                filename,
                size: file.length,
            });

            // Convertir Buffer a File
            const OpenAI = await import("openai");
            const fileToUpload = await OpenAI.toFile(file, filename, {
                type: mimeType,
            });

            // uploadAndPoll: sube, adjunta y espera hasta completion
            const fileRef = await client.vectorStores.files.uploadAndPoll(
                vectorStoreId,
                fileToUpload
            );

            this.log("info", "Archivo procesado exitosamente", {
                vectorStoreId,
                fileId: fileRef.id,
                status: fileRef.status,
            });

            return fileRef;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error en uploadAndPoll", {
                vectorStoreId,
                filename,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Crear batch de archivos con polling
     * Para subir múltiples archivos eficientemente
     */
    public async uploadAndPollBatch(
        vectorStoreId: string,
        files: Array<{ buffer: Buffer; filename: string; mimeType: string }>
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Subiendo batch de archivos con polling", {
                vectorStoreId,
                fileCount: files.length,
            });

            // Primero subir todos los archivos a Files API
            const OpenAI = await import("openai");
            const fileIds: string[] = [];

            for (const file of files) {
                const fileToUpload = await OpenAI.toFile(
                    file.buffer,
                    file.filename,
                    { type: file.mimeType }
                );

                const uploaded = await client.files.create({
                    file: fileToUpload,
                    purpose: "assistants",
                });

                fileIds.push(uploaded.id);
            }

            // Crear batch y hacer polling
            const batch = await client.vectorStores.fileBatches.createAndPoll(
                vectorStoreId,
                { file_ids: fileIds }
            );

            this.log("info", "Batch procesado exitosamente", {
                vectorStoreId,
                batchId: batch.id,
                status: batch.status,
                fileCount: batch.file_counts.total,
            });

            return batch;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error en uploadAndPoll batch", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Obtener información de un archivo de OpenAI
     */
    public async getFile(fileId: string): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Obteniendo información de archivo", {
                fileId,
            });

            const file = await client.files.retrieve(fileId);

            return file;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al obtener archivo", {
                fileId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Eliminar archivo de OpenAI Files API
     */
    public async deleteFile(fileId: string): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Eliminando archivo de OpenAI", {
                fileId,
            });

            const result = await client.files.delete(fileId);

            this.log("info", "Archivo eliminado de OpenAI", {
                fileId,
                deleted: result.deleted,
            });

            return result;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al eliminar archivo", {
                fileId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Crear vector store y agregar archivos en batch
     */
    public async createVectorStoreFileBatch(
        vectorStoreId: string,
        fileIds: string[]
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Creando batch de archivos en vector store", {
                vectorStoreId,
                fileCount: fileIds.length,
            });

            const batch = await client.vectorStores.fileBatches.create(
                vectorStoreId,
                {
                    file_ids: fileIds,
                }
            );

            this.log("info", "Batch de archivos creado exitosamente", {
                vectorStoreId,
                batchId: batch.id,
                status: batch.status,
            });

            return batch;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al crear batch de archivos", {
                vectorStoreId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Obtener status de un batch de archivos
     */
    public async getVectorStoreFileBatch(
        vectorStoreId: string,
        batchId: string
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Obteniendo status de batch", {
                vectorStoreId,
                batchId,
            });

            const batch = await client.vectorStores.fileBatches.retrieve(
                batchId,
                { vector_store_id: vectorStoreId }
            );

            return batch;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al obtener batch", {
                vectorStoreId,
                batchId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Cancelar batch de archivos
     */
    public async cancelVectorStoreFileBatch(
        vectorStoreId: string,
        batchId: string
    ): Promise<any> {
        const client = this.getClient();

        try {
            this.log("info", "Cancelando batch de archivos", {
                vectorStoreId,
                batchId,
            });

            const batch = await client.vectorStores.fileBatches.cancel(
                batchId,
                { vector_store_id: vectorStoreId }
            );

            return batch;
        } catch (error: any) {
            const mappedError = mapOpenAIError(error);
            this.log("error", "Error al cancelar batch", {
                vectorStoreId,
                batchId,
                error: mappedError.message,
            });
            throw mappedError;
        }
    }

    /**
     * Health check del servicio
     */
    public async healthCheck(): Promise<boolean> {
        try {
            const client = this.getClient();
            // Hacer una llamada simple para verificar conectividad
            await client.models.list();
            return true;
        } catch (error) {
            this.log("error", "Health check falló", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return false;
        }
    }

    /**
     * Obtener información de configuración (para debugging)
     */
    public getConfigInfo(): Record<string, any> {
        if (!this.configManager) {
            return {};
        }

        const config = this.configManager.getConfig();
        return {
            provider: this.providerName,
            apiKey: this.configManager.getMaskedApiKey(),
            organization: config.organization || "default",
            baseURL: config.baseURL,
            timeout: config.timeout,
            maxRetries: config.maxRetries,
            isReady: this.isReady(),
        };
    }
}

export default OpenAIProvider;
