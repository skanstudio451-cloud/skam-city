import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

const mine = (id) => db.from('items').select('data').eq('kind', 'applications').eq('data->>uid', id).order('created_at', { ascending: false })

export async function GET() {
  const s = await getServerSession(authOptions); if (!s) return E('login', 401)
  const { data } = await mine(s.user.id).limit(1)
  const d = data?.[0]?.data
  return Response.json({ status: d?.status || 'none', reason: d?.reason })
}

export async function POST(req) {
  const s = await getServerSession(authOptions); if (!s) return E('login', 401)
  const b = await req.json()
  const { data: all } = await mine(s.user.id)
  if (all.some((x) => x.data.status === 'accepted')) return E('أنت مقبول مسبقاً ولا يمكنك التقديم مرة أخرى', 403)
  if (all.some((x) => x.data.status === 'pending')) return E('عندك تقديم قيد المراجعة', 409)
  const T = (v) => String(v ?? '').trim().slice(0, 2000)
  const L = (v) => T(v).length
  const keys = ['character', 'nickname', 'age', 'country', 'story', 'discord', 'roblox']
  if (!keys.every((k) => L(b[k]))) return E('عبّ كل الحقول', 400)
  const answers = (b.answers || []).slice(0, 10).map((x) => ({ q: T(x.q), a: T(x.a) }))
  // نسبة القبول تقديرية من طول وجودة القصة والإجابات (من 100)
  const age = Number(b.age)
  const score = Math.round(Math.min(100, 15 + Math.min(30, L(b.story) / 15)
    + answers.reduce((t, x) => t + Math.min(10, x.a.length / 12), 0) + (age >= 14 && age <= 60 ? 5 : 0)))
  const d = Object.fromEntries(keys.map((k) => [k, T(b[k])]))
  await db.from('items').insert({ kind: 'applications', data: { ...d, answers, score, uid: s.user.id, status: 'pending' } })
  return Response.json({ ok: 1 })
}
