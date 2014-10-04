# tessel-weather

Turns my [Tessel](http://tessel.io) board into a sort of weather station.
Pushes data to a Heroku app. Must be on wifi to push data.

## cortado-sketch.ino

This file is a simple firmware for the LightBlue
[Bean](http://punchthrough.com/bean/) (previously called the Cortado) to send
temperature data over Bluetooth LE (as a serial connection).

In theory, this would allow the Tessel to have another temperature data point
(say, from another room.) For now, since I don't have the Tessel BLE module, I
haven't fully integrated it.

## License

Copyright (c) 2012 Matt Gauger

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
