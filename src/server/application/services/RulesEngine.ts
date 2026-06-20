import { differenceInMinutes, format, isSameDay, startOfDay, addMinutes } from 'date-fns';

export interface Fichada {
  id: string;
  empleadoId: string;
  timestamp: string;
  tipo: 'ENTRADA' | 'SALIDA' | 'FIN_DESCANSO' | 'INICIO_DESCANSO';
}

export class RulesEngine {
  
  /**
   * Procesa un día completo de fichadas para un empleado
   * Limpia dobles fichadas, calcula tiempos y devuelve interpretación + Novedades a crear
   */
  public evaluarDia(fecha: Date, empleado: any, fichadasDelDia: Fichada[]) {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    
    if (!empleado.horarioBase && (!empleado.horario || typeof empleado.horario !== 'object')) {
      return this.crearFallback(empleado, fechaStr, 'HORARIO_NO_ASIGNADO', 'Empleado sin horario');
    }
    
    // Resolve horario from multiple possibilities
    const horario = Array.isArray(empleado.horario) 
      ? empleado.horario[0] 
      : (empleado.horario || empleado.horarioBase);

    // 1. Limpieza de fichadas (unificar / ignorar duplicadas)
    // Ordenamos cronológicamente
    let sorted = [...fichadasDelDia].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Filtrar duplicados rápidos (ej: dos ENTRADA con menos de 5 mins de diferencia)
    const fichadasLimpias: Fichada[] = [];
    for (const f of sorted) {
      if (fichadasLimpias.length === 0) {
        fichadasLimpias.push(f);
      } else {
        const last = fichadasLimpias[fichadasLimpias.length - 1];
        const minDiff = differenceInMinutes(new Date(f.timestamp), new Date(last.timestamp));
        if (f.tipo === last.tipo && minDiff < 5) {
          // Es un rebote / doble fichada intencional rápida -> Lo ignoramos
          continue;
        }
        fichadasLimpias.push(f);
      }
    }

    const entrada = fichadasLimpias.find(f => f.tipo === 'ENTRADA');
    // Tomamos la última salida
    const salidas = fichadasLimpias.filter(f => f.tipo === 'SALIDA');
    const salida = salidas.length > 0 ? salidas[salidas.length - 1] : undefined;

    // 2. Determinar si es día laboral
    const diaSemana = fecha.getDay();
    let diasLaborales = [];
    if (Array.isArray(horario.diasLaborales)) {
      diasLaborales = horario.diasLaborales;
    } else if (horario.diasLaborales?.dias) {
      diasLaborales = horario.diasLaborales.dias;
    }

    const esDiaLaboral = diasLaborales.includes(diaSemana);

    if (!esDiaLaboral) {
      if (entrada && salida) {
        const extra = differenceInMinutes(new Date(salida.timestamp), new Date(entrada.timestamp));
        return {
          interpretacion: {
            empleadoId: empleado.id,
            fichadaId: entrada.id,
            fecha: fechaStr,
            resultado: { observaciones: 'Fichada en día no laboral' },
            minutosTardanza: 0,
            minutosExtra: extra,
            minutosDescansoExcedido: 0,
            estado: 'CALCULADO'
          },
          novedades: [{
            empleadoId: empleado.id,
            tipo: 'HORAS_EXTRA',
            fechaDesde: fechaStr,
            fechaHasta: fechaStr,
            cantidad: Math.floor(extra / 60),
            observaciones: 'Asistencia en día no laboral',
            esAutomatica: true,
            estado: 'PENDIENTE'
          }]
        };
      }
      return this.crearFallback(empleado, fechaStr, 'DIA_NO_LABORAL', 'No debe asistir', entrada?.id);
    }

    // Es día laboral
    const resultado: any = {};
    const novedades: any[] = [];
    
    if (!entrada) {
      // Ausencia! (asumiendo que ya terminó el día o estamos reprocesando un día pasado)
      const isPastDay = new Date(fechaStr).getTime() < startOfDay(new Date()).getTime();
      if (isPastDay) {
        resultado.observaciones = 'Ausencia detectada';
        novedades.push({
          empleadoId: empleado.id,
          tipo: 'AUSENCIA',
          fechaDesde: fechaStr,
          fechaHasta: fechaStr,
          cantidad: 1,
          observaciones: 'Ausencia sin justificar detectada automáticamente',
          esAutomatica: true,
          estado: 'PENDIENTE'
        });
      } else {
        resultado.observaciones = 'Día en curso, sin entrada';
      }
      return {
        interpretacion: {
          empleadoId: empleado.id,
          fecha: fechaStr,
          resultado,
          minutosTardanza: 0, minutosExtra: 0, minutosDescansoExcedido: 0, estado: 'CALCULADO'
        },
        novedades
      };
    }

    // Entrada teórica
    const [hEnt, mEnt] = horario.horaEntrada.split(':').map(Number);
    const expectedEntrada = new Date(fecha);
    expectedEntrada.setHours(hEnt, mEnt, 0, 0);

    const [hSal, mSal] = horario.horaSalida.split(':').map(Number);
    const expectedSalida = new Date(fecha);
    expectedSalida.setHours(hSal, mSal, 0, 0);

    let minutosTardanza = 0;
    let minutosExtra = 0;
    let minutosAnticipada = 0;

    const diffEntrada = differenceInMinutes(new Date(entrada.timestamp), expectedEntrada);
    if (diffEntrada > (horario.toleranciaEntrada || 0)) {
      minutosTardanza = diffEntrada;
      resultado.tardanza = true;
      novedades.push({
        empleadoId: empleado.id,
        tipo: 'TARDANZA',
        fechaDesde: fechaStr,
        fechaHasta: fechaStr,
        cantidad: Math.floor(minutosTardanza), // Guardamos en minutos la cantidad o en decimal horas
        observaciones: `Llegada tarde por ${minutosTardanza} minutos`,
        esAutomatica: true,
        estado: 'PENDIENTE'
      });
    }

    if (salida) {
      const diffSalida = differenceInMinutes(new Date(salida.timestamp), expectedSalida);
      if (diffSalida > (horario.toleranciaSalida || 0)) {
        minutosExtra = diffSalida;
        resultado.horasExtra = true;
        // Solo generar Novedad si cumple unbral de horas extra (e.g. > 30 mins)
        if (minutosExtra > 30) {
          novedades.push({
            empleadoId: empleado.id,
            tipo: 'HORAS_EXTRA',
            fechaDesde: fechaStr,
            fechaHasta: fechaStr,
            cantidad: Math.floor(minutosExtra / 60), // En horas 
            observaciones: `Horas extra: ${minutosExtra} mins`,
            esAutomatica: true,
            estado: 'PENDIENTE'
          });
        }
      } else if (diffSalida < 0) {
        minutosAnticipada = Math.abs(diffSalida);
        resultado.salidaAnticipada = true;
        if (minutosAnticipada > 15) {
            novedades.push({
              empleadoId: empleado.id,
              tipo: 'SALIDA_ANTICIPADA',
              fechaDesde: fechaStr,
              fechaHasta: fechaStr,
              cantidad: minutosAnticipada,
              observaciones: `Salió ${minutosAnticipada} minutos antes`,
              esAutomatica: true,
              estado: 'PENDIENTE'
            });
        }
      }
    } else {
      resultado.observaciones = 'Falta registrar salida';
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
        estado: 'CALCULADO'
      },
      novedades
    };
  }

  private crearFallback(empleado: any, fechaStr: string, estado: string, obs: string, fichadaId?: string) {
    return {
      interpretacion: {
        empleadoId: empleado.id,
        ...(fichadaId ? { fichadaId } : {}),
        fecha: fechaStr,
        resultado: { observaciones: obs },
        minutosTardanza: 0,
        minutosExtra: 0,
        minutosDescansoExcedido: 0,
        estado
      },
      novedades: []
    };
  }
}
