import { App } from "./app";
import { serverConfig } from "./config/env";

const PORT = serverConfig.port;
const HOST = serverConfig.host;

// Crear y configurar la aplicación
const appInstance = new App();
const app = appInstance.getApp();

// Función para inicializar el servidor
async function startServer(): Promise<void> {
    try {
        // Inicializar la base de datos
        await appInstance.initializeDatabase();

        // Iniciar el servidor
        const server = app.listen(PORT, () => {
            console.log("🚀 ========================================");
            console.log("⛪ Microservicio de Configuración");
            console.log("🏛️  Jóvenes con Un Próposito");
            console.log("🚀 ========================================");
            console.log(`🌐 Servidor ejecutándose en: http://${HOST}:${PORT}`);
            console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
            console.log(`📚 API Info: http://${HOST}:${PORT}/api`);
            console.log(`📚 API Docs: http://${HOST}:${PORT}/api/docs`);
            console.log("🚀 ========================================");
            console.log("📋 Endpoints disponibles:");
            console.log(
                "   GET  /                                - Información de la API"
            );
            console.log(
                "   GET  /health                          - Health check"
            );
            console.log(
                "   GET  /api                             - Información de endpoints"
            );
            console.log("🚀 ========================================");
            console.log(`🔧 Entorno: ${serverConfig.nodeEnv}`);
            console.log(
                `🗄️  Base de datos: MySQL (${process.env.MYSQL_DATABASE})`
            );
            console.log("🚀 ========================================");
        });

        // Manejo graceful de cierre del servidor
        process.on("SIGTERM", () => {
            console.log("🔄 SIGTERM recibido, cerrando servidor...");
            server.close(() => {
                console.log("✅ Servidor cerrado correctamente");
                process.exit(0);
            });
        });

        process.on("SIGINT", () => {
            console.log("\n🔄 SIGINT recibido, cerrando servidor...");
            server.close(() => {
                console.log("✅ Servidor cerrado correctamente");
                process.exit(0);
            });
        });
    } catch (error) {
        console.error("❌ Error al iniciar el servidor:", error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();

export default app;
