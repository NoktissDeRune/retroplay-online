// Fonction pour charger et mettre à jour le Header
async function loadHeader() {
  const container = document.getElementById('header-container');
  if (!container) return;

  try {
    const response = await fetch('header.html');
    if (!response.ok) throw new Error('Impossible de charger header.html');
    
    const html = await response.text();
    container.innerHTML = html;

    // Met à jour les éléments utilisateur / admin dans le header
    await mettreAJourHeaderAuth();

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

// Gestion dynamique des droits et de la session dans le Header
async function mettreAJourHeaderAuth() {
  if (typeof supabaseClient === 'undefined') return;

  const { data: { session } } = await supabaseClient.auth.getSession();
  const authContainer = document.getElementById('header-auth-section');
  const adminLink = document.getElementById('nav-admin-link');

  if (!session) {
    // Si déconnecté
    if (adminLink) adminLink.style.display = 'none';
    if (authContainer) {
      authContainer.innerHTML = `
        <a href="login.html" class="nav-link">Connexion</a>
        <a href="register.html" class="nav-arcade-btn">S'inscrire</a>
      `;
    }
    return;
  }

  // Si connecté : vérification du rôle Admin dans la table profiles
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  const isAdmin = profile?.is_admin === true;

  // Affichage du lien Admin uniquement si is_admin est true
  if (adminLink) {
    adminLink.style.display = isAdmin ? 'inline-block' : 'none';
  }

  // Affichage des infos de profil dans le header
  if (authContainer) {
    const userEmail = session.user.email.split('@')[0]; // Extrait le nom avant le @
    authContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="font-size: 0.85rem; color: var(--text-muted);">
          👤 <strong style="color: #fff;">${userEmail}</strong> ${isAdmin ? '<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 4px;">ADMIN</span>' : ''}
        </span>
        <button id="header-logout-btn" class="nav-link" style="background: none; border: none; cursor: pointer;">Déconnexion</button>
      </div>
    `;

    // Écouteur pour la déconnexion
    document.getElementById('header-logout-btn')?.addEventListener('click', async () => {
      await supabaseClient.auth.signOut();
      window.location.reload();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
});
