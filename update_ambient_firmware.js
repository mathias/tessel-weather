var tessel = require('tessel');
var ambientLib = require('ambient-attx4');

// This will need to be run to update the Ambient module's firmware:
ambientLib.updateFirmware( tessel.port['D'], 'node_modules/ambient-attx4/firmware/src/ambient-attx4.hex');
