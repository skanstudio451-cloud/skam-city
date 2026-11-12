import { db } from '@/lib/db'
import { E } from '@/lib/perm'

// سكربت روبلوكس يسأل: وش الطلبات اللي تنتظر الشراء؟
export async function GET(req) {
  if (!process.env.ROBLOX_SECRET || req.headers.get('x-secret') !== process.env.ROBLOX_SECRET) return E('forbidden', 403)
  const { data } = await db.from('items').select('id,data,created_at')
    .eq('kind', 'orders').eq('data->>status', 'awaiting_purchase').eq('data->>pay', 'gamepass')
  const fresh = (data || []).filter((o) => Date.now() - new Date(o.created_at) < 864e5)
  return Response.json(fresh.map((o) => ({ id: o.id, roblox: o.data.roblox, passId: o.data.passId })))
}
