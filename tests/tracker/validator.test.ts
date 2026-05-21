import { describe, expect, it } from 'vitest'

import { validateTransition } from '../../src/tracker/validator'
import { TASK_STATES } from '../../src/tracker/types'

const CANONICAL_PAIRS = [
  { verb: 'start' as const, from: 'TO-DO', to: 'IN-PROGRESS' },
  { verb: 'submit' as const, from: 'IN-PROGRESS', to: 'IN-REVIEW' },
  { verb: 'approve' as const, from: 'IN-REVIEW', to: 'DONE' },
  { verb: 'reject' as const, from: 'IN-REVIEW', to: 'REWORK' },
  { verb: 'resume' as const, from: 'REWORK', to: 'IN-PROGRESS' },
] as const

describe('Gate R9-1.0.1 — workflow state-transition validator', () => {
  it('T-R9-1.0.1.1: accepts each canonical transition', () => {
    for (const { verb, from, to } of CANONICAL_PAIRS) {
      const result = validateTransition(verb, from)
      expect(result).toEqual({
        ok: true,
        kind: 'transition',
        verb,
        from,
        to,
      })
    }
  })

  it('T-R9-1.0.1.2: detects idempotent no-op when source equals destination', () => {
    for (const { verb, to } of CANONICAL_PAIRS) {
      const result = validateTransition(verb, to)
      expect(result).toEqual({
        ok: true,
        kind: 'noop',
        verb,
        state: to,
      })
    }
  })

  it('T-R9-1.0.1.3: rejects every illegal source→verb combination via full matrix sweep', () => {
    const verbs = ['start', 'submit', 'resume', 'approve', 'reject'] as const

    for (const verb of verbs) {
      for (const state of TASK_STATES) {
        const canonical = CANONICAL_PAIRS.find((p) => p.verb === verb)
        if (!canonical) continue

        const isValid = state === canonical.from || state === canonical.to
        if (isValid) continue

        const result = validateTransition(verb, state)
        expect(result).toEqual({
          ok: false,
          code: 'illegal_transition',
          message: `Cannot ${verb} from '${state}'. Expected source state: '${canonical.from}'.`,
        })
      }
    }
  })

  it('T-R9-1.0.1.4: rejects unknown verb strings and unknown source-state symbols', () => {
    const unknownVerb = validateTransition('merge' as never, 'TO-DO')
    expect(unknownVerb).toEqual({
      ok: false,
      code: 'unknown_verb',
      message: "Unknown workflow verb 'merge'. Expected one of: start, submit, resume, approve, reject.",
    })

    const unknownState = validateTransition('start', 'BLOCKED' as never)
    expect(unknownState).toEqual({
      ok: false,
      code: 'unknown_state',
      message: "Unknown task state 'BLOCKED'. Expected one of: TO-DO, IN-PROGRESS, IN-REVIEW, REWORK, DONE.",
    })
  })
})
