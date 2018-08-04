const config = require('./config')
const HEXADECIMAL = 16
const SIGN_BIT_NEGATIVE_LIMIT = 128

// parsing borrowed from https://github.com/Espesen/node-ruuvitag
const parseRawTagData = (rawData, uuid) => {

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
  const humidity = parseInt(hexHumidity, 16) / 2

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
  parseRawTagData,
  parseRuuviEddystoneData
}
