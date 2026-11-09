// Rangées thématiques de l'accueil (style plateforme de streaming).
// S'appuie sur les variables et fonctions de app.js : tousLesJeux, currentUser,
// userFavorisIds et creerCarteJeu().

async function construireRangees() {
  const section = document.getElementById('rows-section');
  if (!section) return;

  section.innerHTML = '';
  const rangees = [];

  try {
    // 1) Continuer à jouer : les derniers jeux lancés par le joueur connecté
    if (currentUser) {
      const { data: historique } = await supabaseClient
        .from('play_history')
        .select('game_id')
        .eq('user_id', currentUser.id)
        .order('last_played_at', { ascending: false })
        .limit(12);

      rangees.push({
        titre: '▶ Continuer à jouer',
        jeux: jeuxParIds((historique || []).map(l => l.game_id))
      });
    }

    // 2) Tendances : jeux lancés par le plus de joueurs ces 30 derniers jours
    const { data: tendances } = await supabaseClient.rpc('trending_games', { p_limit: 10 });
    rangees.push({
      titre: '🔥 Tendances',
      jeux: jeuxParIds((tendances || []).map(t => t.game_id))
    });

    // 3) Nouveautés : les jeux ajoutés le plus récemment
    rangees.push({
      titre: '🆕 Nouveautés',
      jeux: tousLesJeux.slice(0, 10)
    });
  } catch (erreur) {
    // Les rangées sont un bonus : une erreur ne doit jamais casser le catalogue
    console.error('Erreur chargement des rangées:', erreur);
  }

  rangees
    .filter(r => r.jeux.length > 0)
    .forEach(r => section.appendChild(creerRangee(r.titre, r.jeux)));
}

// Retrouve les jeux du catalogue à partir d'une liste d'identifiants (ordre conservé)
function jeuxParIds(ids) {
  return ids
    .map(id => tousLesJeux.find(j => j.id === String(id)))
    .filter(Boolean);
}

function creerRangee(titre, jeux) {
  const bloc = document.createElement('div');
  bloc.className = 'row-block';

  const h2 = document.createElement('h2');
  h2.className = 'section-title';
  h2.textContent = titre;

  const defilement = document.createElement('div');
  defilement.className = 'row-scroller';
  jeux.forEach(jeu => {
    defilement.appendChild(creerCarteJeu(jeu, userFavorisIds.includes(jeu.id)));
  });

  bloc.appendChild(h2);
  bloc.appendChild(defilement);
  return bloc;
}

// Jeu à la une : choisi dans l'admin, sinon le plus tendance, sinon le dernier ajouté
async function choisirJeuALaUne() {
  const choisi = tousLesJeux.find(j => j.featured === true);
  if (choisi) return choisi;

  try {
    const { data } = await supabaseClient.rpc('trending_games', { p_limit: 1 });
    if (data && data.length > 0) {
      const tendance = tousLesJeux.find(j => j.id === String(data[0].game_id));
      if (tendance) return tendance;
    }
  } catch (erreur) {
    console.error('Erreur jeu à la une:', erreur);
  }

  return tousLesJeux[0];
}

