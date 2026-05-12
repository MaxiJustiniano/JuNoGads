import { supabase } from '../supabase.js';

export class InterpretacionRepository {
  async save(data: any) {
    const { data: result, error } = await supabase
      .from('interpretaciones')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async getByDate(fecha: string) {
    const { data, error } = await supabase
      .from('interpretaciones')
      .select('*, empleado:empleados(*), fichada:fichadas(*)')
      .eq('fecha', fecha);
    
    if (error) throw error;
    return data;
  }
}
