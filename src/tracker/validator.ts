import { TASK_STATES, type TaskState, type WorkflowValidationResult, type WorkflowVerb } from './types'

const CANONICAL_TRANSITIONS: Record<WorkflowVerb, { from: TaskState; to: TaskState }> = {
  start: { from: 'TO-DO', to: 'IN-PROGRESS' },
  submit: { from: 'IN-PROGRESS', to: 'IN-REVIEW' },
  resume: { from: 'REWORK', to: 'IN-PROGRESS' },
  approve: { from: 'IN-REVIEW', to: 'DONE' },
  reject: { from: 'IN-REVIEW', to: 'REWORK' },
}

const VALID_VERBS = new Set<string>(Object.keys(CANONICAL_TRANSITIONS))
const VALID_STATES = new Set<string>(TASK_STATES)

export function validateTransition(
  verb: string,
  sourceState: string,
): WorkflowValidationResult {
  if (!VALID_VERBS.has(verb)) {
    return {
      ok: false,
      code: 'unknown_verb',
      message: `Unknown workflow verb '${verb}'. Expected one of: start, submit, resume, approve, reject.`,
    }
  }

  if (!VALID_STATES.has(sourceState)) {
    return {
      ok: false,
      code: 'unknown_state',
      message: `Unknown task state '${sourceState}'. Expected one of: ${TASK_STATES.join(', ')}.`,
    }
  }

  const canonical = CANONICAL_TRANSITIONS[verb as WorkflowVerb]

  if (sourceState === canonical.to) {
    return {
      ok: true,
      kind: 'noop',
      verb: verb as WorkflowVerb,
      state: sourceState as TaskState,
    }
  }

  if (sourceState === canonical.from) {
    return {
      ok: true,
      kind: 'transition',
      verb: verb as WorkflowVerb,
      from: sourceState as TaskState,
      to: canonical.to,
    }
  }

  return {
    ok: false,
    code: 'illegal_transition',
    message: `Cannot ${verb} from '${sourceState}'. Expected source state: '${canonical.from}'.`,
  }
}
