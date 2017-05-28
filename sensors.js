const scanner = require('eddystone-beacon-scanner')
const config = require('./config')
const SCANINTERVAL = 120000
const SCANTIME = 2500
const data = new Map()

scanner.on('found', readings)
scanner.on('updated', readings)

// Supports ruuvitag weather station formats 2 & 4
// URL decoding borrowed from https://github.com/kyyhkynen/node-ruuvitag-weather
function readings(tag) {
  console.log('tag', tag)
  const hash = tag.url.split('#')[1]
  const decoded = Buffer.from(hash, 'base64')

  uTemp = (((decoded[2] & 127) << 8) | decoded[3])
  const tempSign = (decoded[2] >> 7) & 1

  const temperature = tempSign === 0 ? uTemp/256.0 : -1 * uTemp/256.0
  const pressure = (((decoded[4] << 8) + decoded[5]) + 50000)/100
  const humidity = decoded[1] * 0.5
  const namedTag = config.tags.find(ruuvitag => ruuvitag.id === tag.id)
  const name = namedTag ? namedTag.name : tag.id

  tagdata = {
    temperature: temperature,
    pressure: pressure,
    humidity: humidity
  }
  data.set(name, tagdata)
}

const jsonData = () => {
  const allData = []
  for(const [key, value] of data) {
    const sensor = {
      name: key,
      data: value
    }
    allData.push(sensor)
  }
  return allData
}

function scan() {
  scanner.startScanning()
  setTimeout(() => {
    scanner.stopScanning()
  }, SCANTIME)
}

function start() {
  console.log('Starting ruuvitag scanner')
  setInterval(scan, SCANINTERVAL);
  scan()
}

module.exports = {
  start: start,
  data: jsonData
}
