import { EmployeeRepository } from "../../infrastructure/repositories/EmployeeRepository";

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
}
