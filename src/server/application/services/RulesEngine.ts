interface Fichada {
  id: string;
  empleadoId: string;
  timestamp: string | Date;
  tipo: 'IN' | 'OUT';
}

interface Horario {
  horaEntrada: string;
  horaSalida: string;
  diasLaborales: string;
  toleranciaEntrada: number;
}

interface Empleado {
  id: string;
  nombre: string;
  estado: string;
}

import { 
  parse, 
  setHours, 
  setMinutes, 
  differenceInMinutes, 
  isBefore, 
  isAfter,
  addMinutes,
  isSameDay,
  startOfDay,
  endOfDay
} from "date-fns";

export interface RuleOutput {
  novedades: string[];
  horasTrabajadas: number;
  tardanzaMinutes: number;
  extraMinutes: number;
  esAusencia: boolean;
  salidaAnticipadaMinutes: number;
}

export class RulesEngine {
  static interpret(
    empleado: Empleado & { horario: Horario },
    fichadas: Fichada[],
    fecha: Date
  ): RuleOutput {
    const output: RuleOutput = {
      novedades: [],
      horasTrabajadas: 0,
      tardanzaMinutes: 0,
      extraMinutes: 0,
      esAusencia: false,
      salidaAnticipadaMinutes: 0
    };

    // 1. Filtrar fichadas del día
    const fichadasDia = fichadas.filter(f => isSameDay(new Date(f.timestamp), fecha));
    const entrada = fichadasDia.find(f => f.tipo === 'IN');
    const salida = fichadasDia.find(f => f.tipo === 'OUT');

    // 2. Check si es día laboral
    const diaSemana = fecha.getDay(); // 0 (Dom) a 6 (Sab)
    const diasLaborales = empleado.horario.diasLaborales.split(',').map(Number);
    const esDiaLaboral = diasLaborales.includes(diaSemana);

    if (!esDiaLaboral) {
      // Si no es laboral pero hay fichadas -> Todo es horas extra
      if (entrada && salida) {
        output.extraMinutes = differenceInMinutes(new Date(salida.timestamp), new Date(entrada.timestamp));
        output.novedades.push('HORA_EXTRA_100_SAD');
      }
      return output;
    }

    // 3. Detectar Ausencia
    if (!entrada) {
      output.esAusencia = true;
      output.novedades.push('AUSENCIA');
      return output;
    }

    // 4. Analizar Entrada (Tardanza)
    const [hEnt, mEnt] = empleado.horario.horaEntrada.split(':').map(Number);
    const entradaTeorica = setMinutes(setHours(startOfDay(fecha), hEnt), mEnt);
    const entradaReal = new Date(entrada.timestamp);
    const limiteTolerancia = addMinutes(entradaTeorica, empleado.horario.toleranciaEntrada);

    if (isAfter(entradaReal, limiteTolerancia)) {
      output.tardanzaMinutes = differenceInMinutes(entradaReal, entradaTeorica);
      output.novedades.push('TARDANZA');
    }

    // 5. Analizar Salida (Si existe)
    if (salida) {
      const [hSal, mSal] = empleado.horario.horaSalida.split(':').map(Number);
      const salidaTeorica = setMinutes(setHours(startOfDay(fecha), hSal), mSal);
      const salidaReal = new Date(salida.timestamp);

      // Horas Extra
      if (isAfter(salidaReal, salidaTeorica)) {
        output.extraMinutes = differenceInMinutes(salidaReal, salidaTeorica);
        if (output.extraMinutes > 30) { // Umbral configurable
          output.novedades.push('HORA_EXTRA_50');
        }
      }

      // Salida Anticipada
      if (isBefore(salidaReal, salidaTeorica)) {
        output.salidaAnticipadaMinutes = differenceInMinutes(salidaTeorica, salidaReal);
        output.novedades.push('SALIDA_ANTICIPADA');
      }

      output.horasTrabajadas = differenceInMinutes(salidaReal, entradaReal) / 60;
    } else {
      // Falta fichada de salida
      output.novedades.push('FALTA_FICHA_SALIDA');
    }

    return output;
  }
}
