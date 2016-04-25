//option 1
//first extractor gets Talk URLs
//second extractor gets Download URLs
//third extractor gets info if "audio" is available

//option 2
//crawler with a depth of 2, pages 3, first exclude all links but Talks links, second exclude all links but Download links
//feed into an extractor and get "audio" data

//https://www.smashingmagazine.com/2015/04/web-scraping-with-nodejs/
//http://www.opensearchserver.com/documentation/faq/crawling/how_to_extract_specific_information_from_web_pages.md
//https://scotch.io/tutorials/scraping-the-web-with-node-js
//http://www.netinstructions.com/how-to-make-a-simple-web-crawler-in-javascript-and-node-js/

var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var AllTedTalkAudioLinks = [];
var pageToVisit = "https://www.ted.com/talks";
var pageCount = 2;
console.log("Visiting page " + pageToVisit);

function collectLinks(body) {
	var allTalkLinks = [];
	var talkLinks = body("a[href^='/talks/']");

	talkLinks.each(function() {
		if (body(this).attr('href') != allTalkLinks[allTalkLinks.length - 1]) {
			allTalkLinks.push(body(this).attr('href'));
		}
	});

	if (allTalkLinks.length === 0) {
		console.log(AllTedTalkAudioLinks);
		return;
	} else {
		for (var talk in allTalkLinks) {
			var talkURL = "https://www.ted.com" + allTalkLinks[talk]
			request(talkURL, checkAudioDownload);
		}
	};

	console.log(pageCount)
	pageToVisit = "https://www.ted.com/talks?page=" + pageCount;
	pageCount++;
	request(pageToVisit, parseBody);

}

function checkForAudioLink(body, talkUrl) {
	function q(arg1, arg2) {
		for(index in arg2["talks"]) {
			if(arg2["talks"][index]["audioDownload"]) {
				var TedTalkLink = { 
									"link": talkUrl,
									"name": arg2["talks"][index]["name"]
								  };
				AllTedTalkAudioLinks.push(TedTalkLink);
			}
		}
	};
	var qData = /q\("talkPage\.init",/gm;
	var scriptData = "";
	body('script').each(function(i, elem) {
		scriptText = body(this).text();
		if(qData.exec(scriptText)) {
			scriptData = scriptText;
			eval(scriptData);
		}
	})
};

function parseBody(error, response, body) {
	if(error) {
		console.log("Error: " + error);
		return;
	}
	if(response.statusCode === 200) {
		var body = cheerio.load(body);
		collectLinks(body);
	}
}

function checkAudioDownload(error, response, body) {
	if(error) {
		console.log("Error: " + error);
		return;
	}
	if(response.statusCode === 200) {
		var talkUrl = response.request.uri.href;
		var body = cheerio.load(body);
		checkForAudioLink(body, talkUrl);
	}
};

request(pageToVisit, parseBody);

// launch server
var express = require("express");
var app = express();

app.get('/', function(req, res) {
	var htmlString = "<h1>TED Talk Links</h1> <br />";
	for(var i in AllTedTalkAudioLinks) {
		htmlString += ("<a href='"+ AllTedTalkAudioLinks[i]["link"] + "'>" + AllTedTalkAudioLinks[i]["name"] + "</a><br />");
	};
	res.send(htmlString);
})

app.listen(8000, function() {
	console.log("listening on port 8000");
})
