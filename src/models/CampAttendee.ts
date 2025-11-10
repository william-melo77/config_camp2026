import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Role from "./Role";

// Atributos del modelo CampAttendee (según la tabla camp_attendees)
interface CampAttendeeAttributes {
    id: string; // CHAR(36)
    firstName: string; // VARCHAR(100)
    lastName: string; // VARCHAR(100)
    gender: "M" | "F" | null; // ENUM('M','F')
    identificationType: "CC" | "PP" | "TI"; // ENUM
    identificationNumber: string; // VARCHAR(10)
    campId: string; // CHAR(36)
    emailVerifiedAt: Date | null; // DATETIME(3)
    mustChangePassword: boolean; // TINYINT(1) -> BOOLEAN
    registrationStatus: "PENDING_PAYMENT" | "PAID" | "CONFIRMED" | "CANCELLED" | "WAITING_LIST"; // ENUM
    age: number | null; // TINYINT(3) UNSIGNED
    birthDate: Date | null; // DATE
    country: string | null; // VARCHAR(50)
    city: string | null; // VARCHAR(100)
    churchPastor: string | null; // VARCHAR(150)
    phone: string | null; // VARCHAR(20)
    email: string | null; // VARCHAR(255)
    passwordHash: string | null; // VARCHAR(255)
    skills: string | null; // TEXT
    allergies: string | null; // TEXT
    shirtSize: "XS" | "S" | "M" | "L" | "XL" | null; // ENUM
    roleId: string; // CHAR(36)
    assistantSubRole: "NONE" | "MONITOR" | "GROUP_LEADER"; // ENUM
    isActive: boolean; // TINYINT(1) -> BOOLEAN
    documentKey: string | null; // VARCHAR(512) - referencia R2
    mimeType: string | null; // VARCHAR(100) - tipo de contenido
    bucket: string | null; // VARCHAR(255) - bucket origen
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

// Atributos opcionales al crear
interface CampAttendeeCreationAttributes
    extends Optional<
        CampAttendeeAttributes,
        | "id"
        | "gender"
        | "age"
        | "birthDate"
        | "country"
        | "city"
        | "churchPastor"
        | "phone"
        | "email"
        | "emailVerifiedAt"
        | "mustChangePassword"
        | "registrationStatus"
        | "passwordHash"
        | "skills"
        | "allergies"
        | "shirtSize"
        | "assistantSubRole"
        | "isActive"
        | "documentKey"
        | "mimeType"
        | "bucket"
        | "createdAt"
        | "updatedAt"
        | "deletedAt"
    > {}

class CampAttendee
    extends Model<CampAttendeeAttributes, CampAttendeeCreationAttributes>
    implements CampAttendeeAttributes
{
    public id!: string;
    public firstName!: string;
    public lastName!: string;
    public gender!: "M" | "F" | null;
    public identificationType!: "CC" | "PP" | "TI";
    public identificationNumber!: string;
    public campId!: string;
    public emailVerifiedAt!: Date | null;
    public mustChangePassword!: boolean;
    public registrationStatus!: "PENDING_PAYMENT" | "PAID" | "CONFIRMED" | "CANCELLED" | "WAITING_LIST";
    public age!: number | null;
    public birthDate!: Date | null;
    public country!: string | null;
    public city!: string | null;
    public churchPastor!: string | null;
    public phone!: string | null;
    public email!: string | null;
    public passwordHash!: string | null;
    public skills!: string | null;
    public allergies!: string | null;
    public shirtSize!: "XS" | "S" | "M" | "L" | "XL" | null;
    public roleId!: string;
    public assistantSubRole!: "NONE" | "MONITOR" | "GROUP_LEADER";
    public isActive!: boolean;
    public documentKey!: string | null;
    public mimeType!: string | null;
    public bucket!: string | null;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date | null;

    // Obtener un asistente por ID (con rol)
    static async findOneData(id: string) {
        return await CampAttendee.findOne({
            where: { id },
            attributes: [
                "id",
                "firstName",
                "lastName",
                "gender",
                "identificationType",
                "identificationNumber",
                "campId",
                "emailVerifiedAt",
                "mustChangePassword",
                "registrationStatus",
                "age",
                "birthDate",
                "country",
                "city",
                "churchPastor",
                "phone",
                "email",
                // passwordHash NO se expone
                "skills",
                "allergies",
                "shirtSize",
                "roleId",
                "assistantSubRole",
                "isActive",
                "documentKey",
                "mimeType",
                "bucket",
                "createdAt",
                "updatedAt",
            ],
            include: [
                {
                    model: Role,
                    as: "role",
                    attributes: ["id", "name", "code"],
                },
            ],
        });
    }

    // Obtener todos los asistentes (opcional incluir eliminados)
    static async findAllData(includeInactive: boolean = false) {
        return await CampAttendee.findAll({
            paranoid: !includeInactive,
            attributes: [
                "id",
                "firstName",
                "lastName",
                "gender",
                "identificationType",
                "identificationNumber",
                "campId",
                "emailVerifiedAt",
                "mustChangePassword",
                "registrationStatus",
                "age",
                "birthDate",
                "country",
                "city",
                "churchPastor",
                "phone",
                "email",
                // passwordHash NO se expone
                "skills",
                "allergies",
                "shirtSize",
                "roleId",
                "assistantSubRole",
                "isActive",
                "documentKey",
                "mimeType",
                "bucket",
                "createdAt",
                "updatedAt",
            ],
            include: [
                {
                    model: Role,
                    as: "role",
                    attributes: ["id", "name", "code"],
                },
            ],
        });
    }

    // Actualizar por ID
    static async findByIdAndUpdate(
        id: string,
        body: Partial<CampAttendeeAttributes>
    ) {
        return await CampAttendee.update(
            {
                firstName: body.firstName,
                lastName: body.lastName,
                gender: body.gender ?? null,
                identificationType: body.identificationType,
                identificationNumber: body.identificationNumber,
                campId: body.campId,
                registrationStatus: body.registrationStatus,
                age: body.age ?? null,
                birthDate: body.birthDate ?? null,
                country: body.country ?? null,
                city: body.city ?? null,
                churchPastor: body.churchPastor ?? null,
                phone: body.phone ?? null,
                email: body.email ?? null,
                // No sobrescribir passwordHash a null si no viene en el body
                passwordHash:
                    typeof body.passwordHash !== "undefined"
                        ? body.passwordHash
                        : undefined,
                skills: body.skills ?? null,
                allergies: body.allergies ?? null,
                shirtSize: body.shirtSize ?? null,
                roleId: body.roleId,
                assistantSubRole: body.assistantSubRole ?? "NONE",
                documentKey: body.documentKey ?? null,
                mimeType: body.mimeType ?? null,
                bucket: body.bucket ?? null,
                isActive:
                    typeof body.isActive === "boolean"
                        ? body.isActive
                        : undefined,
            },
            { where: { id } }
        );
    }

    // Crear un asistente
    static async createCampAttendee(data: CampAttendeeCreationAttributes) {
        return await CampAttendee.create({
            firstName: data.firstName,
            lastName: data.lastName,
            gender: (data as any).gender ?? null,
            identificationType: data.identificationType,
            identificationNumber: data.identificationNumber,
            campId: (data as any).campId,
            emailVerifiedAt: null,
            mustChangePassword: true,
            registrationStatus: (data as any).registrationStatus ?? "PENDING_PAYMENT",
            age: data.age ?? null,
            birthDate: data.birthDate ?? null,
            country: data.country ?? null,
            city: data.city ?? null,
            churchPastor: data.churchPastor ?? null,
            phone: data.phone ?? null,
            email: data.email ?? null,
            // Persistir hash de contraseña (si el controlador lo calculó)
            passwordHash: data.passwordHash ?? null,
            skills: data.skills ?? null,
            allergies: data.allergies ?? null,
            shirtSize: data.shirtSize ?? null,
            roleId: data.roleId,
            assistantSubRole: data.assistantSubRole ?? "NONE",
            documentKey: (data as any).documentKey ?? null,
            mimeType: (data as any).mimeType ?? null,
            bucket: (data as any).bucket ?? "jovenesconunproposito",
            isActive: (data as any).isActive ?? false,
        });
    }

    // Soft delete
    static async deleteCampAttendee(id: string) {
        return await CampAttendee.destroy({ where: { id } });
    }
}

// Definición del modelo acorde a la tabla existente (camelCase timestamps)
CampAttendee.init(
    {
        id: {
            type: DataTypes.CHAR(36),
            primaryKey: true,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
        },
        firstName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        lastName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        gender: {
            type: DataTypes.ENUM("M", "F"),
            allowNull: true,
        },
        identificationType: {
            type: DataTypes.ENUM("CC", "PP", "TI"),
            allowNull: false,
        },
        identificationNumber: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        campId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        emailVerifiedAt: {
            type: DataTypes.DATE(3),
            allowNull: true,
            defaultValue: null,
        },
        mustChangePassword: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        registrationStatus: {
            type: DataTypes.ENUM("PENDING_PAYMENT", "PAID", "CONFIRMED", "CANCELLED", "WAITING_LIST"),
            allowNull: false,
            defaultValue: "PENDING_PAYMENT",
        },
        age: {
            type: (DataTypes.TINYINT as any).UNSIGNED,
            allowNull: true,
        },
        birthDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        country: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        churchPastor: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        skills: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        allergies: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        shirtSize: {
            type: DataTypes.ENUM("XS", "S", "M", "L", "XL"),
            allowNull: true,
        },
        roleId: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        assistantSubRole: {
            type: DataTypes.ENUM("NONE", "MONITOR", "GROUP_LEADER"),
            allowNull: false,
            defaultValue: "NONE",
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        documentKey: {
            type: DataTypes.STRING(512),
            allowNull: true,
        },
        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        bucket: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: "jovenesconunproposito",
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
        tableName: "camp_attendees",
        modelName: "CampAttendee",
        freezeTableName: true,
        underscored: false,
    }
);

export default CampAttendee;
