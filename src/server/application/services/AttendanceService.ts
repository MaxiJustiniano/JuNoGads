import { AttendanceRepository } from "../../infrastructure/repositories/AttendanceRepository.js";
import { EmployeeRepository } from "../../infrastructure/repositories/EmployeeRepository.js";
import { InterpretacionRepository } from "../../infrastructure/repositories/InterpretacionRepository.js";
import { NovedadRepository } from "../../infrastructure/repositories/NovedadRepository.js";
import { RulesEngine } from "./RulesEngine.js";
import { addDays } from "date-fns";
import { format as formatTz, toZonedTime } from "date-fns-tz";
import { supabase } from "../../infrastructure/supabase.js";

const TZ = "America/Argentina/Buenos_Aires";

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
      const fechaLocal = toZonedTime(new Date(data.timestamp), TZ);
      const dayStr = formatTz(fechaLocal, "yyyy-MM-dd", { timeZone: TZ });
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
  async reprocesarPeriodo(
    empleadoId: string,
    fromDateStr: string,
    toDateStr: string,
  ) {
    console.log(`Reprocesando ${empleadoId} de ${fromDateStr} a ${toDateStr}`);
    const empleado = await this.employeeRepository.findById(empleadoId);
    if (!empleado) throw new Error("Empleado no encontrado");

    // Borramos interpretaciones viejas y novedades automaticas pendientes
    await this.interpretacionRepo.deleteByEmployeeAndDateRange(
      empleadoId,
      fromDateStr,
      toDateStr,
    );
    await this.novedadRepo.deleteByEmployeeAndDateRange(
      empleadoId,
      fromDateStr,
      toDateStr,
    );

    // Para evitar problemas de offset con parseISO, podemos crear las fechas de busqueda extremas
    // ej fromDateStr="2026-06-20", busquemos desde las 00:00 local hasta las 23:59 del final
    const timeFrom = `${fromDateStr}T00:00:00.000-03:00`; // TZ Offset de AR (-03:00)
    const timeTo = `${toDateStr}T23:59:59.999-03:00`;

    // Obtenemos todas las fichadas en el periodo
    const fichadasRango = await this.repository.findByEmployeeAndDateRange(
      empleadoId,
      timeFrom,
      timeTo,
    );

    // Fetch global config
    let globalConfig = null;
    const { data: globalConfigData, error: errConfig } = await supabase
      .from("configuracion_global")
      .select("*")
      .eq("id", 1)
      .single();

    if (!errConfig && globalConfigData) {
      globalConfig = globalConfigData;
    } else {
      const fs = await import("fs");
      const path = await import("path");
      const CONFIG_FILE = path.join(process.cwd(), "configuracion.json");
      if (fs.existsSync(CONFIG_FILE)) {
        globalConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      }
    }

    // Iterar por día
    let actualDateStr = fromDateStr;
    let actualDate = new Date(`${actualDateStr}T12:00:00Z`); // Mediodía para evitar cruces
    const endDate = new Date(`${toDateStr}T12:00:00Z`);

    while (actualDate <= endDate) {
      const currentDayStr = formatTz(
        toZonedTime(actualDate, TZ),
        "yyyy-MM-dd",
        { timeZone: TZ },
      );

      // Filtrar fichadas exactas de 'currentDayStr'
      const fichadasDia = fichadasRango.filter((f) => {
        const localF = toZonedTime(new Date(f.timestamp), TZ);
        return (
          formatTz(localF, "yyyy-MM-dd", { timeZone: TZ }) === currentDayStr
        );
      });

      const { interpretacion, novedades } = this.motorDeReglas.evaluarDia(
        actualDate,
        empleado,
        fichadasDia,
        globalConfig,
      );

      // Upsert/Insert
      await this.interpretacionRepo.save(interpretacion);
      if (novedades.length > 0) {
        await this.novedadRepo.saveMany(novedades);
      }

      actualDate = addDays(actualDate, 1);
    }

    return { message: "Reprocesamiento exitoso" };
  }
}
