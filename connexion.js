import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://oyzqzbpoesrjuopjyfkv.supabase.co";

const supabaseKey = "sb_publishable_MrnJ7ePcX5bnqSQ-cQ9D5w_d-dLJX5v";
const supabase = createClient(supabaseUrl, supabaseKey);

const formulaire = document.getElementById("formulaire-connexion");

formulaire.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const motdepasse = document.getElementById("motdepasse").value;

    const bouton = formulaire.querySelector("button");

    bouton.disabled = true;
    bouton.textContent = "Connexion en cours...";

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: motdepasse
    });

    if (error) {
        alert("Erreur de connexion : " + error.message);
    } else {
        alert("Connexion réussie ! Bienvenue dans CROQUY.");
    }

    bouton.disabled = false;
    bouton.textContent = "Se connecter";
});
