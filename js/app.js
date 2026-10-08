document.addEventListener('DOMContentLoaded', () => {
  initCatalogue();
});

let tousLesJeux = [];
let consoleFiltre = 'all';

async function initCatalogue() {
  const grid = document.getElementById('games-grid');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  try {
    const response = await fetch('data/games.json');
    tousLesJeux = await response.json();

    if (tousLesJeux.length > 0) {
      afficherHeroBanner(tousLesJeux[0]); // Le 1er jeu est mis à la une
    }

    afficherSectionPersonnelle();
    afficherJeux(tousLesJeux);

    // Écouteur de recherche
    searchInput.addEventListener('input', (e) => {
      filtrerJeux(e.target.value, consoleFiltre);
    });

    // Écouteurs de filtres console
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        consoleFiltre = btn.dataset.console;
        filtrerJeux(searchInput.value, consoleFiltre);
      });
    });

  } catch (erreur) {
    console.error('Erreur lors du chargement du catalogue:', erreur);
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Impossible de charger le catalogue de jeux.</p>';
  }
}

function afficherHeroBanner(jeu) {
  const heroContainer = document.getElementById('hero-section');
  const coverUrl = jeu.cover || 'https://via.placeholder.com/800x400';

  heroContainer.innerHTML = `
    <div class="hero-card">
      <img class="hero-bg" src="${coverUrl}" alt="${jeu.title}">
      <div class="hero-content">
        <span class="hero-tag">🔥 À la une — ${jeu.console.toUpperCase()}</span>
        <h1 class="hero-title">${jeu.title}</h1>
        <p class="hero-desc">${jeu.description || ''}</p>
        <a href="play.html?game=${jeu.id}" class="btn-play-hero">▶ Jouer maintenant</a>
      </div>
    </div>
  `;
}

function afficherJeux(jeux) {
  const grid = document.getElementById('games-grid');
  grid.innerHTML = '';

  if (jeux.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted);">Aucun jeu ne correspond à votre recherche.</p>';
    return;
  }

  const favoris = getFavoris();

  jeux.forEach(jeu => {
    const card = creerCarteJeu(jeu, favoris.includes(jeu.id));
    grid.appendChild(card);
  });
}

function creerCarteJeu(jeu, estFavori) {
  const card = document.createElement('div');
  card.className = 'game-card';

  const coverUrl = jeu.cover || 'https://via.placeholder.com/300x400?text=Pas+de+visuel';
  const desc = jeu.description || 'Cliquez pour jouer à ce classique !';

  card.innerHTML = `
    <button class="fav-btn ${estFavori ? 'active' : ''}" title="Ajouter aux favoris">
      ${estFavori ? '❤️' : '🤍'}
    </button>
    <a href="play.html?game=${jeu.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;">
      <div class="cover-wrapper">
        <img class="cover-img" src="${coverUrl}" alt="${jeu.title}" loading="lazy">
        <span class="badge">${jeu.console.toUpperCase()}</span>
      </div>
      <div class="game-info">
        <div class="game-title">${jeu.title}</div>
        <div class="game-desc">${desc}</div>
      </div>
    </a>
  `;

  // Gestion du clic sur le cœur
  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleFavori(jeu.id);
    afficherSectionPersonnelle();
    afficherJeux(tousLesJeux);
  });

  return card;
}

function afficherSectionPersonnelle() {
  const personalSection = document.getElementById('personal-section');
  const personalGrid = document.getElementById('personal-grid');
  const favorisIds = getFavoris();
  const dernierJeuId = localStorage.getItem('retroplay_last_game');

  // Récupération des jeux uniques (Favoris + Dernier jeu)
  const idsAicher = [...new Set([...favorisIds, dernierJeuId].filter(Boolean))];
  const jeuxPerso = tousLesJeux.filter(j => idsAicher.includes(j.id));

  if (jeuxPerso.length === 0) {
    personalSection.style.display = 'none';
    return;
  }

  personalSection.style.display = 'block';
  personalGrid.innerHTML = '';

  jeuxPerso.forEach(jeu => {
    const card = creerCarteJeu(jeu, favorisIds.includes(jeu.id));
    personalGrid.appendChild(card);
  });
}

function filtrerJeux(recherche, consoleCode) {
  const terme = recherche.toLowerCase().trim();

  const resultats = tousLesJeux.filter(jeu => {
    const matchTitre = jeu.title.toLowerCase().includes(terme);
    const matchConsole = (consoleCode === 'all') || (jeu.console.toLowerCase() === consoleCode.toLowerCase());
    return matchTitre && matchConsole;
  });

  afficherJeux(resultats);
}

// --- Fonctions LocalStorage ---
function getFavoris() {
  return JSON.parse(localStorage.getItem('retroplay_favs') || '[]');
}

function toggleFavori(id) {
  let favs = getFavoris();
  if (favs.includes(id)) {
    favs = favs.filter(fId => fId !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('retroplay_favs', JSON.stringify(favs));
}
