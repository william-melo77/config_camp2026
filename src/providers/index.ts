/**
 * Exportaciones centralizadas de providers
 */

// Base
export * from "./base/types";
export { AIProvider } from "./base/AIProvider";

// OpenAI
export { OpenAIProvider } from "./openai/OpenAIProvider";
export { OpenAIConfigManager } from "./openai/OpenAIConfig";
export type { OpenAIProviderConfig } from "./openai/OpenAIConfig";
export * from "./openai/OpenAIErrors";

// Factory
export { ProviderFactory } from "./ProviderFactory";
import { ProviderFactory } from "./ProviderFactory";

// Storage providers
export * from "./storage/types";
export { StorageProvider } from "./storage/StorageProvider";
export { StorageProviderFactory } from "./StorageProviderFactory";
export { R2Provider } from "./r2/R2Provider";

export default ProviderFactory;
