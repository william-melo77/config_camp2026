import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import logger from "./logger";

// Extender la interfaz Request para este archivo
interface ExtendedRequest extends Request {
    requestId?: string;
    startTime?: number;
}

const requestLogger = (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    req.requestId = randomUUID();
    req.startTime = Date.now();

    logger.info("Request started", {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
    });

    const originalSend = res.send;
    res.send = function (body) {
        const responseTime = Date.now() - (req.startTime || Date.now());
        logger.info("Request completed", {
            requestId: req.requestId,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
        });
        return originalSend.call(this, body);
    };

    next();
};

export default requestLogger;
