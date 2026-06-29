import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      headers: { 
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      } 
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  )

  if (req.method === "GET") {
    const { data: games } = await supabase.from("executions").select("*").order("count", { ascending: false })
    const { data: total } = await supabase.from("totals").select("value").eq("id", 1).single()

    const gamesObj = {}
    games?.forEach(g => { gamesObj[g.game_name] = g.count })

    return new Response(JSON.stringify({ total: total?.value ?? 26000, games: gamesObj }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }

  if (req.method === "POST") {
    const body = await req.json()
    const gameName = (body.gameName || "Desconhecido").toString().substring(0, 50)

    const { data: existing } = await supabase.from("executions").select("count").eq("game_name", gameName).single()

    if (existing) {
      await supabase.from("executions").update({ count: existing.count + 1 }).eq("game_name", gameName)
    } else {
      await supabase.from("executions").insert({ game_name: gameName, count: 1 })
    }

    const { data: total } = await supabase.from("totals").select("value").eq("id", 1).single()
    await supabase.from("totals").update({ value: (total?.value ?? 26000) + 1 }).eq("id", 1)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    })
  }

  return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405 })
})
