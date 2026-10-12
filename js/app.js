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
    // ----------------------------------------------------
    // MODIFICATION SUPABASE ICI :
    // Remplace le fetch('data/games.json') par Supabase
    // ----------------------------------------------------
    const { data: games, error } = await supabaseClient
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Normalisation des IDs et des champs pour être 100% compatible
    tousLesJeux = (games || []).map(jeu => ({
      ...jeu,
      id: String(jeu.id), // Garantit que l'ID est une chaîne pour le localStorage
      cover: jeu.cover_url || jeu.cover // Gère le champ cover_url de Supabase
    }));

    if (tousLesJeux.length > 0) {
      afficherHeroBanner(tousLesJeux[0]);
    }

    afficherJeux(tousLesJeux);

    // Écouteur de recherche
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filtrerJeux(e.target.value, consoleFiltre);
      });
    }

    // Écouteurs de filtres
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        consoleFiltre = btn.dataset.console;
        const query = searchInput ? searchInput.value : '';
        filtrerJeux(query, consoleFiltre);
      });
    });

  } catch (erreur) {
    console.error('Erreur lors du chargement du catalogue Supabase:', erreur);
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Impossible de charger le catalogue depuis la base de données.</p>';
  }
}

function afficherHeroBanner(jeu) {
  const heroContainer = document.getElementById('hero-section');
  if (!heroContainer) return;

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
  if (!grid) return;

  grid.innerHTML = '';

  if (jeux.length === 0) {
    const message = consoleFiltre === 'favorites' 
      ? 'Vous n\'avez pas encore de favoris. Cliquez sur le ❤️ d\'un jeu pour l\'ajouter !'
      : 'Aucun jeu ne correspond à votre recherche.';
    
    grid.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted); padding: 3rem 0;">${message}</p>`;
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
    e.stopPropagation();
    
    const isNowFav = toggleFavori(jeu.id);
    favBtn.classList.toggle('active', isNowFav);
    favBtn.textContent = isNowFav ? '❤️' : '🤍';

    if (consoleFiltre === 'favorites') {
      const searchInput = document.getElementById('search-input');
      const query = searchInput ? searchInput.value : '';
      filtrerJeux(query, consoleFiltre);
    }
  });

  return card;
}

function filtrerJeux(recherche, consoleCode) {
  const terme = recherche.toLowerCase().trim();
  const favoris = getFavoris();

  const resultats = tousLesJeux.filter(jeu => {
    const matchTitre = jeu.title.toLowerCase().includes(terme);
    
    let matchConsole = false;
    if (consoleCode === 'all') {
      matchConsole = true;
    } else if (consoleCode === 'favorites') {
      matchConsole = favoris.includes(jeu.id);
    } else {
      matchConsole = (jeu.console.toLowerCase() === consoleCode.toLowerCase());
    }

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
  const index = favs.indexOf(id);
  
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(id);
  }
  
  localStorage.setItem('retroplay_favs', JSON.stringify(favs));
  return favs.includes(id);
}
