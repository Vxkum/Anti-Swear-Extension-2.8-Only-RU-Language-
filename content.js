// Матерные КОРНИ - ищем их везде, даже внутри слов
const MAT_ROOTS = [
  // Русский мат - основа
  "хуй","хуи","хуя","хуе","хую","хер","херн","херов",
  "пизд","пезд","пздец","пздц",
  // ВАЖНО: корни минимум 3-4 символа, чтобы не попадать в обычные слова!
  // Например "еб" нельзя — срабатывает в "служебный", "учебный", "хлебный"
  "ебать","ебал","ебан","ебл",
  "ёбан","ёбнут","ёбнул","ёбнуться","ёбнулся","ёбнулась",
  "заеб","въеб","выеб","переёб","поеб","уеб","наеб","разъеб","проеб",
  "заёбан","заёб",
  "ипать","ипала",
  "блядь","блят","бляди","бляд","бляцк","блядск",
  "сучка","сученыш",
  "жопа","жопн","жопой","жопу",
  "говно","говнян","говнист",
  "срака","срать","срал","обосра","насра","усра","засра",
  "пердеть","пердун","пёрд","бздеть","бздун",
  "залупа","залупин",
  "гондон","гандон",
  "мандавош","манда",
  "пидор","пидар","педор","педар","педер","пидрила","педик","пидорас","пидарас",
  "шлюха","шалава","курва","потаскуха","шмара","давалка",
  "долбоёб","долбоеб",
  "мудак","мудила","мудозвон",
  "дрочить","дрочил","онанист","мастурб",
  "ублюдок","выблядок",
  "хуесос","хуйло","нахуй","похуй","похер","нахер","дохуя","нихуя",
  "пиздец","пиздёж","пиздун","пиздобол","пизданул","пиздорванец",
  "тварина","мразина",
  "ёптить","ептить",
  "трахать","трахал","трахает","трахнул","трахнула",
  "спермак","спермот",
  "чмошник",
  // Мягкий мат (только явные формы, не корни)
  "хренов","хреново","захренел",
  // Английский мат — только достаточно длинные или специфичные
  "fuck","fucker","motherfucker","fuckup","fuckface","fuckwit","clusterfuck",
  "dickhead","dickface","dickwad",
  "cocksucker","cockhead",
  "pussy","cunt","cunting",
  "bitch","bitchy","son of a bitch",
  "slut","slutty","slutbag",
  "whore",
  "shit","shitty","bullshit","horseshit","dipshit","shitface","shithead",
  "asshole","asshat","asswipe","jackass","dumbass",
  "bastard",
  "goddamn","goddamnit",
  "pissoff",
  "crap","crappy",
  "retard","retarded",
  "nigger","nigga",
  "faggot",
  "twat","twatwaffle",
  "wanker","wanking",
  "bollocks",
  "tosser",
  "bugger",
  "arsehole",
  "douchebag",
  "jerkoff"
];

let filterEnabled = true;
let blurMode = 'blur'; // 'blur' | 'solid'
let solidColor = '#000000';
let processedNodes = new WeakSet();

function loadSettings(callback) {
  chrome.storage.sync.get(['filterEnabled', 'blurMode', 'solidColor'], function(result) {
    filterEnabled = result.filterEnabled !== false;
    blurMode = result.blurMode || 'blur';
    solidColor = result.solidColor || '#000000';
    if (callback) callback();
  });
}

function injectStyles() {
  let style = document.getElementById('antiswear-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'antiswear-styles';
    document.head.appendChild(style);
  }
  updateStyles(style);
}

function updateStyles(styleEl) {
  const el = styleEl || document.getElementById('antiswear-styles');
  if (!el) return;
  if (blurMode === 'blur') {
    el.textContent = `
      .antiswear-blur {
        filter: blur(5px);
        user-select: none;
        cursor: not-allowed;
        background: rgba(0,0,0,0.1);
        padding: 0 2px;
        border-radius: 3px;
        transition: filter 0.3s;
        display: inline-block;
      }
      .antiswear-blur:hover { filter: blur(2px); }
    `;
  } else {
    el.textContent = `
      .antiswear-blur {
        background-color: ${solidColor};
        color: transparent;
        user-select: none;
        cursor: not-allowed;
        padding: 0 2px;
        border-radius: 2px;
        display: inline-block;
        transition: background-color 0.3s;
      }
      .antiswear-blur:hover { opacity: 0.7; }
    `;
  }
}

function containsMat(text) {
  const lower = text.toLowerCase();
  return MAT_ROOTS.some(function(root) { return lower.indexOf(root) !== -1; });
}

function blurMatInText(node) {
  if (!filterEnabled || !node.nodeValue || processedNodes.has(node)) return;
  const text = node.nodeValue;
  if (!containsMat(text)) return;
  processedNodes.add(node);

  const words = text.split(/(\s+)/);
  let hasMatWords = false;
  const fragments = [];

  words.forEach(function(word) {
    if (word.trim() === '') { fragments.push(document.createTextNode(word)); return; }
    let wordHasMat = MAT_ROOTS.some(function(root) { return word.toLowerCase().indexOf(root) !== -1; });
    if (wordHasMat) {
      hasMatWords = true;
      const span = document.createElement('span');
      span.className = 'antiswear-blur';
      span.textContent = word;
      fragments.push(span);
    } else {
      fragments.push(document.createTextNode(word));
    }
  });

  if (hasMatWords && node.parentNode) {
    const parent = node.parentNode;
    fragments.forEach(function(f) { parent.insertBefore(f, node); });
    parent.removeChild(node);
  }
}

function walkNodes(node) {
  if (!filterEnabled) return;
  if (node.nodeType === 3) { blurMatInText(node); }
  else if (node.nodeType === 1 && node.childNodes &&
    node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' &&
    node.tagName !== 'NOSCRIPT' && !node.classList.contains('antiswear-blur')) {
    Array.from(node.childNodes).forEach(function(child) { walkNodes(child); });
  }
}

function init() {
  if (!filterEnabled) return;
  walkNodes(document.body);
  const observer = new MutationObserver(function(mutations) {
    if (!filterEnabled) return;
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) { walkNodes(node); });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Слушаем изменения настроек в реальном времени
chrome.storage.onChanged.addListener(function(changes) {
  if (changes.blurMode || changes.solidColor) {
    blurMode = changes.blurMode ? changes.blurMode.newValue : blurMode;
    solidColor = changes.solidColor ? changes.solidColor.newValue : solidColor;
    updateStyles();
  }
});

if (document.body) {
  loadSettings(function() {
    if (filterEnabled) { injectStyles(); init(); }
  });
} else {
  document.addEventListener('DOMContentLoaded', function() {
    loadSettings(function() {
      if (filterEnabled) { injectStyles(); init(); }
    });
  });
}
