var tessel = require('tessel'),
    ambientLib = require('ambient-attx4'),
    climateLib = require('climate-si7020'),
    wifi = require('wifi-cc3000'),
    _ = require('lodash'),
    needle = require('needle');

/* Hardware setup */
var ambient = ambientLib.use(tessel.port['D']),
    climate = climateLib.use(tessel.port['A']);

var led1 = tessel.led[0],
    led2 = tessel.led[1];

/* Program constants */
var serverHost = '192.168.1.106',
    serverPort = 3000,
    secretToken = 'cookie', // change to production token
    secondsBetweenReadings = 1000 * 30, // Should be about once a minute in production
    urlToPost = "http://" + serverHost + ":" + serverPort;

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

var postCallback = function(error, response) {
  if (!error && response && response.statusCode == 200) {
    console.log('POST success');
  } else { 
    console.log('Error contacting server.', error);
  }
};

var post = function(path, data) {
  if (wifi.isConnected()) {
    var payload = _.merge(data, {secret_token: secretToken});

    needle.post(urlToPost + path, payload, postCallback);
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

var loop = function() {
  ledOn(led1);

  climate.readTemperature('f', function (err, tempReading) {
    var temp = tempReading.toFixed(2);
    console.log('Degrees:', temp + 'F');
    postTemperature(temp);
  });

  climate.readHumidity(function (err, humid) {
    var humidity = humid.toFixed(4);
    console.log('Humidity:', humidity + '%RH');
    postHumidity(humidity);
  });

  ledOn(led2);

  ambient.getLightLevel(function(err, ldata) {
    var lightLevel =  ldata.toFixed(8);
    console.log('Light Level:', lightLevel);
    postLightLevel(lightLevel);
  });

  ambient.getSoundLevel(function(err, sdata) {
    var soundLevel = sdata.toFixed(8);
    console.log('Sound Level:', soundLevel);
    postSoundLevel(soundLevel);
  });


  ledOff(led1);
  ledOff(led2);

  setTimeout(loop, secondsBetweenReadings);
};

ambient.on('ready', function() {
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
    console.log("Initialized");
    setImmediate(loop);
  });
});
