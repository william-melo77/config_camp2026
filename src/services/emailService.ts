import nodemailer, { Transporter } from "nodemailer";
import { smtpConfig } from "../config/env";
import logger from "../utils/logger";
import path from "path";
import fs from "fs/promises";

// Tipos para los emails
export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

export interface WelcomeEmailData {
    firstName: string;
    lastName: string;
    email: string;
    identificationNumber: string;
}

class EmailService {
    private transporter: Transporter | null = null;
    private initialized: boolean = false;

    /**
     * Inicializa el transporter de nodemailer
     * Se crea solo una vez (singleton pattern)
     */
    private async initialize(): Promise<void> {
        if (this.initialized && this.transporter) {
            return;
        }

        try {
            // Si no hay configuración de autenticación, crear transporter sin auth
            if (!smtpConfig.auth) {
                logger.warn(
                    "SMTP auth no configurado, emails pueden no enviarse correctamente"
                );
                this.transporter = nodemailer.createTransport({
                    host: smtpConfig.host,
                    port: smtpConfig.port,
                    secure: smtpConfig.secure,
                });
            } else {
                this.transporter = nodemailer.createTransport({
                    host: smtpConfig.host,
                    port: smtpConfig.port,
                    secure: smtpConfig.secure,
                    auth: smtpConfig.auth,
                });
            }

            // Verificar conexión solo en desarrollo o si se requiere
            if (process.env.NODE_ENV === "development") {
                await this.transporter.verify();
                logger.info("SMTP connection verified successfully");
            }

            this.initialized = true;
        } catch (error) {
            logger.error("Error initializing SMTP transporter", {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Envía un email genérico
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        try {
            await this.initialize();

            if (!this.transporter) {
                throw new Error("Email transporter no inicializado");
            }

            const mailOptions = {
                from: smtpConfig.from,
                to: Array.isArray(options.to)
                    ? options.to.join(", ")
                    : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || this.stripHtml(options.html),
                cc: options.cc
                    ? Array.isArray(options.cc)
                        ? options.cc.join(", ")
                        : options.cc
                    : undefined,
                bcc: options.bcc
                    ? Array.isArray(options.bcc)
                        ? options.bcc.join(", ")
                        : options.bcc
                    : undefined,
            };

            const info = await this.transporter.sendMail(mailOptions);

            logger.info("Email sent successfully", {
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });

            return true;
        } catch (error) {
            logger.error("Error sending email", {
                error: error instanceof Error ? error.message : String(error),
                to: options.to,
                subject: options.subject,
            });
            // No lanzar error para no bloquear la respuesta del controlador
            return false;
        }
    }

    /**
     * Carga una plantilla HTML desde el sistema de archivos
     */
    async loadTemplate(templateName: string): Promise<string> {
        try {
            // Intentar desde la ruta relativa a src (desarrollo con ts-node)
            let templatePath = path.join(
                __dirname,
                "..",
                "templates",
                "email",
                `${templateName}.html`
            );

            // Si no existe, intentar desde process.cwd() (producción compilada)
            try {
                await fs.access(templatePath);
            } catch {
                templatePath = path.join(
                    process.cwd(),
                    "src",
                    "templates",
                    "email",
                    `${templateName}.html`
                );
                // Si tampoco existe, intentar desde dist
                try {
                    await fs.access(templatePath);
                } catch {
                    templatePath = path.join(
                        process.cwd(),
                        "dist",
                        "templates",
                        "email",
                        `${templateName}.html`
                    );
                }
            }

            const template = await fs.readFile(templatePath, "utf-8");
            return template;
        } catch (error) {
            logger.error("Error loading email template", {
                error: error instanceof Error ? error.message : String(error),
                templateName,
            });
            throw error;
        }
    }

    /**
     * Reemplaza placeholders en una plantilla
     */
    replacePlaceholders(
        template: string,
        data: Record<string, string | number>
    ): string {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, "g");
            result = result.replace(placeholder, String(value));
        }
        return result;
    }

    /**
     * Envía email de bienvenida cuando un usuario es activado
     */
    async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
        try {
            const template = await this.loadTemplate("welcome");
            
            // Extraer solo el primer nombre (por si tiene varios nombres)
            const firstNameOnly = data.firstName.split(" ")[0];
            
            const html = this.replacePlaceholders(template, {
                firstName: firstNameOnly,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
                password: data.identificationNumber,
            });

            return await this.sendEmail({
                to: data.email,
                subject: "¡Bienvenido a Jóvenes con Un Propósito!",
                html,
            });
        } catch (error) {
            logger.error("Error sending welcome email", {
                error: error instanceof Error ? error.message : String(error),
                email: data.email,
            });
            return false;
        }
    }

    /**
     * Extrae texto plano del HTML para email en modo texto
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim();
    }
}

// Exportar instancia singleton
export const emailService = new EmailService();
