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

    afficherJeux(tousLesJeux);

    // Écouteur pour la recherche
    searchInput.addEventListener('input', (e) => {
      filtrerJeux(e.target.value, consoleFiltre);
    });

    // Écouteurs pour les boutons de filtre console
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

function afficherJeux(jeux) {
  const grid = document.getElementById('games-grid');
  grid.innerHTML = '';

  if (jeux.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted);">Aucun jeu ne correspond à votre recherche.</p>';
    return;
  }

  jeux.forEach(jeu => {
    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = `play.html?game=${jeu.id}`;

    const coverUrl = jeu.cover || 'https://via.placeholder.com/300x400?text=Pas+de+visuel';
    const desc = jeu.description || 'Cliquez pour jouer à ce classique rétro !';

    card.innerHTML = `
      <div class="cover-wrapper">
        <img class="cover-img" src="${coverUrl}" alt="${jeu.title}" loading="lazy">
        <span class="badge">${jeu.console.toUpperCase()}</span>
      </div>
      <div class="game-info">
        <div class="game-title">${jeu.title}</div>
        <div class="game-desc">${desc}</div>
      </div>
    `;

    grid.appendChild(card);
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
