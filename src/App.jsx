import LoanDashboard from './components/LoanDashboard'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <header className="border-b bg-white/70 backdrop-blur sticky top-0">
        <div className="max-w-5xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Smart Loan Recovery</h1>
          <a href="/test" className="text-sm text-blue-600 hover:underline">System Check</a>
        </div>
      </header>
      <main className="py-8">
        <LoanDashboard />
      </main>
    </div>
  )
}

export default App
