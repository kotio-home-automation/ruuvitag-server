const noble = require('noble')
const parser = require('./parser')
const SCANINTERVAL = 20000
const SCANTIME = 1000
const jdata = new Map()

const onDiscover = (peripheral) => {

  const manufacturerData = peripheral.advertisement ? peripheral.advertisement.manufacturerData : undefined
  const serviceDataArray = peripheral.advertisement ? peripheral.advertisement.serviceData : undefined;
  const serviceData = serviceDataArray && Array.isArray(serviceDataArray) ? serviceDataArray[0] : undefined

  // a ruuvitag in raw mode is found
  if (manufacturerData && manufacturerData[0] === 0x99 && manufacturerData[1] === 0x04) {

    if (manufacturerData[2] === 3) {
      const tagData = parser.parseFormat3RawTagData(manufacturerData.toString('hex'), peripheral.uuid)
      if (tagData) {
        jdata.set(tagData.name, tagData.data)
      }
    }

    if (manufacturerData[2] === 5) {
      const tagData = parser.parseFormat5RawTagData(manufacturerData, peripheral.uuid)
      jdata.set(tagData.name, tagData.data)
    }
  }

  // a ruuvitag eddystone beacon is possibly found
  if (serviceData && serviceData.uuid === 'feaa') {
    const tagData = parser.parseRuuviEddystoneData(serviceData.data, peripheral.uuid)
    if (tagData) {
      jdata.set(tagData.name, tagData.data)
    }
  }
}

noble.on('discover', onDiscover)

const scan = () => {
  noble.startScanning([], true)
  setTimeout(() => {
    noble.stopScanning()
  }, SCANTIME)
}

const jsonData = () => {
  const allData = []
  for(const [key, value] of jdata) {
    const sensor = {
      name: key,
      data: value
    }
    allData.push(sensor)
  }
  return allData
}

const start = () => {
  console.log('Starting ruuvitag scanner')
  setInterval(scan, SCANINTERVAL);
}

module.exports = {
  start: start,
  data: jsonData
}
