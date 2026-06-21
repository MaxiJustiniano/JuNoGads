import { Request, Response } from "express";
import { supabase } from "../supabase.js";
import fs from "fs";
import path from "path";

const CONFIG_FILE = path.join(process.cwd(), "configuracion.json");

const DEFAULT_CONFIG = {
  id: 1,
  toleranciaEntradaMinutos: 5,
  toleranciaSalidaMinutos: 0,
  umbralHorasExtraMinutos: 30,
  tiempoMinimoDescansoMinutos: 60,
};

export class ConfiguracionController {
  getGlobal = async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from("configuracion_global")
        .select("*")
        .eq("id", 1)
        .single();

      if (error && error.code !== "PGRST116" && !error.message.includes("Could not find the table")) {
        throw error;
      }

      if (!data) {
        if (fs.existsSync(CONFIG_FILE)) {
          return res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")));
        }
        return res.json(DEFAULT_CONFIG);
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Error al obtener la configuracion global:", error.message);
      if (fs.existsSync(CONFIG_FILE)) {
        return res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")));
      }
      return res.json(DEFAULT_CONFIG);
    }
  };

  upsertGlobal = async (req: Request, res: Response) => {
    try {
      const {
        toleranciaEntradaMinutos,
        toleranciaSalidaMinutos,
        umbralHorasExtraMinutos,
        tiempoMinimoDescansoMinutos,
      } = req.body;

      const configObj = {
        id: 1,
        toleranciaEntradaMinutos: toleranciaEntradaMinutos ?? 5,
        toleranciaSalidaMinutos: toleranciaSalidaMinutos ?? 0,
        umbralHorasExtraMinutos: umbralHorasExtraMinutos ?? 30,
        tiempoMinimoDescansoMinutos: tiempoMinimoDescansoMinutos ?? 60,
      };

      const { data, error } = await supabase
        .from("configuracion_global")
        .upsert(configObj)
        .select()
        .single();

      if (error) {
        if (error.message.includes("Could not find the table") || error.code === "PGRST116" || error.code === "42P01") {
          // Fallback to local file if table does not exist
          fs.writeFileSync(CONFIG_FILE, JSON.stringify(configObj, null, 2));
          return res.json(configObj);
        }
        throw error;
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Error al modificar configuracion global:", error.message);
      res.status(500).json({ error: error.message });
    }
  };
}
