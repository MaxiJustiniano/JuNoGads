import { Request, Response } from "express";
import { supabase } from "../supabase.js";
import bcrypt from "bcryptjs";

export class UserController {
  getUsers = async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, username, nombre, apellido, dni, rol:roles(nombre)")
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback en caso de que no hayan ejecutado la migración SQL 02_users_add_fields.sql
        if (
          error.code === "PGRST116" ||
          error.message.includes("Could not find the column")
        ) {
          const { data: oldData, error: oldError } = await supabase
            .from("usuarios")
            .select("id, username, rol:roles(nombre)")
            .order("created_at", { ascending: false });
          if (oldError) throw oldError;
          return res.json(oldData);
        }
        throw error;
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Error al obtener usuarios:", error.message);
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
  };

  createUser = async (req: Request, res: Response) => {
    try {
      const { nombre, apellido, dni } = req.body;

      if (!nombre || !apellido || !dni) {
        return res
          .status(400)
          .json({ error: "Nombre, apellido y DNI son requeridos" });
      }

      // Generar usuario: primer letra del nombre + apellido sin espacios en minúscula
      const username = `${nombre.charAt(0).toLowerCase()}${apellido.toLowerCase().replace(/\s/g, "")}`;

      // Generar contraseña: dni
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(dni.toString(), salt);

      // Buscar el ID del rol Administrador
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("nombre", "Administrador")
        .single();

      if (roleError || !roleData) {
        return res.status(500).json({
          error: "No se encontró el rol Administrador en la base de datos.",
        });
      }

      const { data, error } = await supabase
        .from("usuarios")
        .insert([
          {
            username,
            password_hash,
            nombre,
            apellido,
            dni,
            rol_id: roleData.id,
          },
        ])
        .select("id, username, nombre, apellido, dni, rol:roles(nombre)")
        .single();

      if (error) {
        if (
          error.message.includes("Could not find the column") ||
          error.code === "PGRST116"
        ) {
          return res.status(400).json({
            error:
              "Debe ejecutar el script SQL 02_users_add_fields.sql en Supabase primero para agregar las columnas nombre, apellido y dni.",
          });
        }
        throw error;
      }

      return res.status(201).json(data);
    } catch (error: any) {
      console.error("Error al crear usuario:", error.message);
      return res.status(500).json({ error: "Error interno al crear usuario" });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { nombre, apellido, dni } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ error: "El ID del usuario es requerido" });
      }

      const updates: any = {};
      if (nombre) updates.nombre = nombre;
      if (apellido) updates.apellido = apellido;
      if (dni) {
        updates.dni = dni;
        // Optionally update password if DNI changes, or leave as separate flow. Let's update it here.
        const salt = await bcrypt.genSalt(10);
        updates.password_hash = await bcrypt.hash(dni.toString(), salt);
      }

      const { data, error } = await supabase
        .from("usuarios")
        .update(updates)
        .eq("id", id)
        .select("id, username, nombre, apellido, dni, rol:roles(nombre)")
        .single();

      if (error) throw error;

      return res.json(data);
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error.message);
      return res
        .status(500)
        .json({ error: "Error interno al actualizar usuario" });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res
          .status(400)
          .json({ error: "El ID del usuario es requerido" });
      }

      const { error } = await supabase.from("usuarios").delete().eq("id", id);

      if (error) throw error;

      return res.json({ message: "Usuario eliminado con éxito" });
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error.message);
      return res
        .status(500)
        .json({ error: "Error interno al eliminar usuario" });
    }
  };
}
