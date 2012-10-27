


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
      'phen0caOoD80eGY2rnnt2A8Z', this.maybeCreateExtensionFolder.bind(this));

  if (chrome.contextMenus) {
    this.showContextMenu_();
  }

  chrome.extension.onMessage.addListener(this.onMessage.bind(this));
};


/** @type {string} */
Background.prototype.FOLDER_NAME = chrome.i18n.getMessage('ext_name');


/**
 * The duration a toast is displayed, in milliseconds.
 * @type {number}
 */
Background.prototype.TOAST_DURATION = 5000;


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
 * If this extension does not have its own folder yet, create one.
 */
Background.prototype.maybeCreateExtensionFolder = function() {
  if (!!localStorage.folderId) {
    // No action necessary if we already have a folder.
    return;
  }

  var createFolderCallback = function(success, response) {
    if (success) {
      localStorage.folderId = response.id;
    } else {
      console.warn('Couldn\'t create folder. Storing files in root.');
      delete localStorage.folderId;
    }
  };

  var listFilesCallback = function(result) {
    console.dir(result);
    if (result === null || result.items.length === 0) {
      console.log('No available folder. Creating new one.');
      this.driveClient.filesInsert({
        title: this.FOLDER_NAME,
        mimeType: this.driveClient.DRIVE_FOLDER_MIME_TYPE
      }, '', createFolderCallback.bind(this));
    } else {
      localStorage.folderId = result.items[0].id;
    }
  };

  // Check if a ChromeToDrive folder already exists.
  // NOTE: since we're acting in a limited scope, only files created by this
  // extension are accessible, thus we can simply search for _all_ folders in
  // the drive (folders not by this extension won't be returned).
  this.driveClient.filesList('trashed = false and mimeType = \'' +
      this.driveClient.DRIVE_FOLDER_MIME_TYPE + '\'',
      listFilesCallback.bind(this));
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

  setTimeout(function() {
    notification.cancel();
  }, this.TOAST_DURATION);
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
      var metadata = {
        title: request.fileName,
        description: request.description,
        mimeType: request.mimeType
      };

      if (localStorage.folderId) {
        metadata['parents'] = [{
          id: localStorage.folderId
        }];
      }

      this.driveClient.filesInsert(metadata, request.data,
          this.onUploadComplete.bind(this));
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
