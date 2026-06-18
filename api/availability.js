import { supabase } from '../lib/supabase.js';
import { availabilityFor, methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const date = String(req.query.date || '');
    const staffId = String(req.query.staff_id || '');
    const duration = Number(req.query.duration || 0);

    if (!date || !staffId || duration <= 0) {
      send(res, 422, { error: true, message: 'Indica date, staff_id y duration.' });
      return;
    }

    const data = await availabilityFor(supabase, { date, staffId, duration });
    send(res, 200, {
      error: false,
      data: {
        available: data.available,
        blocked: data.blocked,
        staff: data.staff
      }
    });
  } catch (error) {
    send(res, 422, { error: true, message: error.message });
  }
}
