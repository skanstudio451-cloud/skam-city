import { db } from '@/lib/db'
import { E } from '@/lib/perm'

// سكربت روبلوكس يأكد إن اللاعب يملك القيم باس، فيوصل الطلب للمالك
export async function POST(req) {
  if (!process.env.ROBLOX_SECRET || req.headers.get('x-secret') !== process.env.ROBLOX_SECRET) return E('forbidden', 403)
  const { orderId } = await req.json()
  const { data: o } = await db.from('items').select('id,data').eq('id', orderId).eq('kind', 'orders').single()
  if (!o || o.data.status !== 'awaiting_purchase') return E('not found', 404)
  await db.from('items').update({ data: { ...o.data, status: 'pending', purchasedAt: Date.now() } }).eq('id', orderId)
  return Response.json({ ok: 1 })
}
