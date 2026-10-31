import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

export async function POST(req) {
  const s = await getServerSession(authOptions); if (!s) return E('login', 401)
  const { productId, roblox } = await req.json()
  const { data: p } = await db.from('items').select('data').eq('id', productId).eq('kind', 'products').single()
  if (!p) return E('المنتج غير موجود', 404)
  await db.from('items').insert({ kind: 'orders', data: {
    uid: s.user.id, discord: s.user.name, roblox: String(roblox).slice(0, 50),
    product: p.data.name, passId: p.data.passId, status: 'pending' } })
  return Response.json({ url: 'https://www.roblox.com/game-pass/' + encodeURIComponent(p.data.passId) })
}
