import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { E } from '@/lib/perm'

export async function POST(req) {
  const s = await getServerSession(authOptions)
  if (!['owner', 'admin'].includes(s?.user?.role)) return E('forbidden', 403)
  const f = (await req.formData()).get('file')
  if (!f) return E('no file', 400)
  const name = Date.now() + '-' + f.name.replace(/[^\w.]/g, '_')
  const { error } = await db.storage.from('media').upload(name, await f.arrayBuffer(), { contentType: f.type })
  if (error) return E(error.message, 500)
  return Response.json({ url: db.storage.from('media').getPublicUrl(name).data.publicUrl })
}
