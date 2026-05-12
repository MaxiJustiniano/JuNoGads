import { Request, Response } from 'express';
import { ScheduleService } from '../../application/services/ScheduleService.js';

export class ScheduleController {
  private service: ScheduleService;

  constructor() {
    this.service = new ScheduleService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const schedules = await this.service.getAllSchedules();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const schedule = await this.service.getScheduleById(req.params.id);
      if (!schedule) {
        return res.status(404).json({ error: 'Horario no encontrado' });
      }
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const schedule = await this.service.createSchedule(req.body);
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const schedule = await this.service.updateSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.deleteSchedule(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
