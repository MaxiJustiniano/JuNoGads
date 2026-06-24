import { supabase } from "../supabase.js";
import bcrypt from "bcryptjs";

export const seedAuth = async () => {
  try {
    console.log("Iniciando seeder de Autenticación y RBAC...");

    // 1. Crear el rol Administrador si no existe
    const { data: adminRole, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("nombre", "Administrador")
      .single();

    let rolId;

    if (!adminRole) {
      console.log("Creando rol Administrador...");
      const { data: newRole, error: insertRoleError } = await supabase
        .from("roles")
        .insert([
          { nombre: "Administrador", descripcion: "Acceso total al sistema" },
        ])
        .select()
        .single();

      if (insertRoleError) throw insertRoleError;
      rolId = newRole.id;
    } else {
      rolId = adminRole.id;
    }

    // 2. Crear usuario "soporte" si no existe
    const { data: userSoporte, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", "soporte")
      .single();

    if (!userSoporte) {
      console.log("Creando usuario Soporte Técnico...");
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash("soporte123*", salt);

      const { error: insertUserError } = await supabase
        .from("usuarios")
        .insert([
          {
            username: "soporte",
            password_hash: passwordHash,
            rol_id: rolId,
          },
        ]);

      if (insertUserError) throw insertUserError;
      console.log("Usuario Soporte Técnico creado con éxito.");
    } else {
      console.log("El usuario Soporte Técnico ya existe.");
    }

    console.log("Seeder finalizado correctamente.");
  } catch (error) {
    console.error("Error en el seeder:", error);
  }
};
