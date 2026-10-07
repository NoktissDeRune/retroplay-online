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

function lancerJeu(consoleCode, cheminRom) {
    const wrapper = document.getElementById('game-wrapper');
    
    // 1. On vide complètement le conteneur pour détruire l'ancienne instance
    wrapper.innerHTML = ''; 

    // 2. On recrée l'élément #game
    const gameDiv = document.createElement('div');
    gameDiv.id = 'game';
    wrapper.appendChild(gameDiv);

    // 3. Configuration d'EmulatorJS
    window.EJS_player = '#game';
    window.EJS_core = consoleCode;
    window.EJS_gameUrl = cheminRom;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_language = 'en-US'; // Évite la requête 404 fr.json inutile

    // 4. Nettoyage et réinjection propre du script
    const oldScript = document.getElementById('emu-script');
    if (oldScript) oldScript.remove();

    let loaderScript = document.createElement('script');
    loaderScript.id = 'emu-script';
    loaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(loaderScript);
}
