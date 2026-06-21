import { Request, Response } from "express";
import { supabase } from "../supabase.js";

export class ResumenController {
  getResumenEnCurso = async (req: Request, res: Response) => {
    try {
      const { empleadoId, mes } = req.query; // mes format: "YYYY-MM"
      if (!mes) {
        return res
          .status(400)
          .json({ error: "Faltan parametro mes" });
      }

      const mesStr = String(mes);
      const startOfMonth = `${mesStr}-01`;
      const endOfMonth = `${mesStr}-31`;

      if (empleadoId) {
        // Single employee
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

        return res.json({
          [String(empleadoId)]: {
            empleadoId,
            mes: mesStr,
            diasTrabajados,
            minutosTardanzaTotales,
            horasExtraTotales,
            ausenciasTotales,
          }
        });
      } else {
        // All employees
        const { data: empleados } = await supabase.from('empleados').select('*').eq('estado', 'ACTIVO');
        if (!empleados) return res.json({});

        const { data: interpretaciones, error: errInterp } = await supabase
          .from("interpretaciones")
          .select("*")
          .gte("fecha", startOfMonth)
          .lte("fecha", endOfMonth);

        if (errInterp) throw errInterp;

        const { data: novedades, error: errNov } = await supabase
          .from("novedades")
          .select("*, empleado:empleados(*)")
          .gte("fechaDesde", startOfMonth)
          .lte("fechaDesde", endOfMonth)
          .eq("estado", "APROBADA");

        if (errNov) throw errNov;

        const result: Record<string, any> = {};

        for (const emp of empleados) {
          const empInterp = interpretaciones.filter(i => i.empleadoId === emp.id);
          const empNov = novedades.filter(n => n.empleadoId === emp.id);

          let diasTrabajados = empInterp.filter(
            (i) => i.resultado?.esDiaLaboral && i.resultado?.horaEntrada,
          ).length;
          let minutosTardanzaTotales = empInterp.reduce(
            (acc, curr) => acc + (curr.minutosTardanza || 0),
            0,
          );
          let horasExtraTotales = 0;
          let ausenciasTotales = 0;

          for (const nov of empNov) {
            if (nov.tipo === "HORAS_EXTRA" || nov.tipo.includes("HORA")) {
              horasExtraTotales += Number(nov.cantidad || 0);
            } else if (nov.tipo === "AUSENCIA" || nov.tipo.includes("AUSENCIA")) {
              ausenciasTotales += Number(nov.cantidad || 0);
            }
          }

          result[emp.id] = {
            empleadoId: emp.id,
            nombreCompleto: `${emp.apellido}, ${emp.nombre}`,
            legajo: emp.legajo,
            mes: mesStr,
            diasTrabajados,
            minutosTardanzaTotales,
            horasExtraTotales,
            ausenciasTotales,
          };
        }
        return res.json(result);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
}
