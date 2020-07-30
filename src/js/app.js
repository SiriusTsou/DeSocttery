const Web3Provider = Web3Vanilla.Web3Provider
const { NetworkOnlyConnector, InjectedConnector } = Web3Vanilla.Connectors

import { RPC_NETWORK, ABI, CONTRACT } from './constant'
import Ticket from './ticket'
import Game from './game'
import { parseUser, getGasPrice, format, formatFloatLength } from './utils'

import WagerDialog from './component/WagerDialog/.'

BigNumber.config({ RANGE: [-19, 61], EXPONENTIAL_AT: [-19, 61] })

class App  {
  constructor(opt) {
    this.networkId = opt.networkId || 1

    this.rWeb3 = null
    this.wWeb3 = null 
    this.rWeb3Provider = null
    this.wWeb3Provider = null
  }

  async start() {
    await this.init()
    await this.render()

    this.rWeb3Provider.provider.on('block', async (block) => {
      if (this.wWeb3Provider && this.wWeb3Provider.account) {
        // await this.renderBalanceAndEarn(this.wWeb3Provider.account)
      } else {
        await this.renderInfo()
      }
    })
  }

  async init() {
    await this.initRWeb3()
    await this.initTicket()
  }

  async initRWeb3() {
    const Infura = new NetworkOnlyConnector({
      supportedNetworkURLs: RPC_NETWORK,
      defaultNetwork: this.networkId,
    })

    const connectors = { Infura }

    const web3Provider = new Web3Provider({
      connectors: connectors,
      libraryName: 'web3.js',
      web3Api: Web3,
    })

    await web3Provider.setConnector('Infura')
    this.rWeb3Provider = web3Provider
    this.rWeb3 = web3Provider.library
  }

  async initWWeb3() {
    if (window.ethereum) {
      console.log('123')
      const supportedNetworks = Object.keys(RPC_NETWORK).map(
        (supportedNetworkURL) => Number(supportedNetworkURL)
      )
      const MetaMask = new InjectedConnector({ 
        supportedNetworks: supportedNetworks,
      })
      const connectors = { MetaMask }
      this.injectedWeb3Provider = new Web3Provider({
        connectors: connectors,
        libraryName: 'web3.js',
        web3Api: Web3,
      })

      $('.s-common-button.s-font-body.s-action-button').prop('disabled', true)
      this.injectedWeb3Provider.event.removeAllListeners()
      this.injectedWeb3Provider.unsetConnector()
      this._error = this.injectedWeb3Provider.event.once('error', (error) => {
        if (error) {
          if (error.code === 'ETHEREUM_ACCESS_DENIED') {
            alert('Please let wallet enable account')
          } else if (error.code === 'UNSUPPORTED_NETWORK') {
            alert('Wrong network, please change to Ropsten network')
          }
        }

        // remove useless onceActive
        this.injectedWeb3Provider.event.removeAllListeners()
        $('.s-common-button.s-font-body.s-action-button').prop('disabled', false)
      })

      this.injectedWeb3Provider.event.once('active', (active) => {
        if (active) {
          // remove useless onceError
          this.injectedWeb3Provider.event.removeAllListeners()

          this.renderAccount(this.injectedWeb3Provider.account)
        }
      })

      await this.injectedWeb3Provider.setConnector('MetaMask')
      this.wWeb3Provider = this.injectedWeb3Provider
      this.wWeb3 = this.injectedWeb3Provider.library    
      if (this.wWeb3Provider.connectorName === 'MetaMask') {
        this.wWeb3Provider.event.on('accountChanged', (account) => {
          this.renderAccount(account)
        })
      }   
    }
    console.log('123')
  }

  async initTicket(){
    this.ticketHome = new Ticket(this.rWeb3, ABI.TICKET.HOME.abi, ABI.TICKET.HOME.gas, CONTRACT[this.networkId].TICKET.HOME)
    this.ticketAway = new Ticket(this.rWeb3, ABI.TICKET.AWAY.abi, ABI.TICKET.AWAY.gas, CONTRACT[this.networkId].TICKET.AWAY)
    this.ticketTie = new Ticket(this.rWeb3, ABI.TICKET.TIE.abi, ABI.TICKET.TIE.gas, CONTRACT[this.networkId].TICKET.TIE)

    this.game = new Game(this.rWeb3, ABI.GAME.abi, ABI.GAME.gas, CONTRACT[this.networkId].GAME)
  }

  async render() {
    await this.renderInfo()
    $('.s-common-button.s-font-body.s-action-button').click(async () => {
      console.log('123')
      await this.initWWeb3()
    })

    // this.wagerDialog = new WagerDialog($('#wager-dialog'), $('#wager-dialog-src').attr('href'))
    // await this.wagerDialog.init()
    
    $('.s-text-button > div > div > div > a').removeAttr('href')
    $('.s-text-button > div > div > div > a').eq(0).click(() => {
      const account = this.wWeb3Provider ? this.wWeb3Provider.account : null
      if (account) {
        this.wagerDialog.show(this.wWeb3Provider, this.game.betOnHomeTeam)
      }
    })

    $('.s-text-button > div > div > div > a').eq(1).click(() => {
      const account = this.wWeb3Provider ? this.wWeb3Provider.account : null
      if (account) {
        this.wagerDialog.show(this.wWeb3Provider, this.game.betOnAwayTeam)
      }
    })

    $('.s-text-button > div > div > div > a').eq(2).click(() => {
      const account = this.wWeb3Provider ? this.wWeb3Provider.account : null
      if (account) {
        this.wagerDialog.show(this.wWeb3Provider, this.game.betOnTie)
      }
    })
  }

  async renderInfo() {
    const homeTotalSupply = await this.ticketHome.totalSupply()
    const awayTotalSupply = await this.ticketAway.totalSupply()
    const tieTotalSupply = await this.ticketTie.totalSupply()
    const totalSupply = homeTotalSupply.plus(awayTotalSupply).plus(tieTotalSupply)
    const homeOdds = totalSupply.div(homeTotalSupply)
    const awayOdds = totalSupply.div(awayTotalSupply)
    const tieOdds = totalSupply.div(tieTotalSupply)

    $('.s-item-subtitle > div > h6 > p').eq(0).text(`Pool: ${formatFloatLength(homeTotalSupply,1)} DAI`)
    $('.s-item-subtitle > div > h6 > p').eq(1).text(`Pool: ${formatFloatLength(awayTotalSupply,1)} DAI`)
    $('.s-item-subtitle > div > h6 > p').eq(2).text(`Pool: ${formatFloatLength(tieTotalSupply,1)} DAI`)
    $('.s-item-text > div > div > p').eq(0).text(`Odds: ${formatFloatLength(homeOdds,1)}`)
    $('.s-item-text > div > div > p').eq(1).text(`Odds: ${formatFloatLength(awayOdds,1)}`)
    $('.s-item-text > div > div > p').eq(2).text(`Odds: ${formatFloatLength(tieOdds,1)}`)
  }

  renderAccount(account) {
    if (account) {
      $('.s-common-button.s-font-body.s-action-button').prop('disabled', true)
      $('.s-common-button.s-font-body.s-action-button').text(parseUser(account))
    } else {
      $('.s-common-button.s-font-body.s-action-button').text('CONNECT')
      $('.s-common-button.s-font-body.s-action-button').prop('disabled', false)
    }
  }
}

export default App
