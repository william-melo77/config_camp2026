import { Request, Response, NextFunction } from "express";
import { check } from "express-validator";
import validateResults from "../utils/handleValidator";

export const validatorCreateCampAttendee = [
  check("firstName")
    .exists({ checkFalsy: true })
    .withMessage("firstName es requerido")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("firstName no debe estar vacío")
    .isLength({ max: 100 })
    .withMessage("firstName debe tener máximo 100 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("firstName solo debe contener letras y espacios (sin números ni símbolos)"),
  check("lastName")
    .exists({ checkFalsy: true })
    .withMessage("lastName es requerido")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("lastName no debe estar vacío")
    .isLength({ max: 100 })
    .withMessage("lastName debe tener máximo 100 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("lastName solo debe contener letras y espacios (sin números ni símbolos)"),
  check("gender")
    .optional({ nullable: true })
    .isIn(["M", "F"]) 
    .withMessage("gender debe ser M o F"),
  check("identificationType")
    .exists({ checkFalsy: true })
    .withMessage("identificationType es requerido")
    .isIn(["CC", "PP", "TI"]) 
    .withMessage("identificationType debe ser CC, PP o TI"),
  check("identificationNumber")
    .exists({ checkFalsy: true })
    .withMessage("identificationNumber es requerido")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("identificationNumber no debe estar vacío")
    .custom((value, { req }) => {
      const type = req.body?.identificationType;
      if (type === "PP") {
        if (!/^[A-Za-z0-9]{1,10}$/.test(value)) {
          throw new Error(
            "identificationNumber para pasaporte (PP) debe ser alfanumérico (letras y números), máximo 10"
          );
        }
      } else {
        if (!/^\d{1,10}$/.test(value)) {
          throw new Error(
            "identificationNumber para CC/TI debe contener solo números, máximo 10"
          );
        }
      }
      return true;
    }),
  check("age")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 255 })
    .withMessage("age debe ser un entero entre 0 y 255")
    .toInt(),
  check("birthDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("birthDate debe ser una fecha válida (YYYY-MM-DD)")
    .toDate(),
  check("city")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("city debe tener máximo 100 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("city solo debe contener letras y espacios"),
  check("country")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("country debe tener máximo 50 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("country solo debe contener letras"),
  check("churchPastor")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 150 })
    .withMessage("churchPastor debe tener máximo 150 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("churchPastor solo debe contener letras y espacios"),
  check("phone")
    .optional({ nullable: true })
    .isString()
    .trim()
    .matches(/^\+?\d{1,15}$/)
    .withMessage("phone debe contener solo números, opcional '+' al inicio, máximo 15 dígitos"),
  check("email")
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .withMessage("email debe ser válido")
    .normalizeEmail(),
  check("password")
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 6, max: 255 })
    .withMessage("password debe tener entre 6 y 255 caracteres"),
  check("isActive")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("isActive debe ser boolean")
    .toBoolean(),
  check("skills")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("skills debe tener máximo 1000 caracteres"),
  check("allergies")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("allergies debe tener máximo 1000 caracteres"),
  check("shirtSize")
    .optional({ nullable: true })
    .isIn(["XS", "S", "M", "L", "XL"]) 
    .withMessage("shirtSize debe ser XS, S, M, L o XL"),
  check("roleId")
    .exists({ checkFalsy: true })
    .withMessage("roleId es requerido")
    .isUUID()
    .withMessage("roleId debe ser un UUID válido"),
  check("assistantSubRole")
    .optional({ nullable: true })
    .isIn(["NONE", "MONITOR", "GROUP_LEADER"]) 
    .withMessage(
      "assistantSubRole debe ser NONE, MONITOR o GROUP_LEADER"
    ),
  // Opcionales de documento R2
  check("documentKey")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 512 })
    .withMessage("documentKey debe tener máximo 512 caracteres"),
  check("mimeType")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("mimeType debe tener máximo 100 caracteres")
    .matches(/^[a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+$/)
    .withMessage("mimeType debe tener formato tipo/subtipo, ej: application/pdf"),
  check("bucket")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage("bucket debe tener máximo 255 caracteres")
    .matches(/^[A-Za-z0-9._-]+$/)
    .withMessage("bucket solo puede contener letras, números, punto, guion y guion bajo"),
  // Nuevos campos controlados por backend:
  // registrationStatus opcional en create; si viene, validar valores permitidos
  check("registrationStatus")
    .optional({ nullable: true })
    .isIn(["PENDING_PAYMENT", "PAID", "CONFIRMED", "CANCELLED", "WAITING_LIST"])
    .withMessage("registrationStatus debe ser PENDING_PAYMENT, PAID, CONFIRMED, CANCELLED o WAITING_LIST"),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

export const validatorUpdateCampAttendee = [
  check("firstName")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("firstName no debe estar vacío")
    .isLength({ max: 100 })
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("firstName solo debe contener letras y espacios (sin números ni símbolos)"),
  check("lastName")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("lastName no debe estar vacío")
    .isLength({ max: 100 })
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("lastName solo debe contener letras y espacios (sin números ni símbolos)"),
  check("gender")
    .optional({ nullable: true })
    .isIn(["M", "F"]),
  check("identificationType")
    .optional({ nullable: true })
    .isIn(["CC", "PP", "TI"]),
  check("identificationNumber")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("identificationNumber no debe estar vacío")
    .custom((value, { req }) => {
      const type = req.body?.identificationType; // si no viene, asumimos regla de CC/TI por seguridad
      if (type === "PP") {
        if (!/^[A-Za-z0-9]{1,10}$/.test(value)) {
          throw new Error(
            "identificationNumber para pasaporte (PP) debe ser alfanumérico (letras y números), máximo 10"
          );
        }
      } else {
        if (!/^\d{1,10}$/.test(value)) {
          throw new Error(
            "identificationNumber para CC/TI debe contener solo números, máximo 10"
          );
        }
      }
      return true;
    }),
  check("age")
    .optional({ nullable: true })
    .isInt({ min: 0, max: 255 })
    .toInt(),
  check("birthDate")
    .optional({ nullable: true })
    .isISO8601()
    .toDate(),
  check("city")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("city no debe estar vacío")
    .isLength({ max: 100 })
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("city solo debe contener letras y espacios"),
  check("country")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("country no debe estar vacío")
    .isLength({ max: 50 })
    .withMessage("country debe tener máximo 50 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("country solo debe contener letras"),
  check("churchPastor")
    .optional({ nullable: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage("churchPastor no debe estar vacío")
    .isLength({ max: 150 })
    .matches(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/)
    .withMessage("churchPastor solo debe contener letras y espacios"),
  check("phone")
    .optional({ nullable: true })
    .isString()
    .trim()
    .matches(/^\+?\d{1,15}$/)
    .withMessage("phone debe contener solo números, opcional '+' al inicio, máximo 15 dígitos"),
  check("email")
    .optional({ nullable: true })
    .trim()
    .isEmail()
    .normalizeEmail(),
  check("isActive")
    .optional({ nullable: true })
    .isBoolean()
    .withMessage("isActive debe ser boolean")
    .toBoolean(),
  check("skills")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("skills debe tener máximo 1000 caracteres"),
  check("allergies")
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("allergies debe tener máximo 1000 caracteres"),
  check("shirtSize")
    .optional({ nullable: true })
    .isIn(["XS", "S", "M", "L", "XL"]),
  check("roleId")
    .optional({ nullable: true })
    .isUUID(),
  check("assistantSubRole")
    .optional({ nullable: true })
    .isIn(["NONE", "MONITOR", "GROUP_LEADER"]),
  // Opcionales de documento R2
  check("documentKey")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 512 }),
  check("mimeType")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .matches(/^[a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+$/),
  check("bucket")
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 255 })
    .matches(/^[A-Za-z0-9._-]+$/),
  // Nuevos campos editables: permitir actualizar registrationStatus
  check("registrationStatus")
    .optional({ nullable: true })
    .isIn(["PENDING_PAYMENT", "PAID", "CONFIRMED", "CANCELLED", "WAITING_LIST"]),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

export const validatorGetCampAttendee = [
  check("id")
    .exists({ checkFalsy: true })
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

export const validatorQueryCampAttendees = [
  check("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive debe ser boolean")
    .toBoolean(),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

// Activar/desactivar asistente
export const validatorActivationStatus = [
  check("id")
    .exists({ checkFalsy: true })
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),
  check("isActive")
    .exists()
    .withMessage("isActive es requerido (puede ser true o false)")
    .isBoolean()
    .withMessage("isActive debe ser boolean")
    .toBoolean(),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

// Cambiar contraseña
export const validatorChangePassword = [
  check("id")
    .exists({ checkFalsy: true })
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),
  check("currentPassword")
    .exists({ checkFalsy: true })
    .withMessage("currentPassword es requerido")
    .isString()
    .isLength({ min: 6, max: 255 })
    .withMessage("currentPassword debe tener entre 6 y 255 caracteres"),
  check("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("newPassword es requerido")
    .isString()
    .isLength({ min: 6, max: 255 })
    .withMessage("newPassword debe tener entre 6 y 255 caracteres"),
  check("confirmPassword")
    .exists({ checkFalsy: true })
    .withMessage("confirmPassword es requerido")
    .isString()
    .isLength({ min: 6, max: 255 })
    .withMessage("confirmPassword debe tener entre 6 y 255 caracteres"),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

// Verificación de existencia por email (query param)
export const validatorCheckEmailUnique = [
  check("email")
    .exists({ checkFalsy: true })
    .withMessage("email es requerido")
    .trim()
    .isEmail()
    .withMessage("email debe ser válido")
    .normalizeEmail(),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];

// Verificación de existencia por identificationNumber (query param)
export const validatorCheckIdentificationUnique = [
  check("identificationNumber")
    .exists({ checkFalsy: true })
    .withMessage("identificationNumber es requerido")
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage("identificationNumber debe tener máximo 10 caracteres")
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage(
      "identificationNumber solo puede contener letras y números (máximo 10)"
    ),
  (req: Request, res: Response, next: NextFunction) => {
    return validateResults(req, res, next);
  },
];