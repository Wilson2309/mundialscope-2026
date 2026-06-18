import { supabase } from '../lib/supabase.js';
import {
  availabilityFor,
  body,
  generateCode,
  getFullAppointment,
  methodGuard,
  minutesToTime,
  normalizeAppointment,
  send,
  timeToMinutes,
  validateBookingDate
} from '../lib/helpers.js';

async function listAppointments(req) {
  const { phone, code } = req.query;
  let query = supabase.from('appointments').select('*, appointment_services(*)').order('created_at', { ascending: false });
  if (phone) query = query.eq('phone', String(phone).replace(/\s+/g, ''));
  if (code) query = query.eq('code', String(code).toUpperCase());
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeAppointment);
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET', 'POST', 'PATCH'])) return;

  try {
    if (req.method === 'GET') {
      send(res, 200, { error: false, data: await listAppointments(req) });
      return;
    }

    if (req.method === 'PATCH') {
      const code = String(req.query.code || '').toUpperCase();
      if (!code) {
        send(res, 422, { error: true, message: 'Indica el código.' });
        return;
      }
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('code', code);
      if (error) throw error;
      send(res, 200, { error: false, message: 'Cita cancelada.', data: await getFullAppointment(supabase, code) });
      return;
    }

    const input = await body(req);
    const clientName = String(input.client_name || '').trim();
    const phone = String(input.phone || '').replace(/\s+/g, '');
    const email = String(input.email || '').trim();
    const serviceIds = Array.isArray(input.service_ids) ? input.service_ids : [];
    const staffId = String(input.staff_id || '');
    const date = String(input.appointment_date || '');
    const startTime = String(input.start_time || '').slice(0, 5);

    if (!clientName) throw new Error('Nombre obligatorio.');
    if (!phone) throw new Error('Teléfono obligatorio.');
    if (!serviceIds.length) throw new Error('Selecciona al menos un servicio.');
    if (!staffId) throw new Error('Trabajador obligatorio.');
    if (!date) throw new Error('Fecha obligatoria.');
    if (!startTime) throw new Error('Hora obligatoria.');

    await validateBookingDate(date);

    const { data: services, error: serviceError } = await supabase.from('services').select('*').in('id', serviceIds).eq('active', true);
    if (serviceError) throw serviceError;
    if (!services || services.length !== serviceIds.length) throw new Error('Uno de los servicios no existe.');

    const { data: staff, error: staffError } = await supabase.from('staff').select('*').eq('id', staffId).eq('active', true).maybeSingle();
    if (staffError) throw staffError;
    if (!staff) throw new Error('Trabajador no válido.');

    const totalDuration = services.reduce((sum, item) => sum + Number(item.duration), 0);
    const totalPrice = services.reduce((sum, item) => sum + Number(item.price), 0);
    const endTime = minutesToTime(timeToMinutes(startTime) + totalDuration);

    const availability = await availabilityFor(supabase, { date, staffId, duration: totalDuration });
    if (!availability.available.includes(startTime)) throw new Error('Ese horario no está disponible.');

    const code = await generateCode(supabase, date);
    const { data: appointment, error: insertError } = await supabase
      .from('appointments')
      .insert({
        code,
        client_name: clientName,
        phone,
        email,
        staff_id: staffId,
        staff_name: staff.name,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        total_duration: totalDuration,
        status: 'confirmed'
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    const serviceRows = services.map((service) => ({
      appointment_id: appointment.id,
      service_id: service.id,
      service_name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category
    }));
    const { error: serviceInsertError } = await supabase.from('appointment_services').insert(serviceRows);
    if (serviceInsertError) throw serviceInsertError;

    send(res, 201, { error: false, message: 'Cita confirmada.', data: await getFullAppointment(supabase, code) });
  } catch (error) {
    send(res, 422, { error: true, message: error.message });
  }
}
