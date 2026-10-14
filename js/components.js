async function loadHeader() {
  const container = document.getElementById('header-container');
  if (!container) return;

  try {
    const response = await fetch('header.html');
    if (!response.ok) throw new Error('Impossible de charger header.html');
    
    const html = await response.text();
    container.innerHTML = html;

    // Une fois le header injecté dans le DOM, on met à jour les boutons d'auth (Connexion/Admin/Déconnexion)
    if (typeof mettreAJourHeaderAuth === 'function') {
      mettreAJourHeaderAuth();
    }

    // Activer la classe "active" sur le lien de la page courante
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

// Charger le header dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', loadHeader);
