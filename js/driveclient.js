


/**
 * A lightweight client library for the Drive API methods used in this
 * extension. Also takes care of user authentication. Uses the OAuth helper
 * library by Boris Smus (Google).
 * @author m.kupriyanov@gmail.com (Misha Kupriyanov)
 * @author kaktus621@gmail.com (Martin Matysiak)
 * @param {string} clientId The clientId to use.
 * @param {string} clientSecret The clientSecret to use.
 * @param {function=} opt_readyCallback Will be called once the user has gone
 *    through the OAuth flow.
 * @constructor
 */
var DriveClient = function(clientId, clientSecret, opt_readyCallback) {
  this.googleAuth = new OAuth2('google', {
    client_id: clientId,
    client_secret: clientSecret,
    api_scope: 'https://www.googleapis.com/auth/drive.file'
  });

  // There seems to be some weird race condition... wait a bit until
  // requesting authorization.
  setTimeout(this.refreshAuthToken_.bind(this, opt_readyCallback), 1000);
};


/** @type {string} */
DriveClient.prototype.MULTIPART_BOUNDARY = '-------314159265358979323846';


/** @type {string} */
DriveClient.prototype.DRIVE_FOLDER_MIME_TYPE =
    'application/vnd.google-apps.folder';


/**
 * Tries to get a new access token for the user. Has no effect if we already
 * have a valid access token.
 * @param {function=} opt_callback A method that will be called when the
 *    authorization process is finished.
 * @private
 */
DriveClient.prototype.refreshAuthToken_ = function(opt_callback) {
  this.googleAuth.authorize(opt_callback);
};


/**
 * Creates a new XMLHttpRequest instance with the authorization header already
 * set.
 * @param {string} method The method to use (POST, GET, etc.).
 * @param {string} url The URL to call.
 * @param {boolean=} opt_asynchronous Whether to perform an asynchronous requst.
 *     Defaults to false.
 * @return {XMLHttpRequest} The XMLHttpRequest instance.
 * @private
 */
DriveClient.prototype.createdAuthenticatedRequest_ = function(method, url,
    opt_asynchronous) {
  var xhr = new XMLHttpRequest();
  xhr.open(method, url, !!opt_asynchronous);
  xhr.setRequestHeader('Authorization', 'OAuth ' +
      this.googleAuth.getAccessToken());
  return xhr;
};


/**
 * Creates a multitype request body out of the given list of parts.
 * @param {Object.<String, Object.<(header|content), String>>} parts The request
 *    body parts with their specific types.
 * @return {string} The generated multipart request body.
 * @private
 */
DriveClient.prototype.createMultipartBody_ = function(parts) {
  var delimiter = '\r\n--' + this.MULTIPART_BOUNDARY + '\r\n';
  var closeDelimiter = '\r\n--' + this.MULTIPART_BOUNDARY + '--';

  var requestBody = '';
  for (var i = 0; i < parts.length; i++) {
    requestBody += delimiter + parts[i].header.join('\r\n') + '\r\n\r\n' +
        parts[i].content;
  }

  return requestBody + closeDelimiter;
};


/**
 * Inserts a new file into the user's drive.
 * @param {Object.<string, string>} metadata An object containing optional
 *    properties for the request body, specified in the Drive API reference.
 * @param {string} data Base64 encoded data.
 * @param {function(boolean, Object)=} opt_callback If set, this method will be
 *    called with the results of this action. The first parameter indicates
 *    success, the second one will contain the result object if it succeeded.
 * @private
 */
DriveClient.prototype.filesInsertInternal_ = function(metadata, data,
    opt_callback) {

  var requestBody = this.createMultipartBody_([
    {
      header: ['Content-Type: application/json'],
      content: JSON.stringify(metadata)
    },
    {
      header: [
        'Content-Type: application/octet-stream',
        'Content-Transfer-Encoding: base64'
      ],
      content: data
    }
  ]);

  var xhr = this.createdAuthenticatedRequest_('POST',
      'https://www.googleapis.com/upload/drive/v2/files', false);
  xhr.setRequestHeader('Content-Type', 'multipart/mixed; boundary="' +
      this.MULTIPART_BOUNDARY + '"');
  xhr.send(requestBody);

  if (xhr.status == 200) {
    if (!!opt_callback) {
      opt_callback(true, JSON.parse(xhr.response));
    }
  } else {
    console.log('Insert failed. Status ' + xhr.status);
    console.log(xhr.response);
    opt_callback(false);
  }
};


/**
 * Runs a files.list query.
 * @param {string} query The query to perform.
 * @param {function(Object)} callback The method which will receive the
 *    query results.
 * @private
 */
DriveClient.prototype.filesListInternal_ = function(query, callback) {
  var xhr = this.createdAuthenticatedRequest_('GET',
      'https://www.googleapis.com/drive/v2/files?q=' + query, false);
  xhr.send();

  callback(xhr.status === 200 ? JSON.parse(xhr.response) : null);
};


/**
 * Adds the given permission resource to the file.
 * @param {string} fileId Identifier of the file to modify.
 * @param {Object} permissions A permissions resource.
 * @param {function(boolean)=} opt_callback Will be called upon completion of
 *    the request, indicating whether the operation succeeded.
 * @private
 */
DriveClient.prototype.permissionsInsertInternal_ = function(fileId, permissions,
    opt_callback) {
  var xhr = this.createdAuthenticatedRequest_('POST',
      'https://www.googleapis.com/drive/v2/files/' + fileId + '/permissions',
      false);

  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(permissions));

  if (opt_callback) {
    opt_callback(xhr.status === 200);
  }
};


/******************* API METHODS *******************/


/**
 * Gets a fresh auth token and then tries to insert a new file into the
 * user's drive.
 * @param {Object.<string, string>} metadata An object containing optional
 *    properties for the request body, specified in the Drive API reference.
 * @param {string} data Base64 encoded data.
 * @param {function(boolean, Object)=} opt_callback If set, this method will be
 *    called (a boolean indicating success and the response object returned by
 *    the drive API if it succeeded).
 */
DriveClient.prototype.filesInsert = function(metadata, data, opt_callback) {
  this.refreshAuthToken_(this.filesInsertInternal_.bind(this, metadata, data,
      opt_callback));
};


/**
 * Gets a fresh token and runs a files.list query.
 * @param {string} query The query to perform.
 * @param {function} callback The method which will receive the query results.
 */
DriveClient.prototype.filesList = function(query, callback) {
  this.refreshAuthToken_(this.filesListInternal_.bind(this, query, callback));
};


/**
 * Gets a fresh auth token and then tries to add the given permission
 * resource to the file.
 * @param {string} fileId Identifier of the file to modify.
 * @param {Object} permissions A permissions resource.
 * @param {function(boolean)=} opt_callback Will be called upon completion of
 *    the request, indicating whether the operation succeeded.
 */
DriveClient.prototype.permissionsInsert = function(fileId, permissions,
    opt_callback) {
  this.refreshAuthToken_(this.permissionsInsertInternal_.bind(this, fileId,
      permissions, opt_callback));
};
