import { supabase } from '../supabase.js';

export class EmployeeRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('empleados')
      .select('*, horario:horarios(*)');
    
    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('empleados')
      .select('*, horario:horarios(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(data: any) {
    const { data: result, error } = await supabase
      .from('empleados')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async update(id: string, data: any) {
    const { data: result, error } = await supabase
      .from('empleados')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
