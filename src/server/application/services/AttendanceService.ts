import { AttendanceRepository } from '../../infrastructure/repositories/AttendanceRepository.js';
import { EmployeeRepository } from '../../infrastructure/repositories/EmployeeRepository.js';
import { InterpretacionRepository } from '../../infrastructure/repositories/InterpretacionRepository.js';
import { NovedadRepository } from '../../infrastructure/repositories/NovedadRepository.js';
import { RulesEngine } from './RulesEngine.js';
import { isSameDay, addDays, format, parseISO } from 'date-fns';

export class AttendanceService {
  private repository: AttendanceRepository;
  private employeeRepository: EmployeeRepository;
  private interpretacionRepo: InterpretacionRepository;
  private novedadRepo: NovedadRepository;
  private motorDeReglas: RulesEngine;

  constructor() {
    this.repository = new AttendanceRepository();
    this.employeeRepository = new EmployeeRepository();
    this.interpretacionRepo = new InterpretacionRepository();
    this.novedadRepo = new NovedadRepository();
    this.motorDeReglas = new RulesEngine();
  }

  async registrarFichada(data: any) {
    // 1. Guardar la fichada como inmutable
    const fichada = await this.repository.register(data);

    // 2. Reprocesar el día de esta fichada para generar la interpretación agrupada.
    if (data.empleadoId && data.timestamp) {
        const fecha = new Date(data.timestamp);
        const dayStr = format(fecha, 'yyyy-MM-dd');
        // Reprocesar de forma asincrónica o sincrónica, usamos la funcion de reprocesamiento para 1 dia
        await this.reprocesarPeriodo(data.empleadoId, dayStr, dayStr);
    }

    return fichada;
  }

  async getRecent() {
    return this.repository.getRecent(100);
  }

  async getInterpretacionesByDate(date: string) {
    return this.interpretacionRepo.getByDate(date);
  }

  /**
   * Reprocesa las fichadas crudas de un rango de tiempo, pasando todo de nuevo
   * por el motor de reglas y recreando las interpretaciones y novedades automáticas.
   */
  async reprocesarPeriodo(empleadoId: string, fromDateStr: string, toDateStr: string) {
    console.log(`Reprocesando ${empleadoId} de ${fromDateStr} a ${toDateStr}`);
    const empleado = await this.employeeRepository.findById(empleadoId);
    if (!empleado) throw new Error("Empleado no encontrado");

    // Borramos interpretaciones viejas y novedades automaticas pendientes
    await this.interpretacionRepo.deleteByEmployeeAndDateRange(empleadoId, fromDateStr, toDateStr);
    await this.novedadRepo.deleteByEmployeeAndDateRange(empleadoId, fromDateStr, toDateStr);

    const fromDate = parseISO(fromDateStr);
    const toDate = parseISO(toDateStr);
    
    // Obtenemos todas las fichadas en el periodo
    // Aseguramos cubrir el día inicial desde la 00:00 y hasta el final de toDate
    const timeFrom = format(fromDate, "yyyy-MM-dd'T'00:00:00.000XXX");
    const timeTo = format(toDate, "yyyy-MM-dd'T'23:59:59.999XXX");
    const fichadasRango = await this.repository.findByEmployeeAndDateRange(empleadoId, timeFrom, timeTo);

    // Iterar por día
    let actualDate = new Date(timeFrom);
    const endDate = new Date(timeTo);

    while (actualDate <= endDate) {
      // Filtrar fichadas exactas de 'actualDate'
      const fichadasDia = fichadasRango.filter(f => isSameDay(new Date(f.timestamp), actualDate));
      
      const { interpretacion, novedades } = this.motorDeReglas.evaluarDia(actualDate, empleado, fichadasDia);
      
      // Upsert/Insert
      await this.interpretacionRepo.save(interpretacion);
      if (novedades.length > 0) {
        await this.novedadRepo.saveMany(novedades);
      }

      actualDate = addDays(actualDate, 1);
    }

    return { message: 'Reprocesamiento exitoso' };
  }
}
