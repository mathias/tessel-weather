var tessel = require('tessel'),
    ambientLib = require('ambient-attx4'),
    climateLib = require('climate-si7020'),
    wifi = require('wifi-cc3000'),
    http = require('http'),
    _ = require('lodash');

var serverHost = '192.168.1.106',
    serverPort = 3000,
    secretToken = 'cookie', // change to production token
    secondsBetweenReadings = 1000 * 5; // Once a minute

var httpOptions = {
  method: 'POST',
  host: serverHost,
  port: serverPort,
  path: '/readings',
};

var ambient = ambientLib.use(tessel.port['D']),
    climate = climateLib.use(tessel.port['A']);

var led1 = tessel.led[0],
    led2 = tessel.led[1];

var ledOn = function(led) {
  return led.write(1);
};

var ledOff = function(led) {
  return led.write(0);
};

ambient.on('error', function(err) {
  console.log('Error initializing ambient module:', err);
});

climate.on('error', function(err) {
  console.log('Error connecting module:', err);
});

var loop = function() {
  var temp, humidity, lightLevel, soundLevel;

  climate.readTemperature('f', function (err, tempReading) {
    temp = tempReading.toFixed(2);
    console.log('Degrees:', temp + 'F');
  });

  climate.readHumidity(function (err, humid) {
    humidity = humid.toFixed(4);
    console.log('Humidity:', humidity + '%RH');
  });


  ambient.getLightLevel(function(err, ldata) {
    lightLevel =  ldata.toFixed(8);
    console.log('Light Level:', lightLevel);
  });


  ambient.getSoundLevel(function(err, sdata) {
    soundLevel = sdata.toFixed(8);
    console.log('Sound Level:', soundLevel);
  });

  ledOn(led2);

  if (wifi.isConnected()) {
    var timestamp = (new Date()).toJSON();

    var payload = {
      secret_token: secretToken,
      reading: {
        timestamp: timestamp,
        temperature_f: temp,
        humidity: humidity,
        light_level: lightLevel,
        sound_level: soundLevel
      }
    };

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

    var req = http.request(_.merge(httpOptions,
                                   {headers: {
                                     'Content-Type': 'application/json',
                                     'Content-Length': payload.length
                                   }}),
                           respHandler);

    req.on('error', function(e) {
      console.log('HTTP request encountered error:', e);
    });

    console.log('POSTing at:', timestamp);
    console.log('Payload:', payload);

    req.write(JSON.stringify(payload));

    req.end();
  }

  ledOff(led1);
  ledOff(led2);
  setTimeout(loop, secondsBetweenReadings);
};

ambient.on('ready', function() {
  climate.on('ready', function() {
    console.log("Initialized");
    setImmediate(loop);
  });
});
