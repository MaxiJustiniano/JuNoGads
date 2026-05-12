import { EmployeeRepository } from '../../infrastructure/repositories/EmployeeRepository.js';
import * as XLSX from 'xlsx';
import { supabase } from '../../infrastructure/supabase.js';

export class EmployeeService {
  private repository: EmployeeRepository;

  constructor() {
    this.repository = new EmployeeRepository();
  }

  async getAllEmployees() {
    return this.repository.findAll();
  }

  async getEmployeeById(id: string) {
    return this.repository.findById(id);
  }

  async createEmployee(employeeData: any) {
    // Business logic validations here
    const cuil = employeeData.cuil || '';
    if (!cuil || typeof cuil !== 'string') {
      throw new Error("CUIL es requerido");
    }

    if (!cuil.includes("-")) {
      // Auto-format if it's just numbers and has length 11
      if (cuil.length === 11 && /^\d+$/.test(cuil)) {
        employeeData.cuil = `${cuil.substring(0, 2)}-${cuil.substring(2, 10)}-${cuil.substring(10)}`;
      } else {
        throw new Error("Formato de CUIL inválido (debe incluir guiones o tener 11 números)");
      }
    }
    
    console.log('Creando empleado con datos:', employeeData);
    return this.repository.create(employeeData);
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.repository.update(id, employeeData);
  }

  async deleteEmployee(id: string) {
    return this.repository.delete(id);
  }

  async generateTemplate(): Promise<Buffer> {
    const ws_name = "Empleados";
    const wb = XLSX.utils.book_new();

    const headers = [
      "legajo", "nombre", "apellido", "dni", "cuil", 
      "fechaIngreso", "categoriaLaboral", "tipoJornada", 
      "horarioAsignado", "estado"
    ];

    const exampleRow = {
      legajo: "EMP123",
      nombre: "Juan",
      apellido: "Pérez",
      dni: "30123456",
      cuil: "20-30123456-1",
      fechaIngreso: "2024-01-01",
      categoriaLaboral: "Administrativo",
      tipoJornada: "FULL_TIME",
      horarioAsignado: "Lunes a Viernes 9 a 18",
      estado: "ACTIVO"
    };

    const ws = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  async processImport(fileBuffer: Buffer): Promise<{ importedCount: number, errors: string[] }> {
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = XLSX.utils.sheet_to_json(ws);
    
    const errors: string[] = [];
    let importedCount = 0;
    
    const existingEmployees = await this.repository.findAll();
    const existingDnis = new Set(existingEmployees.map(e => e.dni));
    const existingLegajos = new Set(existingEmployees.map(e => e.legajo));

    // Fetch horarios from db to check names or assign default
    const { data: horarios } = await supabase.from('horarios').select('*');
    const defaultHorarioId = horarios && horarios.length > 0 ? horarios[0].id : null;

    for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        const rowNum = i + 2; // +1 for 0-index, +1 for header

        // Basic validation
        if (!row.nombre) { errors.push(`Fila ${rowNum}: Nombre es requerido`); continue; }
        if (!row.apellido) { errors.push(`Fila ${rowNum}: Apellido es requerido`); continue; }
        if (!row.dni) { errors.push(`Fila ${rowNum}: DNI es requerido`); continue; }
        if (!row.cuil) { errors.push(`Fila ${rowNum}: CUIL es requerido`); continue; }
        if (!row.legajo) { errors.push(`Fila ${rowNum}: Legajo es requerido`); continue; }

        if (existingDnis.has(String(row.dni))) { errors.push(`Fila ${rowNum}: DNI duplicado`); continue; }
        if (existingLegajos.has(String(row.legajo))) { errors.push(`Fila ${rowNum}: Legajo duplicado`); continue; }

        let horarioIdToUse = defaultHorarioId;
        if (row.horarioAsignado && horarios) {
            const matchH = horarios.find(h => h.nombre.toLowerCase().includes(String(row.horarioAsignado).toLowerCase()));
            if (matchH) horarioIdToUse = matchH.id;
        }

        try {
            const empData = {
                nombre: row.nombre,
                apellido: row.apellido,
                dni: String(row.dni),
                cuil: String(row.cuil),
                legajo: String(row.legajo),
                fechaIngreso: row.fechaIngreso || new Date().toISOString().split('T')[0],
                categoria: row.categoriaLaboral || 'Administrativo',
                tipoJornada: row.tipoJornada || 'FULL_TIME',
                estado: row.estado || 'ACTIVO',
                horarioId: horarioIdToUse
            };

            await this.createEmployee(empData);
            
            existingDnis.add(String(row.dni));
            existingLegajos.add(String(row.legajo));
            importedCount++;
        } catch (e: any) {
            errors.push(`Fila ${rowNum}: Error de validación - ${e.message}`);
        }
    }

    return { importedCount, errors };
  }
}
