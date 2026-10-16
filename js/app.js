document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

let tousLesJeux = [];
let consoleFiltre = 'all';
let currentUser = null;
let userFavorisIds = []; // Stocke les IDs des favoris de l'utilisateur connecté

async function initApp() {
  // 1. Vérifier si un utilisateur est connecté
  const { data: { session } } = await supabaseClient.auth.getSession();
  currentUser = session ? session.user : null;

  // Mettre à jour l'UI du Header (Connexion / Profil / Déconnexion)
  mettreAJourHeaderAuth();

  // 2. Charger les favoris depuis Supabase si connecté
  await chargerFavoris();

  // 3. Charger le catalogue des jeux
  initCatalogue();
}

// --- Gestion de l'UI Header Auth ---
async function mettreAJourHeaderAuth() {
  const header = document.querySelector('header');
  if (!header) return;

  let authNav = document.getElementById('auth-nav');
  if (!authNav) {
    authNav = document.createElement('div');
    authNav.id = 'auth-nav';
    authNav.style.cssText = 'margin-left: auto; display: flex; gap: 1rem; align-items: center;';
    header.appendChild(authNav);
  }

  if (currentUser) {
    // Interroger la base de données pour savoir si l'utilisateur est admin
    let estAdmin = false;
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUser.id)
      .single();

    if (profile && profile.is_admin) {
      estAdmin = true;
    }

    authNav.innerHTML = `
      ${estAdmin ? '<a href="admin.html" style="background: #ef4444; color: white; text-decoration: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; font-weight: bold;">🛠️ Admin</a>' : ''}
      <span style="font-size: 0.85rem; color: #94a3b8; display: none; @media(min-width: 768px){display:inline;}">👤 ${currentUser.email.split('@')[0]}</span>
      <button id="btn-logout-header" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">Déconnexion</button>
    `;
    document.getElementById('btn-logout-header')?.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.reload();
    });
  } else {
    authNav.innerHTML = `
      <a href="login.html" style="color: white; text-decoration: none; font-size: 0.9rem;">Connexion</a>
      <a href="register.html" style="background: var(--accent, #6366f1); color: white; text-decoration: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.9rem; font-weight: bold;">S'inscrire</a>
    `;
  }
}

// --- Chargement des Favoris ---
async function chargerFavoris() {
  if (currentUser) {
    // Récupérer depuis Supabase
    const { data, error } = await supabaseClient
      .from('favorites')
      .select('game_id')
      .eq('user_id', currentUser.id);

    if (!error && data) {
      userFavorisIds = data.map(f => String(f.game_id));
    }
  } else {
    userFavorisIds = [];
  }
}

async function initCatalogue() {
  const grid = document.getElementById('games-grid');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  try {
    const { data: games, error } = await supabaseClient
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    tousLesJeux = (games || []).map(jeu => ({
      ...jeu,
      id: String(jeu.id),
      cover: jeu.cover_url || jeu.cover
    }));

    if (tousLesJeux.length > 0) {
      afficherHeroBanner(tousLesJeux[0]);
    }

    afficherJeux(tousLesJeux);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filtrerJeux(e.target.value, consoleFiltre);
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const cibleConsole = btn.dataset.console;

        // VERIFICATION INVITE : Si clic sur "Mes Favoris" sans être connecté
        if (cibleConsole === 'favorites' && !currentUser) {
          alert("Connecte-toi pour accéder à tes favoris !");
          window.location.href = 'login.html';
          return;
        }

        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        consoleFiltre = cibleConsole;
        const query = searchInput ? searchInput.value : '';
        filtrerJeux(query, consoleFiltre);
      });
    });

  } catch (erreur) {
    console.error('Erreur lors du chargement du catalogue Supabase:', erreur);
    if (grid) {
      grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Impossible de charger le catalogue depuis la base de données.</p>';
    }
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
        <a href="play.html?id=${jeu.id}" class="btn-play-hero">▶ Jouer maintenant</a>
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

  jeux.forEach(jeu => {
    const estFavori = userFavorisIds.includes(jeu.id);
    const card = creerCarteJeu(jeu, estFavori);
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
    <a href="play.html?id=${jeu.id}" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; height:100%;">      <div class="cover-wrapper">
        <img class="cover-img" src="${coverUrl}" alt="${jeu.title}" loading="lazy">
        <span class="badge">${jeu.console.toUpperCase()}</span>
      </div>
      <div class="game-info">
        <div class="game-title">${jeu.title}</div>
        <div class="game-desc">${desc}</div>
      </div>
    </a>
  `;

  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isNowFav = await toggleFavori(jeu.id);
    if (isNowFav === null) return; // Annulé car non connecté

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

  const resultats = tousLesJeux.filter(jeu => {
    const matchTitre = jeu.title.toLowerCase().includes(terme);
    
    let matchConsole = false;
    if (consoleCode === 'all') {
      matchConsole = true;
    } else if (consoleCode === 'favorites') {
      matchConsole = userFavorisIds.includes(jeu.id);
    } else {
      matchConsole = (jeu.console.toLowerCase() === consoleCode.toLowerCase());
    }

    return matchTitre && matchConsole;
  });

  afficherJeux(resultats);
}

// --- Logique Synchro Favoris (Supabase) ---
async function toggleFavori(gameId) {
  // 1. VERIFICATION INVITE : Redirection vers login si non connecté
  if (!currentUser) {
    alert("Connecte-toi pour ajouter ce jeu à tes favoris !");
    window.location.href = 'login.html';
    return null;
  }
  
  const index = userFavorisIds.indexOf(gameId);
  const isCurrentlyFav = index > -1;

  if (isCurrentlyFav) {
    // Supprimer le favori
    const { error } = await supabaseClient
      .from('favorites')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('game_id', gameId);

    if (!error) {
      userFavorisIds.splice(index, 1);
      return false;
    }
  } else {
    // Ajouter le favori
    const { error } = await supabaseClient
      .from('favorites')
      .insert([{ user_id: currentUser.id, game_id: gameId }]);

    if (!error) {
      userFavorisIds.push(gameId);
      return true;
    }
  }

  return isCurrentlyFav; // En cas d'erreur réseau
}
