import { Request, Response } from "express";
import { EmployeeService } from '../../application/services/EmployeeService.js';

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

  downloadTemplate = async (req: Request, res: Response) => {
    try {
      const buffer = await this.service.generateTemplate();
      res.setHeader('Content-Disposition', 'attachment; filename="plantilla_empleados.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  importExcel = async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ status: 'error', message: 'No se subió ningún archivo' });
      
      const result = await this.service.processImport(file.buffer);
      
      if (result.errors && result.errors.length > 0) {
        return res.status(400).json({ status: 'error', errors: result.errors });
      }

      res.json({ status: 'success', message: `Se importaron ${result.importedCount} empleados correctamente.` });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
