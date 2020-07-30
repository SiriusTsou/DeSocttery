import { getGasPrice, format } from '../../utils'
// import { TOKEN, TTOKEN, ABI, CONTRACT } from '../../constant'

class WagerDialog {
  constructor (target, src) {
    this.target = target
    this.src = src
  }

  async init() {
    await this.initComponent()
    this.initI18n()
    this.initToken()
  }

  async initComponent() {
    await new Promise(resolve => {
      this.target.load(this.src, resolve)
    })

    this.closeButton = this.target.find('.dialog-close-button')
    this.dialogButton = this.target.find('.dialog-button')

    this.closeButton.click(this.close.bind(this))
    this.dialogButton.click(this.confirm.bind(this))


    $('#available-dialog-balance').click(() => {
      const availableBalance = new BigNumber($('#dialog-balance').text())
      if (availableBalance.gt(0)) {
        $('#available-dialog-balance-input').val(format(availableBalance, 9))
      } else {
        $('#available-dialog-balance-input').val(0)
      }
    })
  }

  initI18n() {
    // $('#dialog-header-withdraw-text').text(t('div.dialog-header-withdraw-text'))
    // $('#dialog-balance-text').text(t('div.dialog-balance-text')) 
    // $('#dialog-withdraw-balance-text').text(t('div.dialog-withdraw-balance-text')) 
    // this.dialogButton.text(t('button.withdraw'))     
  }

  initToken() {
    $('#dialog-token-balance').text(this.TOKEN)
  }

  show(wWeb3Provider, exchange) {
    this.wWeb3Provider = wWeb3Provider
    this.wWeb3 = this.wWeb3Provider.library
    this.networkId = this.wWeb3Provider.networkId
    this.exchange = exchange
    this.target.show()
  }

  close () {
    this.target.hide()
  }

  async confirm() {
    const account = this.wWeb3Provider ? this.wWeb3Provider.account : null
    if (!account) {
      return false
    }

    const amount = new BigNumber($('#available-dialog-balance-input').val())
    if (!amount.toNumber()) {
      return alert(t('main.withraw-alert'))
    }

    const gasPrice = await getGasPrice()

    let final_amount = this.exchange.toTToken(amount)
    const _amount = final_amount.gt(this.exchange._AB) ? this.exchange._AB.toFixed(0) : final_amount.toFixed(0)

    if (this.wWeb3Provider.connectorName === 'MetaMask') {
      await this.exchange.withdraw(this.wWeb3, gasPrice, _amount, account)
        .on('transactionHash', (hash) => {
          console.log(hash)
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          alert('success')
        })
        .on('error', (error, receipt) => {
          console.log('error', error)
        })
    } else {
      const fee = this.exchange.gas.times(gasPrice).div(1e+18)
      const txParams = {
        value: amount,
        unit: this.TOKEN,
        fee: fee.toString(),
      }
      const txFunc = async () => {
        this.exchange.withdraw(this.wWeb3, gasPrice, _amount, account)
          .on('transactionHash', (hash) => {
            console.log(hash)
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            alert('success')
          })
          .on('error', (error, receipt) => {
            console.log('error', error)
          })
      }
      this.approvalDialog.show(txParams, txFunc)
    }

    this.close()
  }
}

export default WagerDialog
