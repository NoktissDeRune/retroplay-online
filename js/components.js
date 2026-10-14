// Function pour charger automatiquement le Header
async function loadHeader() {
  const container = document.getElementById('header-container');
  if (!container) return;

  try {
    const response = await fetch('header.html');
    if (!response.ok) throw new Error('Impossible de charger header.html');
    
    const html = await response.text();
    container.innerHTML = html;

    // Mise à jour de l'état de connexion utilisateur
    if (typeof mettreAJourHeaderAuth === 'function') {
      mettreAJourHeaderAuth();
    }

    // Activer la surbrillance de la page courante
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = container.querySelectorAll('.header-nav a');
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
      }
    });

  } catch (error) {
    console.error('Erreur lors du chargement du header :', error);
  }
}

// Fonction pour injecter les éléments CSS/JS globaux dans le <head> si absents
function setupGlobalHead() {
  const head = document.head;

  // En cas d'oubli du CSS principal
  if (!document.querySelector('link[href*="style.css"]')) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'css/style.css';
    head.appendChild(cssLink);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupGlobalHead();
  loadHeader();
});
