import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import ResponseHandler from "./responseHandler";

const validateResults = (req: Request, res: Response, next: NextFunction) => {
    try {
        validationResult(req).throw();
        return next();
    } catch (error: any) {
        return ResponseHandler.badRequest(
            res,
            "Error de validación",
            error.array()
        );
    }
};

export default validateResults;
