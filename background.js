chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
      id: 'icdCodeLookup',
      title: 'Show ICD Description',
      contexts: ['selection']
    });
  });
  
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === 'icdCodeLookup') {
      var selectedText = info.selectionText.trim();
      var icdCodeRegex = /\b[A-Z]\d{2}(?:\.\d{1,3})?\b/g;
      var icdCodes = selectedText.match(icdCodeRegex);
      if (icdCodes) {
        var apiUrl = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=';
        
        icdCodes.forEach(function(code) {
          fetch(apiUrl + code)
            .then(response => response.json())
            .then(data => {
              if (data[3].length > 0) {
                var description = data[3][0];
                chrome.tabs.sendMessage(tab.id, { action: 'showOverlay', code: code, description: description });
              } else {
                chrome.tabs.sendMessage(tab.id, { action: 'showOverlay', code: code, description: 'Description not found' });
              }
            })
            .catch(error => {
              console.error('Error:', error);
            });
        });
      } else {
        chrome.tabs.sendMessage(tab.id, { action: 'showOverlay', code: '', description: 'No ICD codes found in the selected text.' });
      }
    }
  });