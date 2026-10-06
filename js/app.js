document.addEventListener('DOMContentLoaded', () => {
    chargerCatalogue();
});

// Fonction qui lit le catalogue JSON et génère l'affichage
async function chargerCatalogue() {
    const grid = document.getElementById('games-grid');
    
    try {
        const response = await fetch('data/games.json');
        const jeux = await response.json();

        grid.innerHTML = ''; // Vide la grille de chargement

        jeux.forEach(jeu => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.onclick = () => lancerJeu(jeu.console, jeu.path);

            card.innerHTML = `
                <div class="game-title">${jeu.title}</div>
                <span class="game-badge">${jeu.console.toUpperCase()}</span>
            `;

            grid.appendChild(card);
        });
    } catch (erreur) {
        console.error('Erreur lors du chargement du catalogue:', erreur);
        grid.innerHTML = '<p>Impossible de charger la liste des jeux.</p>';
    }
}

// Fonction qui lance l'émulateur
function lancerJeu(consoleCode, cheminRom) {
    const wrapper = document.getElementById('game-wrapper');
    wrapper.innerHTML = '<div id="game"></div>';

    EJS_player = '#game';
    EJS_core = consoleCode;
    EJS_gameUrl = cheminRom;
    EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

    let loaderScript = document.createElement('script');
    loaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(loaderScript);
}