import { check } from "express-validator";
import { Request, Response, NextFunction } from "express";
import validateResults from "../utils/handleValidator";

// Validar creación de rol
export const validatorCreateRole = [
  check("name")
    .exists({ checkFalsy: true })
    .withMessage("name es requerido")
    .isString()
    .withMessage("name debe ser string")
    .isLength({ min: 2, max: 50 })
    .withMessage("name debe tener entre 2 y 50 caracteres")
    .trim(),

  check("code")
    .exists({ checkFalsy: true })
    .withMessage("code es requerido")
    .isString()
    .withMessage("code debe ser string")
    .isLength({ min: 2, max: 50 })
    .withMessage("code debe tener entre 2 y 50 caracteres")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("code solo puede contener letras, números, guiones y guion bajo")
    .trim(),

  check("description")
    .optional()
    .isString()
    .withMessage("description debe ser string")
    .isLength({ max: 255 })
    .withMessage("description no debe superar 255 caracteres")
    .trim(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next),
];

// Validar actualización de rol
export const validatorUpdateRole = [
  check("name")
    .optional()
    .isString()
    .withMessage("name debe ser string")
    .isLength({ min: 2, max: 50 })
    .withMessage("name debe tener entre 2 y 50 caracteres")
    .trim(),

  check("code")
    .optional()
    .isString()
    .withMessage("code debe ser string")
    .isLength({ min: 2, max: 50 })
    .withMessage("code debe tener entre 2 y 50 caracteres")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("code solo puede contener letras, números, guiones y guion bajo")
    .trim(),

  check("description")
    .optional()
    .isString()
    .withMessage("description debe ser string")
    .isLength({ max: 255 })
    .withMessage("description no debe superar 255 caracteres")
    .trim(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next),
];

// Validar obtención por ID (UUID)
export const validatorGetRole = [
  check("id")
    .exists({ checkFalsy: true })
    .withMessage("id es requerido")
    .isUUID()
    .withMessage("id debe ser un UUID válido"),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next),
];

// Validar obtención por code
export const validatorGetRoleByCode = [
  check("code")
    .exists({ checkFalsy: true })
    .withMessage("code es requerido")
    .isString()
    .withMessage("code debe ser string")
    .isLength({ min: 2, max: 50 })
    .withMessage("code debe tener entre 2 y 50 caracteres")
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage("code solo puede contener letras, números, guiones y guion bajo")
    .trim(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next),
];

// Validar query de listado
export const validatorQueryRoles = [
  check("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive debe ser boolean")
    .toBoolean(),

  (req: Request, res: Response, next: NextFunction) => validateResults(req, res, next),
];