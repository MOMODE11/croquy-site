Remplace entièrement le contenu de ton fichier `script.js` par ce code :

```javascript
// ==========================================
// CONFIGURATION SUPABASE
// ==========================================

const SUPABASE_URL = "https://oyzqzbpoesrjuopjyfkv.supabase.co";

// Remplace cette valeur par ta clé Publishable ACTUELLE
const SUPABASE_KEY = "COLLE_ICI_TA_CLE_SB_PUBLISHABLE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================
// IDENTIFIANTS DES PRODUITS
// ==========================================

const idsProduits = {
    "CROQUY Original - Bocal": "d281c9d2-e3e3-4b55-9f74-535149b38828",
    "CROQUY Arachides - Bocal": "e8466296-aea3-4b1d-8883-bee0990fc5cf",
    "CROQUY Original - Sachet": "e920617c-649b-481a-8aa1-4f30a877d95d",
    "CROQUY Arachides - Sachet": "95fdf1ee-1289-4f6b-af17-e4bb51713954",
    "CROQUY Original - Bidon": "7fcc67f3-c5e3-4ddd-b8ca-6f05b1f90f0d",
    "CROQUY Arachides - Bidon": "bc746a2b-7615-4d1c-a2e8-a3d7b72f6c3d"
};

// ==========================================
// IDENTIFIANTS DES ZONES DE LIVRAISON
// ==========================================

const idsZones = {
    "korhogo": "f47354f9-c8b3-49c4-950b-9dd7315731d4",
    "proche": "b61d0ca2-3247-416a-90f6-bc91ce296233",
    "eloignee": "0023a938-0d7f-43fb-a126-97d85fb447ee"
};

// ==========================================
// IMAGES DES PRODUITS
// ==========================================

const imagesProduits = {
    "CROQUY Original - Bocal": "images/bocal_original.jpg",
    "CROQUY Arachides - Bocal": "images/bocal_arachide.jpg",
    "CROQUY Original - Sachet": "images/croquy-original-sachet.jpg",
    "CROQUY Arachides - Sachet": "images/croquy-arachides-sachet.jpg",
    "CROQUY Original - Bidon": "images/bidon_original.jpg",
    "CROQUY Arachides - Bidon": "images/bidon_arachide.jpg"
};

// ==========================================
// DONNÉES DU PANIER
// ==========================================

let panier = JSON.parse(localStorage.getItem("panierCroquy")) || [];

let stockProduits = {};
let prixProduits = {};
let fraisZones = {};

let produitsCharges = false;

// ==========================================
// CHARGEMENT DES PRODUITS DEPUIS SUPABASE
// ==========================================

async function chargerProduits() {

    produitsCharges = false;

    const { data, error } = await supabaseClient
        .from("produits")
        .select("id, nom, prix, stock, actif")
        .eq("actif", true);

    if (error) {
        console.error("Erreur chargement produits :", error);
        alert("Impossible de charger les produits. Vérifie la connexion à Supabase.");
        return;
    }

    Object.keys(idsProduits).forEach(function(nomInterface) {

        const produitBDD = data.find(function(produit) {
            return produit.id === idsProduits[nomInterface];
        });

        if (produitBDD) {
            stockProduits[nomInterface] = Number(produitBDD.stock);
            prixProduits[nomInterface] = Number(produitBDD.prix);
        } else {
            stockProduits[nomInterface] = 0;
            prixProduits[nomInterface] = 0;
        }
    });

    // Actualiser les prix des articles déjà dans le panier
    panier = panier.map(function(produit) {

        if (prixProduits[produit.nom] !== undefined) {
            produit.prix = prixProduits[produit.nom];
        }

        return produit;
    });

    produitsCharges = true;

    localStorage.setItem("panierCroquy", JSON.stringify(panier));

    afficherPanier();

    console.log("Produits CROQUY chargés :", data);
}

// ==========================================
// CHARGEMENT DES ZONES DE LIVRAISON
// ==========================================

async function chargerZonesLivraison() {

    const { data, error } = await supabaseClient
        .from("zones_livraison")
        .select("id, nom, frais, actif")
        .eq("actif", true);

    if (error) {
        console.error("Erreur zones de livraison :", error);
        return;
    }

    data.forEach(function(zone) {

        Object.keys(idsZones).forEach(function(code) {

            if (idsZones[code] === zone.id) {
                fraisZones[code] = Number(zone.frais);
            }

        });

    });

    afficherPanier();
}

// ==========================================
// CALCUL DES FRAIS DE LIVRAISON
// ==========================================

function calculerFraisLivraison() {

    const zone = document.getElementById("zone-livraison");

    if (!zone || !zone.value) return 0;

    if (fraisZones[zone.value] !== undefined) {
        return fraisZones[zone.value];
    }

    return 0;
}

// ==========================================
// COMPTEUR DU PANIER
// ==========================================

function mettreAJourCompteurPanier() {

    const compteur = document.getElementById("compteur-panier");

    if (!compteur) return;

    let nombreArticles = 0;

    panier.forEach(function(produit) {
        nombreArticles += produit.quantite;
    });

    compteur.textContent = nombreArticles;
}

// ==========================================
// AJOUTER UN PRODUIT AU PANIER
// ==========================================

function ajouterAuPanier(nomProduit, prix) {

    if (!produitsCharges) {
        alert("Les produits sont en cours de chargement. Réessaie dans quelques instants.");
        return;
    }

    if (stockProduits[nomProduit] === undefined ||
        stockProduits[nomProduit] <= 0) {

        alert("Ce produit est actuellement indisponible.");
        return;
    }

    const prixActuel = prixProduits[nomProduit];

    let produitExistant = panier.find(function(produit) {
        return produit.nom === nomProduit;
    });

    const quantiteActuelle = produitExistant
        ? produitExistant.quantite
        : 0;

    if (quantiteActuelle >= stockProduits[nomProduit]) {
        alert("La quantité maximale disponible en stock est atteinte !");
        return;
    }

    if (produitExistant) {

        produitExistant.quantite++;

    } else {

        panier.push({
            nom: nomProduit,
            prix: prixActuel,
            quantite: 1
        });

    }

    afficherPanier();

    afficherNotification(nomProduit + " ajouté au panier !");
}

// ==========================================
// NOTIFICATION
// ==========================================

function afficherNotification(message) {

    let notification = document.getElementById("notification-croquy");

    if (!notification) {

        notification = document.createElement("div");
        notification.id = "notification-croquy";

        document.body.appendChild(notification);
    }

    notification.textContent = "✅ " + message;

    notification.classList.add("notification-visible");

    clearTimeout(notification.timer);

    notification.timer = setTimeout(function() {

        notification.classList.remove("notification-visible");

    }, 2500);
}

// ==========================================
// AFFICHER LE PANIER
// ==========================================

function afficherPanier() {

    localStorage.setItem("panierCroquy", JSON.stringify(panier));

    mettreAJourCompteurPanier();

    const contenuPanier = document.getElementById("contenu-panier");
    const totalPanier = document.getElementById("total-panier");

    if (!contenuPanier || !totalPanier) return;

    contenuPanier.innerHTML = "";

    let total = 0;

    panier.forEach(function(produit) {

        const sousTotal = produit.quantite * produit.prix;

        total += sousTotal;

        const ligne = document.createElement("div");
        ligne.className = "ligne-panier";

        const image = document.createElement("img");

        image.className = "image-produit-panier";
        image.src = imagesProduits[produit.nom] || "images/logo-croquy.png";
        image.alt = produit.nom;

        const texte = document.createElement("p");

        texte.innerHTML =
            "<strong>" + produit.nom + "</strong><br>" +
            produit.quantite + " × " + produit.prix +
            " FCFA = " + sousTotal + " FCFA";

        const boutonMoins = document.createElement("button");

        boutonMoins.textContent = "−";

        boutonMoins.onclick = function() {
            modifierQuantite(produit.nom, -1);
        };

        const boutonPlus = document.createElement("button");

        boutonPlus.textContent = "+";

        boutonPlus.onclick = function() {
            modifierQuantite(produit.nom, 1);
        };

        const boutonSupprimer = document.createElement("button");

        boutonSupprimer.textContent = "🗑️";
        boutonSupprimer.title = "Supprimer ce produit";

        boutonSupprimer.onclick = function() {
            supprimerDuPanier(produit.nom);
        };

        ligne.appendChild(image);
        ligne.appendChild(texte);
        ligne.appendChild(boutonMoins);
        ligne.appendChild(boutonPlus);
        ligne.appendChild(boutonSupprimer);

        contenuPanier.appendChild(ligne);

    });

    if (panier.length === 0) {
        contenuPanier.innerHTML = "<p>Ton panier est vide.</p>";
    }

    totalPanier.textContent = total;

    const frais = calculerFraisLivraison();

    const elementFrais = document.getElementById("frais-livraison");
    const elementTotal = document.getElementById("total-commande");

    if (elementFrais && elementTotal) {

        elementFrais.textContent = frais;
        elementTotal.textContent = total + frais;

    }

    mettreAJourCompteurPanier();
}

// ==========================================
// MODIFIER LA QUANTITÉ
// ==========================================

function modifierQuantite(nomProduit, changement) {

    const produit = panier.find(function(element) {
        return element.nom === nomProduit;
    });

    if (!produit) return;

    const nouvelleQuantite = produit.quantite + changement;

    if (nouvelleQuantite <= 0) {

        supprimerDuPanier(nomProduit);
        return;

    }

    if (nouvelleQuantite > stockProduits[nomProduit]) {

        alert("La quantité maximale disponible est atteinte !");
        return;

    }

    produit.quantite = nouvelleQuantite;

    afficherPanier();
}

// ==========================================
// SUPPRIMER UN PRODUIT
// ==========================================

function supprimerDuPanier(nomProduit) {

    panier = panier.filter(function(produit) {
        return produit.nom !== nomProduit;
    });

    afficherPanier();
}

// ==========================================
// VIDER LE PANIER
// ==========================================

function viderPanier() {

    panier = [];

    afficherPanier();
}

// ==========================================
// COMMANDER : SUPABASE + WHATSAPP
// ==========================================

async function commanderSurWhatsApp() {

    if (!produitsCharges) {
        alert("Les produits ne sont pas encore chargés.");
        return;
    }

    if (panier.length === 0) {
        alert("Ton panier est vide !");
        return;
    }

    const nom = document.getElementById("nom-client").value.trim();

    const telephone = document.getElementById("telephone-client").value.trim();

    const adresse = document.getElementById("adresse-client").value.trim();

    const informations = document.getElementById("message-client").value.trim();

    const zone = document.getElementById("zone-livraison");

    if (
        nom === "" ||
        telephone === "" ||
        adresse === "" ||
        !zone ||
        zone.value === ""
    ) {
        alert("Remplis ton nom, ton téléphone, ton adresse et ta zone de livraison !");
        return;
    }

    if (!/^[0-9]{10}$/.test(telephone)) {
        alert("Saisis un numéro de téléphone valide de 10 chiffres !");
        return;
    }

    const zoneId = idsZones[zone.value];

    if (!zoneId || fraisZones[zone.value] === undefined) {
        alert("Cette zone de livraison est indisponible.");
        return;
    }

    // Vérifier que chaque produit possède un identifiant
    for (const produit of panier) {

        if (!idsProduits[produit.nom]) {
            alert("Un produit de ton panier n'est pas reconnu.");
            return;
        }

        if (produit.quantite > stockProduits[produit.nom]) {
            alert("Le stock de " + produit.nom + " est insuffisant.");
            return;
        }
    }

    // Préparer les articles pour Supabase
    const articles = panier.map(function(produit) {

        return {
            produit_id: idsProduits[produit.nom],
            quantite: produit.quantite
        };

    });

    const bouton = document.querySelector(
        'button[onclick="commanderSurWhatsApp()"]'
    );

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement en cours...";
    }

    try {

        // ENREGISTRER LA COMMANDE DANS SUPABASE

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
            console.error("Erreur enregistrement commande :", error);

            alert(
                "La commande n'a pas pu être enregistrée. " +
                "Aucune confirmation WhatsApp ne sera envoyée."
            );

            return;
        }

        console.log("Commande enregistrée. Identifiant :", data);

        // PRÉPARER LE MESSAGE WHATSAPP

        const frais = calculerFraisLivraison();

        const numeroWhatsApp = "2250778183813";

        let message = "Bonjour CROQUY ! Je souhaite passer une commande.\n\n";

        message += "INFORMATIONS DU CLIENT\n";
        message += "Nom : " + nom + "\n";
        message += "Téléphone : " + telephone + "\n";
        message += "Adresse : " + adresse + "\n";
        message += "Zone de livraison : " + zone.selectedOptions[0].text + "\n\n";

        message += "MA COMMANDE\n\n";

        let total = 0;

        panier.forEach(function(produit) {

            const sousTotal = produit.quantite * produit.prix;

            message += "- " + produit.nom +
                "\nQuantité : " + produit.quantite +
                "\nPrix unitaire : " + produit.prix + " FCFA" +
                "\nSous-total : " + sousTotal + " FCFA\n\n";

            total += sousTotal;

        });

        message += "Total des produits : " + total + " FCFA\n";
        message += "Frais de livraison : " + frais + " FCFA\n";
        message += "TOTAL À PAYER : " + (total + frais) + " FCFA";

        if (informations !== "") {
            message += "\n\nInformations supplémentaires : " + informations;
        }

        message += "\n\nRéférence commande : " + data;

        const lien = "https://wa.me/" + numeroWhatsApp +
            "?text=" + encodeURIComponent(message);

        // Vider le panier après enregistrement réussi
        viderPanier();

        window.location.href = lien;

    } catch (erreur) {

        console.error("Erreur inattendue :", erreur);

        alert("Une erreur inattendue est survenue.");

    } finally {

        if (bouton) {
            bouton.disabled = false;
            bouton.textContent = "Commander sur WhatsApp";
        }

    }
}

// ==========================================
// INITIALISATION
// ==========================================

document.addEventListener("DOMContentLoaded", async function() {

    console.log("SCRIPT CROQUY CHARGÉ !");

    await chargerProduits();

    await chargerZonesLivraison();

    afficherPanier();

});
```
