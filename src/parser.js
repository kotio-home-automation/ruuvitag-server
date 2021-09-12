const config = require('./config')
const HEXADECIMAL = 16
const SIGN_BIT_NEGATIVE_LIMIT = 128

// parsing borrowed from https://github.com/Espesen/node-ruuvitag
const parseFormat3RawTagData = (rawData, uuid) => {

  const humidityStart      = 6
  const humidityEnd        = 8
  const temperatureStart   = 8
  const temperatureEnd     = 12
  const pressureStart      = 12
  const pressureEnd        = 16
  const accelerationXStart = 16
  const accelerationXEnd   = 20
  const accelerationYStart = 20
  const accelerationYEnd   = 24
  const accelerationZStart = 24
  const accelerationZEnd   = 28
  const batteryStart       = 28
  const batteryEnd         = 32

  const hexHumidity = rawData.substring(humidityStart, humidityEnd)
  const humidity = parseInt(hexHumidity, HEXADECIMAL) / 2

  const hexTemperatureString = rawData.substring(temperatureStart, temperatureEnd)
  const temperatureFullDegrees = parseInt(hexTemperatureString.substring(0, 2), HEXADECIMAL)
  const temperatureDecimals = parseInt(hexTemperatureString.substring(2, 4), HEXADECIMAL) / 100
  const fullTemperature = temperatureFullDegrees + temperatureDecimals

  const isNegativeTemperature = fullTemperature > SIGN_BIT_NEGATIVE_LIMIT
  const temperature = isNegativeTemperature ? (0 - fullTemperature + SIGN_BIT_NEGATIVE_LIMIT) : fullTemperature

  const hexPressure = rawData.substring(pressureStart, pressureEnd)
  const pressure = (parseInt(hexPressure, HEXADECIMAL) + 50000) / 100

  const namedTag = config.tags.find(ruuvitag => ruuvitag.id === uuid)
  const name = namedTag ? namedTag.name : uuid

  const tagData = {
    temperature: temperature,
    pressure: pressure,
    humidity: humidity
  }

  return {
    name: name,
    data: tagData
  }
}

// parsing borrowed from https://github.com/pakastin/node-ruuvitag/blob/cd4201d792e5b3d5c5dd06ff0c4eda00f31be834/dataformats/5.js
const parseFormat5RawTagData = (rawData, uuid) => {
  const tagData = {};

  let temperature = (rawData[3] << 8) | (rawData[4] & 0xff);
  if (temperature > 32767) {
    temperature -= 65534;
  }
  tagData.temperature = temperature / 200.0;

  tagData.humidity = (((rawData[5] & 0xff) << 8) | (rawData[6] & 0xff)) / 400.0;
  const pressure = (((rawData[7] & 0xff) << 8) | (rawData[8] & 0xff)) + 50000;
  tagData.pressure = (pressure > 1100) ? null : pressure

  let accelerationX = (rawData[9] << 8) | (rawData[10] & 0xff);
  if (accelerationX > 32767) accelerationX -= 65536; // two's complement
  tagData.accelerationX = accelerationX;

  let accelerationY = (rawData[11] << 8) | (rawData[12] & 0xff);
  if (accelerationY > 32767) accelerationY -= 65536; // two's complement
  tagData.accelerationY = accelerationY;

  let accelerationZ = (rawData[13] << 8) | (rawData[14] & 0xff);
  if (accelerationZ > 32767) accelerationZ -= 65536; // two's complement
  tagData.accelerationZ = accelerationZ;

  const powerInfo = ((rawData[15] & 0xff) << 8) | (rawData[16] & 0xff);
  tagData.battery = (powerInfo >>> 5) + 1600;
  tagData.txPower = (powerInfo & 0b11111) * 2 - 40;
  tagData.movementCounter = rawData[17] & 0xff;
  tagData.measurementSequenceNumber = ((rawData[18] & 0xff) << 8) | (rawData[19] & 0xff);

  tagData.mac = [
    int2Hex(rawData[20]),
    int2Hex(rawData[21]),
    int2Hex(rawData[22]),
    int2Hex(rawData[23]),
    int2Hex(rawData[24]),
    int2Hex(rawData[25])
  ].join(':');

  const namedTag = config.tags.find(ruuvitag => ruuvitag.id === uuid)
  const name = namedTag ? namedTag.name : uuid

  return {
    name: name,
    data: tagData
  }
}


function int2Hex (str) {
  return ('0' + str.toString(16).toUpperCase()).slice(-2);
}

const parseRuuviUrlHash = (beaconData) => {
  // This determines that frame is a URL, see https://github.com/google/eddystone/blob/master/protocol-specification.md
  if (beaconData.readUInt8(0) === 0x10) {

    // eddystone URL starts at byte 3, see https://github.com/google/eddystone/tree/master/eddystone-url#frame-specification
    const urlData = beaconData.slice(3)
    let url = ''

    for (const value of urlData) {
      url += String.fromCharCode(value)
    }

    // we only support ruuvi URL's
    if (url.match(/ruu\.vi/)) {
      return url.split('#')[1]
    }
    return undefined
  }
  return undefined
}

const parseRuuviEddystoneData = (data, uuid) => {

  const hash = parseRuuviUrlHash(data)

  // hash decoding borrowed from https://github.com/kyyhkynen/node-ruuvitag-weather
  if (hash) {
    const decoded = Buffer.from(hash, 'base64')

    const uTemp = (((decoded[2] & 127) << 8) | decoded[3])
    const tempSign = (decoded[2] >> 7) & 1

    const temperature = tempSign === 0 ? uTemp / 256.0 : -1 * uTemp / 256.0
    const pressure = (((decoded[4] << 8) + decoded[5]) + 50000) / 100
    const humidity = decoded[1] * 0.5
    const namedTag = config.tags.find(ruuvitag => ruuvitag.id === uuid)
    const name = namedTag ? namedTag.name : uuid

    tagData = {
      temperature: temperature,
      pressure: pressure,
      humidity: humidity
    }

    return {
      name: name,
      data: tagData
    }
  }
  return undefined
}

module.exports = {
  parseFormat3RawTagData,
  parseFormat5RawTagData,
  parseRuuviEddystoneData
}
