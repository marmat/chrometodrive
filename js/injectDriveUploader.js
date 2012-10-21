console.log('injectDriveUploader');

//chrome.extension.sendMessage({
//	greeting : "hello"
//}, function(response) {
//	console.log(response.farewell);
//});

var FILE_TO_DOWLOAD = '';
var FILE_BASE64 = '';
var FILE_DATA_MIME_TYPE = '';


chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    
    if (request.action == "download") {
    	
    	downloadFile(request.url, function(data) {
    		FILE_TO_DOWLOAD = request.url;
    		FILE_BASE64 = data;
    		FILE_DATA_MIME_TYPE = 'image/jpeg';
    		
    		(function() {
    			var ga = document.createElement('script');
    			ga.type = 'text/javascript';
    			ga.async = true;
    			ga.src = 'https://apis.google.com/js/client.js?onload=handleClientLoad';
    			var s = document.getElementsByTagName('head')[0];
    			s.parentNode.insertBefore(ga, s);
    		})();
    		
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

			callback(base64);
			// document.getElementById("myImage").src="data:image/png;base64,"+base64;
		}
	};

	xhr.send();
}


var CLIENT_ID = '1054546345631-b4qa1umtauia8uoommptadohd2b2p0gk.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

  /**
   * Called when the client library is loaded to start the auth flow.
   */
  function handleClientLoad() {
    window.setTimeout(checkAuth, 1);
  }

  /**
   * Check if the current user has authorized the application.
   */
  function checkAuth() {
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
    if (authResult && !authResult.error) {
//  // Access token has been successfully retrieved, requests can be sent to the API.
	console.log('uploadFile');

    gapi.client.load('drive', 'v2', function() {
        
        //insertFile('red_dot.png', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==', null, 'image/png');
        
    	insertFile(FILE_NAME, FILE_BASE64, null, FILE_DATA_MIME_TYPE);
        
        
        
    });


	
} else {
  // No access token could be retrieved, force the authorization flow.
  gapi.auth.authorize(
      {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
          handleAuthResult);
    }
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
  
  

  
