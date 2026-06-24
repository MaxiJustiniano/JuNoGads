import { Request, Response } from "express";
import { supabase } from "../supabase.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Clave secreta para firmar los JWT. En producción debería venir de process.env.JWT_SECRET
const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_jwt_key_for_pymetime";

export class AuthController {
  /**
   * Endpoint de Login
   * Recibe credenciales, valida el hash y devuelve un token JWT con la info del rol.
   */
  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Usuario y contraseña son requeridos" });
      }

      // 1. Buscar el usuario en la base de datos junto con su rol
      const { data: user, error } = await supabase
        .from("usuarios")
        .select("*, rol:roles(nombre)")
        .eq("username", username)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 2. Validar la contraseña contra el hash almacenado
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // 3. Generar Token JWT incluyendo el rol ("Administrador")
      const roleName = user.rol?.nombre || "Usuario";

      const payload = {
        userId: user.id,
        username: user.username,
        role: roleName,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

      // 4. Responder con el token y datos del usuario
      return res.json({
        message: "Login exitoso",
        token,
        user: {
          id: user.id,
          username: user.username,
          role: roleName,
        },
      });
    } catch (error: any) {
      console.error("Error en login:", error.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}
