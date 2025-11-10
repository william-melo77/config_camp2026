/**
 * Tipos e interfaces para los proveedores de IA
 */

// Tipos de proveedores disponibles
export enum AIProviderType {
    OPENAI = "openai",
    // Futuro: ANTHROPIC = "anthropic",
    // Futuro: COHERE = "cohere",
}

// Status de los vector stores
export enum VectorStoreStatus {
    CREATING = "creating",
    READY = "ready",
    FAILED = "failed",
}

// Configuración base para cualquier proveedor
export interface AIProviderConfig {
    apiKey: string;
    organization?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
}

// Resultado de operaciones
export interface OperationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: Record<string, any>;
}

// Información de un vector store
export interface VectorStoreInfo {
    id: string;
    name?: string;
    status: string;
    fileCount?: number;
    fileCounts?: {
        in_progress: number;
        completed: number;
        failed: number;
        cancelled: number;
        total: number;
    };
    usageBytes?: number;
    metadata?: Record<string, any>;
    expiresAfter?: {
        anchor: "last_active_at";
        days: number;
    };
    expiresAt?: number;
    lastActiveAt?: number;
    createdAt?: number | Date;
}

// Parámetros para crear vector store
export interface CreateVectorStoreParams {
    name?: string;
    file_ids?: string[]; // IDs de archivos para agregar al crear
    metadata?: Record<string, any>;
    expires_after?: {
        anchor: "last_active_at";
        days: number; // Días hasta expirar
    };
    chunking_strategy?: {
        type: "auto" | "static";
        static?: {
            max_chunk_size_tokens: number;
            chunk_overlap_tokens: number;
        };
    };
}

// Parámetros para actualizar vector store
export interface UpdateVectorStoreParams {
    name?: string;
    metadata?: Record<string, any>;
    expires_after?: {
        anchor: "last_active_at";
        days: number;
    };
}

// Información de archivo
export interface FileInfo {
    id: string;
    name: string;
    size: number;
    status: string;
    createdAt?: number | Date;
}

// Parámetros para agregar archivo a vector store
export interface AddFileToVectorStoreParams {
    vectorStoreId: string;
    fileId: string;
}

// Nuevo: parámetros para actualizar atributos de un archivo en vector store
export interface UpdateVectorStoreFileParams {
    vectorStoreId: string;
    fileId: string;
    attributes: Record<string, any>;
}

// Resultado de lista paginada
export interface PaginatedResult<T> {
    data: T[];
    hasMore: boolean;
    firstId?: string;
    lastId?: string;
}

// Opciones de log para debugging
export interface LogOptions {
    requestId?: string;
    tenantId?: string;
    userId?: string;
    [key: string]: any;
}
