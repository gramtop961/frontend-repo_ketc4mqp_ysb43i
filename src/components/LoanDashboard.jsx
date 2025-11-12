import { useEffect, useMemo, useState } from 'react'

const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function LoanDashboard() {
  const [borrowers, setBorrowers] = useState([])
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [bRes, lRes] = await Promise.all([
        fetch(`${baseUrl}/borrowers`),
        fetch(`${baseUrl}/loans`),
      ])
      const [bJson, lJson] = await Promise.all([bRes.json(), lRes.json()])
      setBorrowers(bJson)
      setLoans(lJson)
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const borrowerMap = useMemo(() => Object.fromEntries(borrowers.map(b => [b._id, b])), [borrowers])

  const train = async () => {
    setLoading(true)
    setMessage('')
    try {
      const r = await fetch(`${baseUrl}/train`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.detail || 'Training failed')
      setMessage(`Model trained on ${j.samples_used} samples${j.auc ? `, AUC=${j.auc.toFixed(3)}` : ''}`)
    } catch (e) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const predict = async (loanId) => {
    try {
      const r = await fetch(`${baseUrl}/predict/${loanId}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.detail || 'Prediction failed')
      return j
    } catch (e) {
      setMessage(`Error: ${e.message}`)
      return null
    }
  }

  const strategy = async (loanId) => {
    try {
      const r = await fetch(`${baseUrl}/strategy/${loanId}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.detail || 'Strategy failed')
      return j
    } catch (e) {
      setMessage(`Error: ${e.message}`)
      return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Smart Loan Recovery</h2>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Refresh</button>
          <button onClick={train} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Train Model</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">{message}</div>}

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {loans.length === 0 ? (
            <div className="p-6 bg-white rounded shadow">No loans yet. Add data via API or database viewer.</div>
          ) : (
            loans.map(ln => (
              <LoanCard key={ln._id} loan={ln} borrower={borrowerMap[ln.borrower_id]} onPredict={predict} onStrategy={strategy} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function LoanCard({ loan, borrower, onPredict, onStrategy }) {
  const [pred, setPred] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const p = await onPredict(loan._id)
      setPred(p)
      const s = await onStrategy(loan._id)
      setPlan(s)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 bg-white rounded shadow border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold">{borrower?.full_name || 'Unknown Borrower'}</div>
          <div className="text-sm text-gray-600">Credit {borrower?.credit_score ?? '-'} · Income ${borrower?.income?.toLocaleString?.() ?? '-'}</div>
        </div>
        <button onClick={run} className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700">Analyze</button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Info label="Amount" value={`$${(loan.loan_amount ?? 0).toLocaleString()}`} />
        <Info label="Term" value={`${loan.term_months} mo`} />
        <Info label="Rate" value={`${loan.interest_rate}%`} />
        <Info label="Late Payments" value={`${loan.num_late_payments}`} />
        <Info label="Past Due Days" value={`${loan.past_due_days}`} />
        <Info label="Status" value={loan.status} />
      </div>

      {loading && <div className="mt-3 text-gray-600">Analyzing...</div>}

      {pred && (
        <div className="mt-4 p-3 rounded bg-blue-50 border border-blue-200">
          <div className="font-semibold">Default Probability: {(pred.probability_default * 100).toFixed(1)}%</div>
          <div className="text-sm text-blue-800">Prediction: {pred.label}</div>
        </div>
      )}

      {plan && (
        <div className="mt-3 p-3 rounded bg-emerald-50 border border-emerald-200">
          <div className="font-semibold capitalize">Recommended: {plan.recommended_strategy.replaceAll('-', ' ')}</div>
          <div className="text-sm text-emerald-800">Risk: {plan.risk_level}</div>
          <ul className="list-disc ml-5 mt-2 text-sm">
            {plan.actions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }){
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
