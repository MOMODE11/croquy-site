// ========================================
// CROQUY - CONNEXION SUPABASE
// ========================================

const SUPABASE_URL = "https://oyzqzbpoesrjuopjyfkv.supabase.co";

const SUPABASE_KEY = "sb_publishable_MrnJ7ePcX5bnqSQ-cQ9D5w_d-dLJX5V";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ========================================
// CONFIGURATION CROQUY
// ========================================

const NUMERO_WHATSAPP = "2250778183813";

const CLE_PANIER = "panierCroquy";

let panier = JSON.parse(localStorage.getItem(CLE_PANIER)) || [];

let produitsDisponibles = [];
let zonesDisponibles = [];

let commandeEnCours = false;


// Correspondance entre les noms affichés et les produits Supabase

const correspondanceProduits = {
    "CROQUY Original - Bocal": "d281c9d2-e3e3-4b55-9f74-535149b38828",
    "CROQUY Arachides - Bocal": "e8466296-aea3-4b1d-8883-bee0990fc5cf",

    "CROQUY Original - Sachet": "e920617c-649b-481a-8aa1-4f30a877d95d",
    "CROQUY Arachides - Sachet": "95fdf1ee-1289-4f6b-af17-e4bb51713954",

    "CROQUY Original - Bidon": "7fcc67f3-c5e3-4ddd-b8ca-6f05b1f90f0d",
    "CROQUY Arachides - Bidon": "bc746a2b-7615-4d1c-a2e8-a3d7b72f6c3d"
};


const imagesProduits = {
    "CROQUY Original - Bocal": "images/bocal_original.jpg",
    "CROQUY Arachides - Bocal": "images/bocal_arachide.jpg",

    "CROQUY Original - Sachet": "images/croquy-original-sachet.jpg",
    "CROQUY Arachides - Sachet": "images/croquy-arachides-sachet.jpg",

    "CROQUY Original - Bidon": "images/bidon_original.jpg",
    "CROQUY Arachides - Bidon": "images/bidon_arachide.jpg"
};


// Correspondance entre les valeurs HTML et les zones Supabase

const correspondanceZones = {
    korhogo: "f47354f9-c8b3-49c4-950b-9dd7315731d4",
    proche: "b61d0ca2-3247-416a-90f6-bc91ce296233",
    eloignee: "0023a938-0d7f-43fb-a126-97d85fb447ee"
};


// ========================================
// OUTILS
// ========================================

function formaterPrix(prix) {
    return Number(prix).toLocaleString("fr-FR");
}


function sauvegarderPanier() {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
}


function afficherNotification(message) {
    let notification = document.getElementById("notification-croquy");

    if (!notification) {
        alert(message);
        return;
    }

    notification.textContent = message;
    notification.style.display = "block";

    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}


// ========================================
// CHARGEMENT DES PRODUITS SUPABASE
// ========================================

async function chargerProduits() {

    const { data, error } = await supabaseClient
        .from("produits")
        .select("id, nom, prix, stock, actif")
        .eq("actif", true);

    if (error) {
        console.error("Erreur produits :", error);
        throw new Error("Impossible de charger les produits.");
    }

    produitsDisponibles = data || [];

    // Mise à jour des informations des produits déjà dans le panier

    panier = panier.map(article => {

        const id = article.produit_id ||
            correspondanceProduits[article.nom];

        const produit = produitsDisponibles.find(p => p.id === id);

        if (!produit) {
            return {
                ...article,
                produit_id: id,
                indisponible: true
            };
        }

        return {
            ...article,
            produit_id: produit.id,
            nom: article.nom,
            prix: produit.prix,
            indisponible: false
        };
    });

    sauvegarderPanier();
}


// ========================================
// CHARGEMENT DES ZONES SUPABASE
// ========================================

async function chargerZones() {

    const { data, error } = await supabaseClient
        .from("zones_livraison")
        .select("id, nom, frais, actif")
        .eq("actif", true);

    if (error) {
        console.error("Erreur zones :", error);
        throw new Error("Impossible de charger les zones de livraison.");
    }

    zonesDisponibles = data || [];
}


// ========================================
// FRAIS DE LIVRAISON
// ========================================

function calculerFraisLivraison() {

    const select = document.getElementById("zone-livraison");

    if (!select) return 0;

    const zoneId = correspondanceZones[select.value];

    const zone = zonesDisponibles.find(z => z.id === zoneId);

    return zone ? Number(zone.frais) : 0;
}


// ========================================
// COMPTEUR DU PANIER
// ========================================

function mettreAJourCompteurPanier() {

    const compteur = document.getElementById("compteur-panier");

    if (!compteur) return;

    const total = panier.reduce(
        (somme, article) => somme + Number(article.quantite),
        0
    );

    compteur.textContent = total;
}


// ========================================
// AJOUTER AU PANIER
// ========================================

function ajouterAuPanier(nomProduit, ancienPrix) {

    const produitId = correspondanceProduits[nomProduit];

    const produit = produitsDisponibles.find(
        p => p.id === produitId
    );

    if (!produit) {
        afficherNotification("Produit indisponible.");
        return;
    }

    if (Number(produit.stock) <= 0) {
        afficherNotification("Ce produit est en rupture de stock.");
        return;
    }

    const article = panier.find(
        p => p.produit_id === produit.id
    );

    if (article) {

        if (article.quantite >= produit.stock) {
            afficherNotification("Stock insuffisant.");
            return;
        }

        article.quantite++;

    } else {

        panier.push({
            produit_id: produit.id,
            nom: nomProduit,
            prix: Number(produit.prix),
            quantite: 1
        });
    }

    sauvegarderPanier();
    mettreAJourCompteurPanier();

    afficherNotification("Produit ajouté au panier !");
}


// ========================================
// AFFICHER LE PANIER
// ========================================

function afficherPanier() {

    const contenu = document.getElementById("contenu-panier");

    if (!contenu) return;

    contenu.innerHTML = "";

    let totalProduits = 0;

    if (panier.length === 0) {

        contenu.innerHTML = "<p>Ton panier est vide.</p>";

    } else {

        panier.forEach((article, index) => {

            const produit = produitsDisponibles.find(
                p => p.id === article.produit_id
            );

            if (!produit) {

                contenu.innerHTML += `
                    <div class="ligne-panier">
                        <p>${article.nom} : produit indisponible.</p>
                        <button onclick="supprimerDuPanier(${index})">
                            🗑️
                        </button>
                    </div>
                `;

                return;
            }

            const sousTotal = Number(produit.prix) *
                Number(article.quantite);

            totalProduits += sousTotal;

            const image = imagesProduits[article.nom] ||
                "images/logo-croquy.png";

            contenu.innerHTML += `
                <div class="ligne-panier">

                    <img
                        src="${image}"
                        alt="${article.nom}"
                        class="image-produit-panier"
                    >

                    <div>
                        <p>${article.nom}</p>

                        <p>${formaterPrix(produit.prix)} FCFA</p>

                        <p>
                            Sous-total :
                            ${formaterPrix(sousTotal)} FCFA
                        </p>

                        <button onclick="modifierQuantite(${index}, -1)">
                            −
                        </button>

                        <span>${article.quantite}</span>

                        <button onclick="modifierQuantite(${index}, 1)">
                            +
                        </button>

                        <button onclick="supprimerDuPanier(${index})">
                            🗑️
                        </button>

                        <p>Stock disponible : ${produit.stock}</p>
                    </div>

                </div>
            `;
        });
    }

    const frais = calculerFraisLivraison();

    const total = totalProduits + frais;

    const zone = document.getElementById("total-panier");
    const livraison = document.getElementById("frais-livraison");
    const commande = document.getElementById("total-commande");

    if (zone) zone.textContent = formaterPrix(totalProduits);

    if (livraison) livraison.textContent = formaterPrix(frais);

    if (commande) commande.textContent = formaterPrix(total);

    mettreAJourCompteurPanier();
}


// ========================================
// MODIFIER LA QUANTITÉ
// ========================================

function modifierQuantite(index, changement) {

    const article = panier[index];

    if (!article) return;

    const produit = produitsDisponibles.find(
        p => p.id === article.produit_id
    );

    if (!produit) {
        afficherNotification("Produit indisponible.");
        return;
    }

    const nouvelleQuantite = article.quantite + changement;

    if (nouvelleQuantite <= 0) {

        supprimerDuPanier(index);
        return;
    }

    if (nouvelleQuantite > produit.stock) {

        afficherNotification("Stock insuffisant.");
        return;
    }

    article.quantite = nouvelleQuantite;

    sauvegarderPanier();
    afficherPanier();
}


// ========================================
// SUPPRIMER UN PRODUIT
// ========================================

function supprimerDuPanier(index) {

    panier.splice(index, 1);

    sauvegarderPanier();
    afficherPanier();

    afficherNotification("Produit retiré du panier.");
}


// ========================================
// VIDER LE PANIER
// ========================================

function viderPanier() {

    if (panier.length === 0) {
        afficherNotification("Ton panier est déjà vide.");
        return;
    }

    if (!confirm("Veux-tu vraiment vider ton panier ?")) {
        return;
    }

    panier = [];

    sauvegarderPanier();
    afficherPanier();

    afficherNotification("Panier vidé.");
}


// ========================================
// CRÉER LA COMMANDE DANS SUPABASE
// ========================================

async function enregistrerCommande(nom, telephone, adresse, zoneId) {

    const articles = panier.map(article => ({
        produit_id: article.produit_id,
        quantite: Number(article.quantite)
    }));

    const { data, error } = await supabaseClient.rpc(
        "creer_commande_croquy",
        {
            p_nom_client: nom,
            p_telephone: telephone,
            p_adresse: adresse,
            p_zone_id: zoneId,
            p_articles: articles
        }
    );

    if (error) {
        console.error("Erreur création commande :", error);
        throw error;
    }

    return data;
}


// ========================================
// COMMANDE WHATSAPP
// ========================================

async function commanderSurWhatsApp() {

    if (commandeEnCours) return;

    if (panier.length === 0) {
        afficherNotification("Ton panier est vide.");
        return;
    }

    const nom = document.getElementById("nom-client").value.trim();

    const telephone = document.getElementById("telephone-client").value.trim();

    const adresse = document.getElementById("adresse-client").value.trim();

    const zoneSelect = document.getElementById("zone-livraison");

    const zoneValeur = zoneSelect.value;

    const messageClient = document.getElementById("message-client").value.trim();

    if (!nom || !telephone || !adresse || !zoneValeur) {
        alert("Merci de remplir toutes les informations obligatoires.");
        return;
    }

    if (!/^[0-9]{10}$/.test(telephone)) {
        alert("Le numéro de téléphone doit contenir 10 chiffres.");
        return;
    }

    const zoneId = correspondanceZones[zoneValeur];

    const zone = zonesDisponibles.find(z => z.id === zoneId);

    if (!zone) {
        alert("Cette zone de livraison n'est pas disponible.");
        return;
    }

    // Vérifier les produits et les stocks avant de commander

    for (const article of panier) {

        const produit = produitsDisponibles.find(
            p => p.id === article.produit_id
        );

        if (!produit) {
            alert("Un produit de ton panier n'est plus disponible.");
            return;
        }

        if (article.quantite > produit.stock) {
            alert(
                "Stock insuffisant pour " + article.nom +
                ". Stock disponible : " + produit.stock
            );
            return;
        }
    }

    const bouton = document.querySelector(".bouton-whatsapp");

    commandeEnCours = true;

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement de la commande...";
    }

    try {

        // Enregistrer réellement la commande dans Supabase

        const commandeId = await enregistrerCommande(
            nom,
            telephone,
            adresse,
            zone.id
        );

        // Préparer le récapitulatif WhatsApp

        let message = "Bonjour CROQUY ! Je viens de passer une commande.%0A%0A";

        message += "*Commande : " + commandeId + "*%0A%0A";

        message += "*Client :* " + encodeURIComponent(nom) + "%0A";

        message += "*Téléphone :* " + encodeURIComponent(telephone) + "%0A";

        message += "*Adresse :* " + encodeURIComponent(adresse) + "%0A";

        message += "*Zone :* " + encodeURIComponent(zone.nom) + "%0A%0A";

        message += "*Produits :*%0A";

        let totalProduits = 0;

        panier.forEach(article => {

            const produit = produitsDisponibles.find(
                p => p.id === article.produit_id
            );

            const sousTotal = produit.prix * article.quantite;

            totalProduits += sousTotal;

            message += "- " + encodeURIComponent(article.nom) +
                " x " + article.quantite +
                " = " + formaterPrix(sousTotal) + " FCFA%0A";
        });

        const frais = Number(zone.frais);

        const total = totalProduits + frais;

        message += "%0A*Total produits :* " +
            formaterPrix(totalProduits) + " FCFA%0A";

        message += "*Livraison :* " +
            formaterPrix(frais) + " FCFA%0A";

        message += "*TOTAL À PAYER :* " +
            formaterPrix(total) + " FCFA%0A";

        if (messageClient) {
            message += "%0A*Informations supplémentaires :* " +
                encodeURIComponent(messageClient);
        }

        // Vider le panier après l'enregistrement réussi

        panier = [];

        sauvegarderPanier();

        afficherPanier();

        // Ouvrir WhatsApp

        const url = "https://wa.me/" +
            NUMERO_WHATSAPP +
            "?text=" + message;

        window.location.href = url;

    } catch (error) {

        console.error(error);

        alert(
            "Impossible d'enregistrer ta commande. " +
            "Vérifie ta connexion et réessaie. " +
            "Aucune nouvelle commande n'a été créée par cette tentative si l'enregistrement a échoué."
        );

    } finally {

        commandeEnCours = false;

        if (bouton) {
            bouton.disabled = false;
            bouton.textContent = "📱 Commander sur WhatsApp";
        }
    }
}


// ========================================
// INITIALISATION
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await chargerProduits();

        await chargerZones();

        mettreAJourCompteurPanier();

        afficherPanier();

    } catch (error) {

        console.error(error);

        afficherNotification(
            "Erreur de connexion. Actualise la page."
        );
    }
});
