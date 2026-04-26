"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, topSignal: null })

  // Calculate stats from signals
  const calculateStats = (signalsList) => {
    if (!signalsList.length) return { total: 0, avgConfidence: 0, topSignal: null }
    
    const total = signalsList.length
    const avgConfidence = Math.round(signalsList.reduce((sum, s) => sum + s.confidence, 0) / total)
    const topSignal = signalsList.reduce((highest, current) => 
      current.confidence > highest.confidence ? current : highest, signalsList[0])
    
    return { total, avgConfidence, topSignal }
  }

  // Get color based on confidence score
  const getConfidenceColor = (score) => {
    if (score >= 80) return "#00ff88"
    if (score >= 60) return "#ffaa00"
    return "#ff4444"
  }

  // Get icon based on signal type/asset
  const getSignalIcon = (asset, signal) => {
    if (signal.toLowerCase().includes("whale")) return "🐋"
    if (signal.toLowerCase().includes("insider")) return "🏢"
    if (signal.toLowerCase().includes("exchange")) return "💱"
    if (asset === "BTC" || asset === "ETH" || asset === "SOL") return "🪙"
    return "📈"
  }

  // Initial fetch
  const fetchSignals = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    setSignals(data || [])
    setStats(calculateStats(data || []))
    setLoading(false)
  }

  // Trigger a new signal manually (for testing)
  const addTestSignal = async () => {
    const testSignals = [
      { asset: "NVDA", signal: "Unusual options flow detected", confidence: 94 },
      { asset: "META", signal: "Large call buyer", confidence: 82 },
      { asset: "SOL", signal: "Whale accumulation", confidence: 77 }
    ]
    
    const randomSignal = testSignals[Math.floor(Math.random() * testSignals.length)]
    
    await fetch('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([randomSignal])
    })
  }

  useEffect(() => {
    fetchSignals()

    // REAL-TIME SUBSCRIPTION
    const channel = supabase
      .channel("signals-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signals"
        },
        (payload) => {
          setSignals((prev) => [payload.new, ...prev])
          setStats(calculateStats([payload.new, ...prev]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <main style={{ 
      padding: 20, 
      fontFamily: "Arial, sans-serif", 
      background: "#0a0a0a", 
      minHeight: "100vh", 
      color: "white" 
    }}>
      
      {/* Header */}
      <div style={{ 
        borderBottom: "1px solid #2a2a2a", 
        paddingBottom: 20, 
        marginBottom: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 15
      }}>
        <div>
          <h1 style={{ 
            fontSize: 28, 
            background: "linear-gradient(90deg, #00ff88, #00cc66)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: 0
          }}>
            🐋 Smart Money Tracker
          </h1>
          <p style={{ color: "#888", fontSize: 12, marginTop: 5 }}>
            Live unusual activity & high-conviction signals
          </p>
        </div>
        
        <button
          onClick={addTestSignal}
          style={{
            background: "#00ff88",
            color: "#0a0a0a",
            border: "none",
            padding: "8px 16px",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: 14
          }}
        >
          + Add Test Signal
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 15,
        marginBottom: 30
      }}>
        <div style={{ background: "#1a1a1a", padding: 15, borderRadius: 10, borderLeft: "4px solid #00ff88" }}>
          <div style={{ color: "#888", fontSize: 12 }}>Total Signals</div>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{stats.total}</div>
        </div>
        <div style={{ background: "#1a1a1a", padding: 15, borderRadius: 10, borderLeft: "4px solid #ffaa00" }}>
          <div style={{ color: "#888", fontSize: 12 }}>Avg Confidence</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#ffaa00" }}>{stats.avgConfidence}%</div>
        </div>
        <div style={{ background: "#1a1a1a", padding: 15, borderRadius: 10, borderLeft: "4px solid #00ff88" }}>
          <div style={{ color: "#888", fontSize: 12 }}>Top Signal</div>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>
            {stats.topSignal?.asset || "—"} 
            <span style={{ fontSize: 14, color: "#00ff88", marginLeft: 8 }}>
              {stats.topSignal?.confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Live Feed Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: 15
      }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>📡 Live Signal Feed</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            background: "#00ff88", 
            borderRadius: "50%",
            animation: "pulse 1.5s infinite"
          }}></div>
          <span style={{ fontSize: 11, color: "#888" }}>Real-time updates</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Signals List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50, color: "#888" }}>
          Loading signals...
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {signals.length === 0 ? (
            <div style={{ textAlign: "center", padding: 50, color: "#888", background: "#1a1a1a", borderRadius: 10 }}>
              No signals yet. Click "Add Test Signal" to see one appear!
            </div>
          ) : (
            signals.map((s) => (
              <div 
                key={s.id} 
                style={{ 
                  background: "#1a1a1a", 
                  padding: "15px 20px", 
                  borderRadius: 10,
                  borderLeft: `4px solid ${getConfidenceColor(s.confidence)}`,
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{getSignalIcon(s.asset, s.signal)}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 18 }}>{s.asset}</strong>
                      <span style={{ 
                        background: "#2a2a2a", 
                        padding: "2px 8px", 
                        borderRadius: 20,
                        fontSize: 11,
                        color: "#00ff88"
                      }}>
                        {s.signal_type || "Signal"}
                      </span>
                    </div>
                    <p style={{ margin: "5px 0 0 0", color: "#ccc", fontSize: 14 }}>{s.signal}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ 
                    fontSize: 24, 
                    fontWeight: "bold", 
                    color: getConfidenceColor(s.confidence)
                  }}>
                    {s.confidence}%
                  </div>
                  <div style={{ fontSize: 10, color: "#666" }}>
                    {new Date(s.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Heatmap Section */}
      <h2 style={{ fontSize: 18, margin: "30px 0 15px 0" }}>🔥 Smart Money Heatmap</h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12
      }}>
        {signals.slice(0, 8).map((s) => (
          <div
            key={`heat-${s.id}`}
            style={{
              background: `linear-gradient(135deg, ${getConfidenceColor(s.confidence)}40, ${getConfidenceColor(s.confidence)}20)`,
              border: `1px solid ${getConfidenceColor(s.confidence)}60`,
              borderRadius: 10,
              padding: 15,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{ fontSize: 24 }}>{getSignalIcon(s.asset, s.signal)}</div>
            <div style={{ fontWeight: "bold", fontSize: 16, marginTop: 5 }}>{s.asset}</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: getConfidenceColor(s.confidence) }}>
              {s.confidence}
            </div>
            <div style={{
              width: "100%",
              height: 4,
              background: "#333",
              borderRadius: 2,
              marginTop: 8,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${s.confidence}%`,
                height: "100%",
                background: getConfidenceColor(s.confidence),
                borderRadius: 2
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Polymarket Section (Static for now) */}
      <h2 style={{ fontSize: 18, margin: "30px 0 15px 0" }}>🎲 Polymarket Top Movers</h2>
      <div style={{
        background: "#1a1a1a",
        borderRadius: 10,
        padding: 20
      }}>
        {[
          { market: "Trump vs Biden 2024", odds: 62, change: "+8%" },
          { market: "BTC > $100k by 2025", odds: 45, change: "+12%" },
          { market: "ETH ETF Approval", odds: 71, change: "+5%" }
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 15 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span>{item.market}</span>
              <span style={{ color: "#00ff88" }}>{item.odds}% {item.change}</span>
            </div>
            <div style={{ width: "100%", height: 6, background: "#333", borderRadius: 3 }}>
              <div style={{ width: `${item.odds}%`, height: 6, background: "#00ff88", borderRadius: 3 }}></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}