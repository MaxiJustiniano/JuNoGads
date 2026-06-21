import { Request, Response } from "express";
import { supabase } from "../supabase.js";

export class CierreController {
  exportExcel = async (req: Request, res: Response) => {
    try {
      const { periodoId } = req.params;

      const { data: cierre, error: errCierre } = await supabase
        .from("cierres_mensuales")
        .select("*")
        .eq("id", periodoId)
        .single();

      if (errCierre || !cierre) {
        return res.status(404).json({ error: "Cierre no encontrado" });
      }

      const { data: empCierres, error: errEmp } = await supabase
        .from("cierre_empleados")
        .select("*, empleado:empleados(*)")
        .eq("cierreId", periodoId);

      if (errEmp) throw errEmp;

      const XLSX = await import("xlsx");

      const rows = (empCierres || []).map((ec: any) => {
        const emp = ec.empleado || {};
        const snap = ec.snapshotData || {};
        const novedades = snap.novedades || [];

        // Sumar horas extras (100% vs 50% - simplificado asumiendo q si es extra normal o de finde)
        let he50 = 0;
        let he100 = 0;
        // Licencias detalle
        const licencias: string[] = [];

        novedades.forEach((n: any) => {
          if (n.tipo === "HORAS_EXTRA") {
            // Asumimos que podemos buscar si es fin de semana (en interpretaciones) o default
            he50 += Number(n.cantidad || 0); // Simplificación si no tenemos flag
          } else if (
            n.tipo.includes("LICENCIA") ||
            n.tipo.includes("ENFERMEDAD") ||
            n.tipo.includes("ESTUDIO")
          ) {
            licencias.push(`${n.tipo} (${n.cantidad} dias)`);
          }
        });

        return {
          Legajo: emp.legajo,
          "Nombre Completo": `${emp.apellido}, ${emp.nombre}`,
          "DNI/CUIL": emp.dni || emp.cuil || "-",
          "Días Trabajados": ec.diasTrabajados,
          "Ausencias Just. / Injust.": ec.ausenciasTotales,
          "Tardanzas (min)": ec.minutosTardanzaTotales,
          "Horas Extra 50%": he50,
          "Horas Extra 100%": he100,
          "Detalle Licencias": licencias.join(" | ") || "Sin novedades",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Preliquidación");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Preliquidacion_${cierre.periodo}.xlsx"`,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      return res.send(buffer);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };

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
