document.addEventListener('DOMContentLoaded', () => {
  initProfil();
});

const IMAGE_DEFAUT = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">' +
  '<rect width="100%" height="100%" fill="#181a20"/>' +
  '<text x="50%" y="50%" fill="#9ca3af" font-family="sans-serif" font-size="20" text-anchor="middle">Pas de visuel</text>' +
  '</svg>'
);

async function initProfil() {
  // Page réservée aux joueurs connectés
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  const user = session.user;
  const pseudo = user.email.split('@')[0];

  document.getElementById('profile-name').textContent = pseudo;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-avatar').textContent = pseudo.charAt(0).toUpperCase();
  document.title = pseudo + ' — RetroPlay';

  await Promise.all([
    chargerHistorique(user.id),
    chargerFavorisProfil(user.id)
  ]);
}

// --- Historique : jeux déjà lancés, du plus récent au plus ancien ---
async function chargerHistorique(userId) {
  const grid = document.getElementById('history-grid');

  const { data, error } = await supabaseClient
    .from('play_history')
    .select('play_count, last_played_at, games(id, title, console, cover_url)')
    .eq('user_id', userId)
    .order('last_played_at', { ascending: false });

  if (error) {
    console.error('Erreur historique:', error);
    grid.innerHTML = messageVide('Impossible de charger ton historique.');
    return;
  }

  const lignes = (data || []).filter(l => l.games);
  const totalParties = lignes.reduce((somme, l) => somme + l.play_count, 0);

  document.getElementById('stat-games').textContent = lignes.length;
  document.getElementById('stat-plays').textContent = totalParties;

  if (lignes.length === 0) {
    grid.innerHTML = messageVide('Tu n\'as pas encore joué. Lance un jeu depuis le catalogue !');
    return;
  }

  grid.innerHTML = '';
  lignes.forEach(l => {
    const date = new Date(l.last_played_at).toLocaleDateString('fr-FR');
    const parties = l.play_count + (l.play_count > 1 ? ' parties' : ' partie');
    grid.appendChild(creerCarte(l.games, parties + ' · dernière le ' + date));
  });
}

// --- Favoris ---
async function chargerFavorisProfil(userId) {
  const grid = document.getElementById('favorites-grid');

  const { data, error } = await supabaseClient
    .from('favorites')
    .select('games(id, title, console, cover_url)')
    .eq('user_id', userId);

  if (error) {
    console.error('Erreur favoris:', error);
    grid.innerHTML = messageVide('Impossible de charger tes favoris.');
    return;
  }

  const jeux = (data || []).map(f => f.games).filter(Boolean);
  document.getElementById('stat-favs').textContent = jeux.length;

  if (jeux.length === 0) {
    grid.innerHTML = messageVide('Aucun favori pour le moment. Clique sur le ❤️ d\'un jeu du catalogue.');
    return;
  }

  grid.innerHTML = '';
  jeux.forEach(jeu => grid.appendChild(creerCarte(jeu, 'Dans tes favoris')));
}

// --- Outils d'affichage ---
function messageVide(texte) {
  return '<p class="profile-empty">' + escapeHtml(texte) + '</p>';
}

function creerCarte(jeu, sousTitre) {
  const cle = trouverConsole(jeu.console);
  const nomConsole = cle ? CONSOLES[cle].court : String(jeu.console ?? '').toUpperCase();

  const carte = document.createElement('a');
  carte.className = 'game-card';
  carte.href = 'play.html?id=' + encodeURIComponent(jeu.id);
  carte.innerHTML = `
    <div class="cover-wrapper">
      <img class="cover-img" src="${escapeHtml(jeu.cover_url || IMAGE_DEFAUT)}" alt="${escapeHtml(jeu.title)}" loading="lazy">
      <span class="badge">${escapeHtml(nomConsole)}</span>
    </div>
    <div class="game-info">
      <div class="game-title">${escapeHtml(jeu.title)}</div>
      <div class="game-desc">${escapeHtml(sousTitre)}</div>
    </div>
  `;
  return carte;
}
