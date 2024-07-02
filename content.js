var timeout;
var overlay;

document.addEventListener('mouseup', function() {
  clearTimeout(timeout);
  timeout = setTimeout(function() {
    var selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      var codeRegex = /\b(?:[A-Za-z]\d{2}(?:\.\d{1,3})?|(?:\d{7}|\d{6})|\b[A-Za-z]\d{4}\b|(?:\d{4}|\d{5})-\d{1,2})\b/g;
      var codes = selectedText.match(codeRegex);
      console.log(codes)
      if (codes) {
        var apiUrls = {
          icd: 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=',
          rxnorm: 'https://clinicaltables.nlm.nih.gov/api/drug_ingredients/v3/search?sf=code&terms=',
          hcpcs: 'https://clinicaltables.nlm.nih.gov/api/hcpcs/v3/search?terms=',
          loinc: 'https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search?terms='
        };
        var promises = [];
        
        codes.forEach(function(code) {
          let type = '';
          let apiUrl = '';
          if (/^[A-Za-z]\d{2}(?:\.\d{1,3})?$/.test(code)) {
            apiUrl = apiUrls.icd;
            type = 'ICD';
          } else if (/^\d{7}|\d{6}$/.test(code)) {
            apiUrl = apiUrls.rxnorm;
            type = 'RXNORM';
          } else if (/^[A-Za-z]\d{4}$/.test(code))     {      
            apiUrl = apiUrls.hcpcs;
            type = 'HCPCS';
          } else if (/^(?:\d{4}|\d{5})-\d{1,2}$/.test(code)) {
            apiUrl = apiUrls.loinc;
            type = 'LOINC';
          }
          
          if (apiUrl) {
            console.log(apiUrl + code)
            var promise = fetch(apiUrl + code)
              .then(response => response.json())
              .then(data => {
                if (data[3].length > 0) {
                  return { code: code, type:type, description: data[3][0] };
                } else {
                  return { code: code, type:type, description: 'Description not found' };
                }
              })
              .catch(error => {
                console.error('Error:', error);
                return { code: code, description: 'Error retrieving description' };
              });
            
            promises.push(promise);
          }
        });
        
        Promise.all(promises)
          .then(results => {
            if (overlay) {
              overlay.remove();
            }
            showOverlay(results);
          });
      }
    }
  }, 3000);
});

function showOverlay(results) {
  overlay = document.createElement('div');
  overlay.className = 'icd-overlay';
  
  var html = '<button class="close-button">Close</button>';
  html += '<div class="icd-content">';
  results.forEach(function(result) {
    html += `
      <p class="icd-row">
        <strong>${result.type} Code:</strong> ${result.code}<br>
        ${result.description}
      </p>
    `;
  });
  html += '</div>';
  
  overlay.innerHTML = html;
  
  var closeButton = overlay.querySelector('.close-button');
  closeButton.addEventListener('click', function() {
    overlay.remove();
  });
  
  document.body.appendChild(overlay);
}