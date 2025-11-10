import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import Camp from "../models/Camp";
import logger from "../utils/logger";
import ResponseHandler from "../utils/responseHandler";
import { AppError } from "../utils/handleError";

interface ExtendedRequest extends Request {
  requestId?: string;
  user?: { id: string; email?: string };
}

const campsController = {
  async getCamps(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const camps = await Camp.findAllData();
      const total = camps.length;
      logger.info("Camps list fetched", { requestId: req.requestId, total });
      return ResponseHandler.success(
        res,
        { camps, total },
        "Lista de camps obtenida exitosamente"
      );
    } catch (error) {
      logger.error("Error fetching camps", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async getCamp(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const camp = await Camp.findOneData(id);
      if (!camp) {
        throw new AppError("Camp no encontrado", 404);
      }
      logger.info("Camp fetched", { requestId: req.requestId, id });
      return ResponseHandler.success(res, { camp }, "Camp obtenido exitosamente");
    } catch (error) {
      logger.error("Error fetching camp", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async getCampByCode(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { code } = matchedData(req, { locations: ["params"] }) as { code: string };
      const camp = await Camp.findOne({ where: { code } });
      if (!camp) {
        throw new AppError("Camp no encontrado para el código proporcionado", 404);
      }
      logger.info("Camp fetched by code", { requestId: req.requestId, code });
      return ResponseHandler.success(
        res,
        { camp },
        "Camp obtenido exitosamente por código"
      );
    } catch (error) {
      logger.error("Error fetching camp by code", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async createCamp(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const data = matchedData(req, { locations: ["body"] }) as any;
      // Enforce defaults aligned to DB schema
      if (typeof data.country === "undefined") data.country = "Colombia";
      if (typeof data.status === "undefined") data.status = "DRAFT";

      const dupCode = await Camp.findOne({ where: { code: data.code } });
      if (dupCode) {
        throw new AppError("Ya existe un camp con el mismo code", 409);
      }

      const camp = await Camp.createCamp(data);
      logger.info("Camp created", { requestId: req.requestId, id: camp.id });
      return ResponseHandler.created(res, { camp }, "Camp creado exitosamente");
    } catch (error) {
      logger.error("Error creating camp", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async updateCamp(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const body = matchedData(req, { locations: ["body"] }) as any;
      const existing = await Camp.findOne({ where: { id } });
      if (!existing) {
        throw new AppError("Camp no encontrado", 404);
      }

      await Camp.findByIdAndUpdate(id, body);
      const updated = await Camp.findOneData(id);
      logger.info("Camp updated", { requestId: req.requestId, id });
      return ResponseHandler.success(res, { camp: updated }, "Camp actualizado exitosamente");
    } catch (error) {
      logger.error("Error updating camp", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async deleteCamp(req: ExtendedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const existing = await Camp.findOne({ where: { id } });
      if (!existing) {
        throw new AppError("Camp no encontrado", 404);
      }
      await Camp.deleteCamp(id);
      logger.info("Camp deleted", { requestId: req.requestId, id });
      return ResponseHandler.success(res, { id }, "Camp eliminado exitosamente");
    } catch (error) {
      logger.error("Error deleting camp", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },
};

export default campsController;