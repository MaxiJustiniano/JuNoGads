import { supabase } from '../supabase.js';

export class ScheduleRepository {
  async findAll() {
    const { data, error } = await supabase
      .from('horarios')
      .select('*');
    if (error) throw error;
    return data.map(this.mapToEntity);
  }

  async findById(id: string) {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return this.mapToEntity(data);
  }

  async create(scheduleData: any) {
    const dbPayload = this.mapToDb(scheduleData);
    const { data: result, error } = await supabase
      .from('horarios')
      .insert(dbPayload)
      .select()
      .single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async update(id: string, scheduleData: any) {
    const dbPayload = this.mapToDb(scheduleData);
    const { data: result, error } = await supabase
      .from('horarios')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapToEntity(result);
  }

  async delete(id: string) {
    // Soft delete via metadata in diasLaborales if needed, but standard is just update
    // Let's do a soft delete setting estado = INACTIVO
    const existing = await this.findById(id);
    existing.estado = 'INACTIVO';
    return this.update(id, existing);
  }

  private mapToDb(entity: any) {
    // Pack extra fields into diasLaborales jsonb to avoid schema changes
    const config = {
      dias: entity.diasLaborales || [],
      tipoJornada: entity.tipoJornada || 'TURNO_FIJO',
      tiempoMinimoDescanso: entity.tiempoMinimoDescanso || 0,
      umbralHorasExtra: entity.umbralHorasExtra || 8,
      estado: entity.estado || 'ACTIVO'
    };

    return {
      nombre: entity.nombre,
      horaEntrada: entity.horaEntrada,
      horaSalida: entity.horaSalida,
      toleranciaEntrada: entity.toleranciaEntrada || 0,
      toleranciaSalida: entity.toleranciaSalida || 0,
      diasLaborales: config
    };
  }

  private mapToEntity(dbRecord: any) {
    // Unpack
    let config: any = {
      dias: [1,2,3,4,5],
      tipoJornada: 'TURNO_FIJO',
      tiempoMinimoDescanso: 0,
      umbralHorasExtra: 8,
      estado: 'ACTIVO'
    };
    if (Array.isArray(dbRecord.diasLaborales)) {
      config.dias = dbRecord.diasLaborales;
    } else if (dbRecord.diasLaborales && typeof dbRecord.diasLaborales === 'object') {
      config = { ...config, ...dbRecord.diasLaborales };
    }

    return {
      id: dbRecord.id,
      nombre: dbRecord.nombre,
      horaEntrada: dbRecord.horaEntrada,
      horaSalida: dbRecord.horaSalida,
      toleranciaEntrada: dbRecord.toleranciaEntrada,
      toleranciaSalida: dbRecord.toleranciaSalida,
      diasLaborales: config.dias,
      tipoJornada: config.tipoJornada,
      tiempoMinimoDescanso: config.tiempoMinimoDescanso,
      umbralHorasExtra: config.umbralHorasExtra,
      estado: config.estado
    };
  }
}
