import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface CampAttributes {
  id: string;
  name: string;
  code: string;
  theme: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  city: string;
  country: string;
  venue: string | null;
  maxAttendees: number | null;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
  status: "DRAFT" | "OPEN" | "CLOSED" | "FINISHED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface CampCreationAttributes
  extends Optional<
    CampAttributes,
    | "id"
    | "theme"
    | "description"
    | "venue"
    | "maxAttendees"
    | "registrationOpensAt"
    | "registrationClosesAt"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

class Camp extends Model<CampAttributes, CampCreationAttributes> implements CampAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public theme!: string | null;
  public description!: string | null;
  public startDate!: Date;
  public endDate!: Date;
  public city!: string;
  public country!: string;
  public venue!: string | null;
  public maxAttendees!: number | null;
  public registrationOpensAt!: Date | null;
  public registrationClosesAt!: Date | null;
  public status!: "DRAFT" | "OPEN" | "CLOSED" | "FINISHED" | "CANCELLED";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static async findOneData(id: string) {
    return await Camp.findOne({
      where: { id },
      attributes: [
        "id",
        "name",
        "code",
        "theme",
        "description",
        "startDate",
        "endDate",
        "city",
        "country",
        "venue",
        "maxAttendees",
        "registrationOpensAt",
        "registrationClosesAt",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  static async findAllData(includeInactive: boolean = false) {
    return await Camp.findAll({
      paranoid: !includeInactive,
      attributes: [
        "id",
        "name",
        "code",
        "theme",
        "description",
        "startDate",
        "endDate",
        "city",
        "country",
        "venue",
        "maxAttendees",
        "registrationOpensAt",
        "registrationClosesAt",
        "status",
        "createdAt",
        "updatedAt",
      ],
      order: [["startDate", "ASC"]],
    });
  }

  static async findByCode(code: string) {
    return await Camp.findOne({
      where: { code },
      attributes: [
        "id",
        "name",
        "code",
        "theme",
        "description",
        "startDate",
        "endDate",
        "city",
        "country",
        "venue",
        "maxAttendees",
        "registrationOpensAt",
        "registrationClosesAt",
        "status",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  static async findByIdAndUpdate(id: string, body: Partial<CampAttributes>) {
    return await Camp.update(
      {
        name: body.name,
        code: body.code,
        theme: body.theme ?? null,
        description: body.description ?? null,
        startDate: body.startDate,
        endDate: body.endDate,
        city: body.city,
        country: body.country ?? "Colombia",
        venue: body.venue ?? null,
        maxAttendees:
          typeof body.maxAttendees !== "undefined" ? body.maxAttendees : undefined,
        registrationOpensAt:
          typeof body.registrationOpensAt !== "undefined"
            ? body.registrationOpensAt
            : undefined,
        registrationClosesAt:
          typeof body.registrationClosesAt !== "undefined"
            ? body.registrationClosesAt
            : undefined,
        status: body.status,
      },
      { where: { id } }
    );
  }

  static async createCamp(data: CampCreationAttributes) {
    return await Camp.create({
      name: data.name,
      code: data.code,
      theme: data.theme ?? null,
      description: data.description ?? null,
      startDate: data.startDate,
      endDate: data.endDate,
      city: data.city,
      country: data.country ?? "Colombia",
      venue: data.venue ?? null,
      maxAttendees: typeof data.maxAttendees !== "undefined" ? data.maxAttendees : null,
      registrationOpensAt: data.registrationOpensAt ?? null,
      registrationClosesAt: data.registrationClosesAt ?? null,
      status: data.status ?? "DRAFT",
    });
  }

  static async deleteCamp(id: string) {
    return await Camp.destroy({ where: { id } });
  }
}

Camp.init(
  {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    theme: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Colombia",
    },
    venue: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    maxAttendees: {
      type: (DataTypes.INTEGER as any).UNSIGNED,
      allowNull: true,
    },
    registrationOpensAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
    registrationClosesAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "OPEN", "CLOSED", "FINISHED", "CANCELLED"),
      allowNull: false,
      defaultValue: "DRAFT",
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
    paranoid: true,
    tableName: "camps",
    modelName: "Camp",
    freezeTableName: true,
    underscored: false,
    indexes: [
      { unique: true, fields: ["code"], name: "ux_camps_code" },
      { unique: false, fields: ["status", "startDate", "endDate"], name: "ix_camps_status_dates" },
    ],
  }
);

export default Camp;