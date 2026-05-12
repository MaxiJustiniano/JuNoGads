import { AttendanceRepository } from '../../infrastructure/repositories/AttendanceRepository.js';
import { EmployeeRepository } from '../../infrastructure/repositories/EmployeeRepository.js';
import { InterpretacionRepository } from '../../infrastructure/repositories/InterpretacionRepository.js';
import { MotorDeReglas } from './MotorDeReglas.js';

export class AttendanceService {
  private repository: AttendanceRepository;
  private employeeRepository: EmployeeRepository;
  private interpretacionRepo: InterpretacionRepository;
  private motorDeReglas: MotorDeReglas;

  constructor() {
    this.repository = new AttendanceRepository();
    this.employeeRepository = new EmployeeRepository();
    this.interpretacionRepo = new InterpretacionRepository();
    this.motorDeReglas = new MotorDeReglas();
  }

  async registrarFichada(data: any) {
    // 1. Guardar la fichada como inmutable
    const fichada = await this.repository.register(data);

    // 2. Obtener el empleado con su horario
    let empleado;
    try {
      empleado = await this.employeeRepository.findById(data.empleadoId);
    } catch (e) {
      console.warn(`No se encontró el empleado ${data.empleadoId}`);
    }

    // 3. Pasar por el motor de reglas
    if (empleado) {
      const interpretacion = this.motorDeReglas.evaluar(fichada, empleado);
      
      // 4. Guardar interpretación
      await this.interpretacionRepo.save(interpretacion);
    }

    return fichada;
  }

  async getRecent() {
    return this.repository.getRecent(100);
  }

  async getInterpretacionesByDate(date: string) {
    return this.interpretacionRepo.getByDate(date);
  }
}
