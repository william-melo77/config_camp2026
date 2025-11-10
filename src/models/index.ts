// Importar todos los modelos
import Role from "./Role";
import CampAttendee from "./CampAttendee";
import Camp from "./Camp";

// Crear objeto de modelos
const models = {
    Role,
    CampAttendee,
    Camp,
};

// Asociaciones
Role.hasMany(CampAttendee, { foreignKey: "roleId", as: "attendees" });
CampAttendee.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Camp.hasMany(CampAttendee, { foreignKey: "campId", as: "attendees" });
CampAttendee.belongsTo(Camp, { foreignKey: "campId", as: "camp" });

// Exportar tanto como default como named exports
export default models;

// Named exports para compatibilidad
export const { Role: RoleModel, CampAttendee: CampAttendeeModel, Camp: CampModel } = models;
