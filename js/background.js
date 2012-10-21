
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {

    switch (request.action) {
      case 'toast':
        webkitNotifications
            .createNotification(null, request.message, '')
            .show();
        break;
    }
});
