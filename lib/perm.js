const PUB = ['rules', 'criminals', 'soldiers', 'staff', 'products', 'pages']
export const E = (m, s) => Response.json({ error: m }, { status: s })
// owner: كل شيء | admin: كل شيء ماعدا قبول/رفض الطلبات | reviewer: الاختبارات فقط
export function can(r, k, a) {
  if (r === 'owner') return true
  if (PUB.includes(k)) return a === 'read' || r === 'admin'
  if (k === 'roles') return r === 'admin'
  if (k === 'applications') return (r === 'admin' || r === 'reviewer') && (a === 'read' || a === 'update')
  if (k === 'orders') return r === 'admin' && a === 'read'
  return false
}
