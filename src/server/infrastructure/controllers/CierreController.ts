import { Request, Response } from "express";
import { supabase } from "../supabase.js";

export class CierreController {
  cerrarMes = async (req: Request, res: Response) => {
    try {
      const { periodo, cerradoPor } = req.body; // e.g. "2026-06"
      if (!periodo || !cerradoPor) {
        return res
          .status(400)
          .json({ error: "Faltan parametros periodo y cerradoPor" });
      }

      // Check if already closed
      const { data: existing } = await supabase
        .from("cierres_mensuales")
        .select("id")
        .eq("periodo", periodo)
        .single();

      if (existing) {
        return res
          .status(400)
          .json({ error: "El periodo ya se encuentra cerrado" });
      }

      // Create Cierre
      const { data: cierre, error: errCierre } = await supabase
        .from("cierres_mensuales")
        .insert({
          periodo,
          cerradoPor,
          fechaCierre: new Date().toISOString(),
        })
        .select()
        .single();

      if (errCierre) throw errCierre;

      // For every employee, generate a snapshot
      const { data: empleados } = await supabase
        .from("empleados")
        .select("*")
        .eq("estado", "ACTIVO");

      const startOfMonth = `${periodo}-01`;
      const endOfMonth = `${periodo}-31`;

      if (empleados) {
        for (const emp of empleados) {
          // get their data
          const { data: fichadas } = await supabase
            .from("fichadas")
            .select("*")
            .eq("empleadoId", emp.id)
            .gte("timestamp", startOfMonth)
            .lt("timestamp", endOfMonth + "T23:59:59Z");
          const { data: interpretaciones } = await supabase
            .from("interpretaciones")
            .select("*")
            .eq("empleadoId", emp.id)
            .gte("fecha", startOfMonth)
            .lte("fecha", endOfMonth);
          const { data: novedades } = await supabase
            .from("novedades")
            .select("*")
            .eq("empleadoId", emp.id)
            .gte("fechaDesde", startOfMonth)
            .lte("fechaDesde", endOfMonth)
            .eq("estado", "APROBADA");

          let diasTrabajados = (interpretaciones || []).filter(
            (i) => i.resultado?.esDiaLaboral && i.resultado?.horaEntrada,
          ).length;
          let minutosTardanzaTotales = (interpretaciones || []).reduce(
            (acc, curr) => acc + (curr.minutosTardanza || 0),
            0,
          );
          let horasExtraTotales = 0;
          let ausenciasTotales = 0;

          for (const nov of novedades || []) {
            if (nov.tipo === "HORAS_EXTRA" || nov.tipo.includes("HORA")) {
              horasExtraTotales += Number(nov.cantidad || 0);
            } else if (
              nov.tipo === "AUSENCIA" ||
              nov.tipo.includes("AUSENCIA")
            ) {
              ausenciasTotales += Number(nov.cantidad || 0);
            }
          }

          await supabase.from("cierre_empleados").insert({
            cierreId: cierre.id,
            empleadoId: emp.id,
            diasTrabajados,
            horasExtraTotales,
            ausenciasTotales,
            minutosTardanzaTotales,
            snapshotData: {
              fichadas,
              interpretaciones,
              novedades,
            },
          });
        }
      }

      res.status(201).json(cierre);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };

  getCierres = async (req: Request, res: Response) => {
    try {
      const { data: cierres, error } = await supabase
        .from("cierres_mensuales")
        .select("*")
        .order("periodo", { ascending: false });
      if (error) throw error;
      res.json(cierres);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
}
