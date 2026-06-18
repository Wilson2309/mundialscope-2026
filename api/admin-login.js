import { body, methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

const input = await body(req);
  const password = String(input.password || '');
  const expected = process.env.OWNER_PASSWORD || 'admin123';

  if (password === expected) {
    send(res, 200, { error: false, token: 'owner-ok' });
    return;
  }

  send(res, 401, { error: true, message: 'Clave incorrecta.' });
}
