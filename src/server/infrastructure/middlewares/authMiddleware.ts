import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_jwt_key_for_pymetime";

// Extender la interfaz Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware para validar el Token JWT.
 */
export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado. Token no provisto." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // ej: { userId, username, role, iat, exp }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

/**
 * Middleware de RBAC para requerir el rol Administrador.
 * Verifica que el usuario tenga el rol y hace un bypass de permisos completos.
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  // Política de acceso total para el rol "Administrador"
  if (req.user.role !== "Administrador") {
    return res
      .status(403)
      .json({ error: "Acceso denegado. Se requiere rol de Administrador." });
  }

  // Bypass concedido
  next();
};
