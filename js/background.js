


/**
 * Background script that takes care of communicating with the Drive API.
 * @author m.kupriyanov@gmail.com (Misha Kupriyanov)
 * @author kaktus621@gmail.com (Martin Matysiak)
 * @constructor
 */
var Background = function() {
  this.menuItemId = null;
  this.driveClient = new DriveClient(
      '726644204609-umoqam0qvmpijkaum5id59gq0dkh1qgp.apps.googleusercontent.com',
      'phen0caOoD80eGY2rnnt2A8Z');

  if (chrome.contextMenus) {
    this.showContextMenu_();
  }

  chrome.extension.onMessage.addListener(this.onMessage.bind(this));
};


/**
 * Registers a new context menu item for images.
 * @private
 */
Background.prototype.showContextMenu_ = function() {
  this.maybeRemoveContextMenu_();
  this.menuItemId = chrome.contextMenus.create({
    'title' : chrome.i18n.getMessage('mnu_upload_to_drive'),
    'documentUrlPatterns' : ['http://*/*', 'https://*/*'],
    'onclick' : this.onClick.bind(this),
    'contexts' : ['image']
  });
};


/**
 * Removes the extension's context menu item, if there was one.
 * @private
 */
Background.prototype.maybeRemoveContextMenu_ = function() {
  if (this.menuItemId !== null) {
    chrome.contextMenus.remove(this.menuItemId);
    this.menuItemId = null;
  }
};


/**
 * Displays a Desktop notification.
 * @param {string} message The message to show.
 * @param {string=} opt_description An additional description that will be shown
 *    in smaller font.
 * @param {function=} opt_callback A method that will be called on click of the
 *    notification.
 */
Background.prototype.toast = function(message, opt_description, opt_callback) {
  var notification = webkitNotifications.createNotification('drive32.png',
      message, opt_description ? opt_description : '');
  if (opt_callback) {
    notification.onclick = opt_callback;
  }

  notification.show();
};


/**
 * Message handler for Chrome Extension messages.
 * @param {Object} request The incoming request.
 * @param {?} sender Information about the requesting client.
 * @param {function=} opt_callback Callback that awaits results.
 */
Background.prototype.onMessage = function(request, sender, opt_callback) {
  switch (request.action) {
    case 'toast':
      this.toast(request.message);
      break;
    case 'store':
      this.driveClient.filesInsert(request.fileName, request.description,
          request.mimeType, request.data, this.onUploadComplete.bind(this));
      break;
  }
};


/**
 * Handler for processing results of insert operations in the DriveClient.
 * @param {boolean} success Whether the operation succeeded.
 * @param {Object=} opt_response If the operation succeeded, this object will
 *    contain information about the created file.
 */
Background.prototype.onUploadComplete = function(success, opt_response) {
  if (success) {
    this.toast(chrome.i18n.getMessage('upload_success'),
        chrome.i18n.getMessage('upload_open'),
        function() {
          chrome.tabs.create({
            url: opt_response.alternateLink
          });
        });
  } else {
    this.toast(chrome.i18n.getMessage('upload_failed'));
  }
};


/**
 * Handler for clicks on the context menu item.
 * @param {OnClickData} info Information about the item clicked and the context
 *    where the click happened.
 * @param {tabs.Tab=} opt_tab The details of the tab where the click took
 *    place. If the click did not take place in a tab, this parameter will
 *    be missing.
 */
Background.prototype.onClick = function(info, opt_tab) {
  // The content script has to get the file
  chrome.tabs.sendMessage(opt_tab.id, {
    action: 'download',
    url: info.srcUrl
  });
};

new Background();
