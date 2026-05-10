import { CheckCircle2, HelpCircle, ShieldCheck, Target } from 'lucide-react'
import type { BriefRecord } from '../../services/api'

interface BriefDocumentProps {
  brief: BriefRecord
}

function confidenceLabel(score: number) {
  if (score >= 0.82) return 'High confidence'
  if (score >= 0.62) return 'Medium confidence'
  return 'Needs review'
}

export default function BriefDocument({ brief }: BriefDocumentProps) {
  return (
    <article className="space-y-8">
      <section className="border-b border-zinc-200 pb-7">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
            {confidenceLabel(brief.confidence_score)} - {Math.round(brief.confidence_score * 100)}%
          </span>
          {brief.tone_profile && (
            <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize text-zinc-700">
              {brief.tone_profile.replace(/_/g, ' ')}
            </span>
          )}
          {brief.is_confirmed && (
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
              Approved
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">Project Brief</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700">{brief.summary}</p>
      </section>

      {brief.goals.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <Target className="h-4 w-4" />
            Goals
          </h2>
          <div className="grid gap-3">
            {brief.goals.map((goal, index) => (
              <div key={`${goal.title}-${index}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-sm font-semibold text-zinc-950">{goal.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{goal.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.success_criteria.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <ShieldCheck className="h-4 w-4" />
            Success criteria
          </h2>
          <div className="space-y-2">
            {brief.success_criteria.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.ambiguities.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <HelpCircle className="h-4 w-4" />
            Open questions
          </h2>
          <div className="space-y-2">
            {brief.ambiguities.map((item, index) => (
              <div key={`${item.field_missing}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-zinc-950">{item.field_missing}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-700">{item.reason}</p>
                <p className="mt-2 text-sm font-semibold text-amber-900">{item.suggested_question}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {brief.followup_questions.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Follow-up questions
          </h2>
          <ol className="space-y-2">
            {brief.followup_questions.map((question, index) => (
              <li key={`${question}-${index}`} className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700">
                  {index + 1}
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}
