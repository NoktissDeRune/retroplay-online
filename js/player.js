document.addEventListener('DOMContentLoaded', () => {
  chargerEtLancerJeu();
});

async function chargerEtLancerJeu() {
  // 1. Récupération de l'ID du jeu dans l'URL (?game=id)
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('game');

  if (!gameId) {
    alert('Aucun jeu spécifié.');
    window.location.href = 'index.html';
    return;
  }

  // 2. Enregistrer le jeu dans l'historique récent (une fois gameId défini)
  localStorage.setItem('retroplay_last_game', gameId);

  try {
    const response = await fetch('data/games.json');
    const jeux = await response.json();
    const jeu = jeux.find(j => j.id === gameId);

    if (!jeu) {
      alert('Jeu introuvable.');
      window.location.href = 'index.html';
      return;
    }

    // 3. Mise à jour de l'interface et des balises SEO
    document.title = `${jeu.title} — RetroPlay`;
    document.getElementById('game-title-display').childNodes[0].textContent = jeu.title + ' ';
    
    const badge = document.getElementById('game-badge-display');
    badge.textContent = jeu.console.toUpperCase();
    
    document.getElementById('game-desc-display').textContent = jeu.description || 'Profitez de votre partie !';

    // 4. Préparation du chemin de la ROM (proxy allorigins si URL externe)
    let romUrl = jeu.path;
    if (romUrl.startsWith('http')) {
      romUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(romUrl)}`;
    }

    // 5. Mappage des consoles vers les bons cores EmulatorJS
    let coreName = jeu.console.toLowerCase();
    if (coreName === 'gbc' || coreName === 'gb') {
      coreName = 'gb'; // 'gb' gère à la fois Game Boy et Game Boy Color
    }

    // 6. Configuration d'EmulatorJS
    window.EJS_player = '#game';
    window.EJS_core = coreName;
    window.EJS_gameUrl = romUrl;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_language = 'en-US';

    // 7. Injection du loader EmulatorJS
    const loaderScript = document.createElement('script');
    loaderScript.id = 'emu-script';
    loaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(loaderScript);

  } catch (erreur) {
    console.error('Erreur lors du lancement du jeu:', erreur);
  }
}
