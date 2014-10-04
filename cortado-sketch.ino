// Notify the client over serial when a temperature reading changes

static int8_t temp = 0;

// the setup routine runs once when you press reset:
void setup()
{
  // initialize serial communication at 57600 bits per second:
  Serial.begin(57600);
}

void loop()
{
  AccelerationReading accel = {0, 0, 0};

  int8_t newTemp = Bean.getTemperature();

  if ( newTemp != temp )
  {
    temp = newTemp;

    Serial.println(temp);
  }

  accel = Bean.getAcceleration();

  uint16_t r = (abs(accel.xAxis)) / 4;
  uint16_t g = (abs(accel.yAxis)) / 4;
  uint16_t b = (abs(accel.zAxis)) / 4;

  Bean.setLed((uint8_t)r,(uint8_t)g,(uint8_t)b);
  Bean.sleep(500);
  Bean.setLed(0,0,0);

  // Sleep for 5 seconds before reading the temperature again
  Bean.sleep(5000);
}
