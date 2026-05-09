import { Request, Response } from "express";
import { EmployeeService } from "../../application/services/EmployeeService";

export class EmployeeController {
  private service: EmployeeService;

  constructor() {
    this.service = new EmployeeService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const employees = await this.service.getAllEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const employee = await this.service.getEmployeeById(req.params.id);
      if (!employee) return res.status(404).json({ message: "No encontrado" });
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const employee = await this.service.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const employee = await this.service.updateEmployee(req.params.id, req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.deleteEmployee(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
