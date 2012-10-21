//https://apis.google.com/js/client.js?onload=handleClientLoad

var CLIENT_ID = '1054546345631-b4qa1umtauia8uoommptadohd2b2p0gk.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

  /**
   * Called when the client library is loaded to start the auth flow.
   */
  function handleClientLoad() {
    console.log('handleClientLoad');

    window.setTimeout(checkAuth, 1);
  }

  /**
   * Check if the current user has authorized the application.
   */
  function checkAuth() {
    console.log('checkAuth');

    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
        handleAuthResult);
  }

  /**
   * Called when authorization server replies.
   *
   * @param {Object} authResult Authorization result.
   */
  function handleAuthResult(authResult) {
    console.log('handleAuthResult');

    if (authResult && !authResult.error) {
//  // Access token has been successfully retrieved, requests can be sent to the API.
//  var filePicker = document.getElementById('filePicker');
//  filePicker.style.visibility = '';
//  filePicker.onchange = uploadFile;
  console.log('uploadFile');
  uploadFile();

} else {
  // No access token could be retrieved, force the authorization flow.
  gapi.auth.authorize(
      {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
          handleAuthResult);
    }
  }

  /**
   * Start the file upload.
   *
   * @param {Object} evt Arguments from the file selector.
   */
  function uploadFile() {
    gapi.client.load('drive', 'v2', function() {
//      var file = evt.target.files[0];
      //insertFile(file);

      insertFile('red_dot.png', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', null, 'image/png');

    });
  }

  /**
   * Insert new file.
   *
   * @param {File} fileData File object to read data from.
   * @param {Function} callback Function to call when the request is complete.
   */
//  function insertFile(fileData, callback) {
  function insertFile(fileDataName, fileBase64Data, fileDataType, contentMimeType, callback) {

    const boundary = '-------314159265358979323846';
const delimiter = "\r\n--" + boundary + "\r\n";
const close_delim = "\r\n--" + boundary + "--";

//var reader = new FileReader();
//reader.readAsBinaryString(fileData);
//reader.onload = function(e) {
  var contentType = fileDataType || 'application/octet-stream';
  var metadata = {
    'title': fileDataName,
    'mimeType': contentMimeType
  };

//  var base64Data = btoa(reader.result);
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

  var request = gapi.client.request({
      'path': '/upload/drive/v2/files',
      'method': 'POST',
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody});
      if (!callback) {
        callback = function(file) {
          console.log(file)
        };
      }
      request.execute(callback);
//    }
  }




