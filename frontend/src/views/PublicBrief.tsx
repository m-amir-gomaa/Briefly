import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Target,
  AlertTriangle,
  HelpCircle,
  Shield,
  Sparkles,
  User,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'

interface PublicBriefProps {
  token: string
}

interface BriefData {
  id: string
  summary: string
  goals: { title: string; detail: string }[]
  success_criteria: string[]
  ambiguities: { field_missing: string; reason: string; suggested_question: string }[]
  followup_questions: string[]
  evidence_map: Record<string, string>
  confidence_score: number
  tone_profile: string
  is_confirmed: boolean
  confirmed_at: string | null
  client_name: string | null
}

export default function PublicBriefView({ token }: PublicBriefProps) {
  const [brief, setBrief] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchBrief()
  }, [token])

  const fetchBrief = async () => {
    try {
      const res = await fetch(`/api/v1/public/brief/${token}`)
      if (!res.ok) throw new Error('Brief not found')
      const data = await res.json()
      setBrief(data)
      setConfirmed(data.is_confirmed)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!clientName.trim()) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/v1/public/brief/${token}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: clientName }),
      })
      if (res.ok) {
        setConfirmed(true)
      }
    } catch (e) {
      console.error('Confirm failed:', e)
    } finally {
      setConfirming(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-success-400'
    if (score >= 0.6) return 'text-warning-400'
    return 'text-danger-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="glass rounded-3xl p-10 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-warning-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-surface-100 mb-2">Brief Not Found</h1>
          <p className="text-surface-400">This brief link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  const goals = typeof brief.goals === 'string' ? JSON.parse(brief.goals) : (brief.goals || [])
  const criteria = typeof brief.success_criteria === 'string' ? JSON.parse(brief.success_criteria) : (brief.success_criteria || [])
  const ambiguities = typeof brief.ambiguities === 'string' ? JSON.parse(brief.ambiguities) : (brief.ambiguities || [])
  const questions = typeof brief.followup_questions === 'string' ? JSON.parse(brief.followup_questions) : (brief.followup_questions || [])

  return (
    <div className="min-h-screen py-12 px-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Briefly</h1>
                <p className="text-xs text-surface-400">AI-Generated Project Brief</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800 text-surface-400 text-xs hover:text-surface-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Summary */}
          <p className="text-lg text-surface-200 leading-relaxed">{brief.summary}</p>

          {/* Meta row */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-surface-800/50">
            <div>
              <span className="text-xs text-surface-500">Confidence</span>
              <p className={`text-2xl font-bold ${confidenceColor(brief.confidence_score)}`}>
                {Math.round(brief.confidence_score * 100)}%
              </p>
            </div>
            <div>
              <span className="text-xs text-surface-500">Tone</span>
              <p className="text-sm font-medium text-surface-200 capitalize">
                {brief.tone_profile?.replace(/_/g, ' ')}
              </p>
            </div>
            {confirmed && (
              <div className="ml-auto flex items-center gap-2 text-success-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Approved</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Goals */}
        {goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-surface-100">Project Goals</h2>
            </div>
            <div className="space-y-4">
              {goals.map((goal: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-surface-900/30 border border-surface-800/50">
                  <h3 className="font-semibold text-surface-100 mb-1">{goal.title}</h3>
                  <p className="text-sm text-surface-400 leading-relaxed">{goal.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Success Criteria */}
        {criteria.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-success-400" />
              <h2 className="text-lg font-semibold text-surface-100">Success Criteria</h2>
            </div>
            <ul className="space-y-2">
              {criteria.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-surface-300">
                  <CheckCircle2 className="w-4 h-4 text-success-400 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Ambiguities */}
        {ambiguities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-8 border-warning-400/10"
          >
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              <h2 className="text-lg font-semibold text-surface-100">Ambiguities & Gaps</h2>
            </div>
            <div className="space-y-4">
              {ambiguities.map((a: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-warning-400/5 border border-warning-400/10">
                  <p className="font-medium text-surface-200 text-sm">{a.field_missing}</p>
                  <p className="text-xs text-surface-400 mt-1">{a.reason}</p>
                  <p className="text-xs text-warning-400 mt-2 italic">💡 {a.suggested_question}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Follow-up Questions */}
        {questions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="w-5 h-5 text-accent-400" />
              <h2 className="text-lg font-semibold text-surface-100">Follow-up Questions</h2>
            </div>
            <ul className="space-y-3">
              {questions.map((q: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-surface-300">
                  <span className="w-6 h-6 rounded-full bg-accent-400/10 text-accent-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {q}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Approve & Sign Off */}
        {!confirmed ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-3xl p-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-surface-100">Approve & Sign Off</h2>
            </div>
            <p className="text-sm text-surface-400 mb-4">
              Review the brief above and confirm it accurately reflects your project requirements.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Your name"
                className="flex-1 bg-surface-900/50 border border-surface-700/50 rounded-xl px-4 py-3 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500/50 text-sm"
                id="client-name-input"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={!clientName.trim() || confirming}
                className={`px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  clientName.trim()
                    ? 'gradient-brand text-white shadow-lg shadow-brand-500/20'
                    : 'bg-surface-800 text-surface-500 cursor-not-allowed'
                }`}
                id="approve-btn"
              >
                {confirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Approve
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 bg-success-400/5 border border-success-400/20 text-center"
          >
            <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-surface-100">Brief Approved</h2>
            <p className="text-sm text-surface-400 mt-1">
              {brief.client_name ? `Signed off by ${brief.client_name}` : 'This brief has been approved.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
