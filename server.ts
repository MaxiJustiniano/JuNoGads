import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { EmployeeController } from "./src/server/infrastructure/controllers/EmployeeController";
import { AttendanceController } from "./src/server/infrastructure/controllers/AttendanceController";
import { NovedadController } from "./src/server/infrastructure/controllers/NovedadController";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from './src/server/infrastructure/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'pymetime_super_secret_key_123';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Middleware
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));

  // Logging Middleware for /api
  app.use("/api", (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.path}`);
    next();
  });

  // --- API Routes (In a real app, these would be in separate files) ---
  
  app.get("/api/health", (req, res) => {
    // Health check endpoint for deployment verification
    res.json({ status: "ok", message: "PymeTime API is running" });
  });

  app.get("/api/diagnose-supabase", async (req, res) => {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        return res.status(400).json({
          status: "error",
          message: "Credenciales faltantes en el servidor",
          details: `Faltan: ${[!url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')}`,
          hint: "Configura las variables en Settings -> Secrets de AI Studio."
        });
      }

      const { data, error } = await supabase.from('empleados').select('*').limit(1);
      
      if (error) {
        return res.status(500).json({
          status: "error",
          message: "Error al conectar con Supabase",
          details: error.message,
          hint: error.hint,
          code: error.code
        });
      }

      res.json({
        status: "success",
        message: "Conexión con Supabase exitosa",
        data: {
          table: 'empleados',
          reachable: true,
          count: data?.length || 0
        }
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        message: "Excepción catastrófica al intentar conectar",
        error: err.message
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ user, token });
  });

  const employeeController = new EmployeeController();

  app.get("/api/empleados", employeeController.getAll);
  app.get("/api/empleados/:id", employeeController.getById);
  app.post("/api/empleados", employeeController.create);
  app.put("/api/empleados/:id", employeeController.update);
  app.delete("/api/empleados/:id", employeeController.delete);

  const attendanceController = new AttendanceController();
  app.post("/api/fichadas", attendanceController.register);
  app.get("/api/fichadas/recientes", attendanceController.getRecent);

  const novedadController = new NovedadController();
  app.get("/api/novedades", novedadController.getAll);
  app.post("/api/novedades", novedadController.create);
  app.patch("/api/novedades/:id/status", novedadController.updateStatus);

  // Catch-all for API routes (unmatched API)
  app.use("/api/*", (req, res) => {
    console.warn(`[API 404] No match for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.originalUrl}` });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Global Error Handled]:", err);
    res.status(500).json({ error: "Error interno del servidor", message: err.message });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
