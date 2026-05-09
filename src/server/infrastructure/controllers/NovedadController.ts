import { Request, Response } from "express";
import { supabase } from "../supabase";

export class NovedadController {
  getAll = async (req: Request, res: Response) => {
    try {
      const { data: novedades, error } = await supabase
        .from('novedades')
        .select('*, empleado:empleados(*)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      res.json(novedades);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const { data: novedad, error } = await supabase
        .from('novedades')
        .insert({
          ...req.body,
          fechaDesde: new Date(req.body.fechaDesde).toISOString(),
          fechaHasta: req.body.fechaHasta ? new Date(req.body.fechaHasta).toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(novedad);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;
      const { data: novedad, error } = await supabase
        .from('novedades')
        .update({ 
          estado, 
          observaciones,
          trazabilidad: { 
            action: 'STATUS_CHANGE', 
            to: estado, 
            at: new Date().toISOString() 
          }
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json(novedad);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
