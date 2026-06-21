import { Request, Response } from "express";
import { supabase } from "../supabase.js";

export class ResumenController {
  getResumenEnCurso = async (req: Request, res: Response) => {
    try {
      const { empleadoId, mes } = req.query; // mes format: "YYYY-MM"
      if (!empleadoId || !mes) {
        return res
          .status(400)
          .json({ error: "Faltan parametros empleadoId y mes" });
      }

      const mesStr = String(mes);
      const startOfMonth = `${mesStr}-01`;
      // We can just use string compare since ISO dates
      const endOfMonth = `${mesStr}-31`;

      const { data: interpretaciones, error: errInterp } = await supabase
        .from("interpretaciones")
        .select("*")
        .eq("empleadoId", empleadoId)
        .gte("fecha", startOfMonth)
        .lte("fecha", endOfMonth);

      if (errInterp) throw errInterp;

      const { data: novedades, error: errNov } = await supabase
        .from("novedades")
        .select("*")
        .eq("empleadoId", empleadoId)
        .gte("fechaDesde", startOfMonth)
        .lte("fechaDesde", endOfMonth)
        .eq("estado", "APROBADA");

      if (errNov) throw errNov;

      let diasTrabajados = interpretaciones.filter(
        (i) => i.resultado?.esDiaLaboral && i.resultado?.horaEntrada,
      ).length;
      let minutosTardanzaTotales = interpretaciones.reduce(
        (acc, curr) => acc + (curr.minutosTardanza || 0),
        0,
      );
      let horasExtraTotales = 0;
      let ausenciasTotales = 0;

      for (const nov of novedades) {
        if (nov.tipo === "HORAS_EXTRA" || nov.tipo.includes("HORA")) {
          horasExtraTotales += Number(nov.cantidad || 0);
        } else if (nov.tipo === "AUSENCIA" || nov.tipo.includes("AUSENCIA")) {
          ausenciasTotales += Number(nov.cantidad || 0);
        }
      }

      res.json({
        empleadoId,
        mes: mesStr,
        diasTrabajados,
        minutosTardanzaTotales,
        horasExtraTotales,
        ausenciasTotales,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
}
