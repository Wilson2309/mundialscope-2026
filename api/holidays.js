import { getHolidays, methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const year = Number(req.query.year || new Date().getFullYear());
    if (year < 2020 || year > 2100) {
      send(res, 422, { error: true, message: 'Año no válido.' });
      return;
    }

    const data = await getHolidays(year);
    send(res, 200, {
      error: false,
      meta: { source: 'nager-date', year },
      data
    });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
