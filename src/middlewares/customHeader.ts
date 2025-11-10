import { Request, Response, NextFunction } from "express";

const customHeader = (req: Request, res: Response, next: NextFunction) => {
    // Agregar headers personalizados para el microservicio
    res.setHeader("X-Service-Name", "Novia del Sur - Configuración");
    res.setHeader("X-Service-Version", "1.0.0");
    res.setHeader("X-Powered-By", "Node.js + Express + TypeScript");

    next();
};

export default customHeader;
