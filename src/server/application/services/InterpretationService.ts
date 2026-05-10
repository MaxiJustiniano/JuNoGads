import { RulesEngine } from './RulesEngine.js';
import { supabase } from '../../infrastructure/supabase.js';
import { eachDayOfInterval } from "date-fns";

export class InterpretationService {
  async processPeriod(startDate: Date, endDate: Date) {
    const { data: empleados, error: empError } = await supabase
      .from('empleados')
      .select('*, horario:horarios(*), fichadas:fichadas(*)')
      .eq('estado', 'ACTIVO');

    if (empError) throw empError;

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const results = [];

    for (const em of empleados as any[]) {
      for (const day of days) {
        const interpretation = RulesEngine.interpret(em, em.fichadas, day);
        const dayStr = day.toISOString().split('T')[0];
        
        const entradaReal = em.fichadas.find((f: any) => 
          f.tipo === 'IN' && new Date(f.timestamp).toISOString().split('T')[0] === dayStr
        )?.timestamp || null;

        const salidaReal = em.fichadas.find((f: any) => 
          f.tipo === 'OUT' && new Date(f.timestamp).toISOString().split('T')[0] === dayStr
        )?.timestamp || null;

        const { data: result, error: upsertError } = await supabase
          .from('interpretaciones')
          .upsert({
            id: `${em.id}-${day.getTime()}`,
            empleadoId: em.id,
            fecha: day.toISOString(),
            novedades: interpretation.novedades,
            entradaReal,
            salidaReal
          })
          .select()
          .single();

        if (upsertError) throw upsertError;
        results.push(result);
      }
    }
    return results;
  }
}
