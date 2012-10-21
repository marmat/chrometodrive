var menuId = null;
var googleAuth = new OAuth2('google', {
    client_id: '1054546345631-b4qa1umtauia8uoommptadohd2b2p0gk.apps.googleusercontent.com',
    client_secret: '06jLeCPzwxGTkMmnW8pg-dZa',
    api_scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive'
});

if (chrome.contextMenus) {
  showContextMenu();
}

function showContextMenu() {
  maybeRemoveContextMenu();

  menuId = chrome.contextMenus.create({
    'title' : chrome.i18n.getMessage('mnu_upload_to_drive'),
    'documentUrlPatterns' : [ 'http://*/*', 'https://*/*' ],
    'onclick' : onClickHandler,
    'contexts' : [ 'link', 'image' ]
  });
}

function maybeRemoveContextMenu() {
  if (menuId !== null) {
    chrome.contextMenus.remove(menuId);
    menuId = null;
  }
}


function storeToDrive(fileName, description, mimeType, data) {
  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  var contentType = 'application/octet-stream';
  var metadata = {
    'description': description,
    'title': fileName,
    'mimeType': mimeType
  };

  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + contentType + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      data +
      close_delim;


  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://www.googleapis.com/upload/drive/v2/files', false);
  xhr.setRequestHeader('Authorization', 'OAuth ' +
      localStorage.c2d_accessToken);
  xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="' +
      boundary + '"');
  xhr.send(multipartRequestBody);

  if (xhr.status == 200) {
    var createdFile = JSON.parse(xhr.response);

    var xhrPerm = new XMLHttpRequest();
    xhrPerm.open('POST', 'https://www.googleapis.com/drive/v2/files/' +
        createdFile.id + '/permissions', false);
    xhrPerm.setRequestHeader('Authorization', 'OAuth ' +
        localStorage.c2d_accessToken);
    xhrPerm.setRequestHeader('Content-Type', 'application/json');
    xhrPerm.send(JSON.stringify({
      role: 'reader',
      type: 'anyone',
      withLink: true
    }));

    if (xhrPerm.status == 200) {
      toast(chrome.i18n.getMessage('upload_success'),
          chrome.i18n.getMessage('upload_open'),
          function() {
            chrome.tabs.create({
              url: createdFile.alternateLink
            });
          });
    } else {
      toast(chrome.i18n.getMessage('upload_noperm'));
    }
  } else {
    toast(chrome.i18n.getMessage('upload_failed'));
  }
}

function toast(message, opt_description, opt_callback) {
  var notification = webkitNotifications.createNotification(null, message,
      opt_description ? opt_description : '');
  if (opt_callback) {
    notification.onclick = opt_callback;
  }

  notification.show();
}

function onClickHandler(info, tab) {
  googleAuth.authorize(function() {
      localStorage.c2d_accessToken = googleAuth.getAccessToken();
      // Ready for action
      chrome.tabs.sendMessage(tab.id, {
          action: 'download',
          url: info.srcUrl
        });
  });
}

function onMessageHandler(request, sender, sendResponse) {
  switch (request.action) {
    case 'toast':
      toast(request.message);
      break;
    case 'store':
      storeToDrive(request.fileName, request.description, request.mimeType,
          request.data);
      break;
  }
}

chrome.extension.onMessage.addListener(onMessageHandler);
