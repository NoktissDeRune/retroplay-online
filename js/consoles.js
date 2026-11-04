// ==========================================================================
// CONSOLES PRISES EN CHARGE — seul endroit à modifier pour en ajouter
//   label      : nom complet (page "Ma ROM")
//   court      : nom affiché sur les pastilles du catalogue
//   core       : nom du cœur EmulatorJS
//   extensions : extensions de fichier acceptées
//   check      : (optionnel) vérifie l'en-tête du fichier
//   maxMo      : (optionnel) taille maximale spécifique à la console
// ==========================================================================
const CONSOLES = {
  gba: {
    label: 'Game Boy Advance',
    court: 'GBA',
    core: 'gba',
    extensions: ['gba'],
    check: (b) => b.length > 0xB2 && b[0xB2] === 0x96
  },
  gb: {
    label: 'Game Boy / Game Boy Color',
    court: 'GB / GBC',
    core: 'gb',
    extensions: ['gb', 'gbc'],
    check: (b) => b.length > 0x107 && b[0x104] === 0xCE && b[0x105] === 0xED && b[0x106] === 0x66 && b[0x107] === 0x66
  },
  n64: {
    label: 'Nintendo 64',
    court: 'N64',
    core: 'n64',
    extensions: ['z64', 'n64', 'v64'],
    check: (b) => b.length > 3 && (
      (b[0] === 0x80 && b[1] === 0x37 && b[2] === 0x12 && b[3] === 0x40) ||
      (b[0] === 0x37 && b[1] === 0x80 && b[2] === 0x40 && b[3] === 0x12) ||
      (b[0] === 0x40 && b[1] === 0x12 && b[2] === 0x37 && b[3] === 0x80)
    )
  },
  nds: {
    label: 'Nintendo DS',
    court: 'DS',
    core: 'nds',
    extensions: ['nds'],
    maxMo: 512
  },
  nes: {
    label: 'Nintendo NES',
    court: 'NES',
    core: 'nes',
    extensions: ['nes'],
    check: (b) => b.length > 3 && b[0] === 0x4E && b[1] === 0x45 && b[2] === 0x53 && b[3] === 0x1A
  },
  snes: {
    label: 'Super Nintendo',
    court: 'SNES',
    core: 'snes',
    extensions: ['sfc', 'smc']
  },
  segaMD: {
    label: 'Sega Mega Drive / Genesis',
    court: 'Mega Drive',
    core: 'segaMD',
    extensions: ['md', 'gen', 'smd']
  },
  segaMS: {
    label: 'Sega Master System',
    court: 'Master System',
    core: 'segaMS',
    extensions: ['sms']
  },
  segaGG: {
    label: 'Sega Game Gear',
    court: 'Game Gear',
    core: 'segaGG',
    extensions: ['gg']
  }
};

// Retrouve la clé d'une console à partir de la valeur stockée en base
// (insensible à la casse ; "gbc" est rattaché à "gb")
function trouverConsole(valeur) {
  const v = String(valeur ?? '').toLowerCase().trim();
  if (v === 'gbc') return 'gb';
  return Object.keys(CONSOLES).find(cle => cle.toLowerCase() === v) || null;
}
