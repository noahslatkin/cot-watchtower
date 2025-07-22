import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Call the FastAPI refresh endpoint
    const API_BASE = Deno.env.get('API_BASE_URL') || 'http://localhost:8000/api'
    
    const response = await fetch(`${API_BASE}/refresh/run`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`API call failed: ${data.error || 'Unknown error'}`)
    }
    
    console.log('COT data refresh completed:', data)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'COT data refresh completed successfully',
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error refreshing COT data:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})