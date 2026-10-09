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

  // Historique récent
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

    // Mise à jour de l'interface
    document.title = `${jeu.title} — RetroPlay`;
    document.getElementById('game-title-display').childNodes[0].textContent = jeu.title + ' ';
    document.getElementById('game-badge-display').textContent = jeu.console.toUpperCase();
    document.getElementById('game-desc-display').textContent = jeu.description || 'Profitez de votre partie !';

    // Initialisation du bouton favori
    setupFavoriButton(currentGameId);

    // Initialisation des boutons de sauvegarde
    setupSaveHandlers();

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

// --- Gestion des Favoris sur play.html ---
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

// --- Gestion de l'Export / Import de Sauvegarde ---
function setupSaveHandlers() {
  const btnExport = document.getElementById('btn-export-save');
  const btnImport = document.getElementById('btn-import-save');
  const inputImport = document.getElementById('input-import-save');

  // Exportation
  btnExport.addEventListener('click', () => {
    if (window.EJS_emulator && typeof window.EJS_emulator.saveSaveFiles === 'function') {
      window.EJS_emulator.saveSaveFiles();
    } else {
      alert('Veuillez lancer la partie et faire au moins une sauvegarde dans le jeu d\'abord.');
    }
  });

  // Importation
  btnImport.addEventListener('click', () => inputImport.click());

  inputImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (window.EJS_emulator && typeof window.EJS_emulator.loadSaveFiles === 'function') {
        window.EJS_emulator.loadSaveFiles(new Uint8Array(event.target.result));
        alert('Sauvegarde chargée avec succès ! Redémarrez le jeu si nécessaire.');
      } else {
        alert('L\'émulateur n\'est pas encore complètement prêt. Réessayez dans quelques secondes.');
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
