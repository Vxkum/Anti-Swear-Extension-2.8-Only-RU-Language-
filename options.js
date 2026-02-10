chrome.storage.sync.get(['customWords'], function(result) {
  if (result.customWords) { document.getElementById('words').value = result.customWords.join('\n'); }
});
document.getElementById('save').onclick = function() {
  var words = document.getElementById('words').value.split('\n').filter(function(w) { return w.trim(); });
  chrome.storage.sync.set({ customWords: words }, function() { alert('Сохранено!'); });
};