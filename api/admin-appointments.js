import { supabase } from '../lib/supabase.js';
import { body, methodGuard, normalizeAppointment, send } from '../lib/helpers.js';

function isOwner(req) {
  return req.headers['x-owner-token'] === 'owner-ok';
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET', 'PATCH'])) return;
  if (!isOwner(req)) {
    send(res, 401, { error: true, message: 'No autorizado.' });
    return;
  }

  try {
    if (req.method === 'PATCH') {
      const input = await body(req);
      const code = String(req.query.code || input.code || '').toUpperCase();
      if (!code) {
        send(res, 422, { error: true, message: 'Indica el código.' });
        return;
      }
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('code', code);
      if (error) throw error;
      send(res, 200, { error: false, message: 'Cita cancelada.' });
      return;
    }

    const { date, status, staff_id: staffId } = req.query;
    let query = supabase.from('appointments').select('*, appointment_services(*)').order('appointment_date', { ascending: false }).order('start_time', { ascending: true });
    if (date) query = query.eq('appointment_date', String(date));
    if (status) query = query.eq('status', String(status));
    if (staffId) query = query.eq('staff_id', String(staffId));
    const { data, error } = await query;
    if (error) throw error;
    send(res, 200, { error: false, data: (data || []).map(normalizeAppointment) });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
