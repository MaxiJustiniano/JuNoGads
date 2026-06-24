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

  changePassword = async (req: Request, res: Response) => {
    try {
      // Usamos el ID del usuario extraído por el middleware authMiddleware (AuthRequest)
      const userId = (req as any).user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "No autorizado" });
      }

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "La contraseña actual y la nueva son requeridas" });
      }

      // 1. Obtener el usuario
      const { data: user, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // 2. Validar contraseña actual
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res
          .status(401)
          .json({ error: "La contraseña actual es incorrecta" });
      }

      // 3. Hashear y actualizar la nueva contraseña
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ password_hash: newPasswordHash })
        .eq("id", userId);

      if (updateError) {
        return res
          .status(500)
          .json({ error: "Error al actualizar la contraseña" });
      }

      return res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error: any) {
      console.error("Error en changePassword:", error.message);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };
}
