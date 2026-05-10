-- Tabla horarios
CREATE TABLE horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  "horaEntrada" text NOT NULL,
  "horaSalida" text NOT NULL,
  "toleranciaEntrada" int DEFAULT 0,
  "toleranciaSalida" int DEFAULT 0,
  "diasLaborales" jsonb DEFAULT '[]'
);

-- Tabla empleados
CREATE TABLE empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legajo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  apellido text NOT NULL,
  dni text UNIQUE NOT NULL,
  cuil text UNIQUE NOT NULL,
  "fechaIngreso" text,
  categoria text,
  "tipoJornada" text,
  estado text DEFAULT 'ACTIVO',
  "horarioId" uuid REFERENCES horarios(id)
);

-- Tabla fichadas
CREATE TABLE fichadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "empleadoId" uuid REFERENCES empleados(id),
  timestamp text NOT NULL,
  tipo text NOT NULL,
  origen text NOT NULL,
  "creadoPor" text,
  observaciones text
);

-- Tabla novedades
CREATE TABLE novedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "empleadoId" uuid REFERENCES empleados(id),
  tipo text NOT NULL,
  "fechaDesde" text NOT NULL,
  "fechaHasta" text,
  cantidad numeric,
  estado text NOT NULL DEFAULT 'PENDIENTE',
  observaciones text,
  "esAutomatica" boolean DEFAULT false,
  "createdAt" text DEFAULT round((EXTRACT(epoch FROM now()) * 1000))::text,
  trazabilidad jsonb
);

-- Insertar un horario por defecto (opcional, para que los empleados puedan ser asignados a uno al crearse)
INSERT INTO horarios (id, nombre, "horaEntrada", "horaSalida", "toleranciaEntrada", "toleranciaSalida", "diasLaborales") 
VALUES (
    '81109015-ab23-4f9c-ad98-b80c352bbded', 
    'Normal 09-18', 
    '09:00', 
    '18:00', 
    15, 
    0, 
    '[1, 2, 3, 4, 5]'
);
