import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'local_data.json');

// Initialize mock DB
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    empleados: [],
    horarios: [],
    fichadas: [],
    interpretaciones: [],
    novedades: []
  }));
}

function getDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return { empleados: [], horarios: [], fichadas: [], interpretaciones: [], novedades: [] };
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

const mockSupabase = {
  from(table: string) {
    let query = {
      table,
      action: 'select',
      selects: '*',
      eqs: [] as any[],
      orderArgs: null as any,
      limitArg: null as number | null,
      payload: null as any,
      isSingle: false
    };

    const builder = {
      select(str = '*') {
        if (query.action !== 'insert' && query.action !== 'update') {
          query.action = 'select';
        }
        query.selects = str;
        return builder;
      },
      insert(data: any) {
        query.action = 'insert';
        query.payload = Array.isArray(data) ? data : [data];
        return builder;
      },
      update(data: any) {
        query.action = 'update';
        query.payload = data;
        return builder;
      },
      eq(col: string, val: any) {
        query.eqs.push({ col, val });
        return builder;
      },
      order(col: string, opts: any) {
        query.orderArgs = { col, ...opts };
        return builder;
      },
      limit(n: number) {
        query.limitArg = n;
        return builder;
      },
      single() {
        query.isSingle = true;
        return builder;
      },
      then(resolve: any, reject: any) {
        try {
          const db = getDb();
          if (!db[query.table]) db[query.table] = [];
          
          let result: any = null;

          if (query.action === 'select') {
            let list = [...db[query.table]];
            
            // Filters
            query.eqs.forEach(eq => {
              list = list.filter(item => item[eq.col] === eq.val);
            });

            // Relations
            if (query.selects.includes('horario:horarios')) {
              list = list.map(item => ({ ...item, horario: db.horarios?.find((h:any) => h.id === item.horarioId) || null }));
            }
            if (query.selects.includes('empleado:empleados')) {
              list = list.map(item => ({ ...item, empleado: db.empleados?.find((e:any) => e.id === item.empleadoId) || null }));
            }
            if (query.selects.includes('fichada:fichadas')) {
              list = list.map(item => ({ ...item, fichada: db.fichadas?.find((f:any) => f.id === item.fichadaId) || null }));
            }

            // Order
            if (query.orderArgs) {
              list.sort((a, b) => {
                const va = a[query.orderArgs.col];
                const vb = b[query.orderArgs.col];
                const mult = query.orderArgs.ascending ? 1 : -1;
                return va > vb ? mult : va < vb ? -mult : 0;
              });
            }

            // Limit
            if (query.limitArg) {
              list = list.slice(0, query.limitArg);
            }

            if (query.isSingle) {
              result = list[0] || null;
              if (!result && query.eqs.length > 0) throw new Error("Row not found");
            } else {
              result = list;
            }
          } else if (query.action === 'insert') {
            const inserted = query.payload.map((p:any) => ({ id: generateUUID(), ...p, createdAt: new Date().toISOString() }));
            db[query.table].push(...inserted);
            saveDb(db);
            result = query.isSingle ? inserted[0] : inserted;
          } else if (query.action === 'update') {
             let list = db[query.table];
             let updated = [];
             for (let i = 0; i < list.length; i++) {
                let match = query.eqs.every(eq => list[i][eq.col] === eq.val);
                if (match) {
                    list[i] = { ...list[i], ...query.payload };
                    updated.push(list[i]);
                }
             }
             saveDb(db);
             result = query.isSingle ? updated[0] || null : updated;
          }

          resolve({ data: result, error: null });
        } catch (e: any) {
          resolve({ data: null, error: { message: e.message || 'Error en operación DB mock' } });
        }
      }
    };
    return builder;
  }
};

export const supabase = mockSupabase as any;
export const getSupabase = () => supabase;

