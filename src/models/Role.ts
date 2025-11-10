import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

// Atributos del modelo Role (coinciden con la tabla existente)
interface RoleAttributes {
  id: string; // CHAR(36) - UUID
  name: string; // VARCHAR(50)
  code: string; // VARCHAR(50) - único
  description: string | null; // VARCHAR(255) nullable
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Atributos opcionales al crear
interface RoleCreationAttributes
  extends Optional<
    RoleAttributes,
    "id" | "description" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public id!: string;
  public name!: string;
  public code!: string;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Obtener un rol por ID (campos visibles)
  static async findOneData(id: string) {
    return await Role.findOne({
      where: { id },
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  // Obtener todos los roles (opcional incluir eliminados)
  static async findAllData(includeInactive: boolean = false) {
    return await Role.findAll({
      paranoid: !includeInactive,
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  // Buscar por code
  static async findByCode(code: string) {
    return await Role.findOne({
      where: { code },
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  // Buscar por nombre
  static async findByName(name: string) {
    return await Role.findOne({
      where: { name },
      attributes: [
        "id",
        "name",
        "code",
        "description",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  // Actualizar un rol
  static async findByIdAndUpdate(id: string, body: Partial<RoleAttributes>) {
    return await Role.update(
      {
        name: body.name,
        code: body.code,
        description: body.description,
      },
      { where: { id } }
    );
  }

  // Crear un rol
  static async createRole(roleData: RoleCreationAttributes) {
    return await Role.create({
      name: roleData.name,
      code: roleData.code,
      description: roleData.description ?? null,
    });
  }

  // Soft delete
  static async deleteRole(id: string) {
    return await Role.destroy({ where: { id } });
  }
}

// Definición del modelo acorde a la tabla existente (camelCase timestamps)
Role.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE(3),
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
  },
  {
    sequelize,
    timestamps: true,
    paranoid: true, // usa deletedAt
    tableName: "roles",
    modelName: "Role",
    freezeTableName: true,
    underscored: false, // columnas camelCase como en la tabla
  }
);

export default Role;