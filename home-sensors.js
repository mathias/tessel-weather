'use strict';

var tessel = require('tessel');
var http = require('http');
var climatelib = require('climate-si7020');

/**
 * Climate module.
 */
var climate = climatelib.use(tessel.port['A']);

climate.on('ready', function () {
  console.log('Connected to si7020!');

  // Loop forever
  setImmediate(function loop() {
    climate.readTemperature('f', function (err, temp) {
      climate.readHumidity(function (err, humid) {
        updateSensor({temperature_f: temp, humidity: humid});
        setTimeout(loop, 6000);
      });
    });
  });
});


/**
 * Update a sensor.
 *
 * @param id Sensor ID
 * @param value Sensor value
 */
var updateSensor = function(value) {
  dataQueue.push(value);
};

/**
 * Main update loop.
 */
var dataQueue = [];
setImmediate(function mainLoop() {
  var options = {
    hostname: '192.168.1.106',
    port: 3000,
    path: '/sensor_readings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  var data = dataQueue.shift();

  if (data) {
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function () {
        console.log('Sensors updated!');
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });

    req.write(JSON.stringify({secret_token: 'cookie', sensor_reading: data}));
    console.log("Pushed: ", data);

    req.end();
  }

  setTimeout(mainLoop, 6000);
});

console.log('Tessel started!');
