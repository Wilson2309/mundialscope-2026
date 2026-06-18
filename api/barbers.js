import { supabase } from '../lib/supabase.js';
import { methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const { skill } = req.query;
    let query = supabase.from('staff').select('*').eq('active', true).order('name', { ascending: true });

    if (skill) {
      query = query.contains('skills', [String(skill)]);
    }

    const { data, error } = await query;
    if (error) throw error;
    send(res, 200, { error: false, data });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
