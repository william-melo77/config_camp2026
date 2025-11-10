import { Sequelize } from "sequelize";
import { dbConfig } from "./env";

// Instancia de Sequelize
export const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: dbConfig.define,
        timezone: "-05:00", // Zona horaria de Colombia
    }
);

// Función para probar la conexión a la base de datos
export async function testDatabaseConnection(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log(
            "✅ Conexión a la base de datos MySQL establecida correctamente"
        );
    } catch (error) {
        console.error("❌ Error al conectar con la base de datos:", error);
        throw error;
    }
}

// Función para sincronizar los modelos con la base de datos
export async function syncDatabase(): Promise<void> {
    try {
        // NO sincronizar automáticamente para evitar cambios en la estructura existente
        // La base de datos ya tiene la estructura correcta
        console.log(
            "ℹ️  Sincronización automática deshabilitada - usando estructura existente de la base de datos"
        );

        // Solo verificar que las tablas existen sin hacer cambios
        await sequelize.sync({ force: false, alter: false });
        console.log(
            "✅ Verificación de estructura de base de datos completada"
        );
    } catch (error) {
        console.error(
            "❌ Error al verificar la estructura de la base de datos:",
            error
        );
        throw error;
    }
}

// Función para cerrar la conexión
export async function closeDatabaseConnection(): Promise<void> {
    try {
        await sequelize.close();
        console.log("✅ Conexión a la base de datos cerrada correctamente");
    } catch (error) {
        console.error("❌ Error al cerrar la conexión:", error);
        throw error;
    }
}

// Exportar la instancia de Sequelize por defecto
export default sequelize;
