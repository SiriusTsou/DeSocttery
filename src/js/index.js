import App from './app'

$(async () => {
  try {
    const app = new App({
      networkId: 3,
    })

    window.app = app
  } catch (e) {
    console.log(e)
  }
})
