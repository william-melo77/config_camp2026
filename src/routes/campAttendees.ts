import { Router } from "express";
import campAttendeesController from "../controllers/campAttendees";
import {
  validatorCreateCampAttendee,
  validatorGetCampAttendee,
  validatorUpdateCampAttendee,
  validatorQueryCampAttendees,
  validatorActivationStatus,
  validatorChangePassword,
  validatorCheckEmailUnique,
  validatorCheckIdentificationUnique,
} from "../validators/campAttendees";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: CampAttendees
 *   description: Gestión de asistentes del camp
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CampAttendee:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           readOnly: true
 *         isActive:
 *           type: boolean
 *           description: Indica si el asistente está activo
 *           default: false
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [M, F]
 *           nullable: true
 *         identificationType:
 *           type: string
 *           enum: [CC, PP, TI]
 *         identificationNumber:
 *           type: string
 *           description: Si identificationType es 'PP', permite letras (mayúsculas/minúsculas) y números; si es 'CC' o 'TI', solo números. Máximo 10 caracteres. Debe ser único sin importar el tipo (identificationType)
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 255
 *           nullable: true
 *         birthDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *         country:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios, máximo 50
 *           maxLength: 50
 *         churchPastor:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         skills:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *         allergies:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *         shirtSize:
 *           type: string
 *           enum: [XS, S, M, L, XL]
 *           nullable: true
 *         roleId:
 *           type: string
 *           format: uuid
 *         assistantSubRole:
 *           type: string
 *           enum: [NONE, MONITOR, GROUP_LEADER]
 *         documentKey:
 *           type: string
 *           nullable: true
 *           maxLength: 512
 *           description: Clave del objeto en R2 (ej. 'camp/docs/uuid.pdf')
 *         mimeType:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *           description: Tipo MIME (ej. 'application/pdf')
 *         bucket:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           description: Nombre del bucket de origen
 *           default: "jovenesconunproposito"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           readOnly: true
 *     CampAttendeeCreateInput:
 *       type: object
 *       required: [firstName, lastName, identificationType, identificationNumber, roleId]
 *       properties:
 *         firstName:
 *           type: string
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         lastName:
 *           type: string
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         gender:
 *           type: string
 *           enum: [M, F]
 *           nullable: true
 *         identificationType:
 *           type: string
 *           enum: [CC, PP, TI]
 *         identificationNumber:
 *           type: string
 *           description: Si identificationType es 'PP', permite letras (mayúsculas/minúsculas) y números; si es 'CC' o 'TI', solo números. Máximo 10 caracteres. Debe ser único sin importar el tipo (identificationType)
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 255
 *           nullable: true
 *         birthDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         country:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios, máximo 50
 *           maxLength: 50
 *         churchPastor:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Solo dígitos con opcional '+' al inicio, máximo 15
 *           pattern: ^\+?[0-9]{1,15}$
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         skills:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *         allergies:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *         shirtSize:
 *           type: string
 *           enum: [XS, S, M, L, XL]
 *           nullable: true
 *         roleId:
 *           type: string
 *           format: uuid
 *         assistantSubRole:
 *           type: string
 *           enum: [NONE, MONITOR, GROUP_LEADER]
 *         documentKey:
 *           type: string
 *           nullable: true
 *           maxLength: 512
 *         mimeType:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *         bucket:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           default: "jovenesconunproposito"
 *     CampAttendeeUpdateInput:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         lastName:
 *           type: string
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         gender:
 *           type: string
 *           enum: [M, F]
 *           nullable: true
 *         identificationType:
 *           type: string
 *           enum: [CC, PP, TI]
 *         identificationNumber:
 *           type: string
 *           description: Si identificationType es 'PP', permite letras (mayúsculas/minúsculas) y números; si es 'CC' o 'TI', solo números. Máximo 10 caracteres. Debe ser único sin importar el tipo (identificationType)
 *         age:
 *           type: integer
 *           minimum: 0
 *           maximum: 255
 *           nullable: true
 *         birthDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         country:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios, máximo 50
 *           maxLength: 50
 *         churchPastor:
 *           type: string
 *           nullable: true
 *           description: Solo letras y espacios
 *           pattern: ^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Solo dígitos con opcional '+' al inicio, máximo 15
 *           pattern: ^\+?[0-9]{1,15}$
 *         email:
 *           type: string
 *           format: email
 *           nullable: true
 *         skills:
 *           type: string
 *           nullable: true
 *         allergies:
 *           type: string
 *           nullable: true
 *         shirtSize:
 *           type: string
 *           enum: [XS, S, M, L, XL]
 *           nullable: true
 *         roleId:
 *           type: string
 *           format: uuid
 *         assistantSubRole:
 *           type: string
 *           enum: [NONE, MONITOR, GROUP_LEADER]
 *         documentKey:
 *           type: string
 *           nullable: true
 *           maxLength: 512
 *         mimeType:
 *           type: string
 *           nullable: true
 *           maxLength: 100
 *         bucket:
 *           type: string
 *           nullable: true
 *           maxLength: 255
 *           default: "jovenesconunproposito"
 */

/**
 * @swagger
 * /api/camp-attendees:
 *   get:
 *     summary: Lista asistentes del camp
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir registros eliminados (soft delete)
 *     responses:
 *       200:
 *         description: Lista de asistentes obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Lista de asistentes obtenida exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendees:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampAttendee'
 *                     total:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", validatorQueryCampAttendees, campAttendeesController.getCampAttendees);

/**
 * @swagger
 * /api/camp-attendees/check-email:
 *   get:
 *     summary: Verifica si un email ya existe
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Resultado de verificación de email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "El email ya está registrado"
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/check-email",
  validatorCheckEmailUnique,
  campAttendeesController.checkEmailExists
);

/**
 * @swagger
 * /api/camp-attendees/check-identification:
 *   get:
 *     summary: Verifica si un número de identificación ya existe
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: query
 *         name: identificationNumber
 *         required: true
 *         schema:
 *           type: string
 *           description: Máximo 10 caracteres alfanuméricos
 *     responses:
 *       200:
 *         description: Resultado de verificación de identificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "El número de identificación ya está registrado"
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/check-identification",
  validatorCheckIdentificationUnique,
  campAttendeesController.checkIdentificationExists
);

/**
 * @swagger
 * /api/camp-attendees/{id}:
 *   get:
 *     summary: Obtiene un asistente por ID
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asistente obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asistente obtenido exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/CampAttendee'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", validatorGetCampAttendee, campAttendeesController.getCampAttendee);

/**
 * @swagger
 * /api/camp-attendees:
 *   post:
 *     summary: Crea un nuevo asistente
 *     tags: [CampAttendees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampAttendeeCreateInput'
 *     responses:
 *       201:
 *         description: Asistente creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asistente creado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/CampAttendee'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", validatorCreateCampAttendee, campAttendeesController.createCampAttendee);

/**
 * @swagger
 * /api/camp-attendees/{id}:
 *   put:
 *     summary: Actualiza un asistente por ID
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CampAttendeeUpdateInput'
 *     responses:
 *       200:
 *         description: Asistente actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asistente actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/CampAttendee'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/:id",
  validatorGetCampAttendee,
  validatorUpdateCampAttendee,
  campAttendeesController.updateCampAttendee
);

/**
 * @swagger
 * /api/camp-attendees/{id}/activation:
 *   patch:
 *     summary: Activa o desactiva un asistente
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado de activación actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asistente activado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/CampAttendee'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch(
  "/:id/activation",
  validatorActivationStatus,
  campAttendeesController.updateActivationStatus
);

/**
 * @swagger
 * /api/camp-attendees/{id}/change-password:
 *   post:
 *     summary: Cambia la contraseña de un asistente
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Contraseña actualizada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendee:
 *                       $ref: '#/components/schemas/CampAttendee'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/:id/change-password",
  validatorChangePassword,
  campAttendeesController.changePassword
);

/**
 * @swagger
 * /api/camp-attendees/{id}:
 *   delete:
 *     summary: Elimina (soft delete) un asistente por ID
 *     tags: [CampAttendees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asistente eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asistente eliminado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete("/:id", validatorGetCampAttendee, campAttendeesController.deleteCampAttendee);

export default router;