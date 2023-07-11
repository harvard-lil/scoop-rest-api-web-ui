/**
 * Forwards a request to the Scoop REST API to enquire about a specific capture.
 * See `README.md` for required environment variables
 * 
 * Expected JSON payload: 
 * - "id_capture"
 * - "pin"
 * 
 * Status codes:
 * - 400: Missing request body / properties in request body, or invalid id_capture.
 * - 401: Wrong / invalid pin
 * - 500: Error enquiring about capture or app misconfiguration
 */
exports.handler = async function (event, context) {
  const requestBody = event?.body ? JSON.parse(event.body) : {}
  //
  // Check API config
  //
  if (!process.env?.ACCESS_PIN || 
      !process.env?.SCOOP_REST_API_URL || 
      !process.env?.SCOOP_REST_API_ACCESS_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Application has not been properly configured'}),
    }
  }

  //
  // Check request body
  //
  if (!requestBody || !requestBody?.id_capture || !requestBody?.pin) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '"id_capture" and "pin" properties are required'}),
    }
  }

  //
  // Check pin
  //
  if (requestBody.pin !== process.env.ACCESS_PIN) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid access pin'}),
    }
  }

  //
  // Check id_capture
  //
  try {
    // https://melvingeorge.me/blog/check-if-string-valid-uuid-regex-javascript
    const re = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

    if (!re.test(requestBody.id_capture)) {
      throw new Error('Provided id_capture is not a valid uuid v4')
    }
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid id_capture'}),
    }   
  }

  //
  // Proxy request to Scoop REST API
  //
  try {
    const response = await fetch(`${process.env.SCOOP_REST_API_URL}/capture/${requestBody.id_capture}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Access-Key': process.env.SCOOP_REST_API_ACCESS_KEY
      }
    })

    // Error with JSON body
    if (response.status !== 200 && response.headers.get('Content-Type') === 'application/json') {
      const data = await response.json()
      throw new Error(data?.error)
    }

    // Error without JSON body
    if (response.status !== 200) {
      throw new Error(response.status)
    }

    // Success
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(await response.json()),
    }
  } 
  // Catch-all
  catch (err) {
    console.trace(err)
  
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error while enquiring about capture request'}),
    }
  }
}