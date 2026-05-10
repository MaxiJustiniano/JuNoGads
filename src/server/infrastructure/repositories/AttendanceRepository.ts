import { supabase } from '../supabase.js';

export class AttendanceRepository {
  async register(data: any) {
    const { data: result, error } = await supabase
      .from('fichadas')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  async findByEmployee(empleadoId: string, limit = 50) {
    const { data, error } = await supabase
      .from('fichadas')
      .select('*')
      .eq('empleadoId', empleadoId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getRecent(limit = 20) {
    const { data, error } = await supabase
      .from('fichadas')
      .select('*, empleado:empleados(*)')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}
