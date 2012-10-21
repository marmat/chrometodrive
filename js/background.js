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

function onClickHandler(info, tab) {
  googleAuth.authorize(function() {
      // Ready for action
      chrome.tabs.sendMessage(tab.id, {
          action: 'download',
          url: info.srcUrl,
          accessToken: googleAuth.getAccessToken()
        });
  });
}

function onMessageHandler(request, sender, sendResponse) {
  switch (request.action) {
    case 'toast':
      webkitNotifications
          .createNotification(null, request.message, '')
          .show();
      break;
      // TODO: Add handler for uploading files from the background page
  }
}

chrome.extension.onMessage.addListener(onMessageHandler);
