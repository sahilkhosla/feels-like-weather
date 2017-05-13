var Alexa = require('alexa-sdk');
var requestify = require('requestify'); 
var async = require('async');

var URLS = {
	'GEO': 'http://api.wunderground.com/api/ed6de775d05cf9c3/geolookup/q/_CITY_NAME_.json',
	'CONDITIONS': 'http://api.wunderground.com/api/ed6de775d05cf9c3/conditions/q/_STATE_/_CITY_NAME_.json',
	'FORECAST': ''
};

var STATES = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'mebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY'
};

var MESSAGES = {
	'launch': 'To ask Brolly for weather, you must say the city and the state'
};

var handlers = {

	'LaunchRequest': function () {
		//TODO
        this.emit(':tell', MESSAGES.launch);
    },

    'GetFeelsLikeWeather': function () {
    	
    	var that = this,
    		message = '',
    		cityName = this.event.request.intent.slots.city.value || '',
    		stateName = this.event.request.intent.slots.state.value || '';

    	console.log('State[1]: ', stateName);

		if (cityName !== '') {

			console.log('City: ', cityName);

			if (stateName !== '') {
				console.log('State[2]: ', stateName);
				stateName = STATES[stateName.toLowerCase()];
				console.log('State[3]: ', stateName);
			}

			console.log('State[4]: ', stateName);

			async.waterfall([
				function(callback) {
					callback(null, cityName, stateName);
				},
				function(cityName, stateName, callback) {
					getQualifiedLocationString(cityName, stateName, callback);
				},
				function(cityName, stateName, callback) {
					getConditions(cityName, stateName, callback);
				},
				function(cityName, stateName, temperature, callback) {
					if (temperature) {
						message = 'currently, it feels like ' + temperature + ' degree celcius in ' + cityName	
					}
					
					console.log('message: ', message);

					if (message) {
						that.emit(':tell', message);		
					} else {
						that.emit(':tell', 'could not get weather');		
					}

					callback(null, 'done');
				}
			], function(err, results) {
				console.log('Error', err);
			});    	
		} else {
			this.emit(':tell', 'sorry, I did not understand the city name');	
		}

		
    }

};

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);    
	alexa.registerHandlers(handlers);
	alexa.execute();        
};

/* Helper Functions */
function getQualifiedLocationString(cityName, stateName, callback) {	

	console.log('getting location...');

	var geoUrl = URLS.GEO.replace('_CITY_NAME_', cityName);
	var cityNameFromResponse,
		stateNameFromResponse;

	console.log('geo url: ', geoUrl);

	//call wundergroud GEO API to get state for the city 
	requestify.get(geoUrl).then(function(response) {	    
    	
    	console.log('response recieved...');

	    var data = response.getBody(),
	    	results,
	    	result;

	    results = data.response.results;

	    console.log('geo data: ', data);
	    console.log('geo results: ', results);

	    if (results && results.length > 0) {
	    	result = results.filter(function(obj) {
	    		return (obj.city === cityName && obj.state === stateName);
	    	});

	    	if (result.length > 0) {
	    		cityNameFromResponse = result[0].city;
	    		stateNameFromResponse = result[0].state;
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

function getConditions(cityName, stateName, callback) {
	console.log('getting conditions...');

	var conditionsUrl = URLS.CONDITIONS.replace('_STATE_', stateName).replace('_CITY_NAME_', cityName);

	console.log('conditionsUrl: ', conditionsUrl);

	requestify.get(conditionsUrl).then(function(response) {	    
	    var weather = response.getBody();
	    if (weather) {
	    	console.log('weather is available', weather);
	    	var feelslike_c = weather.current_observation.feelslike_c;
	    	console.log('getting conditions...', feelslike_c);
	    	callback(null, cityName, stateName, feelslike_c);	    	
	    } else {
	    	callback(null, cityName, stateName, '');
	    }			    	    
	});
}