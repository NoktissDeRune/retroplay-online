// ==========================================================================
// 1. CONSOLES PRISES EN CHARGE  (seul endroit à modifier pour en ajouter)
//    core       : nom du cœur EmulatorJS
//    extensions : extensions de fichier acceptées
//    check      : (optionnel) vérifie l'en-tête du fichier pour détecter un mauvais fichier
// ==========================================================================
const CONSOLES = {
  gba: {
    label: 'Game Boy Advance',
    core: 'gba',
    extensions: ['gba'],
    // Octet fixe 0x96 à l'offset 0xB2 dans l'en-tête GBA
    check: (b) => b.length > 0xB2 && b[0xB2] === 0x96
  },
  gb: {
    label: 'Game Boy / Game Boy Color',
    core: 'gb',
    extensions: ['gb', 'gbc'],
    // Début du logo Nintendo à l'offset 0x104
    check: (b) => b.length > 0x107 && b[0x104] === 0xCE && b[0x105] === 0xED && b[0x106] === 0x66 && b[0x107] === 0x66
  },
  n64: {
    label: 'Nintendo 64',
    core: 'n64',
    extensions: ['z64', 'n64', 'v64'],
    // Les trois ordres d'octets possibles d'une ROM N64
    check: (b) => b.length > 3 && (
      (b[0] === 0x80 && b[1] === 0x37 && b[2] === 0x12 && b[3] === 0x40) ||
      (b[0] === 0x37 && b[1] === 0x80 && b[2] === 0x40 && b[3] === 0x12) ||
      (b[0] === 0x40 && b[1] === 0x12 && b[2] === 0x37 && b[3] === 0x80)
    )
  },
  nes: {
    label: 'Nintendo NES',
    core: 'nes',
    extensions: ['nes'],
    // Signature "NES" + 0x1A
    check: (b) => b.length > 3 && b[0] === 0x4E && b[1] === 0x45 && b[2] === 0x53 && b[3] === 0x1A
  },
  snes: {
    label: 'Super Nintendo',
    core: 'snes',
    extensions: ['sfc', 'smc']
  },
  segaMD: {
    label: 'Sega Mega Drive / Genesis',
    core: 'segaMD',
    extensions: ['md', 'gen', 'smd']
  },
  segaMS: {
    label: 'Sega Master System',
    core: 'segaMS',
    extensions: ['sms']
  },
  segaGG: {
    label: 'Sega Game Gear',
    core: 'segaGG',
    extensions: ['gg']
  },
  nds: {
    label: 'Nintendo DS',
    core: 'nds',
    extensions: ['nds'],
    maxMo: 512
  }
};

// Les archives .zip sont acceptées, mais la console doit alors être choisie à la main
const EXTENSIONS_ARCHIVE = ['zip'];
const TAILLE_MAX_MO = 128;

// ==========================================================================
// 2. OUTILS
// ==========================================================================
const el = {
  form: document.getElementById('local-form'),
  file: document.getElementById('rom-file'),
  select: document.getElementById('rom-console'),
  error: document.getElementById('local-error'),
  list: document.getElementById('supported-list'),
  panel: document.getElementById('local-panel'),
  game: document.getElementById('local-game'),
  gameName: document.getElementById('local-game-name'),
  btnChange: document.getElementById('btn-change-rom')
};

function extensionDe(nomFichier) {
  const i = nomFichier.lastIndexOf('.');
  return i === -1 ? '' : nomFichier.slice(i + 1).toLowerCase();
}

function consolePourExtension(ext) {
  return Object.keys(CONSOLES).find(cle => CONSOLES[cle].extensions.includes(ext)) || null;
}

function toutesLesExtensions() {
  return Object.values(CONSOLES).flatMap(c => c.extensions).concat(EXTENSIONS_ARCHIVE);
}

function afficherErreur(message) {
  el.error.textContent = message || '';
}

// ==========================================================================
// 3. INITIALISATION DE L'INTERFACE
// ==========================================================================
function initInterface() {
  // Liste déroulante des consoles
  el.select.innerHTML = '<option value="">— Choisir la console —</option>';
  Object.entries(CONSOLES).forEach(([cle, c]) => {
    const opt = document.createElement('option');
    opt.value = cle;
    opt.textContent = c.label;
    el.select.appendChild(opt);
  });

  // Liste affichée des consoles prises en charge
  Object.values(CONSOLES).forEach(c => {
    const li = document.createElement('li');
    li.textContent = c.label + ' (' + c.extensions.map(e => '.' + e).join(', ') + ')';
    el.list.appendChild(li);
  });
  const liZip = document.createElement('li');
  liZip.textContent = 'Archives .zip (console à choisir manuellement)';
  el.list.appendChild(liZip);

  // Filtre du sélecteur de fichier
  el.file.accept = toutesLesExtensions().map(e => '.' + e).join(',');
}

// ==========================================================================
// 4. VALIDATION
// ==========================================================================
// Vérifie le nom, la taille et la cohérence extension / console choisie
function validerFichier(file, cleConsole) {
  if (!file) return 'Choisis d\'abord un fichier de jeu.';

  const ext = extensionDe(file.name);
  if (!toutesLesExtensions().includes(ext)) {
    return 'Format non pris en charge (« .' + ext + ' »). Consulte la liste des consoles ci-dessous.';
  }

  if (file.size === 0) return 'Ce fichier est vide.';
  const maxMo = CONSOLES[cleConsole].maxMo ?? TAILLE_MAX_MO;
  if (file.size > maxMo * 1024 * 1024) {
    return 'Fichier trop volumineux pour cette console (maximum ' + maxMo + ' Mo).';
  }

  if (!cleConsole) return 'Choisis la console correspondant à ce jeu.';

  if (!EXTENSIONS_ARCHIVE.includes(ext) && !CONSOLES[cleConsole].extensions.includes(ext)) {
    return 'Ce fichier (.' + ext + ') ne correspond pas à la console « ' + CONSOLES[cleConsole].label + ' ».';
  }
  return null;
}

// Vérifie l'en-tête du fichier (pour les consoles qui ont une signature connue)
async function validerEntete(file, cleConsole) {
  const ext = extensionDe(file.name);
  if (EXTENSIONS_ARCHIVE.includes(ext)) return null; // contenu d'une archive non vérifiable ici

  const check = CONSOLES[cleConsole].check;
  if (!check) return null;

  const octets = new Uint8Array(await file.slice(0, 0x200).arrayBuffer());
  if (!check(octets)) {
    return 'Ce fichier ne semble pas être une ROM ' + CONSOLES[cleConsole].label + ' valide.';
  }
  return null;
}

// ==========================================================================
// 5. ÉVÉNEMENTS
// ==========================================================================
el.file.addEventListener('change', () => {
  afficherErreur('');
  const file = el.file.files[0];
  if (!file) return;

  const ext = extensionDe(file.name);
  if (!toutesLesExtensions().includes(ext)) {
    afficherErreur('Format non pris en charge (« .' + ext + ' »). Consulte la liste des consoles ci-dessous.');
    el.file.value = '';
    el.select.value = '';
    return;
  }

  // Détection automatique de la console (sauf archive .zip)
  const cle = consolePourExtension(ext);
  el.select.value = cle || '';
  if (!cle) afficherErreur('Archive détectée : choisis la console correspondante.');
});

el.select.addEventListener('change', () => {
  const file = el.file.files[0];
  if (!file || !el.select.value) return afficherErreur('');
  afficherErreur(validerFichier(file, el.select.value));
});

el.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = el.file.files[0];
  const cle = el.select.value;

  const erreur = validerFichier(file, cle) || await validerEntete(file, cle);
  if (erreur) return afficherErreur(erreur);

  afficherErreur('');
  lancerJeu(file, cle);
});

el.btnChange.addEventListener('click', () => {
  // EmulatorJS ne peut pas être réinitialisé proprement : on recharge la page
  window.location.reload();
});

// ==========================================================================
// 6. LANCEMENT D'EMULATORJS
// ==========================================================================
function lancerJeu(file, cleConsole) {
  const nom = file.name.replace(/\.[^.]+$/, '');

  el.panel.classList.add('is-hidden');
  el.game.classList.remove('is-hidden');
  el.gameName.textContent = nom;
  document.title = nom + ' — RetroPlay';

  window.EJS_player = '#game-container';
  window.EJS_core = CONSOLES[cleConsole].core;
  window.EJS_gameUrl = URL.createObjectURL(file); // lecture locale, aucun envoi
  window.EJS_gameName = nom;
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
  window.EJS_language = 'fr';

  const script = document.createElement('script');
  script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
  document.body.appendChild(script);
}

initInterface();
