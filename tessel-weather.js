var tessel = require('tessel'),
    ambientLib = require('ambient-attx4'),
    climateLib = require('climate-si7020'),
    wifi = require('wifi-cc3000'),
    http = require('http'),
    _ = require('lodash');

var serverHost = '192.168.1.106',
    serverPort = 8000,
    secondsBetweenReadings = 1000 * 60; // Once a minute

var httpHeaders = {
  'Content-Type': 'application/json'
};

var httpOptions = {
  method: 'POST',
  host: serverHost,
  port: serverPort,
  path: '/reading',
  headers: httpHeaders
};

var ambient = ambientLib.use(tessel.port['D']),
    climate = climateLib.use(tessel.port['A']);

var led1 = tessel.led[0],
    led2 = tessel.led[1],
    ledOn = function(led) {
      return led.write(1);
    },
    ledOff = function(led) {
      return led.write(0);
    };


var ambientReady = false,
    climateReady = false;

ambient.on('ready', function() {
  ambientReady = true;
});

climate.on('ready', function() {
  climateReady = true;
});

ambient.on('error', function(err) {
  console.log('Error initializing ambient module:', err);
});

climate.on('error', function(err) {
  console.log('Error connecting module:', err);
});

var loop = function() {
  var temp, humidity, lightLevel, soundLevel;

  var payload = {};

  if (climateReady) {
    climate.readTemperature('f', function (err, tempReading) {
      temp = tempReading.toFixed(2);
      console.log('Degrees:', temp + 'F');
    });

    climate.readHumidity(function (err, humid) {
      humidity = humid.toFixed(4);
      console.log('Humidity:', humidity + '%RH');
    });

    payload = _.merge(payload, {
      temperatureF: temp,
      humidity: humidity
    });

    ledOn(led1);
  }

  if (ambientReady) {
    ambient.getLightLevel(function(err, ldata) {
      lightLevel =  ldata.toFixed(8);
      console.log('Light Level:', lightLevel);
    });


    ambient.getSoundLevel(function(err, sdata) {
      soundLevel = sdata.toFixed(8);
      console.log('Sound Level:', soundLevel);
    });

    payload = _.merge(payload, {
      lightLevel: lightLevel,
      soundLevel: soundLevel
    });

    ledOn(led2);
  }

  if (wifi.isConnected()) {
    payload = _.merge(payload, {
      timestampUtc: Date.now()
    });

    var respHandler = function(response) {
      var responseStr = '';

      response.setEncoding('utf8');

      response.on('data', function(chunk) {
        responseStr += chunk;
      });

      response.on('end', function() {
        console.log('HTTP response:', responseStr);
      });
    };

    var req = http.request(httpOptions, respHandler);

    req.on('error', function(e) {
      console.log('HTTP request encountered error:', e);
    });

    req.write(JSON.stringify(payload));
    req.end();
  }

  ledOff(led1);
  ledOff(led2);
  setTimeout(loop, secondsBetweenReadings);
};

setImmediate(loop);
