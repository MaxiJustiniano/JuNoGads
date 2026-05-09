import { Request, Response } from "express";
import { AttendanceRepository } from "../repositories/AttendanceRepository";

export class AttendanceController {
  private repository: AttendanceRepository;

  constructor() {
    this.repository = new AttendanceRepository();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { empleadoId, tipo, origen, observaciones, creadoPor } = req.body;
      
      const fichada = await this.repository.register({
        empleadoId,
        tipo,
        origen: origen || 'MANUAL',
        timestamp: new Date(),
        creadoPor: creadoPor || 'system',
        observaciones
      });

      res.status(201).json(fichada);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getRecent = async (req: Request, res: Response) => {
    try {
      const fichadas = await this.repository.getRecent();
      res.json(fichadas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
