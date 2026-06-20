import { supabase } from '../supabase.js';

export class NovedadRepository {
  async saveMany(novedades: any[]) {
    if (novedades.length === 0) return [];
    const { data: result, error } = await supabase
      .from('novedades')
      .insert(novedades)
      .select();
    
    if (error) throw error;
    return result;
  }

  async deleteByEmployeeAndDateRange(empleadoId: string, fromDate: string, toDate: string) {
    // Solo borramos las automáticas que no hayan sido procesadas (para reprocesamiento)
    const { error } = await supabase
      .from('novedades')
      .delete()
      .eq('empleadoId', empleadoId)
      .eq('esAutomatica', true)
      .eq('estado', 'PENDIENTE')
      .gte('fechaDesde', fromDate)
      .lte('fechaDesde', toDate);
    
    if (error) throw error;
  }
}
