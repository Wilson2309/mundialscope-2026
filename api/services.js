import { supabase } from '../lib/supabase.js';
import { methodGuard, send } from '../lib/helpers.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    send(res, 200, { error: false, data });
  } catch (error) {
    send(res, 500, { error: true, message: error.message });
  }
}
