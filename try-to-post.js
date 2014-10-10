/* global console */
/* global require */

var tessel = require('tessel');
var http = require('http');

var mainLoop = function() {
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

  var data = {temperature_f: 100.0};

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function () {
      console.log('Response received.');
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ', e.message);
  });


  req.write(JSON.stringify({secret_token: 'cookie', sensor_reading: data}));
  console.log('Pushed data.');

  req.end();

  setTimeout(mainLoop, 5000);
};

console.log('Tessel started!');
setImmediate(mainLoop);
