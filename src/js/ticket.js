import { TOKEN } from './constant'

class Ticket  {
  constructor(rWeb3,abi, gas, address) {
    this._address = address

    this.rWeb3 = rWeb3
    this.ticket = new this.rWeb3.eth.Contract(abi, address)
    this.gas = gas
  }

  async totalSupply() {
    const _totalSupply = await this.ticket.methods.totalSupply().call()
    const _ts = new BigNumber(_totalSupply)
    return _ts.div(TOKEN['ETH'].EXP_DECIMALS)
  }
}

export default Ticket
