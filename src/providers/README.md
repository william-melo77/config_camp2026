# 🔌 Providers - Sistema de Integración con APIs de IA

Sistema profesional para integrar múltiples proveedores de IA con arquitectura desacoplada.

---

## 🚀 Uso Rápido

### Obtener Provider

```typescript
import { ProviderFactory, AIProviderType } from "./providers";

// Obtener OpenAI provider
const provider = ProviderFactory.getProvider(AIProviderType.OPENAI);

if (provider && provider.isReady()) {
    // Provider disponible y listo para usar
    const vectorStore = await provider.createVectorStore({
        name: "Mi Vector Store",
    });
}
```

### Verificar Disponibilidad

```typescript
import { ProviderFactory, AIProviderType } from "./providers";

// Verificar si OpenAI está configurado
if (ProviderFactory.isProviderAvailable(AIProviderType.OPENAI)) {
    console.log("✅ OpenAI disponible");
}

// Listar todos los proveedores disponibles
const available = ProviderFactory.getAvailableProviders();
console.log("Proveedores:", available); // ["openai"]
```

---

## 📁 Estructura

```
providers/
├── base/                  # Clases e interfaces base
│   ├── AIProvider.ts     # Clase abstracta
│   └── types.ts          # Tipos compartidos
│
├── openai/               # Implementación OpenAI
│   ├── OpenAIProvider.ts    # Provider principal
│   ├── OpenAIConfig.ts      # Configuración
│   └── OpenAIErrors.ts      # Errores personalizados
│
├── ProviderFactory.ts    # Factory para crear providers
└── index.ts              # Exportaciones públicas
```

---

## 🎨 Agregar Nuevo Proveedor

### Ejemplo: Anthropic

**1. Crear archivos:**

```
providers/
└── anthropic/
    ├── AnthropicProvider.ts
    ├── AnthropicConfig.ts
    └── AnthropicErrors.ts
```

**2. Implementar clase:**

```typescript
// anthropic/AnthropicProvider.ts
import { AIProvider } from "../base/AIProvider";

export class AnthropicProvider extends AIProvider {
    private static instance: AnthropicProvider | null = null;

    private constructor(config) {
        super(config, "Anthropic");
        // Inicialización
    }

    public static getInstance(config?) {
        if (!this.instance && config) {
            this.instance = new AnthropicProvider(config);
        }
        return this.instance;
    }

    // Implementar métodos abstractos
    async createVectorStore(params) {
        // Lógica de Anthropic
    }
}
```

**3. Registrar en Factory:**

```typescript
// ProviderFactory.ts
import { AnthropicProvider } from "./anthropic/AnthropicProvider";

// En AIProviderType enum (types.ts)
export enum AIProviderType {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",  // ✅ Agregar
}

// En ProviderFactory
case AIProviderType.ANTHROPIC:
  provider = this.createAnthropicProvider();
  break;

private static createAnthropicProvider() {
  return AnthropicProvider.getInstance({
    apiKey: env.ANTHROPIC_API_KEY
  });
}
```

**4. Usar:**

```typescript
const provider = ProviderFactory.getProvider(AIProviderType.ANTHROPIC);
```

---

## 🛡️ Manejo de Errores

### Errores Tipados

```typescript
import {
  OpenAIError,
  OpenAIAuthenticationError,
  OpenAIRateLimitError,
  OpenAIQuotaError
} from "./providers";

try {
  await provider.createVectorStore({...});
} catch (error) {
  if (error instanceof OpenAIAuthenticationError) {
    // API Key inválida
    console.error("Verifica tu API Key");
  } else if (error instanceof OpenAIRateLimitError) {
    // Rate limit
    console.error("Demasiadas peticiones");
  } else if (error instanceof OpenAIQuotaError) {
    // Sin créditos
    console.error("Agrega créditos a tu cuenta");
  }
}
```

---

## 🔍 Logging

Todos los providers incluyen logging automático:

```typescript
// Esto se registra automáticamente:
const vs = await provider.createVectorStore({...});

// Log generado:
{
  "level": "info",
  "message": "Creando vector store en OpenAI",
  "provider": "OpenAI",
  "name": "Mi Vector Store",
  "timestamp": "2025-10-21..."
}
```

---

## 🧪 Testing

### Resetear Providers

```typescript
import { ProviderFactory } from "./providers";

// Antes de cada test
beforeEach(() => {
    ProviderFactory.resetAll();
});
```

### Mock Provider

```typescript
import { AIProvider } from "./providers/base/AIProvider";

class MockProvider extends AIProvider {
    async createVectorStore(params) {
        return {
            id: "mock-vs-123",
            name: params.name,
            status: "ready",
        };
    }

    // ... implementar otros métodos
}
```

---

## 📖 Métodos Disponibles

### AIProvider (Base - Todos los Providers)

```typescript
// Métodos abstractos (implementados por cada provider)
createVectorStore(params)
getVectorStore(id)
updateVectorStore(id, params)
deleteVectorStore(id)
listVectorStoreFiles(vectorStoreId)
addFileToVectorStore(params)
removeFileFromVectorStore(vectorStoreId, fileId)

// Métodos de utilidad
isReady(): boolean
getProviderName(): string
```

### OpenAIProvider (Específico)

```typescript
// Métodos adicionales de OpenAI
listVectorStores(limit, after);
uploadFile(file, filename, purpose);
createVectorStoreFileBatch(vectorStoreId, fileIds);
getVectorStoreFileBatch(vectorStoreId, batchId);
cancelVectorStoreFileBatch(vectorStoreId, batchId);
healthCheck();
getConfigInfo();
```

---

## 💡 Mejores Prácticas

### 1. Siempre Verificar Disponibilidad

```typescript
const provider = ProviderFactory.getProvider(AIProviderType.OPENAI);

if (!provider || !provider.isReady()) {
    throw new Error("Provider no disponible");
}

// Usar provider...
```

### 2. Manejar Errores Específicos

```typescript
try {
  await provider.createVectorStore({...});
} catch (error) {
  if (error instanceof OpenAIQuotaError) {
    // Notificar al admin: sin créditos
  } else if (error instanceof OpenAIRateLimitError) {
    // Implementar retry con backoff
  } else {
    // Error genérico
  }
}
```

### 3. Usar Factory, No Instancias Directas

```typescript
// ✅ CORRECTO
const provider = ProviderFactory.getProvider(AIProviderType.OPENAI);

// ❌ INCORRECTO
const provider = OpenAIProvider.getInstance(config);
```

### 4. Aprovechar Retry Automático

El provider ya hace retry, no necesitas implementarlo:

```typescript
// Esto ya incluye retry automático (hasta 3 intentos)
const vs = await provider.createVectorStore({...});
```

---

## 🔐 Seguridad

### API Keys

-   ✅ **Nunca** loguees la API Key completa
-   ✅ Usa `getMaskedApiKey()` para logs
-   ✅ Guarda en variables de entorno
-   ✅ No commitees `.env`

### Validación

-   ✅ Config Manager valida formato de API Key
-   ✅ Valida configuración antes de usar
-   ✅ Errores claros si falta configuración

---

## 📞 Soporte

-   📖 Ver documentación completa en `/configuracion/`
-   🐛 Reportar bugs en GitHub Issues
-   💬 Preguntas: Revisa los archivos de documentación

---

**Última actualización:** 21 de Octubre, 2025

