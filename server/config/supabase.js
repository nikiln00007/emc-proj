const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
let supabasePublic = null;

if (supabaseUrl && supabaseSecretKey) {
  supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
  console.log('✅ Supabase admin client initialized');
} else {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SECRET_KEY not set — Supabase disabled');
}

if (supabaseUrl && supabasePublishableKey) {
  supabasePublic = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false },
  });
}

module.exports = { supabase, supabasePublic };
