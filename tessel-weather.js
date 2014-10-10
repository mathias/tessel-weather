var tessel = require('tessel'),
    ambientLib = require('ambient-attx4'),
    climateLib = require('climate-si7020'),
    wifi = require('wifi-cc3000'),
    _ = require('lodash'),
    http = require('http');

/* Hardware setup */
var ambient = ambientLib.use(tessel.port['D']),
    climate = climateLib.use(tessel.port['A']);

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
      var req = http.request(postOptions(path));

      req.on('error', function(e) {
        console.log('Error contacting server.', error);
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
      sound_level: {level: level},
      light_level: {level: level}
    });
  }
};

var printStats = function() {
  console.log("Tessel stats:");
  console.log("Memory usage:", process.memoryUsage());
};

var loop = function() {
  ledOn(led1);
  printStats();

  climate.readTemperature('f', function (err, tempReading) {
    var temp = tempReading.toFixed(2);
    console.log('Degrees:', temp + 'F');
    //postTemperature(temp);
  });

  climate.readHumidity(function (err, humid) {
    var humidity = humid.toFixed(4);
    console.log('Humidity:', humidity + '%RH');
    //postHumidity(humidity);
  });

  ledOn(led2);

  ambient.getLightLevel(function(err, ldata) {
    var lightLevel =  ldata.toFixed(8);
    console.log('Light Level:', lightLevel);
    //postLightLevel(lightLevel);
  });

  ambient.getSoundLevel(function(err, sdata) {
    var soundLevel = sdata.toFixed(8);
    console.log('Sound Level:', soundLevel);
    //postSoundLevel(soundLevel);
  });

  postReading(temp, humidity, slevel, llevel);

  ledOff(led1);
  ledOff(led2);

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

  ambient.setLightTrigger(0.5);
  ambient.setSoundTrigger(0.03);

  ambient.on('sound-trigger', function(data) {
    console.log("Sound threshold was reached", data.toFixed(8));
    postSoundLevel(data.toFixed(8));

    // Clear the trigger so it stops firing
    ambient.clearSoundTrigger();

    setTimeout(function() {
      ambient.setSoundTrigger(soundThreshold);
    }, 1500);
  });

  ambient.on('light-trigger', function(data) {
    console.log("Light threshold was reached", data.toFixed(8));

    postLightLevel(data.toFixed(8));

    // Clear the trigger so it stops firing
    ambient.clearLightTrigger();

    setTimeout(function() {
      ambient.setLightTrigger(0.5);
    }, 1500);
  });

  climate.on('ready', function() {
    console.log("Climate Module Initialized");
    setImmediate(loop);
  });
});
