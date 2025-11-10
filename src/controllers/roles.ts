import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import Role from "../models/Role";
import ResponseHandler from "../utils/responseHandler";
import logger from "../utils/logger";
import { AppError } from "../utils/handleError";

// Extiende Request para agregar metadatos comunes
interface ExtendedRequest extends Request {
  user?: any;
  requestId?: string;
}

export const getRoles = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = matchedData(req, { locations: ["query"] }) as {
      includeInactive?: boolean;
    };
    const includeInactive = Boolean(data.includeInactive);
    const roles = await Role.findAllData(includeInactive);

    logger.info("Roles list retrieved", {
      requestId: req.requestId,
      count: roles.length,
      includeInactive,
    });

    ResponseHandler.success(
      res,
      { roles, total: roles.length },
      "Roles obtenidos exitosamente"
    );
  } catch (error) {
    logger.error("Error fetching roles", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export const getRole = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
    const role = await Role.findOneData(id);
    if (!role) {
      throw new AppError("Rol no encontrado", 404);
    }

    logger.info("Role retrieved", { requestId: req.requestId, id });

    ResponseHandler.success(res, { role }, "Rol obtenido exitosamente");
  } catch (error) {
    logger.error("Error fetching role", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export const getRoleByCode = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { code } = matchedData(req, { locations: ["params"] }) as { code: string };
    const role = await Role.findByCode(code);
    if (!role) {
      throw new AppError("Rol no encontrado", 404);
    }

    logger.info("Role retrieved by code", { requestId: req.requestId, code });

    ResponseHandler.success(res, { role }, "Rol obtenido exitosamente");
  } catch (error) {
    logger.error("Error fetching role by code", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export const createRole = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = matchedData(req, { locations: ["body"] }) as {
      name: string;
      code: string;
      description?: string | null;
    };

    const existing = await Role.findByCode(body.code);
    if (existing) {
      throw new AppError("El code ya existe para otro rol", 409);
    }

    const created = await Role.createRole({
      name: body.name,
      code: body.code,
      description: body.description ?? null,
    });

    logger.info("Role created", { requestId: req.requestId, id: created.id });

    ResponseHandler.created(res, { role: created }, "Rol creado exitosamente");
  } catch (error) {
    logger.error("Error creating role", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export const updateRole = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
    const body = matchedData(req, { locations: ["body"] }) as {
      name?: string;
      code?: string;
      description?: string | null;
    };

    const current = await Role.findOneData(id);
    if (!current) {
      throw new AppError("Rol no encontrado", 404);
    }

    if (body.code) {
      const existsCode = await Role.findByCode(body.code);
      if (existsCode && existsCode.id !== id) {
        throw new AppError("El code ya está en uso por otro rol", 409);
      }
    }

    await Role.findByIdAndUpdate(id, body);
    const updated = await Role.findOneData(id);

    logger.info("Role updated", { requestId: req.requestId, id });

    ResponseHandler.success(res, { role: updated }, "Rol actualizado exitosamente");
  } catch (error) {
    logger.error("Error updating role", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export const deleteRole = async (
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
    const current = await Role.findOneData(id);
    if (!current) {
      throw new AppError("Rol no encontrado", 404);
    }

    await Role.deleteRole(id);

    logger.info("Role deleted", { requestId: req.requestId, id });

    ResponseHandler.success(
      res,
      { id, deleted: true },
      "Rol eliminado exitosamente"
    );
  } catch (error) {
    logger.error("Error deleting role", {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

export default {
  getRoles,
  getRole,
  getRoleByCode,
  createRole,
  updateRole,
  deleteRole,
};