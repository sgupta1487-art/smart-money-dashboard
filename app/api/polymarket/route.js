export async function GET() {
  const response = await fetch('https://gamma-api.polymarket.com/markets')
  const markets = await response.json()
  
  const topMarkets = markets.slice(0, 5).map(m => ({
    market: m.question,
    odds: Math.round(m.probability * 100),
    volume: m.volume
  }))
  
  return Response.json(topMarkets)
}