import { supabase } from '../lib/supabase.js';
import { getFullAppointment, methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const code = String(req.query.code || '').toUpperCase();
    if (!code) {
      send(res, 422, { error: true, message: 'Indica el código.' });
      return;
    }
    const appointment = await getFullAppointment(supabase, code);
    if (!appointment) {
      send(res, 404, { error: true, message: 'Cita no encontrada.' });
      return;
    }

    const text = [
      'BarberFlow',
      `Código: ${appointment.code}`,
      `Cliente: ${appointment.client_name}`,
      `Servicios: ${appointment.services.map((item) => item.name).join(', ')}`,
      `Trabajador: ${appointment.staff_name}`,
      `Fecha: ${appointment.appointment_date}`,
      `Hora: ${appointment.start_time} - ${appointment.end_time}`,
      `Total: $${appointment.total_price.toFixed(2)}`
    ].join(' | ');

    send(res, 200, {
      error: false,
      data: {
        qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(text)}`,
        text
      }
    });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
