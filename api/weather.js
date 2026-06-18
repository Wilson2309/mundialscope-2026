import { fetchJSON, methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-2.1894&longitude=-79.8891&current=temperature_2m,relative_humidity_2m,wind_speed_10m';
    const result = await fetchJSON(url);
    if (!result?.current) throw new Error('No se pudo consultar Open-Meteo.');

    send(res, 200, {
      error: false,
      meta: { source: 'open-meteo' },
      data: {
        temperature: result.current.temperature_2m,
        humidity: result.current.relative_humidity_2m,
        wind: result.current.wind_speed_10m
      }
    });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
