import { ScheduleRepository } from '../../infrastructure/repositories/ScheduleRepository.js';

export class ScheduleService {
  private repository: ScheduleRepository;

  constructor() {
    this.repository = new ScheduleRepository();
  }

  async getAllSchedules() {
    return this.repository.findAll();
  }

  async getScheduleById(id: string) {
    return this.repository.findById(id);
  }

  async createSchedule(data: any) {
    if (!data.nombre || !data.horaEntrada || !data.horaSalida) {
      throw new Error('Validación fallida: nombre, horaEntrada y horaSalida son requeridos');
    }
    // Basic validations
    if (data.toleranciaEntrada < 0 || data.toleranciaSalida < 0) {
      throw new Error('Validación fallida: las tolerancias no pueden ser negativas');
    }
    return this.repository.create(data);
  }

  async updateSchedule(id: string, data: any) {
    if (data.toleranciaEntrada !== undefined && data.toleranciaEntrada < 0) {
      throw new Error('Validación fallida: las tolerancias no pueden ser negativas');
    }
    return this.repository.update(id, data);
  }

  async deleteSchedule(id: string) {
    return this.repository.delete(id);
  }
}
