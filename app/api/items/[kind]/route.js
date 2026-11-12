import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, E } from '@/lib/perm'

async function guard(kind, act) {
  const s = await getServerSession(authOptions)
  if (!s) return { r: E('سجّل دخولك أولاً', 401) }
  if (!can(s.user.role, kind, act)) return { r: E('ما عندك صلاحية', 403) }
  return { s }
}

// يجلب اسم وصورة حساب دسكورد من آيدي الشخص
async function enrich(kind, d) {
  if (!['staff', 'roles'].includes(kind) || !d.discord_id) return d
  d.discord_id = String(d.discord_id).trim()
  const r = await fetch('https://discord.com/api/v10/users/' + d.discord_id, { headers: { Authorization: 'Bot ' + process.env.DISCORD_BOT_TOKEN } })
  if (r.ok) {
    const u = await r.json()
    d.name = u.global_name || u.username
    d.avatar = u.avatar
      ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`
  }
  return d
}

export async function GET(_, { params }) {
  const g = await guard(params.kind, 'read'); if (g.r) return g.r
  const { data } = await db.from('items').select('id,data,created_at').eq('kind', params.kind).order('created_at')
  return Response.json(data)
}

export async function POST(req, { params }) {
  const g = await guard(params.kind, 'create'); if (g.r) return g.r
  const d = await enrich(params.kind, await req.json())
  const { error } = await db.from('items').insert({ kind: params.kind, data: d })
  return error ? E(error.message, 500) : Response.json({ ok: 1 })
}

export async function PATCH(req, { params }) {
  const g = await guard(params.kind, 'update'); if (g.r) return g.r
  const { id, data } = await req.json()
  const { data: old } = await db.from('items').select('data').eq('id', id).eq('kind', params.kind).single()
  if (!old) return E('غير موجود', 404)
  let d
  if (params.kind === 'applications') {
    if (old.data.status !== 'pending') return E('تم البت في هذا الطلب مسبقاً', 409)
    if (!['accepted', 'rejected'].includes(data.status)) return E('حالة غير صحيحة', 400)
    if (data.status === 'rejected' && !String(data.reason || '').trim()) return E('سبب الرفض مطلوب', 400)
    d = { ...old.data, status: data.status, reason: data.reason, reviewer: g.s.user.name }
  } else if (params.kind === 'orders') {
    if (!['accepted', 'rejected'].includes(data.status)) return E('حالة غير صحيحة', 400)
    if (!['pending', 'awaiting_purchase'].includes(old.data.status)) return E('تم البت في هذا الطلب مسبقاً', 409)
    d = { ...old.data, status: data.status, decidedAt: Date.now() }
    if (data.status === 'accepted' && old.data.productId) {
      const { data: pr } = await db.from('items').select('data').eq('id', old.data.productId).single()
      const q = pr?.data?.qty
      if (typeof q === 'number') {
        if (q <= 0) return E('نفدت كمية هذا المنتج', 409)
        await db.from('items').update({ data: { ...pr.data, qty: q - 1 } }).eq('id', old.data.productId)
      }
    }
  } else d = await enrich(params.kind, { ...old.data, ...data })
  await db.from('items').update({ data: d }).eq('id', id)
  return Response.json({ ok: 1 })
}

export async function DELETE(req, { params }) {
  const g = await guard(params.kind, 'delete'); if (g.r) return g.r
  await db.from('items').delete().eq('id', new URL(req.url).searchParams.get('id')).eq('kind', params.kind)
  return Response.json({ ok: 1 })
}
