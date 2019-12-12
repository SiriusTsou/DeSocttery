export const parseUser = (address) => {
  return address.replace(/^(0x.{4}).+(.{4})$/, '$1…$2')
}

export const getGasPrice = async () => {
  const response = await fetch('https://ethgasstation.info/json/ethgasAPI.json')
  const data = await response.json()
  const gasPrice = new BigNumber(data.fast).div(10).times(1e9)
  return gasPrice
}

export const format = (bigNumber, len) => {
  const bigNumberIntLen = bigNumber.toFixed(0).length

  len = bigNumberIntLen > len ? 0 : len - bigNumberIntLen

  bigNumber = bigNumber.toFixed(len)
  bigNumber = new BigNumber(bigNumber)
  return !bigNumber.isZero() ? bigNumber.toString() : 0
}

export const formatFloatLength = (bigNumber, len) => {
  const str = bigNumber.toString()
  let temp = str
  if (str.includes('.')) {
    const _ = str.split('.')
    temp = _[0]+'.'+_[1].substr(0,len)
  }

  return !bigNumber.isZero() ? temp : 0
}
