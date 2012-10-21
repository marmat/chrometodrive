chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == 'download') {

      downloadFile(request.url, function(data, mimeType) {
        var fileToDownload = request.url;
        var description = 'File:' + request.url + '\nParent:' +
            document.location;

        var fileName = fileToDownload.split('/');
        fileName = fileName[fileName.length - 1];
        var base64 = data;

        insertFileOAuth(fileName, base64, null, mimeType, request.accessToken,
            description);
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


function insertFileOAuth(fileDataName, fileBase64Data, fileDataType,
    contentMimeType, oauthToken, fileDescription, callback) {
  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  var contentType = fileDataType || 'application/octet-stream';
  var metadata = {
    'description': fileDescription,
    'title': fileDataName,
    'mimeType': contentMimeType
  };

  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      fileBase64Data +
      close_delim;


  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files', false);
  xhr.setRequestHeader('Authorization', 'OAuth ' + oauthToken);
  xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="' +
      boundary + '"');
  xhr.send(multipartRequestBody);

  if (xhr.status == 200) {
    var createdFile = JSON.parse(xhr.response);

    var xhrPerm = new XMLHttpRequest();
    xhrPerm.open('POST', 'https://www.googleapis.com/drive/v2/files/' +
        createdFile.id + '/permissions', false);
    xhrPerm.setRequestHeader('Authorization', 'OAuth ' + oauthToken);
    xhrPerm.setRequestHeader('Content-Type', 'application/json');
    xhrPerm.send(JSON.stringify({
      role: 'reader',
      type: 'anyone',
      withLink: true
    }));

    if (xhrPerm.status == 200) {
      chrome.extension.sendMessage({
        action: 'toast',
        message: chrome.i18n.getMessage('upload_success')
      });
    } else {
      chrome.extension.sendMessage({
        action: 'toast',
        message: chrome.i18n.getMessage('upload_noperm')
      });
    }
  } else {
    chrome.extension.sendMessage({
      action: 'toast',
      message: chrome.i18n.getMessage('upload_failed')
    });
  }
}
