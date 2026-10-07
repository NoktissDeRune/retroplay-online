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

    let romUrl = cheminRom;

    if (romUrl.startsWith('http')) {
        // Encodage propre de l'URL source
        const encodedUrl = encodeURIComponent(cheminRom);
        
        // Proxy ultra-stable pour les gros fichiers binaires (Archive.org)
        romUrl = `https://corsproxy.io/?url=${encodedUrl}`;
    }

    // Extraction du nom de fichier original (ex: "zelda.z64") pour qu'EmuJS reconnaisse l'extension
    const fileName = cheminRom.split('/').pop().split('?')[0];

    EJS_player = '#game';
    EJS_core = consoleCode;
    EJS_gameUrl = romUrl;
    EJS_gameName = fileName; // Indique explicitement le nom du fichier à l'émulateur
    EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';

    // Nettoyage des anciens scripts loader s'il y en a
    const oldScript = document.getElementById('emu-loader');
    if (oldScript) oldScript.remove();

    let loaderScript = document.createElement('script');
    loaderScript.id = 'emu-loader';
    loaderScript.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(loaderScript);
}
