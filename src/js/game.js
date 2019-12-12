
class Game  {
  constructor(rWeb3, abi, gas, address) {
    this._address = address

    this.rWeb3 = rWeb3
    this.game = new this.rWeb3.eth.Contract(abi, address)
    this.gas = gas
  }

  betOnHomeTeam(wWeb3, gasPrice, amount, account) {
    const game = new wWeb3.eth.Contract(this.abi, this.address)
    return game.methods.betOnHomeTeam(amount).send({
        from: account,
        gas: this.gas.toString(),
        gasPrice: gasPrice.toString()
      })
  }

  betOnAwayTeam(wWeb3, gasPrice, amount, account) {
    const game = new wWeb3.eth.Contract(this.abi, this.address)
    return game.methods.betOnAwayTeam(amount).send({
        from: account,
        gas: this.gas.toString(),
        gasPrice: gasPrice.toString()
      })
  }

  betOnTie(wWeb3, gasPrice, amount, account) {
    const game = new wWeb3.eth.Contract(this.abi, this.address)
    return game.methods.betOnTie(amount).send({
        from: account,
        gas: this.gas.toString(),
        gasPrice: gasPrice.toString()
      })
  }  

  draw(wWeb3, gasPrice, account) {
    const game = new wWeb3.eth.Contract(this.abi, this.address)
    return game.methods.draw().send({
        from: account,
        gas: this.gas.toString(),
        gasPrice: gasPrice.toString()
      })
  }  

  win(wWeb3, gasPrice, account) {
    const game = new wWeb3.eth.Contract(this.abi, this.address)
    return game.methods.win().send({
        from: account,
        gas: this.gas.toString(),
        gasPrice: gasPrice.toString()
      })
  }  
}

export default Game
