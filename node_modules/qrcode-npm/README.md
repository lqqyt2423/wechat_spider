qrcode-npm
==========

This is an npm module for qrcode JavaScript library (http://www.d-project.com/qrcode)

Notice that I am not the author of the code, I am just simply creating an npm module out of the great library from Kazuhiko Arase
Notice also that there is another module (node-qrcode, see: https://github.com/soldair/node-qrcode), which is more sophisticated and uses canvas object:
* qrcode-npm uses img or table tags, which is more friendly to older browsers
* if you know your target browser is canvas capable then I recommend using node-qrcode module

examples
--------

	var qrCode = require('qrcode')

	var qr = qrCode.qrcode(4, 'M');
	qr.addData(text);
	qr.make();

	qr.createImgTag(4);    // creates an <img> tag as text
	qr.createTableTag(4);  // creates a <table> tag as text

install
-------
	npm install qrcode-npm
	
The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
