// Load settings
chrome.storage.sync.get(['filterEnabled', 'darkTheme', 'blurMode', 'solidColor'], function(result) {
  var fe = result.filterEnabled !== false;
  var dt = result.darkTheme || false;
  var mode = result.blurMode || 'blur';
  var color = result.solidColor || '#000000';

  document.getElementById('toggleFilter').checked = fe;
  updateStatus(fe);
  updateTheme(dt);
  setMode(mode, false);
  setColor(color, false);
});

// Filter toggle
document.getElementById('toggleFilter').addEventListener('change', function(e) {
  var enabled = e.target.checked;
  chrome.storage.sync.set({ filterEnabled: enabled });
  updateStatus(enabled);
  reloadTabs();
});

// Theme
document.getElementById('themeBtn').addEventListener('click', function() {
  chrome.storage.sync.get(['darkTheme'], function(result) {
    var newTheme = !result.darkTheme;
    chrome.storage.sync.set({ darkTheme: newTheme });
    updateTheme(newTheme);
  });
});

// Blur mode buttons
document.querySelectorAll('.mode-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setMode(this.dataset.mode, true);
  });
});

// Color presets
document.querySelectorAll('.color-preset').forEach(function(preset) {
  preset.addEventListener('click', function() {
    setColor(this.dataset.color, true);
  });
});

// Custom color picker
document.getElementById('customColor').addEventListener('input', function() {
  setColor(this.value, true);
});

// --- Helpers ---

function setMode(mode, save) {
  document.querySelectorAll('.mode-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  var colorSection = document.getElementById('colorSection');
  colorSection.style.display = mode === 'solid' ? 'block' : 'none';
  if (save) {
    chrome.storage.sync.set({ blurMode: mode });
  }
}

function setColor(color, save) {
  document.getElementById('customColor').value = color;
  document.querySelectorAll('.color-preset').forEach(function(p) {
    p.classList.toggle('active', p.dataset.color.toLowerCase() === color.toLowerCase());
  });
  if (save) {
    chrome.storage.sync.set({ solidColor: color });
  }
}

function updateStatus(enabled) {
  var el = document.getElementById('status');
  el.textContent = enabled ? '✅ Фильтр активен' : '❌ Фильтр отключён';
  el.className = enabled ? 'status active' : 'status inactive';
}

function updateTheme(dark) {
  document.body.className = dark ? 'dark' : 'light';
  document.getElementById('themeBtn').textContent = dark ? '☀️' : '🌙';
}

function reloadTabs() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      if (tab.url &&
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://') &&
        !tab.url.startsWith('edge://') &&
        !tab.url.startsWith('about:')) {
        try { chrome.tabs.reload(tab.id); } catch(e) {}
      }
    });
  });
}
