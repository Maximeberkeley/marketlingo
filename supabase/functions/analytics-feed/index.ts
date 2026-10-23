// analytics-feed — secure, read-only analytics API for Power BI.
// Auth: x-analytics-key header must match ANALYTICS_API_KEY secret.
// All user IDs are pseudonymized as sha256(user_id + key)[:16] — stable across
// datasets, so Power BI can join tables, without exposing raw UUIDs or emails.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Dataset whitelist: name -> table, exact columns returned, and the timestamp
// column used for `since` incremental filtering and ordering.
const DATASETS: Record<string, { table: string; columns: string; ts: string }> = {
  users: {
    table: 'profiles',
    columns: 'id,created_at,updated_at,selected_market,familiarity_level,timezone,demo_onboarding_status,is_pro_user,pro_plan_type,ai_consent_at,voice_consent_at',
    ts: 'created_at',
  },
  events: {
    table: 'analytics_events',
    columns: 'id,user_id,event,properties,occurred_at',
    ts: 'occurred_at',
  },
  progress: {
    table: 'user_progress',
    columns: 'id,user_id,market_id,current_day,current_streak,longest_streak,start_date,last_activity_at,familiarity_level,learning_goal,created_at,updated_at',
    ts: 'updated_at',
  },
  daily_completions: {
    table: 'daily_completions',
    columns: 'id,user_id,market_id,completion_date,lesson_completed,completed_stack_id,games_completed,drills_completed,xp_earned,demo_completed,created_at,updated_at',
    ts: 'completion_date',
  },
  xp: {
    table: 'user_xp',
    columns: 'id,user_id,market_id,total_xp,current_level,xp_to_next_level,startup_stage,created_at,updated_at',
    ts: 'updated_at',
  },
  xp_transactions: {
    table: 'xp_transactions',
    columns: 'id,user_id,market_id,xp_amount,source_type,source_id,description,created_at',
    ts: 'created_at',
  },
  streak_freezes: {
    table: 'streak_freezes',
    columns: 'id,user_id,market_id,used_at,week_of,kind,created_at',
    ts: 'created_at',
  },
  interview_attempts: {
    // user_response and feedback excluded: free-text learner writing.
    table: 'interview_lab_attempts',
    columns: 'id,user_id,market_id,path,stage,attempt_type,score,structure_score,content_score,persona_score,persona,scenario_question,time_spent_seconds,created_at',
    ts: 'created_at',
  },
  deliverable_entries: {
    // content excluded: learner's own writing.
    table: 'deliverable_entries',
    columns: 'id,user_id,market_id,goal_key,section_key,day_number,source,created_at,updated_at',
    ts: 'created_at',
  },
  notes: {
    // content excluded: learner's own writing.
    table: 'notes',
    columns: 'id,user_id,slide_id,stack_id,market_id,linked_label,created_at,updated_at',
    ts: 'created_at',
  },
  trainer_attempts: {
    table: 'trainer_attempts',
    columns: 'id,user_id,scenario_id,selected_option,is_correct,time_spent_seconds,created_at',
    ts: 'created_at',
  },
  decision_attempts: {
    table: 'decision_attempts',
    columns: 'id,user_id,scenario_id,market_id,concept_key,selected_option,confidence,is_correct,misconception_tag,evidence_delta,time_spent_seconds,created_at',
    ts: 'created_at',
  },
  drills_progress: {
    table: 'drills_progress',
    columns: 'id,user_id,drill_type,market_id,completed_count,correct_count,average_time_seconds,last_completed_at,created_at,updated_at',
    ts: 'updated_at',
  },
  games_progress: {
    table: 'games_progress',
    columns: 'id,user_id,game_type,market_id,score,level,completed_at,created_at,updated_at',
    ts: 'updated_at',
  },
  league_memberships: {
    table: 'league_memberships',
    columns: 'id,user_id,market_id,week_of,tier,weekly_xp,final_rank,result,created_at,updated_at',
    ts: 'created_at',
  },
  achievements: {
    table: 'user_achievements',
    columns: 'id,user_id,achievement_id,unlocked_at',
    ts: 'unlocked_at',
  },
  markets: {
    table: 'markets',
    columns: 'id,name,icon,description,created_at',
    ts: 'created_at',
  },
  stacks: {
    table: 'stacks',
    columns: 'id,market_id,title,stack_type,duration_minutes,tags,published_at,created_at',
    ts: 'created_at',
  },
}

const MAX_LIMIT = 5000

async function pseudoId(userId: string, key: string): Promise<string> {
  const data = new TextEncoder().encode(userId + ':' + key)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const apiKey = Deno.env.get('ANALYTICS_API_KEY')
  if (!apiKey) return json({ error: 'Analytics API not configured' }, 503)
  if (req.headers.get('x-analytics-key') !== apiKey) return json({ error: 'Unauthorized' }, 401)

  const url = new URL(req.url)
  const dataset = url.searchParams.get('table') ?? ''
  const cfg = DATASETS[dataset]
  if (!cfg) {
    return json({ error: `Unknown table '${dataset}'. Available: ${Object.keys(DATASETS).join(', ')}` }, 400)
  }

  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '1000', 10) || 1000, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
  const since = url.searchParams.get('since')

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  let query = supabase
    .from(cfg.table)
    .select(cfg.columns)
    .order(cfg.ts, { ascending: true })
    .range(offset, offset + limit - 1)

  if (since) {
    if (isNaN(Date.parse(since))) return json({ error: 'Invalid since timestamp' }, 400)
    query = query.gt(cfg.ts, since)
  }

  const { data, error } = await query
  if (error) return json({ error: error.message }, 500)

  const rows = data ?? []
  // Pseudonymize user IDs (stable hash, joinable across datasets).
  const out = []
  for (const row of rows as Record<string, unknown>[]) {
    const r = { ...row }
    const uid = (r.user_id ?? r.id) as string | undefined
    if (dataset === 'users') {
      r.pseudo_user_id = await pseudoId(r.id as string, apiKey)
      delete r.id
    } else if (uid && 'user_id' in r) {
      r.pseudo_user_id = await pseudoId(uid, apiKey)
      delete r.user_id
    }
    out.push(r)
  }

  return json({
    table: dataset,
    count: out.length,
    offset,
    limit,
    next_offset: out.length === limit ? offset + limit : null,
    rows: out,
  })
})
