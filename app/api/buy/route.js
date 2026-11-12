import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

const DAY = 864e5

export async function POST(req) {
  const s = await getServerSession(authOptions); if (!s) return E('login', 401)
  const { productId, roblox } = await req.json()
  const { data: p } = await db.from('items').select('data').eq('id', productId).eq('kind', 'products').single()
  if (!p) return E('المنتج غير موجود', 404)
  const d = p.data
  if (typeof d.qty === 'number' && d.qty <= 0) return E('نفدت كمية هذا المنتج', 409)

  // هل عنده طلب مفتوح لنفس المنتج؟
  const { data: mine } = await db.from('items').select('id,data,created_at')
    .eq('kind', 'orders').eq('data->>uid', s.user.id).eq('data->>productId', productId)
  const open = (mine || []).find((o) => o.data.status === 'pending'
    || (o.data.status === 'awaiting_purchase' && Date.now() - new Date(o.created_at) < DAY))
  const base = { uid: s.user.id, discord: s.user.name, product: d.name, productId }

  // تحويل: يوصل الطلب للمالك مباشرة
  if (d.pay === 'transfer') {
    if (open) return E('عندك طلب لهذا المنتج بانتظار القبول', 409)
    await db.from('items').insert({ kind: 'orders', data: { ...base, pay: 'transfer', status: 'pending' } })
    return Response.json({ ok: 1 })
  }

  // قيم باس: الطلب ينتظر الشراء، وسكربت روبلوكس يأكد الشراء
  const rb = String(roblox || '').trim().slice(0, 50)
  if (!rb) return E('اكتب يوزرك في روبلوكس', 400)
  if (!d.passId) return E('هذا المنتج ما له قيم باس', 400)
  const url = 'https://www.roblox.com/game-pass/' + encodeURIComponent(d.passId)
  if (!open) await db.from('items').insert({ kind: 'orders', data: { ...base, pay: 'gamepass', roblox: rb, passId: String(d.passId), status: 'awaiting_purchase' } })
  return Response.json({ url })
}
