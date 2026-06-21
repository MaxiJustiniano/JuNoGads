import { differenceInMinutes, format, isSameDay, startOfDay } from "date-fns";
import { toZonedTime, format as formatTz, fromZonedTime } from "date-fns-tz";

const TZ = "America/Argentina/Buenos_Aires";

export interface Fichada {
  id: string;
  empleadoId: string;
  timestamp: string;
  tipo: "ENTRADA" | "SALIDA" | "FIN_DESCANSO" | "INICIO_DESCANSO";
}

export class RulesEngine {
  /**
   * Procesa un día completo de fichadas para un empleado
   * Limpia dobles fichadas, calcula tiempos y devuelve interpretación + Novedades a crear
   */
  public evaluarDia(
    fechaUTC: Date,
    empleado: any,
    fichadasDelDia: Fichada[],
    globalConfig?: any,
  ) {
    const config = Object.assign(
      {
        toleranciaEntradaMinutos: 5,
        toleranciaSalidaMinutos: 0,
        umbralHorasExtraMinutos: 30,
        tiempoMinimoDescansoMinutos: 60,
      },
      globalConfig || {},
    );

    // La fecha proporcionada podría estar en UTC o local del server.
    // Lo ideal es tener el día en la zona horaria objetivo
    const fechaLocal = toZonedTime(fechaUTC, TZ);
    const fechaStr = formatTz(fechaLocal, "yyyy-MM-dd", { timeZone: TZ });

    if (
      !empleado.horarioBase &&
      (!empleado.horario || typeof empleado.horario !== "object")
    ) {
      return this.crearFallback(
        empleado,
        fechaStr,
        "HORARIO_NO_ASIGNADO",
        "Empleado sin horario",
      );
    }

    // Resolve horario from multiple possibilities
    const horario = Array.isArray(empleado.horario)
      ? empleado.horario[0]
      : empleado.horario || empleado.horarioBase;

    // 1. Limpieza de fichadas (unificar / ignorar duplicadas)
    // Ordenamos cronológicamente
    let sorted = [...fichadasDelDia].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const fichadasLimpias: Fichada[] = [];
    for (const f of sorted) {
      if (fichadasLimpias.length === 0) {
        fichadasLimpias.push(f);
      } else {
        const last = fichadasLimpias[fichadasLimpias.length - 1];
        const minDiff = differenceInMinutes(
          new Date(f.timestamp),
          new Date(last.timestamp),
        );
        if (f.tipo === last.tipo && minDiff < 5) {
          continue;
        }
        fichadasLimpias.push(f);
      }
    }

    const entrada = fichadasLimpias.find((f) => f.tipo === "ENTRADA");
    const salidas = fichadasLimpias.filter((f) => f.tipo === "SALIDA");
    const salida = salidas.length > 0 ? salidas[salidas.length - 1] : undefined;

    // 2. Determinar si es día laboral
    const diaSemana = fechaLocal.getDay();
    let diasLaborales = [];
    if (Array.isArray(horario.diasLaborales)) {
      diasLaborales = horario.diasLaborales;
    } else if (horario.diasLaborales?.dias) {
      diasLaborales = horario.diasLaborales.dias;
    }

    const esDiaLaboral = diasLaborales.includes(diaSemana);

    if (!esDiaLaboral) {
      if (entrada && salida) {
        const extra = differenceInMinutes(
          new Date(salida.timestamp),
          new Date(entrada.timestamp),
        );
        return {
          interpretacion: {
            empleadoId: empleado.id,
            fichadaId: entrada.id,
            fecha: fechaStr,
            resultado: {
              observaciones: "Fichada en día no laboral",
              esDiaLaboral: false,
            },
            minutosTardanza: 0,
            minutosExtra: extra,
            minutosDescansoExcedido: 0,
            estado: "CALCULADO",
          },
          novedades: [
            {
              empleadoId: empleado.id,
              tipo: "HORAS_EXTRA",
              fechaDesde: fechaStr,
              fechaHasta: fechaStr,
              cantidad: Math.floor(extra / 60),
              observaciones: "Asistencia en día no laboral",
              esAutomatica: true,
              estado: "PENDIENTE",
            },
          ],
        };
      }
      return this.crearFallback(
        empleado,
        fechaStr,
        "DIA_NO_LABORAL",
        "No debe asistir",
        entrada?.id,
      );
    }

    // Es día laboral
    const resultado: any = { esDiaLaboral: true };
    const novedades: any[] = [];

    if (!entrada) {
      // Ausencia! (asumiendo que ya terminó el día o estamos reprocesando un día pasado)
      const ahoraNeto = toZonedTime(new Date(), TZ);
      const isPastDay = fechaLocal.getTime() < startOfDay(ahoraNeto).getTime();

      if (isPastDay) {
        resultado.observaciones = "Ausencia detectada";
        novedades.push({
          empleadoId: empleado.id,
          tipo: "AUSENCIA",
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          cantidad: 1,
          observaciones: "Ausencia sin justificar detectada automáticamente",
          esAutomatica: true,
          estado: "PENDIENTE",
        });
      } else {
        resultado.observaciones = "Día en curso, sin entrada";
      }
      return {
        interpretacion: {
          empleadoId: empleado.id,
          fecha: fechaStr,
          resultado,
          minutosTardanza: 0,
          minutosExtra: 0,
          minutosDescansoExcedido: 0,
          estado: "CALCULADO",
        },
        novedades,
      };
    }

    // Entrada y Salida teóricas en la zona horaria objetivo
    const [hEnt, mEnt] = horario.horaEntrada.split(":");
    const expectedEntradaDate = fromZonedTime(
      `${fechaStr}T${hEnt}:${mEnt}:00`,
      TZ,
    );

    const [hSal, mSal] = horario.horaSalida.split(":");
    const expectedSalidaDate = fromZonedTime(
      `${fechaStr}T${hSal}:${mSal}:00`,
      TZ,
    );

    const entradaRealDate = new Date(entrada.timestamp);
    resultado.horaEntrada = formatTz(
      toZonedTime(entradaRealDate, TZ),
      "HH:mm",
      { timeZone: TZ },
    );

    let minutosTardanza = 0;
    let minutosExtra = 0;
    let minutosAnticipada = 0;

    const diffEntrada = differenceInMinutes(
      entradaRealDate,
      expectedEntradaDate,
    );
    if (diffEntrada > (config.toleranciaEntradaMinutos || 0)) {
      minutosTardanza = diffEntrada;
      resultado.tardanza = true;
      novedades.push({
        empleadoId: empleado.id,
        tipo: "TARDANZA",
        fechaDesde: fechaStr,
        fechaHasta: fechaStr,
        cantidad: Math.floor(minutosTardanza), // Guardamos en minutos la cantidad o en decimal horas
        observaciones: `Llegada tarde por ${minutosTardanza} minutos`,
        esAutomatica: true,
        estado: "PENDIENTE",
      });
    } else if (diffEntrada < 0) {
      // Llegada anterior a la teórica -> suma a minutos extra
      minutosExtra += Math.abs(diffEntrada);
    }

    if (salida) {
      resultado.horaSalida = formatTz(
        toZonedTime(new Date(salida.timestamp), TZ),
        "HH:mm",
        { timeZone: TZ },
      );
      const salidaRealDate = new Date(salida.timestamp);
      const diffSalida = differenceInMinutes(
        salidaRealDate,
        expectedSalidaDate,
      );

      if (diffSalida > (config.toleranciaSalidaMinutos || 0)) {
        minutosExtra += diffSalida;
      } else if (diffSalida < 0) {
        minutosAnticipada = Math.abs(diffSalida);
        resultado.salidaAnticipada = true;
        resultado.minutosSalidaAnticipada = minutosAnticipada;
        if (minutosAnticipada > (config.toleranciaSalidaMinutos || 15)) {
          novedades.push({
            empleadoId: empleado.id,
            tipo: "SALIDA_ANTICIPADA",
            fechaDesde: fechaStr,
            fechaHasta: fechaStr,
            cantidad: minutosAnticipada,
            observaciones: `Salió ${minutosAnticipada} minutos antes`,
            esAutomatica: true,
            estado: "PENDIENTE",
          });
        }
      }

      if (minutosExtra > 0) {
        resultado.horasExtra = true;
        // Solo generar Novedad si cumple umbral de horas extra
        if (minutosExtra > config.umbralHorasExtraMinutos) {
          novedades.push({
            empleadoId: empleado.id,
            tipo: "HORAS_EXTRA",
            fechaDesde: fechaStr,
            fechaHasta: fechaStr,
            cantidad: parseFloat((minutosExtra / 60).toFixed(2)), // En horas con dos decimales
            observaciones: `Horas extra: ${minutosExtra} mins (Llegada/Salida combinada)`,
            esAutomatica: true,
            estado: "PENDIENTE",
          });
        }
      }
    } else {
      resultado.observaciones = "Falta registrar salida";
    }

    return {
      interpretacion: {
        empleadoId: empleado.id,
        fichadaId: entrada.id,
        fecha: fechaStr,
        resultado,
        minutosTardanza,
        minutosExtra,
        minutosDescansoExcedido: 0,
        estado: "CALCULADO",
      },
      novedades,
    };
  }

  private crearFallback(
    empleado: any,
    fechaStr: string,
    estado: string,
    obs: string,
    fichadaId?: string,
  ) {
    return {
      interpretacion: {
        empleadoId: empleado.id,
        ...(fichadaId ? { fichadaId } : {}),
        fecha: fechaStr,
        resultado: { observaciones: obs, esDiaLaboral: false },
        minutosTardanza: 0,
        minutosExtra: 0,
        minutosDescansoExcedido: 0,
        estado,
      },
      novedades: [],
    };
  }
}
