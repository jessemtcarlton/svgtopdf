var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var PDFDocument = require('pdfKit');
var SVGtoPDF = require('svg-to-pdfkit');
var parseString = require('xml2js').parseString;
var xml2js = require('xml2js');
var search = require('simple-object-query').search;
var request = require('request');
var imageCallbacks = 0;
var requestIn;
var resultOut;
var svgAsJs;
var options = {
	useCSS: false,
	assumePt: true,
	width: 0,
	height: 0,
	pageHeight: 0,
	pageWidth: 0,
	copies: 0,
	margin: 0,
	crop: 0
};


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: true
}));

// parse application/json
app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Hello World!');
});
app.post('/pdf', function (req, res) {
	requestIn = req;
	resultOut = res;
	res.setHeader('Content-Type', 'application/pdf');
	res.setHeader('Content-Disposition', 'attachment; filename=quote.pdf');
	if (req.body.pageHeight > 0 && req.body.pageWidth > 0) {
		options.pageHeight = parseInt(req.body.pageHeight);
		options.pageWidth = parseInt(req.body.pageWidth);
	}

	if (req.body.margin > 0) {
		options.margin = parseFloat(req.body.margin);
	}
	if (req.body.crop > 0) {
		options.crop = parseFloat(req.body.crop);
	}


	if (req.body.svg) {
		processSvg(req.body.svg);

	}

	/*res.send(JSON.stringify({
	imagename: req.body.imagename || "dfgfgfdf"
	})); */
});
app.listen(3000, function () {
	console.log('Example app listening on port 3000!');
});


var getImageBase64 = function (url, callback) {
	imageCallbacks += 1;
	request({ url, encoding: null }, (error, response, body) => {
		imageCallbacks -= 1;
		if (!error && response.statusCode === 200) {
			var img = "data:image/png;base64," + Buffer.from(body, 'utf8').toString("base64");
			if (typeof callback === "function") {
				callback(img);
			}
		}
		if (imageCallbacks === 0) {
			var builder = new xml2js.Builder();
			var xml = builder.buildObject(svgAsJs);
			createPdf(xml, resultOut);
		}
	});
};

function processSvg(svg) {
	parseString(svg, function (err, svgResult) {
		svgAsJs = svgResult;
		options.height = parseInt(svgAsJs.svg.$.height);
		options.width = parseInt(svgAsJs.svg.$.width);
		if (err) console.log(err);
		var res = search({
			source: svgAsJs,
			recursion: true,
			query: {
				'xlink:href': function (value) {
					if (value.substring(0, 4).toLowerCase() === "http" && value.toLowerCase().indexOf("png") > 0) {
						return true;
					}
					return false;
				}
			}
		});
		if (res.length === 0) {
			createPdf(svg, resultOut);
		} else {
			search({
				source: svgAsJs,
				recursion: true,
				callback: function (object) {
					console.log(object.target["xlink:href"]);
					var base64image = getImageBase64(object.target["xlink:href"], function (imagedata) {
						object.target["xlink:href"] = imagedata;
					});
				},
				query: {
					'xlink:href': function (value) {
						if (value.substring(0, 4).toLowerCase() === "http" && value.toLowerCase().indexOf("png") > 0) {
							return true;
						}
						return false;
					}
				}
			});
		}
	});
}

function createPdf(svg, stream) {
	var compress = false;
	var showViewport = false;
	var x = parseFloat(0) + (4 * options.crop);
	var y = parseFloat(0) + (4 * options.crop);
	var doc = new PDFDocument({
		compress: compress,
		size: [options.width + (8 * options.crop), options.height + (8 * options.crop)]
	});
	//Register a font
	doc.registerFont('Bermuda Script', 'fonts/Bermuda Script.ttf');
	doc.registerFont('Atlantic Inline', 'fonts/Atlantic Inline-Normal.ttf');
	doc.registerFont('Clarendon BT', 'fonts/tt0283m_.ttf');
	doc.registerFont('Clarendon BT-Bold', 'fonts/tt0284m_.ttf');
	doc.registerFont('Cooper Md BT', 'fonts/cooper.ttf');
	doc.registerFont('Cooper Md BT-Bold', 'fonts/CooperBlackStd.ttf');
	doc.registerFont('Franklin Gothic ITC Bk BT', 'fonts/FranklinGothic1.ttf');
	doc.registerFont('Franklin Gothic ITC Bk BT-Bold', 'fonts/FRKGOTD.ttf');
	doc.registerFont('Franklin Gothic ITC Bk BT-BoldItalic', 'fonts/FRKGOTDI.TTF');
	doc.registerFont('Franklin Gothic ITC Bk BT-Italic', 'fonts/FRKGOTNI.ttf');
	doc.registerFont('Futura Md BT', 'fonts/tt0142m_.ttf');
	doc.registerFont('Futura Md BT-Italic', 'fonts/tt0143m_.ttf');
	doc.registerFont('Futura Md BT-Bold', 'fonts/tt0144m_.ttf');
	doc.registerFont('Futura Md BT-BoldItalic', 'fonts/tt0145m_.ttf');
	doc.registerFont('Goudy Old Style', 'fonts/GOUDOS.ttf');
	doc.registerFont('Goudy Old Style-Bold', 'fonts/GOUDOSB.ttf');
	doc.registerFont('Goudy Old Style-Italic', 'fonts/GOUDOSI.ttf');
	doc.registerFont('Helsinki Narrow-Italic', 'fonts/Helsinki-Narrow-Oblique.ttf');
	doc.registerFont('Helsinki Narrow', 'fonts/Helsinki-Narrow.ttf');
	doc.registerFont('Helsinki Narrow-BoldItalic', 'fonts/Helsinki-Narrow-BoldOblique.ttf');
	doc.registerFont('Helsinki Narrow-Bold', 'fonts/Helsinki-Narrow-Bold.ttf');
	doc.registerFont('Palatino Linotype', 'fonts/pala.ttf');
	doc.registerFont('Palatino Linotype-Bold', 'fonts/palab.ttf');
	doc.registerFont('Palatino Linotype-BoldItalic', 'fonts/palabi.ttf');
	doc.registerFont('Palatino Linotype-Italic', 'fonts/palai.ttf');
	doc.registerFont('San Diego', 'fonts/brsanrt0-webfont.ttf');
	doc.registerFont('Swis721 BT', 'fonts/tt0003m_.ttf');
	doc.registerFont('Swis721 BT-Italic', 'fonts/tt0004m_.ttf');
	doc.registerFont('Swis721 BT-Bold', 'fonts/tt0005m_.ttf');
	doc.registerFont('Swis721 BT-BoldItalic', 'fonts/tt0006m_.ttf');
	doc.registerFont('US Roman', 'fonts/brus_rt0-webfont.ttf');
	doc.registerFont('Zapf Chancery-Italic', 'fonts/zafchami-webfont.ttf');
	doc.registerFont('Zapf Chancery', 'fonts/zafchamt-webfont.ttf');
	doc.registerFont("Arial", 'fonts/arial.ttf');
	doc.registerFont("Arial-Italic", 'fonts/arial italic.ttf');
	doc.registerFont('Belgium', 'fonts/brbelrt0-webfont.ttf');
	doc.registerFont('BrushScriptStd', 'fonts/BrushScriptStd.ttf');
	doc.registerFont('FleurishScript', 'fonts/fleurishscript.ttf');
	doc.registerFont('Germany', 'fonts/brgerrt0-webfont.ttf');
	doc.registerFont('Helvetica-Italic', 'fonts/helr46w-webfont.ttf');
	doc.registerFont('Helvetica', 'fonts/helvetic-webfont.ttf');
	doc.registerFont('Istanbul', 'fonts/bristrt0-webfont.ttf');
	doc.registerFont('Optima-Bold', 'fonts/OPTIMA-Bold.ttf');
	doc.registerFont('Optima-Italic', 'fonts/Optima-italic.ttf');
	doc.registerFont('Optima', 'fonts/OPTIMA.ttf');
	doc.registerFont('Utah-Italic', 'fonts/brutaic0-webfont.ttf');
	doc.registerFont('Utah', 'fonts/brutarc0-webfont.ttf');
	doc.registerFont('Verdana', 'fonts/Verdana.ttf');
	doc.registerFont('Verdana-Bold', 'fonts/verdanab.ttf');
	doc.registerFont('Verdana-Italic', 'fonts/verdanai.ttf');
	doc.registerFont('Verdana-BoldItalic', 'fonts/verdanaz.ttf');
	doc.registerFont('Atlanta', 'fonts/Atlanta-Book.ttf');
	doc.registerFont('Atlanta-Italic', 'fonts/Atlanta-BookOblique.ttf');
	doc.registerFont('Atlanta-Bold', 'fonts/Atlanta-Demi.ttf');
	doc.registerFont('Atlanta-BoldItalic', 'fonts/Atlanta-DemiOblique.ttf');

	console.log(doc._registeredFonts);
	if (options.useCSS) {
		let hiddenDiv = document.getElementById('hidden-div');
		hiddenDiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + svg + '</svg>';
		SVGtoPDF(doc, hiddenDiv.firstChild.firstChild, x, y, options);
	} else {
		SVGtoPDF(doc, svg, x, y, options);
	}
	if (options.crop > 0) {
		var startX = x + options.crop;
		var startY = y + options.crop;
		doc.lineWidth(0.25);
		doc.lineCap('butt')
			.moveTo(startX + options.crop, startY)
			.lineTo(startX, startY)
			.lineTo(startX, startY + options.crop)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX - (options.crop / 2), startY)
			.lineTo(startX - (3 * options.crop), startY)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX, startY - (options.crop / 2))
			.lineTo(startX, startY - (3 * options.crop))
			.stroke();
		startX = x + options.crop;
		startY = y + options.height - options.crop;
		doc.lineCap('butt')
			.moveTo(startX + options.crop, startY)
			.lineTo(startX, startY)
			.lineTo(startX, startY - options.crop)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX - (options.crop / 2), startY)
			.lineTo(startX - (3 * options.crop), startY)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX, startY + (options.crop / 2))
			.lineTo(startX, startY + (3 * options.crop))
			.stroke();
		startX = x + options.width - options.crop;
		startY = y + options.crop;
		doc.lineCap('butt')
			.moveTo(startX - options.crop, startY)
			.lineTo(startX, startY)
			.lineTo(startX, startY + options.crop)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX + (options.crop / 2), startY)
			.lineTo(startX + (3 * options.crop), startY)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX, startY - (options.crop / 2))
			.lineTo(startX, startY - (3 * options.crop))
			.stroke();
		startX = x + options.width - options.crop;
		startY = y + options.height - options.crop;
		doc.lineCap('butt')
			.moveTo(startX - options.crop, startY)
			.lineTo(startX, startY)
			.lineTo(startX, startY - options.crop)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX + (options.crop / 2), startY)
			.lineTo(startX + (3 * options.crop), startY)
			.stroke();
		doc.lineCap('butt')
			.moveTo(startX, startY + (options.crop / 2))
			.lineTo(startX, startY + (3 * options.crop))
			.stroke();
	}
	doc.pipe(stream);
	doc.end();
}


