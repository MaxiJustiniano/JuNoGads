import { Request, Response } from "express";
import { supabase } from "../supabase.js";

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

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) {
        return res.json(DEFAULT_CONFIG);
      }

      return res.json(data);
    } catch (error: any) {
      console.error("Error al obtener la configuracion global:", error.message);
      res.status(500).json({ error: error.message });
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

      if (error) throw error;

      return res.json(data);
    } catch (error: any) {
      console.error("Error al modificar configuracion global:", error.message);
      res.status(500).json({ error: error.message });
    }
  };
}
