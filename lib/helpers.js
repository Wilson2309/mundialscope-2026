export const BASE_HOURS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30'
];

export function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-owner-token');
  res.end(JSON.stringify(payload, null, 2));
}

export function methodGuard(req, res, allowed) {
  if (req.method === 'OPTIONS') {
    send(res, 200, { error: false });
    return false;
  }
  if (!allowed.includes(req.method)) {
    send(res, 405, { error: true, message: 'Método no permitido.' });
    return false;
  }
  return true;
}

export function body(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export function timeToMinutes(time) {
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function overlaps(newStart, newEnd, existingStart, existingEnd) {
  return timeToMinutes(newStart) < timeToMinutes(existingEnd) && timeToMinutes(newEnd) > timeToMinutes(existingStart);
}

export function isSunday(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 0;
}

export async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': process.env.APP_USER_AGENT || 'BarberFlow/1.0'
    }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function getHolidays(year) {
  const data = await fetchJSON(`https://date.nager.at/api/v3/PublicHolidays/${year}/EC`);
  return Array.isArray(data) ? data : [];
}

export async function isHoliday(date) {
  const holidays = await getHolidays(date.slice(0, 4));
  return holidays.some((holiday) => holiday.date === date);
}

export async function validateBookingDate(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Fecha no válida.');
  }
  const today = new Date();
  const todayText = today.toISOString().slice(0, 10);
  if (date < todayText) throw new Error('No puedes agendar fechas pasadas.');
  if (isSunday(date)) throw new Error('No atendemos los domingos.');
  if (await isHoliday(date)) throw new Error('No se puede agendar en feriados de Ecuador.');
}

export function normalizeAppointment(row) {
  const services = row.appointment_services || row.services || [];
  return {
    id: row.id,
    code: row.code,
    client_name: row.client_name,
    phone: row.phone,
    email: row.email,
    staff_id: row.staff_id,
    staff_name: row.staff_name,
    appointment_date: row.appointment_date,
    start_time: String(row.start_time).slice(0, 5),
    end_time: String(row.end_time).slice(0, 5),
    total_price: Number(row.total_price),
    total_duration: Number(row.total_duration),
    status: row.status,
    created_at: row.created_at,
    services: services.map((service) => ({
      id: service.service_id || service.id,
      name: service.service_name || service.name,
      price: Number(service.price),
      duration: Number(service.duration),
      category: service.category
    }))
  };
}

export async function getFullAppointment(supabase, code) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, appointment_services(*)')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeAppointment(data) : null;
}

export async function generateCode(supabase, date) {
  const prefix = `BF-${date.replaceAll('-', '')}-`;
  const { data, error } = await supabase
    .from('appointments')
    .select('code')
    .eq('appointment_date', date)
    .like('code', `${prefix}%`)
    .order('code', { ascending: false })
    .limit(1);
  if (error) throw error;
  const last = data?.[0]?.code;
  const next = last ? Number(last.slice(-3)) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export async function availabilityFor(supabase, { date, staffId, duration }) {
  await validateBookingDate(date);
  const { data: staff, error: staffError } = await supabase.from('staff').select('*').eq('id', staffId).eq('active', true).maybeSingle();
  if (staffError) throw staffError;
  if (!staff) throw new Error('Trabajador no válido.');

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('start_time,end_time,status')
    .eq('staff_id', staffId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled');
  if (error) throw error;

  const workStart = timeToMinutes(staff.schedule_start);
  const workEnd = timeToMinutes(staff.schedule_end);
  const available = [];
  const blocked = [];

  for (const slot of BASE_HOURS) {
    const start = timeToMinutes(slot);
    const end = start + Number(duration);
    const endText = minutesToTime(end);
    const inSchedule = start >= workStart && end <= workEnd;
    const hasOverlap = (appointments || []).some((item) => overlaps(slot, endText, String(item.start_time).slice(0, 5), String(item.end_time).slice(0, 5)));
    if (inSchedule && !hasOverlap) available.push(slot);
    else blocked.push(slot);
  }

  return { available, blocked, staff };
}
