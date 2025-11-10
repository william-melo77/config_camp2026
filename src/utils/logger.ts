import winston from "winston";
import chalk from "chalk";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "../config/env";

const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            level: "error",
            maxSize: "20m",
            maxFiles: "14d",
        }),
        new DailyRotateFile({
            filename: "logs/combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }),
    ],
});

// Desarrollo: logs coloridos en consola
if (env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf((info) => {
                    return (
                        chalk.blue(`[${info.timestamp}]`) +
                        ` ${info.level}: ${chalk.white(info.message)}`
                    );
                })
            ),
        })
    );
}

export default logger;
