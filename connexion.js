// =================================
// CONNEXION CROQUY À SUPABASE
// =================================

const SUPABASE_URL = "https://oyzqzbpoesrjuopjyfkv.supabase.co";

const SUPABASE_KEY = "sb_publishable_MrnJ7ePcX5bnqSQ-cQ9D5w_d-dLJX5v";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("Connexion Supabase CROQUY initialisée !");