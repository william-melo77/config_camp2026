import { Router, Request, Response } from "express";
import { r2Config } from "../config/env";
import ResponseHandler from "../utils/responseHandler";
import logger from "../utils/logger";
import { R2Provider } from "../providers/r2/R2Provider";

const router = Router();
const r2 = new R2Provider();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: Gestión de URLs firmadas para subida a Cloudflare R2
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadUrlRequest:
 *       type: object
 *       required: [filename, contentType]
 *       properties:
 *         filename:
 *           type: string
 *           description: Nombre del archivo a subir
 *         contentType:
 *           type: string
 *           description: Tipo MIME del archivo (ej. image/png)
 *     UploadUrlResponse:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *           description: URL firmada (PUT) válida por tiempo limitado
 *         publicUrl:
 *           type: string
 *           description: URL pública del archivo si el bucket es público (vacía si es privado)
 *         expiresIn:
 *           type: integer
 *           description: Tiempo de expiración en segundos
 *           example: 300
 *         key:
 *           type: string
 *           description: Key (ruta) del archivo dentro del bucket
 *
 *     DownloadUrlRequest:
 *       type: object
 *       required: [key]
 *       properties:
 *         key:
 *           type: string
 *           description: Key (ruta) del archivo dentro del bucket
 *           example: "uploads/mi-archivo.png"
 *         expiresIn:
 *           type: integer
 *           description: Tiempo de expiración en segundos (por defecto 300)
 *           example: 300
 *     DownloadUrlResponse:
 *       type: object
 *       properties:
 *         downloadUrl:
 *           type: string
 *           description: URL firmada (GET) válida por tiempo limitado
 *         expiresIn:
 *           type: integer
 *           description: Tiempo de expiración en segundos
 *           example: 300
 *         key:
 *           type: string
 *           description: Key (ruta) del archivo dentro del bucket
 */

/**
 * @swagger
 * /api/upload-url:
 *   post:
 *     summary: Genera una URL firmada para subir archivos a R2
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UploadUrlRequest'
 *     responses:
 *       200:
 *         description: URL firmada generada exitosamente
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
 *                   example: "URL firmada generada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/UploadUrlResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/upload-url", async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body || {};

    if (!filename || !contentType) {
      return ResponseHandler.error(res, "Faltan parámetros: filename y contentType", 400);
    }

    // Construir key única segura
    const timestamp = Date.now();
    const safeName = String(filename).replace(/[^A-Za-z0-9._-]/g, "_");
    const key = `${timestamp}-${safeName}`;

    const { uploadUrl, publicUrl, expiresIn } = await r2.getPresignedPutUrl(
      r2Config.bucket,
      key,
      contentType,
      300
    );

    return ResponseHandler.success(
      res,
      { uploadUrl, publicUrl, expiresIn, key },
      "URL firmada generada exitosamente"
    );
  } catch (error) {
    logger.error("Error generando URL firmada", { error });
    return ResponseHandler.error(
      res,
      `Error interno al generar URL firmada: ${error instanceof Error ? error.message : "Error desconocido"}`,
      500
    );
  }
});

/**
 * @swagger
 * /api/download-url:
 *   post:
 *     summary: Genera una URL firmada para descargar archivos de R2
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DownloadUrlRequest'
 *     responses:
 *       200:
 *         description: URL firmada de descarga generada exitosamente
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
 *                   example: "URL firmada de descarga generada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/DownloadUrlResponse'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/download-url", async (req: Request, res: Response) => {
  try {
    const { key, expiresIn } = req.body || {};

    if (!key || typeof key !== "string") {
      return ResponseHandler.error(
        res,
        "Falta parámetro: key",
        400
      );
    }

    const { downloadUrl } = await r2.getPresignedGetUrl(
      r2Config.bucket,
      key,
      typeof expiresIn === "number" && expiresIn > 0 ? expiresIn : 300
    );

    return ResponseHandler.success(
      res,
      { downloadUrl, expiresIn: typeof expiresIn === "number" ? expiresIn : 300, key },
      "URL firmada de descarga generada exitosamente"
    );
  } catch (error) {
    logger.error("Error generando URL firmada de descarga", { error });
    return ResponseHandler.error(
      res,
      `Error interno al generar URL de descarga: ${
        error instanceof Error ? error.message : "Error desconocido"
      }`,
      500
    );
  }
});

export default router;