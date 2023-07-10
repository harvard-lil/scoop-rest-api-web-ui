/**
 * Forwards a capture request to the Scoop REST API.
 * See `README.md` for required environment variables.
 * 
 * Expected JSON payload: 
 * - "url"
 * - "pin"
 * 
 * Status codes:
 * - 400: Missing request body or properties in request body.
 * - 401: Wrong / invalid pin
 * - 400: Invalid URL
 * - 500: Error while creating capture or app misconfiguration
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
  if (!requestBody || !requestBody?.url || !requestBody?.pin) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '"url" and "pin" properties are required'}),
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
  // Check URL
  //
  try {
    new URL(requestBody.url)
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid url'}),
    }   
  }

  //
  // Proxy request
  //
  try {
    const response = await fetch(`${process.env.SCOOP_REST_API_URL}/capture`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Access-Key': process.env.SCOOP_REST_API_ACCESS_KEY
      },
      body: JSON.stringify({ url: requestBody.url })
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
  } catch (err) {
    console.trace(err)
  
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error while creating capture request'}),
    }
  }
}