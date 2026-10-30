import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

export async function GET() {
  if (!(await getServerSession(authOptions))) return E('login', 401)
  const { data } = await db.from('settings').select('data').eq('id', 1).single()
  return Response.json(data?.data || {})
}
export async function PUT(req) {
  const s = await getServerSession(authOptions)
  if (!['owner', 'admin'].includes(s?.user?.role)) return E('forbidden', 403)
  await db.from('settings').update({ data: await req.json() }).eq('id', 1)
  return Response.json({ ok: 1 })
}
