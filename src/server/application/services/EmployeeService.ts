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
    if (!employeeData.cuil.includes("-")) {
      throw new Error("Formato de CUIL inválido");
    }
    return this.repository.create(employeeData);
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.repository.update(id, employeeData);
  }

  async deleteEmployee(id: string) {
    return this.repository.delete(id);
  }
}
