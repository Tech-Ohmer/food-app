'use client'

import { useState, useTransition } from 'react'
import { updateRemittanceRules } from '@/app/actions/remittance'
import type { RemittanceRule } from '@/types'
import { REMITTANCE_RULE_LABELS } from '@/types'

export default function RemittanceRulesForm({
  restaurantId,
  currentRule,
  currentDays,
}: {
  restaurantId: string
  currentRule: RemittanceRule
  currentDays: number
}) {
  const [rule, setRule] = useState<RemittanceRule>(currentRule)
  const [days, setDays] = useState(currentDays)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const result = await updateRemittanceRules(restaurantId, rule, days)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remittance Rule</label>
          <select
            value={rule}
            onChange={e => setRule(e.target.value as RemittanceRule)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {(Object.keys(REMITTANCE_RULE_LABELS) as RemittanceRule[]).map(r => (
              <option key={r} value={r}>{REMITTANCE_RULE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {rule === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Days</label>
            <input
              type="number"
              min={1}
              max={30}
              value={days}
              onChange={e => setDays(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">Rider must remit within {days} day{days !== 1 ? 's' : ''} of delivery</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Rules saved!</span>}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
        <p className="font-medium mb-1">⚠️ Overdue alerts</p>
        <p>If a rider hasn't remitted after <strong>3 days past the due date</strong>, both you and the admin will receive an automatic email alert.</p>
      </div>
    </div>
  )
}
