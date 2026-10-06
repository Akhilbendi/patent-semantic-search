import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Search, SlidersHorizontal, ChevronRight, ArrowLeft, FileText, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import './styles.css'

const API = '/api'

function scoreClass(score) {
  if (score >= 0.7) return 'score high'
  if (score >= 0.5) return 'score medium'
  return 'score'
}

function App() {
  const [query, setQuery] = useState('')
  const [threshold, setThreshold] = useState(0.35)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(setHealth).catch(() => {})
  }, [])

  const examples = useMemo(() => [
    'battery management system for electric vehicles',
    'wireless communication network',
    'medical diagnosis using patient records',
    'artificial intelligence machine learning'
  ], [])

  async function search() {
    if (!query.trim()) return
    setLoading(true); setError(''); setSearched(true); setSelected(null)
    try {
      const r = await fetch(`${API}/search`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ query: query.trim(), threshold: Number(threshold), top_k: 20 })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Search request failed')
      setResults(data.results || [])
    } catch (e) {
      setResults([])
      setError(e.message || 'Could not connect to the search service.')
    } finally { setLoading(false) }
  }

  async function openPatent(pub) {
    setError('')
    try {
      const r = await fetch(`${API}/patent/${encodeURIComponent(pub)}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Patent could not be loaded')
      setSelected(data)
      window.scrollTo({top:0, behavior:'smooth'})
    } catch (e) { setError(e.message) }
  }

  if (selected) return <PatentDetail patent={selected} onBack={() => setSelected(null)} />

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><FileText size={20}/></div><div><strong>Patent Semantic Search</strong><span>MiniLM + FAISS</span></div></div><div className="status">{health?.status === 'ok' ? <><i/> Search service online</> : 'Connecting…'}</div></header>
    <main className="container">
      <section className="hero">
        <p className="eyebrow">SEMANTIC PATENT SEARCH</p>
        <h1>Find patents by <span>meaning</span>, not just keywords.</h1>
        <p className="sub">Search 10,000 patent records using the same MiniLM semantic-embedding and FAISS similarity workflow used in the analysis notebook.</p>
      </section>
      <section className="search-panel">
        <label>Search query</label>
        <div className="search-row"><div className="input-wrap"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="e.g. battery management system for electric vehicles"/></div><button onClick={search} disabled={loading || !query.trim()}>{loading?<Loader2 className="spin" size={18}/>:<Search size={18}/>} Search</button></div>
        <div className="controls"><div><SlidersHorizontal size={16}/><span>Minimum relevance</span><input className="range" type="range" min="0" max="1" step="0.01" value={threshold} onChange={e=>setThreshold(e.target.value)}/><input className="number" type="number" min="0" max="1" step="0.01" value={threshold} onChange={e=>setThreshold(e.target.value)}/></div><small>Top 20 maximum</small></div>
        <div className="examples"><span>Try:</span>{examples.map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>
      </section>
      {error && <div className="error"><AlertCircle size={18}/>{error}</div>}
      {searched && !loading && !error && <section className="results-section"><div className="results-head"><div><h2>Search results</h2><p>{results.length ? `${results.length} qualifying patent${results.length===1?'':'s'} at threshold ${Number(threshold).toFixed(2)}` : 'No result meets the selected relevance threshold.'}</p></div></div>{results.length ? <div className="results">{results.map(r=><button className="result-card" key={r.publication_number} onClick={()=>openPatent(r.publication_number)}><div className="rank">#{r.rank}</div><div className="result-main"><div className="pub">{r.publication_number}</div><h3>{r.title || 'Untitled patent'}</h3><div className="card-bottom"><span className={scoreClass(r.relevance_score)}>Relevance {Number(r.relevance_score).toFixed(4)}</span><span className="open">View patent <ChevronRight size={16}/></span></div></div></button>)}</div> : <div className="na"><strong>N/A</strong><span>No patents met the minimum relevance threshold.</span></div>}</section>}
    </main>
    <footer>Prototype semantic search • 10,000 patent records • MiniLM embeddings • FAISS exact vector search</footer>
  </div>
}

function PatentDetail({patent, onBack}) {
 return <div className="app-shell"><header className="topbar"><button className="back" onClick={onBack}><ArrowLeft size={18}/> Back to results</button><div className="brand"><div className="brand-mark"><FileText size={20}/></div><div><strong>Patent Semantic Search</strong><span>Patent details</span></div></div></header><main className="container detail"><div className="detail-hero"><p className="eyebrow">PATENT RECORD</p><div className="pub-large">{patent.publication_number}</div><h1>{patent.title || 'Untitled patent'}</h1></div><article><section><h2>Abstract</h2><div className="prose">{patent.abstract || 'N/A'}</div></section><section><h2>Claims</h2><div className="prose claims">{patent.claims || 'N/A'}</div></section></article></main><footer>Patent details retrieved from the search index metadata.</footer></div>
}

createRoot(document.getElementById('root')).render(<App />)
