import { Request, Response, NextFunction } from "express";
import { matchedData } from "express-validator";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import logger from "../utils/logger";
import ResponseHandler from "../utils/responseHandler";
import CampAttendee from "../models/CampAttendee";
import Role from "../models/Role";
import { AppError } from "../utils/handleError";

// Extiendo Request localmente para logging consistente
interface ExtendedRequest extends Request {
  requestId?: string;
  user?: { id: string; email?: string };
}

const campAttendeesController = {
  async getCampAttendees(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = matchedData(req, { locations: ["query"] }) as {
        includeInactive?: boolean;
      };
      const includeInactive = Boolean(data.includeInactive);
      const attendees = await CampAttendee.findAllData(includeInactive);
      const total = attendees.length;

      logger.info("CampAttendees list fetched", {
        requestId: req.requestId,
        total,
      });

      return ResponseHandler.success(
        res,
        { attendees, total },
        "Lista de asistentes obtenida exitosamente"
      );
    } catch (error) {
      logger.error("Error fetching camp attendees", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async getCampAttendee(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as {
        id: string;
      };
      const attendee = await CampAttendee.findOneData(id);

      if (!attendee) {
        throw new AppError("Asistente no encontrado", 404);
      }

      logger.info("CampAttendee fetched", { requestId: req.requestId, id });
      return ResponseHandler.success(
        res,
        { attendee },
        "Asistente obtenido exitosamente"
      );
    } catch (error) {
      logger.error("Error fetching camp attendee", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async createCampAttendee(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const body = matchedData(req, { locations: ["body"] }) as any;
      // Asignar campId por defecto sin requerirlo en el body
      if (!body.campId) {
        body.campId = "4fe33661-785c-4e8b-a4ce-12d0ccd4be98";
      }
      // Campos nuevos y reglas:
      // - emailVerifiedAt: ignorar del body, siempre null al crear
      body.emailVerifiedAt = null;
      // - mustChangePassword: inyectar true (1)
      body.mustChangePassword = true;
      // - registrationStatus: aceptar si viene y validar; si no, default PENDING_PAYMENT
      const allowedStatuses = [
        "PENDING_PAYMENT",
        "PAID",
        "CONFIRMED",
        "CANCELLED",
        "WAITING_LIST",
      ];
      if (typeof body.registrationStatus === "string") {
        if (!allowedStatuses.includes(body.registrationStatus)) {
          throw new AppError(
            "registrationStatus inválido",
            400
          );
        }
      } else {
        body.registrationStatus = "PENDING_PAYMENT";
      }
      // Validar que el roleId exista para evitar error de FK
      if (body.roleId) {
        const role = await Role.findOne({ where: { id: body.roleId } });
        if (!role) {
          throw new AppError("Rol no encontrado para roleId proporcionado", 400);
        }
        // Reglas de assistantSubRole dependiendo del rol
        if (role.code === "ASISTENTE") {
          if (!body.assistantSubRole) {
            body.assistantSubRole = "NONE";
          }
        } else {
          if (body.assistantSubRole) {
            throw new AppError(
              "assistantSubRole no permitido si el rol no es ASISTENTE",
              400
            );
          }
          body.assistantSubRole = "NONE";
        }
      }
      // birthDate no futura
      if (body.birthDate && body.birthDate > new Date()) {
        throw new AppError("birthDate no puede ser una fecha futura", 400);
      }
      // Consistencia age vs birthDate (tolerancia ±1)
      if (body.birthDate && typeof body.age === "number") {
        const today = new Date();
        let calcAge = today.getFullYear() - body.birthDate.getFullYear();
        const m = today.getMonth() - body.birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < body.birthDate.getDate())) {
          calcAge--;
        }
        if (Math.abs(calcAge - body.age) > 1) {
          throw new AppError("age es inconsistente con birthDate", 400);
        }
      }
      // Duplicidad identificación por número (único en el sistema, sin importar tipo)
      if (body.identificationNumber) {
        const dupId = await CampAttendee.findOne({
          where: { identificationNumber: body.identificationNumber },
        });
        if (dupId) {
          throw new AppError(
            "Ya existe un asistente con el mismo número de identificación",
            409
          );
        }
      }
      // Duplicidad email
      if (body.email) {
        const dupEmail = await CampAttendee.findOne({ where: { email: body.email } });
        if (dupEmail) {
          throw new AppError("Ya existe un asistente con el mismo email", 409);
        }
      }
      // Asegurar isActive por defecto en false si no se indica
      if (typeof body.isActive === "undefined") {
        body.isActive = false;
      }
      // Hash de password: si no se pasa password, usar identificationNumber
      if (body.identificationNumber) {
        const plainPassword: string = typeof body.password === "string" && body.password.length > 0
          ? body.password
          : String(body.identificationNumber);
        const saltRounds = 10;
        const hashed = await bcrypt.hash(plainPassword, saltRounds);
        body.passwordHash = hashed;
        delete body.password;
      }
      const attendee = await CampAttendee.createCampAttendee(body);
      logger.info("CampAttendee created", {
        requestId: req.requestId,
        id: attendee.id,
      });
      return ResponseHandler.created(
        res,
        { attendee },
        "Asistente creado exitosamente"
      );
    } catch (error) {
      logger.error("Error creating camp attendee", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async updateCampAttendee(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as {
        id: string;
      };
      const body = matchedData(req, { locations: ["body"] }) as any;
      // Si roleId viene en el body, validar existencia para evitar error de FK
      if (typeof body.roleId !== "undefined") {
        const role = await Role.findOne({ where: { id: body.roleId } });
        if (!role) {
          throw new AppError("Rol no encontrado para roleId proporcionado", 400);
        }
        // Reglas de assistantSubRole según rol final
        if (role.code === "ASISTENTE") {
          // Si cambiamos a ASISTENTE y no se envía assistantSubRole, poner NONE
          if (!body.assistantSubRole) {
            body.assistantSubRole = "NONE";
          }
        } else {
          // Para roles no ASISTENTE, siempre NONE automáticamente
          body.assistantSubRole = "NONE";
        }
      }
      // Obtener asistente actual para validaciones de duplicidad
      const existing = await CampAttendee.findOne({ where: { id } });
      if (!existing) {
        throw new AppError("Asistente no encontrado", 404);
      }
      // birthDate no futura (normalizar string DATEONLY a Date)
      const rawBirth = typeof body.birthDate !== "undefined" ? body.birthDate : (existing as any).birthDate;
      const finalBirthDate: Date | null = rawBirth
        ? (typeof rawBirth === "string" ? new Date(rawBirth) : rawBirth)
        : null;
      if (finalBirthDate && finalBirthDate > new Date()) {
        throw new AppError("birthDate no puede ser una fecha futura", 400);
      }
      // Consistencia age vs birthDate (tolerancia ±1)
      const finalAge: number | null = typeof body.age !== "undefined" ? body.age : existing.age;
      if (finalBirthDate && typeof finalAge === "number") {
        const today = new Date();
        let calcAge = today.getFullYear() - finalBirthDate.getFullYear();
        const m = today.getMonth() - finalBirthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < finalBirthDate.getDate())) {
          calcAge--;
        }
        if (Math.abs(calcAge - finalAge) > 1) {
          throw new AppError("age es inconsistente con birthDate", 400);
        }
      }
      // Duplicidad identificación por número (excluir propio id, independiente del tipo)
      const finalIdNumber = typeof body.identificationNumber !== "undefined" ? body.identificationNumber : existing.identificationNumber;
      if (finalIdNumber) {
        const dupId = await CampAttendee.findOne({
          where: { identificationNumber: finalIdNumber, id: { [Op.ne]: existing.id } },
        });
        if (dupId) {
          throw new AppError(
            "Ya existe otro asistente con el mismo número de identificación",
            409
          );
        }
      }
      // Duplicidad email (excluir propio id)
      const finalEmail = typeof body.email !== "undefined" ? body.email : existing.email;
      if (finalEmail) {
        const dupEmail = await CampAttendee.findOne({
          where: { email: finalEmail, id: { [Op.ne]: existing.id } },
        });
        if (dupEmail) {
          throw new AppError("Ya existe otro asistente con el mismo email", 409);
        }
      }
      const [affected] = await CampAttendee.findByIdAndUpdate(id, body);

      if (!affected) {
        throw new AppError("Asistente no encontrado", 404);
      }

      const attendee = await CampAttendee.findOneData(id);
      logger.info("CampAttendee updated", {
        requestId: req.requestId,
        id,
      });
      return ResponseHandler.success(
        res,
        { attendee },
        "Asistente actualizado exitosamente"
      );
    } catch (error) {
      logger.error("Error updating camp attendee", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async deleteCampAttendee(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as {
        id: string;
      };
      const deleted = await CampAttendee.deleteCampAttendee(id);

      if (!deleted) {
        throw new AppError("Asistente no encontrado", 404);
      }

      logger.info("CampAttendee deleted", { requestId: req.requestId, id });
      return ResponseHandler.success(
        res,
        { id, deleted: true },
        "Asistente eliminado exitosamente"
      );
    } catch (error) {
      logger.error("Error deleting camp attendee", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async updateActivationStatus(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const data = matchedData(req, { locations: ["body"] }) as { isActive: boolean };
      const attendee = await CampAttendee.findOne({ where: { id } });
      if (!attendee) {
        throw new AppError("Asistente no encontrado", 404);
      }
      await CampAttendee.findByIdAndUpdate(id, { isActive: Boolean(data.isActive) });
      const updated = await CampAttendee.findOneData(id);
      logger.info("CampAttendee activation updated", { requestId: req.requestId, id, isActive: Boolean(data.isActive) });
      return ResponseHandler.success(
        res,
        { attendee: updated },
        Boolean(data.isActive) ? "Asistente activado exitosamente" : "Asistente desactivado exitosamente"
      );
    } catch (error) {
      logger.error("Error updating activation status", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async changePassword(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = matchedData(req, { locations: ["params"] }) as { id: string };
      const data = matchedData(req, { locations: ["body"] }) as {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      };
      if (data.newPassword !== data.confirmPassword) {
        throw new AppError("La nueva contraseña no coincide con la confirmación", 400);
      }
      const attendee = await CampAttendee.findOne({ where: { id } });
      if (!attendee) {
        throw new AppError("Asistente no encontrado", 404);
      }
      // Validar siempre contra el passwordHash existente
      if (!attendee.passwordHash) {
        throw new AppError("No hay contraseña configurada para este asistente", 400);
      }
      const isValid = await bcrypt.compare(data.currentPassword, attendee.passwordHash);
      if (!isValid) {
        throw new AppError("La contraseña actual es incorrecta", 401);
      }
      const saltRounds = 10;
      const newHash = await bcrypt.hash(data.newPassword, saltRounds);
      await CampAttendee.findByIdAndUpdate(id, { passwordHash: newHash });
      const updated = await CampAttendee.findOneData(id);
      logger.info("CampAttendee password changed", { requestId: req.requestId, id });
      return ResponseHandler.success(
        res,
        { attendee: updated },
        "Contraseña actualizada exitosamente"
      );
    } catch (error) {
      logger.error("Error changing password", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async checkEmailExists(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = matchedData(req, { locations: ["query"] }) as {
        email: string;
      };

      if (!email) {
        throw new AppError("Parámetro requerido: email", 400);
      }

      const dupEmail = await CampAttendee.findOne({ where: { email } });
      const exists = Boolean(dupEmail);

      logger.info("Check email exists", {
        requestId: req.requestId,
        email,
        exists,
      });

      return ResponseHandler.success(
        res,
        { exists },
        exists ? "El email ya está registrado" : "El email no existe"
      );
    } catch (error) {
      logger.error("Error checking email existence", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },

  async checkIdentificationExists(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { identificationNumber } = matchedData(req, { locations: ["query"] }) as {
        identificationNumber: string;
      };

      if (!identificationNumber) {
        throw new AppError("Parámetro requerido: identificationNumber", 400);
      }

      const dupId = await CampAttendee.findOne({
        where: { identificationNumber },
      });
      const exists = Boolean(dupId);

      logger.info("Check identification exists", {
        requestId: req.requestId,
        identificationNumber,
        exists,
      });

      return ResponseHandler.success(
        res,
        { exists },
        exists
          ? "El número de identificación ya está registrado"
          : "El número de identificación no existe"
      );
    } catch (error) {
      logger.error("Error checking identification existence", {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return next(error);
    }
  },
};

export default campAttendeesController;