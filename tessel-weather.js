var tessel = require('tessel'),
    ambientLib = require('ambient-attx4'),
    climateLib = require('climate-si7020'),
    wifi = require('wifi-cc3000'),
    _ = require('lodash'),
    http = require('http');

/* Hardware setup */
var ambient = ambientLib.use(tessel.port['D']),
    climate = climateLib.use(tessel.port['A']);

var climateReady = false,
    ambientReady = false;

var led1 = tessel.led[0],
    led2 = tessel.led[1];

/* Program constants */
var serverHost = '192.168.1.106',
    serverPort = 3000,
    secretToken = 'cookie', // change to production token
    secondsBetweenReadings = 1000 * 30; // change to once a minute for production

var postOptions = function(path) {
  return {
    hostname: serverHost,
    port: serverPort,
    path: path,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };
};

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

var post = function(path, data) {
  if (wifi.isConnected()) {
    console.log('Attempting to POST to', path);

    var payload = _.merge(data, {secret_token: secretToken});

    ledOn(led1);

    try {
      var req = http.request(postOptions(path), function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
        });
      });

      req.on('error', function(e) {
        console.log('Error contacting server.', e);
      });

      req.write(payload);
      req.end();

      ledOff(led1);
    } catch (e) {
      console.log('Error POSTing to server:', e);
    }
  } else {
    console.log('Wifi not connected.');
  }
};

var postTemperature = function(temp) {
  if (!_.isUndefined(temp)) {
    post('/temperatures', {temperature: {temperature_f: temp}});
  }
};

var postHumidity = function(humidity) {
  if (!_.isUndefined(humidity)) {
    post('/humidities', {humidity: {humidity: humidity}});
  }
};

var postSoundLevel = function(level) {
  if (!_.isUndefined(level)) {
    post('/sound_levels', {sound_level: {level: level}});
  }
};

var postLightLevel = function(level) {
  if (!_.isUndefined(level)) {
    post('/light_levels', {light_level: {level: level}});
  }
};

var postReading = function(temp, humidity, slevel, llevel) {
  if (!_.isUndefined(temp) &&
      !_.isUndefined(humidity) &&
      !_.isUndefined(slevel) &&
      !_.isUndefined(llevel)) {
    post('/sensor_readings', {
      temperature: {temperature_f: temp},
      humidity: {humidity: humidity},
      sound_level: {level: slevel},
      light_level: {level: llevel}
    });
  }
};

var printStats = function() {
  console.log("Memory usage:", process.memoryUsage());
};

var loop = function() {
  ledOn(led1);
  printStats();
  var temp, humidity, lightLevel, soundLevel;

  climate.readTemperature('f', function (err, tempReading) {
    temp = tempReading.toFixed(2);

    console.log('Degrees:', temp + 'F');
    //postTemperature(temp);
  });

  climate.readHumidity(function (err, humid) {
    humidity = humid.toFixed(4);

    console.log('Humidity:', humidity + '%RH');
    //postHumidity(humidity);
  });

  ledOn(led2);

  ambient.getLightLevel(function(err, ldata) {
    lightLevel =  ldata.toFixed(8);

    console.log('Light Level:', lightLevel);
    //postLightLevel(lightLevel);
  });

  ambient.getSoundLevel(function(err, sdata) {
    soundLevel = sdata.toFixed(8);

    console.log('Sound Level:', soundLevel);
    //postSoundLevel(soundLevel);
  });

  postReading(temp, humidity, soundLevel, lightLevel);

  ledOff(led1);
  ledOff(led2);

};

var outerLoop = function() {
  if (ambientReady && climateReady) {
    loop();
  } else {
    console.log("Modules not ready.");
  }

  setTimeout(loop, secondsBetweenReadings);
};

wifi.on('disconnect', function(err, data){
  console.log("Wifi disconnect event", err, data);
});

wifi.on('error', function(err){
  console.log("Wifi error event: ", err);
});

ambient.on('ready', function() {
  console.log("Ambient Module Initialized");
  ambientReady = true;

  var soundTrigger = 0.03,
      lightTrigger = 0.5,
      timeBetweenTriggers = 1500;

  ambient.setLightTrigger(lightTrigger);
  ambient.setSoundTrigger(soundTrigger);

  ambient.on('sound-trigger', function(data) {
    console.log("Sound threshold was reached", data.toFixed(8));
    postSoundLevel(data.toFixed(8));

    // Clear the trigger so it stops firing
    ambient.clearSoundTrigger();

    setTimeout(function() {
      ambient.setSoundTrigger(soundTrigger);
    }, timeBetweenTriggers);
  });

  ambient.on('light-trigger', function(data) {
    console.log("Light threshold was reached", data.toFixed(8));

    postLightLevel(data.toFixed(8));

    // Clear the trigger so it stops firing
    ambient.clearLightTrigger();

    setTimeout(function() {
      ambient.setLightTrigger(lightTrigger);
    }, timeBetweenTriggers);
  });
});

climate.on('ready', function() {
  console.log("Climate Module Initialized");
  climateReady = true;
});

setImmediate(outerLoop);
