import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://oyzqzbpoesrjuopjyfkv.supabase.co";

const supabaseKey = "sb_publishable_MrnJ7ePcX5bnqSQ-cQ9D5w_d-dLJX5v";

const fetchAvecDelai = async (url, options = {}) => {
    const controller = new AbortController();

    const minuterie = setTimeout(() => {
        controller.abort();
    }, 15000);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(minuterie);
    }
};

const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: fetchAvecDelai
    }
});

const formulaire = document.getElementById("formulaire-connexion");

formulaire.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const motdepasse = document.getElementById("motdepasse").value;
    const bouton = formulaire.querySelector("button");

    bouton.disabled = true;
    bouton.textContent = "Connexion en cours...";

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: motdepasse
        });

        if (error) {
            alert("Erreur : " + error.message);
        } else {
            alert("Connexion réussie !");
        }

    } catch (erreur) {
        alert("Problème de connexion : " + erreur.message);

    } finally {
        bouton.disabled = false;
        bouton.textContent = "Se connecter";
    }
});
