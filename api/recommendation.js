import { supabase } from '../lib/supabase.js';
import { availabilityFor, methodGuard, send } from '../lib/helpers.js';

function rankStaff(staff, categories, availabilityOk, dayCount) {
  const skills = staff.skills || [];
  const matched = categories.filter((category) => skills.includes(category)).length;
  const skillScore = categories.length ? matched / categories.length : 0;
  return Math.min(100, Math.round((skillScore * 80) + (availabilityOk ? 15 : 0) + Math.max(0, 5 - Math.min(5, dayCount))));
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const ids = String(req.query.service_ids || '').split(',').map((id) => id.trim()).filter(Boolean);
    const date = req.query.date ? String(req.query.date) : null;
    const time = req.query.time ? String(req.query.time) : null;

    if (!ids.length) {
      send(res, 422, { error: true, message: 'Selecciona servicios.' });
      return;
    }

    const { data: services, error: serviceError } = await supabase.from('services').select('*').in('id', ids).eq('active', true);
    if (serviceError) throw serviceError;
    if (!services?.length) throw new Error('Servicios no válidos.');

    const duration = services.reduce((sum, item) => sum + Number(item.duration), 0);
    const categories = [...new Set(services.map((item) => item.category))];
    const { data: staff, error: staffError } = await supabase.from('staff').select('*').eq('active', true);
    if (staffError) throw staffError;

    let appointments = [];
    if (date) {
      const { data, error } = await supabase.from('appointments').select('staff_id,status').eq('appointment_date', date).neq('status', 'cancelled');
      if (error) throw error;
      appointments = data || [];
    }

    const ranked = [];
    for (const worker of staff || []) {
      let availabilityOk = true;
      if (date && time) {
        try {
          const slots = await availabilityFor(supabase, { date, staffId: worker.id, duration });
          availabilityOk = slots.available.includes(time);
        } catch {
          availabilityOk = false;
        }
      }
      const dayCount = appointments.filter((item) => item.staff_id === worker.id).length;
      ranked.push({
        id: worker.id,
        name: worker.name,
        role: worker.role,
        specialty: worker.specialty,
        match: rankStaff(worker, categories, availabilityOk, dayCount),
        available: availabilityOk,
        day_count: dayCount
      });
    }

    ranked.sort((a, b) => b.match - a.match || a.day_count - b.day_count);
    send(res, 200, {
      error: false,
      data: {
        recommended: ranked[0] || null,
        alternatives: ranked.slice(1, 5)
      }
    });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
