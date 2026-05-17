import { createServer as createHttpServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'

import { createComment, deleteComment, listComments, updateComment } from './routes/comments'
import { createTask, deleteTask, getTask, listTasks, updateTask } from './routes/tasks'
import type { TrackerDatabase } from './schema'
import type { CommentError, Result, TaskError, TrackerResult } from './types'

interface ServerOptions {
  db: TrackerDatabase
}

interface ProjectMetaRow {
  name: string
  tagline: string | null
  phase_count: number | null
  stream_count: number | null
}

type JsonObject = Record<string, unknown>
type JsonBody = JsonObject | undefined
type RouteResult = { status: number; body: TrackerResult<unknown, ErrorEnvelope> }

interface ErrorEnvelope {
  code: string
  message: string
}

const ERROR_STATUS: Record<string, number> = {
  duplicate_id: 409,
  invalid_json: 400,
  invalid_parent: 400,
  invalid_severity: 400,
  invalid_state: 400,
  comment_not_found: 404,
  not_found: 404,
  project_not_found: 404,
  task_not_found: 404,
}

function sendJson(response: ServerResponse, status: number, body: TrackerResult<unknown, ErrorEnvelope>): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJson(request: IncomingMessage): Promise<JsonBody> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  if (chunks.length === 0) {
    return undefined
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim()
  return rawBody.length === 0 ? undefined : (JSON.parse(rawBody) as JsonObject)
}

function errorResult(code: string, message: string): RouteResult {
  return {
    status: ERROR_STATUS[code] ?? 500,
    body: { error: { code, message } },
  }
}

function dataResult(status: number, data: unknown): RouteResult {
  return { status, body: { data } }
}

function taskResult<TData>(status: number, result: Result<TData, TaskError>): RouteResult {
  return result.ok ? dataResult(status, result.data) : errorResult(result.error.code, result.error.message)
}

function commentResult<TData>(status: number, result: TrackerResult<TData, CommentError>): RouteResult {
  return 'data' in result ? dataResult(status, result.data) : errorResult(result.error.code, result.error.message)
}

function notFound(): RouteResult {
  return errorResult('not_found', 'Route not found.')
}

function methodNotFound(): RouteResult {
  return notFound()
}

function getProject(db: TrackerDatabase): RouteResult {
  const row = db.prepare('SELECT name, tagline, phase_count, stream_count FROM project_meta WHERE id = 1').get() as
    | ProjectMetaRow
    | undefined

  if (!row) {
    return errorResult('project_not_found', 'Project metadata was not found.')
  }

  return dataResult(200, {
    name: row.name,
    tagline: row.tagline,
    phaseCount: row.phase_count,
    streamCount: row.stream_count,
  })
}

function parsePath(request: IncomingMessage): { pathname: string; parts: string[]; searchParams: URLSearchParams } {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  const parts = url.pathname
    .split('/')
    .filter(Boolean)
    .map((part) => decodeURIComponent(part))

  return {
    pathname: url.pathname,
    parts,
    searchParams: url.searchParams,
  }
}

function ensureTaskExists(db: TrackerDatabase, taskId: string): TaskError | undefined {
  const result = getTask(db, { id: taskId })
  return result.ok ? undefined : result.error
}

function route(db: TrackerDatabase, request: IncomingMessage, body: JsonBody): RouteResult {
  const { pathname, parts, searchParams } = parsePath(request)
  const method = request.method ?? 'GET'

  if (method === 'GET' && pathname === '/project') {
    return getProject(db)
  }

  if (parts.length === 1 && parts[0] === 'tasks') {
    if (method === 'POST') {
      return taskResult(201, createTask(db, body as unknown as Parameters<typeof createTask>[1]))
    }

    if (method === 'GET') {
      return taskResult(
        200,
        listTasks(db, {
          phase: searchParams.get('phase') ?? undefined,
          stream: searchParams.get('stream') ?? undefined,
        }),
      )
    }

    return methodNotFound()
  }

  if (parts.length === 2 && parts[0] === 'tasks') {
    const taskId = parts[1]

    if (method === 'GET') {
      return taskResult(200, getTask(db, { id: taskId }))
    }

    if (method === 'PATCH') {
      return taskResult(200, updateTask(db, { ...(body as JsonObject), id: taskId }))
    }

    if (method === 'DELETE') {
      return taskResult(200, deleteTask(db, { id: taskId }))
    }

    return methodNotFound()
  }

  if (parts.length === 3 && parts[0] === 'tasks' && parts[2] === 'comments') {
    const taskId = parts[1]

    if (method === 'POST') {
      return commentResult(201, createComment(db, taskId, body as unknown as Parameters<typeof createComment>[2]))
    }

    if (method === 'GET') {
      const missingTask = ensureTaskExists(db, taskId)
      return missingTask ? errorResult(missingTask.code, missingTask.message) : commentResult(200, listComments(db, taskId))
    }

    return methodNotFound()
  }

  if (parts.length === 4 && parts[0] === 'tasks' && parts[2] === 'comments') {
    const taskId = parts[1]
    const commentId = parts[3]

    if (method === 'PATCH') {
      return commentResult(200, updateComment(db, taskId, commentId, body as Parameters<typeof updateComment>[3]))
    }

    if (method === 'DELETE') {
      return commentResult(200, deleteComment(db, taskId, commentId))
    }
  }

  return notFound()
}

export function createServer(options: ServerOptions): Server {
  return createHttpServer(async (request, response) => {
    try {
      const body = request.method === 'GET' || request.method === 'DELETE' ? undefined : await readJson(request)
      const result = route(options.db, request, body)
      sendJson(response, result.status, result.body)
    } catch (error) {
      if (error instanceof SyntaxError) {
        const result = errorResult('invalid_json', 'Request body must be valid JSON.')
        sendJson(response, result.status, result.body)
        return
      }

      const result = errorResult('internal_error', error instanceof Error ? error.message : 'Internal server error.')
      sendJson(response, result.status, result.body)
    }
  })
}
