import { supabase } from "@/lib/supabase"

// GET - returns sample signals (for testing)
export async function GET() {
  const signals = [
    {
      asset: "BTC",
      signal: "Whale accumulation detected - 5,000 BTC moved to cold wallet",
      confidence: 85,
      signal_type: "whale"
    },
    {
      asset: "TSLA",
      signal: "Insider buying spike - CEO purchased 50,000 shares",
      confidence: 90,
      signal_type: "insider"
    },
    {
      asset: "ETH",
      signal: "Exchange inflow surge - $200M ETH to Binance",
      confidence: 72,
      signal_type: "exchange"
    }
  ]

  const { data, error } = await supabase
    .from("signals")
    .insert(signals)
    .select()

  return Response.json({ success: true, data, error })
}

// POST - allows you to add new signals from anywhere
export async function POST(request) {
  try {
    const newSignals = await request.json()
    
    // Format signals to match your table structure
    const signalsToInsert = Array.isArray(newSignals) ? newSignals : [newSignals]
    
    const formattedSignals = signalsToInsert.map(signal => ({
      asset: signal.asset,
      signal: signal.signal,
      confidence: signal.confidence,
      signal_type: signal.signal_type || "general",
      created_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from("signals")
      .insert(formattedSignals)
      .select()

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}