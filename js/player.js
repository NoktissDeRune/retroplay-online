document.addEventListener('DOMContentLoaded', () => {
  chargerEtLancerJeu();
});

let currentGameId = null;

async function chargerEtLancerJeu() {
  const params = new URLSearchParams(window.location.search);
  currentGameId = params.get('game');

  if (!currentGameId) {
    alert('Aucun jeu spécifié.');
    window.location.href = 'index.html';
    return;
  }

  localStorage.setItem('retroplay_last_game', currentGameId);

  try {
    const response = await fetch('data/games.json');
    const jeux = await response.json();
    const jeu = jeux.find(j => j.id === currentGameId);

    if (!jeu) {
      alert('Jeu introuvable.');
      window.location.href = 'index.html';
      return;
    }

    // Titre et informations de la page
    document.title = `${jeu.title} — RetroPlay`;
    document.getElementById('game-title-display').childNodes[0].textContent = jeu.title + ' ';
    document.getElementById('game-badge-display').textContent = jeu.console.toUpperCase();
    document.getElementById('game-desc-display').textContent = jeu.description || 'Profitez de votre partie !';

    // Gestion du bouton favori
    setupFavoriButton(currentGameId);

    // Configuration de la ROM
    let romUrl = jeu.path;
    if (romUrl.startsWith('http')) {
      romUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(romUrl)}`;
    }

    let coreName = jeu.console.toLowerCase();
    if (coreName === 'gbc' || coreName === 'gb') {
      coreName = 'gb';
    }

    // Configuration EmulatorJS
    window.EJS_player = '#game';
    window.EJS_core = coreName;
    window.EJS_gameUrl = romUrl;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_language = 'en-US';

    const loaderScript = document.createElement('script');
    loaderScript.id = 'emu-script';
    loaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(loaderScript);

  } catch (erreur) {
    console.error('Erreur lors du lancement du jeu:', erreur);
  }
}

function setupFavoriButton(gameId) {
  const btnFav = document.getElementById('btn-fav');
  let favoris = JSON.parse(localStorage.getItem('retroplay_favs') || '[]');

  function updateBtn(isFav) {
    btnFav.textContent = isFav ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris';
  }

  updateBtn(favoris.includes(gameId));

  btnFav.addEventListener('click', () => {
    favoris = JSON.parse(localStorage.getItem('retroplay_favs') || '[]');
    const index = favoris.indexOf(gameId);

    if (index > -1) {
      favoris.splice(index, 1);
    } else {
      favoris.push(gameId);
    }

    localStorage.setItem('retroplay_favs', JSON.stringify(favoris));
    updateBtn(favoris.includes(gameId));
  });
}
