var menuId = null;
var pageInfo = null;
var tabs = new Object();


var googleAuth = new OAuth2('google', {
	  client_id: '1054546345631-b4qa1umtauia8uoommptadohd2b2p0gk.apps.googleusercontent.com',
	  client_secret: '06jLeCPzwxGTkMmnW8pg-dZa',
	  api_scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive'
});


if (chrome.contextMenus) {
	showContextMenu();
}

function showContextMenu() {
	removeContextMenu();

	menuId = chrome.contextMenus.create({
		'title' : chrome.i18n.getMessage('mnu_upload_to_drive'),
		'documentUrlPatterns' : [ 'http://*/*', 'https://*/*' ],
		'onclick' : onClickHandler,
		'contexts' : [ 'link', 'image' ]
	});
}

function removeContextMenu() {
	if (menuId != null) {
		chrome.contextMenus.remove(menuId);
		menuId = null;
	}
}

function onClickHandler(info, tab) {

	console.log('onClickHandler', info, tab);

	
	googleAuth.authorize(function() {
		  // Ready for action
		  chrome.tabs.sendMessage(tab.id, {action: "download", url: info.srcUrl}, function(response) {
			    console.log(response);
			  });	
	});
	

	

//	requestContent('/js/fileDownloader.js', function(code) {
//		console.log('requestContent', code);
//		chrome.tabs.executeScript(tab.id, {code: code});
//
//	});
	

	  
	  
//	downloadFile(info.srcUrl, 'image/png', function(data) {
//		
//		console.log('callback', data);
//		
//	});
	

};

function requestContent(url, callback) {
    var xhr = new XMLHttpRequest();
    try {
        xhr.onreadystatechange = function(){
            if (xhr.readyState != 4)
                return;
            
            console.debug(xhr);
            
            if (xhr.response) {
                console.debug(xhr);
                callback(xhr.response);
            }
        };

        xhr.onerror = function(error) {
            console.debug(error);
        };

        xhr.open("GET", url, true);
        xhr.send(null);
    } catch(e) {
        console.error(e);
    }
}

function downloadFile(url, mimeType, callback) {
	

	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = 'blob';
	
	xhr.onload = function(e) {
	
	  window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(fs) {
	    fs.root.getFile('image.png', {create: true}, function(fileEntry) {
	      fileEntry.createWriter(function(writer) {
	
	        writer.onwrite = function(e) { 
	        	console.log('onwrite', e);
	        };
	        writer.onerror = function(e) { 
	        	console.log('onerror', e);
	        };
	
	        console.log('xhr.response', xhr.response);
	        var blob = new Blob([xhr.response], {type: mimeType});
	
	        writer.write(blob);
	        
	        console.log('blob', blob);
	
	      }, onError);
	    }, onError);
	  }, onError);
	};
	
xhr.send();
}

function downloadFile2(url, mimeType, callback) {

var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);

xhr.responseType = 'arraybuffer';

xhr.onload = function(e) {
  if (this.status == 200) {
    var uInt8Array = new Uint8Array(this.response);
    var i = uInt8Array.length;
    var binaryString = new Array(i);
    while (i--)
    {
      binaryString[i] = String.fromCharCode(uInt8Array[i]);
    }
    var data = binaryString.join('');

    var base64 = window.btoa(data);
    
    callback(base64);
//    document.getElementById("myImage").src="data:image/png;base64,"+base64;
  }
};

xhr.send();
}

function onError(data) {
	console.log('onError', data);
}