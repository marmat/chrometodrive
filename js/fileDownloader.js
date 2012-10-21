function downloadFile(url, mimeType, callback) {

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
