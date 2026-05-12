import { Request, Response } from "express";
import { AttendanceService } from '../../application/services/AttendanceService.js';

export class AttendanceController {
  private service: AttendanceService;

  constructor() {
    this.service = new AttendanceService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const { empleadoId, tipo, origen, observaciones, creadoPor, timestamp } = req.body;
      
      const fichada = await this.service.registrarFichada({
        empleadoId,
        tipo,
        origen: origen || 'MANUAL',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
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
      const fichadas = await this.service.getRecent();
      res.json(fichadas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getInterpretaciones = async (req: Request, res: Response) => {
    try {
      const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : new Date().toISOString().split('T')[0];
      const interpretaciones = await this.service.getInterpretacionesByDate(fecha);
      res.json(interpretaciones);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
