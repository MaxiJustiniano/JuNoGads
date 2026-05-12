// src/server/application/services/MotorDeReglas.ts
import { differenceInMinutes, parseISO, format } from 'date-fns';

export class MotorDeReglas {
  
  /**
   * Evalúa una fichada contra el horario del empleado y genera una interpretación.
   * @param fichada La fichada a evaluar
   * @param empleado El empleado con su horario asociado
   */
  public evaluar(fichada: any, empleado: any) {
    if (!empleado.horario) {
      return this.crearResultadoBase(fichada, 'HORARIO_NO_ASIGNADO', 'Empleado sin horario asignado');
    }

    const { horario } = empleado;
    const fichadaDate = new Date(fichada.timestamp);
    const fechaStr = format(fichadaDate, 'yyyy-MM-dd');
    
    // Obtener día de la semana (0 = DOMINGO, 1 = LUNES, ... 6 = SABADO)
    const diaSemana = fichadaDate.getDay();
    
    // Verificar si es día laboral
    const diasLaborales = horario.diasLaborales || [];
    const esDiaLaboral = diasLaborales.includes(diaSemana);
    
    if (!esDiaLaboral) {
      // Fichar en día no laboral (ej: feriado o fin de semana libre) -> Todo es hora extra o anormal
      return {
        fichadaId: fichada.id,
        empleadoId: empleado.id,
        fecha: fechaStr,
        resultado: {
          tipoFichada: fichada.tipo,
          esDiaLaboral: false,
          observaciones: 'Fichada en día no laboral'
        },
        minutosTardanza: 0,
        minutosExtra: 0, // Las horas extra completas se calculan al cerrar el día
        minutosDescansoExcedido: 0,
        estado: 'CALCULADO' // o 'REQUIERE_REVISION'
      };
    }

    // Lógica para días laborales
    const [horaEntExpected, minEntExpected] = horario.horaEntrada.split(':').map(Number);
    const expectedEntradaDate = new Date(fichadaDate);
    expectedEntradaDate.setHours(horaEntExpected, minEntExpected, 0, 0);

    const [horaSalExpected, minSalExpected] = horario.horaSalida.split(':').map(Number);
    const expectedSalidaDate = new Date(fichadaDate);
    expectedSalidaDate.setHours(horaSalExpected, minSalExpected, 0, 0);

    let minutosTardanza = 0;
    let minutosExtra = 0;
    let minutosDescansoExcedido = 0;
    
    const resultado: any = {
      tipoFichada: fichada.tipo,
    };

    if (fichada.tipo === 'ENTRADA') {
      const diffEntrada = differenceInMinutes(fichadaDate, expectedEntradaDate);
      if (diffEntrada > (horario.toleranciaEntrada || 0)) {
        minutosTardanza = diffEntrada;
        resultado.tardanza = true;
      } else {
        resultado.tardanza = false;
      }
    } else if (fichada.tipo === 'SALIDA') {
      const diffSalida = differenceInMinutes(fichadaDate, expectedSalidaDate);
      if (diffSalida > (horario.toleranciaSalida || 0)) {
        minutosExtra = diffSalida;
        resultado.horasExtra = true;
      } else if (diffSalida < 0) {
        // Salida anticipada
        resultado.salidaAnticipada = true;
        resultado.minutosSalidaAnticipada = Math.abs(diffSalida);
      }
    } else if (fichada.tipo === 'FIN_DESCANSO') {
      // Necesitaría calcular contra el INICIO_DESCANSO. 
      // Esta lógica en una pasada en tiempo real solo tiene contexto de 1 fichada.
      // Lo ideal es tener el contexto de las fichadas previas del mismo día
      resultado.requiereContextoDia = true;
    }

    return {
      fichadaId: fichada.id,
      empleadoId: empleado.id,
      fecha: fechaStr,
      resultado,
      minutosTardanza: Math.max(0, minutosTardanza),
      minutosExtra: Math.max(0, minutosExtra),
      minutosDescansoExcedido: Math.max(0, minutosDescansoExcedido),
      estado: 'CALCULADO'
    };
  }

  private crearResultadoBase(fichada: any, estado: string, obs: string) {
    return {
      fichadaId: fichada.id,
      empleadoId: fichada.empleadoId,
      fecha: format(new Date(fichada.timestamp), 'yyyy-MM-dd'),
      resultado: { observaciones: obs },
      minutosTardanza: 0,
      minutosExtra: 0,
      minutosDescansoExcedido: 0,
      estado
    };
  }
}
