# Ruuvitag

Ruuvitag communicates via Bluetooth Low Energy i.e. BLE and therefore bluetooth support is required and BLE compatibility is a requirement.

## Bluetooth and Linux

Accessing bluetooth advertising **requires** sudo/root privileges or a [noble workaround](https://github.com/sandeepmistry/noble#running-on-linux)

Bluetooth requires some utilities https://github.com/sandeepmistry/noble#linux. You can omit `bluez` if you are using Raspberry Pi and you need to install bluez manually (next section).

`sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev`

### Raspberry Pi and Bluetooth

*I'm not quite sure if this is neccessary on latest raspbian but if the above section's instructions don't work try this one.*

Raspberry Pi and bluetooth low energy is a bit harder operation, see http://www.elinux.org/RPi_Bluetooth_LE if you are running RPi with wheezy or https://learn.adafruit.com/install-bluez-on-the-raspberry-pi/installation if you are running RPi with jessie.

## Install dependencies

  ```
  npm install
  ```

This can take a while because of the native library compilation of bluetooth if your building on RPi or similar platform.

## Start the server

  `sudo` or `root` rights are required unless you used the noble workaround (I didn't)

  `sudo node src/index.js`

  or

  `sudo ./node_modules/nodemon/bin/nodemon.js src/index.js`

## Test server by fetching ruuvitag data

Go to URL http://localhost:3102/ruuvitag

## Identifying ruuvitags

To identify and name your ruuvitags I have added a utility that can scan beacons. I suggest that you idenitify your beacons one at a time.

* Start with going to server directory `../utils`.

1) start tag #1 and run `sudo node ruuvitag-identifier.js`
2) watch your console and take note of the tag's id
3) add the _id_ and a _name_ that you want to give to the ruuvitag to file's `src/config.js` variable `tags`
4) repeat steps 1-3 for all your ruuvitags

## REST API

Kotio Ruuvitag server REST API works over http with JSON messages

### Fetching ruuvitag data

URL: `http://localhost:3101/ruuvitag`

Response format:

```javascript
[
  {
    "name": "Defined ruuvitage name or ruuvitag's id",
    "data": {
      "temperature": 27,
      "pressure": 1009,
      "humidity": 43
    }
  }
]
```

* temperature is in celsius without decimals
* pressure is hPa
* humidity is relative humidity percentage

Response is a array containing all found ruuvitags.
