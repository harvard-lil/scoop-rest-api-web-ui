
/**
 * Request a capture
 */
document.querySelector("article#request form").addEventListener("submit", (e) => {
  const urlInput = document.querySelector("article#request input[name='url']")
  const pinInput = document.querySelector("article#request input[name='pin']")
  const submitButton = document.querySelector("article#request button")
  const progressBar = document.querySelector("article#request progress")

  e.preventDefault()
  
  // Block form
  urlInput.setAttribute('disabled', 'disabled')
  pinInput.setAttribute('disabled', 'disabled')
  submitButton.setAttribute('disabled', 'disabled')

  progressBar.classList.remove('hidden')
  progressBar.removeAttribute('aria-hidden')

  // Send request
  // TODO
})