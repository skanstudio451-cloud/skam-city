import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

const DAY = 864e5

// طلبات العميل نفسه. القرارات (قبول/رفض) تختفي بعد 24 ساعة
export async function GET() {
  const s = await getServerSession(authOptions); if (!s) return E('login', 401)
  const { data } = await db.from('items').select('id,data,created_at')
    .eq('kind', 'orders').eq('data->>uid', s.user.id).order('created_at', { ascending: false }).limit(30)
  const now = Date.now()
  const out = (data || []).filter((o) => {
    if (o.data.decidedAt) return now - o.data.decidedAt < DAY
    if (o.data.status === 'awaiting_purchase') return now - new Date(o.created_at) < DAY
    return true
  }).map((o) => ({ id: o.id, product: o.data.product, pay: o.data.pay, status: o.data.status }))
  return Response.json(out)
}
