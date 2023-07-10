
/**
 * Request a capture
 */
document.querySelector("section#request form").addEventListener("submit", async e => {
  const urlInput = document.querySelector("section#request input[name='url']")
  const pinInput = document.querySelector("section#request input[name='pin']")
  const submitButton = document.querySelector("section#request button")
  const progressBar = document.querySelector("section#request progress")

  const successDialog = document.querySelector('dialog#response-success')
  const failedDialog = document.querySelector('dialog#response-failed')

  let status = 'pending'
  let id_capture = null
  let capture = null

  e.preventDefault()
  
  //
  // Block form
  //
  urlInput.setAttribute('disabled', 'disabled')
  pinInput.setAttribute('disabled', 'disabled')
  submitButton.setAttribute('disabled', 'disabled')

  progressBar.classList.remove('hidden')
  progressBar.removeAttribute('aria-hidden')

  //
  // Send request and long-poll until completion or failure
  //
  try {

    // First request
    const response = await fetch('/.netlify/functions/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: urlInput.value, 
        pin: pinInput.value
      })
    })

    if (response.status === 400) {
      throw new Error('Invalid request')
    }

    if (response.status === 401) {
      throw new Error('Invalid PIN')
    }

    if (response.status === 500 || response.status !== 200) {
      throw new Error(`An error occurred while requesting the capture of ${urlInput.value}`)
    }

    const data = await response.json()
    id_capture = data?.id_capture
    
    if (!id_capture) {
      throw new Error('No id_capture was returned by the API')
    }


    // Long poll until completion or failure -- up to 50 times
    for (let i = 0; i < 50; i++) {
      await new Promise(resolve => setTimeout(resolve, 2500)) // Tick

      const response = await fetch('/.netlify/functions/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_capture, 
          pin: pinInput.value
        })
      })

      if (response.status !== 200) {
        throw new Error(`An error occurred while requesting the capture of ${urlInput.value}`)
      }

      const data = await response.json()
      status = data?.status

      if (status === "success" || status === "failed") {
        capture = data
        break
      }

      // If we reach 50 attempts, something went wrong
      if (i >= 50) {
        throw new Error("Capture timeout")
      }
    }

    // Populate and open summary dialog
    console.log(capture)
    const captureTime = ((new Date(capture?.ended_timestamp) - new Date(capture?.started_timestamp)) / 1000).toFixed(2)
    const waczUrl = capture?.artifacts.find(url => url.endsWith('.wacz'))
    const screenshotUrl = capture?.artifacts.find(url => url.endsWith('.png'))
    successDialog.querySelector("*[data-id='capture-time']").innerHTML = `${captureTime}`
    successDialog.querySelector("*[data-id='capture-url']").setAttribute('href', capture?.url)
    successDialog.querySelector("*[data-id='playback-url']").setAttribute('href', capture?.temporary_playback_url)
    successDialog.querySelector("*[data-id='wacz-url']").setAttribute('href', waczUrl)
    successDialog.querySelector("*[data-id='screenshot-url']").setAttribute('href', screenshotUrl)
    successDialog.querySelector("textarea").value = JSON.stringify(capture, null, 2)
    successDialog.showModal()

  } 
  // On error: open error dialog and re-throw error
  catch (err) {
    failedDialog.showModal()
    throw err
  } 
  // In any case: re-activate form
  finally {
    urlInput.removeAttribute('disabled')
    pinInput.removeAttribute('disabled')
    submitButton.removeAttribute('disabled')
  
    progressBar.classList.add('hidden')
    progressBar.setAttribute('aria-hidden', 'true')
  }
})

