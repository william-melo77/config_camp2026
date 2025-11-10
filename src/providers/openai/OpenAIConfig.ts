import { AIProviderConfig } from "../base/types";
import { OpenAIConfigurationError } from "./OpenAIErrors";

/**
 * Configuración específica de OpenAI
 */
export interface OpenAIProviderConfig extends AIProviderConfig {
    apiKey: string;
    organization?: string;
    baseURL?: string;
    timeout?: number;
    maxRetries?: number;
    defaultHeaders?: Record<string, string>;
}

/**
 * Configuración por defecto de OpenAI
 */
export const DEFAULT_OPENAI_CONFIG: Partial<OpenAIProviderConfig> = {
    baseURL: "https://api.openai.com/v1",
    timeout: 60000, // 60 segundos
    maxRetries: 3,
    defaultHeaders: {
        "OpenAI-Beta": "assistants=v2", // Header requerido para API Beta
    },
};

/**
 * Clase para gestionar la configuración de OpenAI
 */
export class OpenAIConfigManager {
    private config: OpenAIProviderConfig;

    constructor(config: Partial<OpenAIProviderConfig>) {
        this.config = this.validateAndMergeConfig(config);
    }

    /**
     * Validar y combinar configuración con valores por defecto
     */
    private validateAndMergeConfig(
        config: Partial<OpenAIProviderConfig>
    ): OpenAIProviderConfig {
        // Validar API Key
        if (!config.apiKey) {
            throw new OpenAIConfigurationError(
                "API Key de OpenAI es requerida"
            );
        }

        // Validar formato de API Key
        if (!this.isValidApiKey(config.apiKey)) {
            throw new OpenAIConfigurationError(
                "Formato de API Key de OpenAI inválido. Debe empezar con 'sk-'"
            );
        }

        // Combinar con valores por defecto
        return {
            ...DEFAULT_OPENAI_CONFIG,
            ...config,
            apiKey: config.apiKey,
        } as OpenAIProviderConfig;
    }

    /**
     * Validar formato de API Key
     */
    private isValidApiKey(apiKey: string): boolean {
        return apiKey.startsWith("sk-") && apiKey.length > 20;
    }

    /**
     * Obtener configuración
     */
    public getConfig(): OpenAIProviderConfig {
        return { ...this.config };
    }

    /**
     * Obtener API Key (enmascarada para logs)
     */
    public getMaskedApiKey(): string {
        const key = this.config.apiKey;
        if (key.length <= 10) return "***";
        return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    }

    /**
     * Validar que la configuración esté completa
     */
    public validate(): boolean {
        return !!(
            this.config.apiKey &&
            this.config.baseURL &&
            this.config.timeout &&
            this.config.maxRetries !== undefined
        );
    }

    /**
     * Actualizar configuración
     */
    public updateConfig(updates: Partial<OpenAIProviderConfig>): void {
        this.config = this.validateAndMergeConfig({
            ...this.config,
            ...updates,
        });
    }

    /**
     * Obtener headers para las peticiones
     */
    public getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            ...this.config.defaultHeaders,
        };

        if (this.config.organization) {
            headers["OpenAI-Organization"] = this.config.organization;
        }

        return headers;
    }
}

export default OpenAIConfigManager;
