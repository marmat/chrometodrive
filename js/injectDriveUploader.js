chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action == 'download') {

        downloadFile(request.url, function(data, mimeType) {
          var fileToDownload = request.url;
          var description = [chrome.i18n.getMessage('desc_source'), ': ',
                request.url, '\n', chrome.i18n.getMessage('desc_parent'), ': ',
                document.location].join('');

          var fileName = fileToDownload.split('/');
          fileName = fileName[fileName.length - 1];

          chrome.extension.sendMessage({
            action: 'store',
            fileName: fileName,
            description: description,
            mimeType: mimeType,
            data: data
          });
        });
      }
    });

function downloadFile(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    if (this.status == 200) {
      var uInt8Array = new Uint8Array(this.response);
      var i = uInt8Array.length;
      var binaryString = new Array(i);
      while (i--) {
        binaryString[i] = String.fromCharCode(uInt8Array[i]);
      }
      var data = binaryString.join('');
      var base64 = window.btoa(data);

      callback(base64, xhr.getResponseHeader('Content-Type'));
    }
  };

  xhr.send();
}

