import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ valid: false, reason: 'format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const domain = email.split('@')[1].toLowerCase()

    // Consulta MX records via Google DNS-over-HTTPS (gratuito, sem limite)
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`)
    const data = await res.json()

    const hasMX = data.Answer && data.Answer.length > 0

    return new Response(JSON.stringify({ valid: hasMX, reason: hasMX ? 'ok' : 'no_mx' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    // Em caso de erro na consulta DNS, libera para não bloquear usuários legítimos
    return new Response(JSON.stringify({ valid: true, reason: 'dns_error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
