// =================================
// PANIER CROQUY
// =================================

let panier = JSON.parse(localStorage.getItem("panierCroquy")) || [];
const imagesProduits = {
"CROQUY Original - Bocal": "images/bocal_original.jpg",
"CROQUY Arachides - Bocal": "images/bocal_arachide.jpg",
"CROQUY Original - Sachet": "images/croquy-original-sachet.jpg",
"CROQUY Arachides - Sachet": "images/croquy-arachides-sachet.jpg",
"CROQUY Original - Bidon": "images/bidon_original.jpg",
"CROQUY Arachides - Bidon": "images/bidon_arachide.jpg"
};


// =================================
// STOCK DES PRODUITS CROQUY
// =================================

let stockProduits = {
    "CROQUY Original - Bocal": 20,
    "CROQUY Arachides - Bocal": 20,
    "CROQUY Original - Sachet": 50,
    "CROQUY Arachides - Sachet": 50,
    "CROQUY Original - Bidon": 20,
    "CROQUY Arachides - Bidon": 20
};

console.log("SCRIPT CROQUY CHARGÉ !");

// =================================
// CALCUL DES FRAIS DE LIVRAISON
// =================================

function calculerFraisLivraison() {
    let zone = document.getElementById("zone-livraison");

    if (!zone) return 0;

    if (zone.value === "korhogo") return 500;
    if (zone.value === "proche") return 1000;
    if (zone.value === "eloignee") return 1500;

    return 0;
}

// =================================
// COMPTEUR DU PANIER
// =================================

function mettreAJourCompteurPanier() {
    let compteur = document.getElementById("compteur-panier");

    if (!compteur) return;

    let nombreArticles = 0;

    panier.forEach(function(produit) {
        nombreArticles += produit.quantite;
    });

    compteur.textContent = nombreArticles;
}

// =================================
// AJOUTER UN PRODUIT AU PANIER
// =================================

function ajouterAuPanier(nomProduit, prix) {

    if (stockProduits[nomProduit] === undefined) {
        alert("Ce produit n'est pas reconnu.");
        return;
    }

    let produitExistant = panier.find(function(produit) {
        return produit.nom === nomProduit;
    });

    let quantiteActuelle = produitExistant
        ? produitExistant.quantite
        : 0;

    if (quantiteActuelle >= stockProduits[nomProduit]) {
        alert("Désolé, ce produit a atteint sa quantité maximale en stock !");
        return;
    }

    if (produitExistant) {
        produitExistant.quantite++;
    } else {
        panier.push({
            nom: nomProduit,
            prix: prix,
            quantite: 1
        });
    }

    afficherPanier();
    afficherNotification(nomProduit + " ajouté au panier !");
}

// =================================
// NOTIFICATION D'AJOUT AU PANIER
// =================================

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

// =================================
// AFFICHER LE PANIER
// =================================

function afficherPanier() {

    // Enregistrer le panier
    localStorage.setItem("panierCroquy", JSON.stringify(panier));

    // Mettre à jour le compteur sur toutes les pages
    mettreAJourCompteurPanier();

    // Récupérer les éléments présents sur la page panier
    let contenuPanier = document.getElementById("contenu-panier");
    let totalPanier = document.getElementById("total-panier");

    // Sur produits.html, ces éléments n'existent pas.
    // On arrête donc l'affichage ici, sans bloquer le compteur.
    if (!contenuPanier || !totalPanier) return;

    contenuPanier.innerHTML = "";

    let total = 0;

    panier.forEach(function(produit) {

let sousTotal = produit.quantite * produit.prix;
total += sousTotal;

let ligne = document.createElement("div");
ligne.className = "ligne-panier";

// Trouver la photo correspondant au produit
let image = document.createElement("img");
image.className = "image-produit-panier";
image.src = imagesProduits[produit.nom] || "images/logo-croquy.png";
image.alt = produit.nom;

// Afficher les informations du produit
let texte = document.createElement("p");

texte.innerHTML =
"<strong>" + produit.nom + "</strong><br>" +
produit.quantite + " × " + produit.prix +
" FCFA = " + sousTotal + " FCFA";


        // Bouton pour diminuer la quantité
        let boutonMoins = document.createElement("button");
        boutonMoins.textContent = "−";

        boutonMoins.onclick = function() {
            modifierQuantite(produit.nom, -1);
        };

        // Bouton pour augmenter la quantité
        let boutonPlus = document.createElement("button");
        boutonPlus.textContent = "+";

        boutonPlus.onclick = function() {
            modifierQuantite(produit.nom, 1);
        };

        // Bouton pour supprimer le produit
        // Bouton pour supprimer le produit
let boutonSupprimer = document.createElement("button");
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

let frais = calculerFraisLivraison();

let elementFrais = document.getElementById("frais-livraison");
let elementTotal = document.getElementById("total-commande");

if (elementFrais && elementTotal) {
    elementFrais.textContent = frais;
    elementTotal.textContent = total + frais;
}

mettreAJourCompteurPanier();
}

// MODIFIER LA QUANTITÉ

function modifierQuantite(nomProduit, changement) {
    let produit = panier.find(function(element) {
        return element.nom === nomProduit;
    });

    if (!produit) return;

    let nouvelleQuantite = produit.quantite + changement;

    if (nouvelleQuantite < 0) return;

    if (nouvelleQuantite > stockProduits[nomProduit]) {
        alert("La quantité maximale disponible est atteinte !");
        return;
    }

    if (nouvelleQuantite === 0) {
        panier = panier.filter(function(element) {
            return element.nom !== nomProduit;
        });
    } else {
        produit.quantite = nouvelleQuantite;
    }

    afficherPanier();
}

// SUPPRIMER UN PRODUIT

function supprimerDuPanier(nomProduit) {
    panier = panier.filter(function(produit) {
        return produit.nom !== nomProduit;
    });

    afficherPanier();
}

// VIDER LE PANIER

function viderPanier() {
    panier = [];
    afficherPanier();
}

// COMMANDER SUR WHATSAPP

function commanderSurWhatsApp() {
    if (panier.length === 0) {
        alert("Ton panier est vide !");
        return;
    }

    let nom = document.getElementById("nom-client").value.trim();
    let telephone = document.getElementById("telephone-client").value.trim();
    let adresse = document.getElementById("adresse-client").value.trim();
    let informations = document.getElementById("message-client").value.trim();
    let zone = document.getElementById("zone-livraison");

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

    let frais = calculerFraisLivraison();
    let numeroWhatsApp = "2250778183813";

    let message = "Bonjour CROQUY ! Je souhaite passer une commande.\n\n";

    message += "INFORMATIONS DU CLIENT\n";
    message += "Nom : " + nom + "\n";
    message += "Téléphone : " + telephone + "\n";
    message += "Adresse : " + adresse + "\n";
    message += "Zone de livraison : " + zone.selectedOptions[0].text + "\n\n";

    message += "MA COMMANDE\n\n";

    let total = 0;

    panier.forEach(function(produit) {
        let sousTotal = produit.quantite * produit.prix;

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

    let lien = "https://wa.me/" + numeroWhatsApp +
        "?text=" + encodeURIComponent(message);

    window.location.href = lien;
}

// INITIALISATION

document.addEventListener("DOMContentLoaded", function() {
    afficherPanier();
});