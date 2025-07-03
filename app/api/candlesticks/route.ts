import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const poolAddress = searchParams.get("poolAddress")
  const timeBucket = searchParams.get("timeBucket") || "1s"
  const limit = searchParams.get("limit") || "10000"

  console.log(`[/api/candlesticks] Request - poolAddress: ${poolAddress}, timeBucket: ${timeBucket}, limit: ${limit}`)

  if (!poolAddress) {
    console.error("[/api/candlesticks] Error: Pool address is required")
    return NextResponse.json({ error: "Pool address is required" }, { status: 400 })
  }

  try {
    // Get current unix timestamp
    const endTime = Math.floor(Date.now() / 1000)
    const mevxUrl = `https://api.mevx.io/api/v1/candlesticks?chain=sol&poolAddress=${poolAddress}&timeBucket=${timeBucket}&endTime=${endTime}&outlier=true&limit=${limit}`
    
    console.log(`[/api/candlesticks] Calling MEVX API: ${mevxUrl}`)
    
    const response = await fetch(mevxUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    console.log(`[/api/candlesticks] MEVX API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[/api/candlesticks] MEVX API Error (${response.status}):`, errorText)
      
      // Try to parse error as JSON for better error messages
      let errorMessage = `MEVX API failed with status: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch {
        // Keep the default error message if parsing fails
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: mevxUrl,
            response: errorText
          }
        },
        { status: response.status >= 500 ? 502 : response.status }
      )
    }

    const data = await response.json()
    console.log(`[/api/candlesticks] Success - received ${data.candlesticks?.length || 0} candlesticks`)
    
    // Validate response structure
    if (!data.candlesticks || !Array.isArray(data.candlesticks)) {
      console.error("[/api/candlesticks] Invalid response structure:", data)
      return NextResponse.json(
        { 
          error: "Invalid response from MEVX API: missing candlesticks array",
          details: { responseData: data }
        },
        { status: 502 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("[/api/candlesticks] Unexpected error:", error)
    return NextResponse.json(
      { 
        error: "Internal Server Error",
        details: {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        }
      },
      { status: 500 }
    )
  }
}
