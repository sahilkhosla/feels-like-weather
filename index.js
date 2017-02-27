var Alexa = require('alexa-sdk');
var requestify = require('requestify'); 
var async = require('async');

var URLS = {
	'GEO': 'http://api.wunderground.com/api/ed6de775d05cf9c3/geolookup/q/_CITY_NAME_.json',
	'CONDITIONS': 'http://api.wunderground.com/api/ed6de775d05cf9c3/conditions/q/_STATE_/_CITY_NAME_.json',
	'FORECAST': ''
};

var handlers = {

	'LaunchRequest': function () {
        this.emit(':tell', 'Say something useful on launch');
    },
    'GetFeelsLikeWeather': function () {
    	
    	var that = this,
    		message = '',
    		cityName = this.event.request.intent.slots.City.value;

		async.waterfall([
			function(callback) {
				callback(null, cityName);
			},
			function(cityName, callback) {
				getQualifiedLocationString(cityName, callback);
			},
			function(stateName, cityName, callback) {
				getConditions(stateName, cityName, callback);
			},
			function(stateName, cityName, temperature, callback) {
				if (temperature) {
					message = 'it feels like ' + temperature + 'degree celcius in ' + cityName	
				}
				
				emitMessage(message, callback);
			}
		], function(err, results) {
			console.log('Error', err);
		});    	
	
    }

};

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};

/* Helper Functions */
function getQualifiedLocationString(cityName, callback) {	

	console.log('getting location...');

	var geoUrl = URLS.GEO.replace('_CITY_NAME_', cityName);
	var cityNameFromResponse,
		stateNameFromResponse;

	console.log('geo url...', geoUrl);

	//call wundergroud GEO API to get state for the city 
	requestify.get(geoUrl).then(function(response) {	    
    	console.log('response recieved...');
	    var results = response.results,
	    	result;

	    if (results && results.size > 0) {
	    	result = results.filter(function(obj) {
	    		return obj.city === cityName;
	    	});

	    	if (result) {
	    		cityNameFromResponse = result.city;
	    		stateNameFromResponse = result.state;
	    	}
	    }	

	    if (cityNameFromResponse && stateNameFromResponse) {
	    	console.log('stateName...', stateNameFromResponse);
	    	callback(null, cityNameFromResponse, stateNameFromResponse);
	    } else {
	    	callback(null, '', '');
	    }
	    	        	    
	});
}

function getConditions(stateName, cityName, callback) {
	console.log('getting conditions...');
	requestify.get('http://api.wunderground.com/api/ed6de775d05cf9c3/conditions/q/IL/Chicago.json').then(function(response) {	    
	    var weather = response.getBody();
	    if (weather) {
	    	console.log('weather is available', weather);
	    	var feelslike_c = weather.current_observation.feelslike_c;
	    	console.log('getting conditions...', feelslike_c);
	    	callback(null, stateName, cityName, feelslike_c);	    	
	    } else {
	    	callback(null, stateName, cityName, '');
	    }			    	    
	});
}

function emitMessage(message, callback) {
	console.log('message: ', message);
	if (message) {
		alexa.emit(':tell', message);		
	} else {
		alexa.emit(':tell', 'could not get weather');		
	}

	callback(null, 'done');
}