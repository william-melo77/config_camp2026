import { AIProvider } from "./base/AIProvider";
import { AIProviderType } from "./base/types";
import { OpenAIProvider } from "./openai/OpenAIProvider";
import { OpenAIProviderConfig } from "./openai/OpenAIConfig";
import { openaiConfig } from "../config/env";
import logger from "../utils/logger";

/**
 * Factory para crear y gestionar proveedores de IA
 * Implementa Singleton pattern para cada tipo de proveedor
 */
export class ProviderFactory {
    private static providers: Map<AIProviderType, AIProvider> = new Map();

    /**
     * Obtener o crear un proveedor específico
     */
    public static getProvider(
        type: AIProviderType = AIProviderType.OPENAI
    ): AIProvider | null {
        // Si ya existe, retornar la instancia
        if (this.providers.has(type)) {
            return this.providers.get(type)!;
        }

        // Crear nueva instancia según el tipo
        try {
            let provider: AIProvider | null = null;

            switch (type) {
                case AIProviderType.OPENAI:
                    provider = this.createOpenAIProvider();
                    break;
                // Futuro: Agregar más proveedores aquí
                // case AIProviderType.ANTHROPIC:
                //     provider = this.createAnthropicProvider();
                //     break;
                default:
                    logger.error(`Tipo de proveedor no soportado: ${type}`);
                    return null;
            }

            if (provider && provider.isReady()) {
                this.providers.set(type, provider);
                logger.info(
                    `Proveedor ${type} creado y registrado exitosamente`
                );
                return provider;
            }

            return null;
        } catch (error) {
            logger.error(`Error al crear proveedor ${type}`, {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }

    /**
     * Crear instancia de OpenAI Provider
     */
    private static createOpenAIProvider(): AIProvider | null {
        if (!openaiConfig.apiKey) {
            logger.warn(
                "OpenAI API Key no configurada. El proveedor OpenAI no estará disponible."
            );
            return null;
        }

        try {
            const config: Partial<OpenAIProviderConfig> = {
                apiKey: openaiConfig.apiKey,
                organization: openaiConfig.organization,
            };

            return OpenAIProvider.getInstance(config);
        } catch (error) {
            logger.error("Error al inicializar OpenAI Provider", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }

    /**
     * Verificar si un proveedor está disponible
     */
    public static isProviderAvailable(type: AIProviderType): boolean {
        const provider = this.getProvider(type);
        return provider !== null && provider.isReady();
    }

    /**
     * Obtener proveedor por defecto (OpenAI)
     */
    public static getDefaultProvider(): AIProvider | null {
        return this.getProvider(AIProviderType.OPENAI);
    }

    /**
     * Listar proveedores disponibles
     */
    public static getAvailableProviders(): AIProviderType[] {
        const available: AIProviderType[] = [];

        for (const type of Object.values(AIProviderType)) {
            if (this.isProviderAvailable(type)) {
                available.push(type);
            }
        }

        return available;
    }

    /**
     * Resetear todos los proveedores (útil para testing)
     */
    public static resetAll(): void {
        this.providers.clear();
        OpenAIProvider.resetInstance();
        logger.info("Todos los proveedores han sido reseteados");
    }

    /**
     * Obtener información de todos los proveedores
     */
    public static getProvidersInfo(): Record<string, any> {
        const info: Record<string, any> = {};

        for (const [type, provider] of this.providers.entries()) {
            info[type] = {
                name: provider.getProviderName(),
                isReady: provider.isReady(),
            };
        }

        return info;
    }
}

export default ProviderFactory;

