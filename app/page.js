'use client'
import { useEffect, useRef, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const api = async (u, m = 'GET', b) => {
  const r = await fetch(u, { method: m, headers: b ? { 'Content-Type': 'application/json' } : {}, body: b && JSON.stringify(b) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || r.status)
  return j
}
const DEF = {
  title: 'SKAM CITY', contact: '9j33', c1: '#a78bfa', c2: '#3b0764', labels: {},
  discord: 'https://discord.gg/ARQnRFAStQ',
  map: 'https://www.roblox.com/ar/games/87768377725414/SKAM-CITY',
  questions: ['ما هو الـ FearRP وكيف تتجنبه؟', 'ما هو الـ MetaGaming؟', 'ما الفرق بين RDM و VDM؟', 'تم القبض عليك أثناء سرقة، كيف تتصرف؟', 'ما هو قانون NLR؟']
}
const RANK = [['rank', 'الترتيب (1 = الأول)', 'number'], ['image', 'الصورة', 'image'], ['name', 'الاسم'], ['desc', 'الوصف', 'area']]
const ITEMS = {
  rules: { t: 'قوانين الرول بلاي', F: [['name', 'اسم القانون'], ['desc', 'الشرح', 'area']] },
  criminals: { t: 'أخطر المجرمين', F: RANK, rank: 1 },
  soldiers: { t: 'أفضل العساكر', F: RANK, rank: 1 },
  staff: { t: 'مسؤولين SKAM CITY', F: [['discord_id', 'آيدي حساب دسكورد'], ['desc', 'الوصف', 'area']] },
  products: { t: 'متجر الماب', store: 1, F: [['image', 'صورة المنتج', 'image'], ['name', 'الاسم'], ['desc', 'الوصف', 'area'],
    ['pay', 'طريقة الدفع (التحويل لمنتجات وخدمات حقيقية، مو لعناصر روبلوكس)', 'select', [['gamepass', 'قيم باس (روبلوكس)'], ['transfer', 'تحويل (تواصل عبر دسكورد)']]],
    ['price', 'السعر (يظهر للعميل، اختياري)'], ['qty', 'الكمية المتوفرة (0 = نفدت، وإذا ما كتبت شيء تكون غير محدودة)', 'number'],
    ['passId', 'ID القيم باس (للقيم باس فقط)']] },
  roles: { t: 'التوظيف', F: [['discord_id', 'آيدي حساب دسكورد'], ['role', 'الرتبة', 'select', [['admin', 'مشرف / أدمن'], ['reviewer', 'مراجع اختبارات']]]] },
  pages: { t: 'الصفحات المخصصة', F: [['title', 'عنوان الصفحة'], ['body', 'المحتوى', 'area'], ['image', 'صورة', 'image']] }
}
const ROLE = { admin: 'مشرف / أدمن', reviewer: 'مراجع اختبارات' }

function Field({ f: [k, l, t, o], v = '', set }) {
  const up = async (e) => {
    const fd = new FormData(); fd.append('file', e.target.files[0])
    const j = await (await fetch('/api/upload', { method: 'POST', body: fd })).json()
    j.url ? set(k, j.url) : alert(j.error || 'فشل الرفع (الفيديوهات الكبيرة الصقها كرابط)')
  }
  const ch = (e) => set(k, t === 'number' ? +e.target.value : e.target.value)
  return (
    <label>{l}
      {t === 'area' ? <textarea value={v} onChange={ch} />
        : t === 'select' ? <select value={v} onChange={ch}><option value="">—</option>{o.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</select>
        : t === 'check' ? <input type="checkbox" checked={!!v} onChange={(e) => set(k, e.target.checked)} />
        : <input type={{ number: 'number', color: 'color', date: 'datetime-local' }[t] || 'text'} value={v} onChange={ch} />}
      {t === 'image' && <input type="file" accept="image/*,video/*" onChange={up} />}
    </label>
  )
}

function Items({ kind, edit, S }) {
  const c = ITEMS[kind]
  const [rows, setRows] = useState([]), [f, setF] = useState(null), [rb, setRb] = useState({}), [err, setErr] = useState(''), [tick, setTick] = useState(0)
  const load = () => api('/api/items/' + kind).then((r) => setRows(c.rank ? r.sort((a, b) => a.data.rank - b.data.rank) : r)).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const save = async () => {
    try { f.id ? await api('/api/items/' + kind, 'PATCH', { id: f.id, data: f.data }) : await api('/api/items/' + kind, 'POST', f.data); setF(null); load() }
    catch (e) { setErr(e.message) }
  }
  const del = async (id) => { if (confirm('تأكيد الحذف؟')) { await api('/api/items/' + kind + '?id=' + id, 'DELETE'); load() } }
  const buy = async (r) => {
    const tr = r.data.pay === 'transfer'
    if (!tr && !rb[r.id]) return alert('اكتب يوزرك في روبلوكس أولاً')
    const w = tr ? null : window.open('', '_blank')
    try {
      const j = await api('/api/buy', 'POST', { productId: r.id, roblox: rb[r.id] })
      setTick(tick + 1); load()
      if (tr) alert('تم إرسال طلبك، بانتظار القبول')
      else if (w) w.location.href = j.url
      else location.href = j.url
    } catch (e) { if (w) w.close(); setErr(e.message) }
  }
  return (
    <section>
      <h2>{c.t}</h2>{err && <p className="err">{err}</p>}
      {kind === 'products' && <MyOrders S={S} tick={tick} />}
      {edit && <button className="btn" onClick={() => setF({ data: {} })}>إضافة</button>}
      {f && <div className="card form">
        {c.F.map((x) => <Field key={x[0]} f={x} v={f.data[x[0]]} set={(k, v) => setF({ ...f, data: { ...f.data, [k]: v } })} />)}
        <div><button className="btn" onClick={save}>حفظ</button><button className="btn ghost" onClick={() => setF(null)}>إلغاء</button></div>
      </div>}
      <div className="grid">{rows.map((r) => { const d = r.data; return (
        <div className="card" key={r.id}>
          {c.rank && <span className="rank">#{d.rank}</span>}
          {(d.image || d.avatar) && <img src={d.image || d.avatar} alt="" />}
          <h3>{d.name || d.title}</h3>
          {d.role && <b>{ROLE[d.role]}</b>}
          <p>{d.desc || d.body}</p>
          {c.store && d.price && <p><b>{d.price}</b></p>}
          {c.store && typeof d.qty === 'number' && <p>{d.qty > 0 ? 'المتوفر: ' + d.qty : 'نفدت الكمية'}</p>}
          {c.store && !(typeof d.qty === 'number' && d.qty <= 0) && <>
            {d.pay !== 'transfer' && <input placeholder="يوزرك في روبلوكس" onChange={(e) => setRb({ ...rb, [r.id]: e.target.value })} />}
            <button className="btn" onClick={() => buy(r)}>{d.pay === 'transfer' ? 'طلب شراء' : 'شراء'}</button></>}
          {edit && <div>
            <button className="btn ghost" onClick={() => setF({ id: r.id, data: { ...d } })}>تعديل</button>
            <button className="btn ghost" onClick={() => del(r.id)}>حذف</button></div>}
        </div>) })}
      </div>
    </section>
  )
}

function MyOrders({ S, tick }) {
  const [rows, setRows] = useState([])
  useEffect(() => {
    const go = () => api('/api/my-orders').then(setRows).catch(() => {})
    go(); const t = setInterval(go, 15000); return () => clearInterval(t)
  }, [tick])
  if (!rows.length) return null
  const msg = (o) => {
    if (o.status === 'awaiting_purchase') return 'بانتظار إتمام الشراء. اشترِ القيم باس ثم ادخل الماب وبيوصل طلبك تلقائياً'
    if (o.status === 'pending') return 'بانتظار قبول الطلب'
    if (o.status === 'rejected') return 'تم رفض الطلب'
    return o.pay === 'transfer' ? 'تم قبول طلبك. الرجاء التواصل مع ' + S.contact + ' عبر دسكورد' : 'تم قبول طلبك'
  }
  return (
    <div className="card" style={{ margin: '14px 0' }}>
      <h3>طلباتي</h3>
      {rows.map((o) => <p key={o.id}><b>{o.product}:</b> {msg(o)}</p>)}
    </div>
  )
}

function Apply({ S }) {
  const [st, setSt] = useState(null), [f, setF] = useState({}), [a, setA] = useState([]), [m, setM] = useState('')
  useEffect(() => { api('/api/apply').then(setSt) }, [])
  if (!st) return null
  const H = <h2>اختبار الرول بلاي</h2>
  if (st.status === 'accepted') return <section>{H}<p className="card">تم قبولك. ما تقدر تقدم مرة ثانية.</p></section>
  if (st.status === 'pending') return <section>{H}<p className="card">تقديمك قيد المراجعة. تابع حالته هنا.</p></section>
  const send = async () => {
    try { await api('/api/apply', 'POST', { ...f, answers: S.questions.map((q, i) => ({ q, a: a[i] || '' })) }); setSt({ status: 'pending' }) }
    catch (e) { setM(e.message) }
  }
  const sf = (k, v) => setF({ ...f, [k]: v })
  return (
    <section>{H}
      {st.status === 'rejected' && <p className="card err">تم رفض تقديمك السابق. السبب: {st.reason}. تقدر تقدم من جديد.</p>}
      <div className="card form">
        {[['character', 'اسم الشخصية'], ['nickname', 'لقب الشخصية'], ['age', 'عمر الشخصية', 'number'], ['country', 'دولة الشخصية'], ['discord', 'يوزرك في دسكورد'], ['roblox', 'يوزرك في روبلوكس']]
          .map((x) => <Field key={x[0]} f={x} v={f[x[0]]} set={sf} />)}
        <Field f={['story', 'قصة الشخصية', 'area']} v={f.story} set={sf} />
        {S.questions.map((q, i) => <Field key={i} f={[i, q, 'area']} v={a[i]} set={(k, v) => { const n = [...a]; n[k] = v; setA(n) }} />)}
        <div><button className="btn" onClick={send}>إرسال التقديم</button></div>{m && <p className="err">{m}</p>}
      </div>
    </section>
  )
}

function Results() {
  const [rows, setRows] = useState([]), [rj, setRj] = useState({}), [err, setErr] = useState('')
  const load = () => api('/api/items/applications').then((r) => setRows(r.reverse())).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const set = async (id, status, reason) => { try { await api('/api/items/applications', 'PATCH', { id, data: { status, reason } }); load() } catch (e) { setErr(e.message) } }
  return (
    <section><h2>نتائج التقديمات</h2>{err && <p className="err">{err}</p>}
      {rows.map((r) => { const d = r.data; return (
        <div className="card" key={r.id} style={{ marginTop: 12 }}>
          <h3>{d.character} «{d.nickname}»</h3>
          <p>العمر {d.age}، {d.country}. دسكورد: {d.discord}. روبلوكس: {d.roblox}</p>
          <p>{d.story}</p>
          {d.answers?.map((x, i) => <p key={i}><b>{x.q}</b><br />{x.a}</p>)}
          <div className="bar"><i style={{ width: d.score + '%' }} /></div>
          <small>نسبة القبول المتوقعة: {d.score} من 100</small>
          <p>الحالة: {{ pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' }[d.status]}{d.reason && ' (' + d.reason + ')'}</p>
          {d.status === 'pending' && <div>
            <button className="btn" onClick={() => set(r.id, 'accepted')}>قبول</button>
            <input placeholder="سبب الرفض" value={rj[r.id] || ''} onChange={(e) => setRj({ ...rj, [r.id]: e.target.value })} />
            <button className="btn ghost" onClick={() => rj[r.id] ? set(r.id, 'rejected', rj[r.id]) : alert('اكتب سبب الرفض')}>رفض</button>
          </div>}
        </div>) })}
    </section>
  )
}

function Orders({ role }) {
  const [rows, setRows] = useState([]), [err, setErr] = useState('')
  const load = () => api('/api/items/orders').then((r) => setRows(r.reverse())).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const set = async (id, status) => { try { await api('/api/items/orders', 'PATCH', { id, data: { status } }); load() } catch (e) { setErr(e.message) } }
  const L = { awaiting_purchase: 'بانتظار إتمام الشراء', pending: 'بانتظار القبول', accepted: 'مقبول', rejected: 'مرفوض' }
  return (
    <section><h2>طلبات المتجر</h2>{err && <p className="err">{err}</p>}
      {rows.map((r) => { const d = r.data; return (
        <div className="card" key={r.id} style={{ marginTop: 12 }}>
          <h3>{d.product}</h3><p>دسكورد: {d.discord}.{d.roblox ? ' روبلوكس: ' + d.roblox : ''}</p>
          <p>طريقة الدفع: {d.pay === 'transfer' ? 'تحويل' : 'قيم باس'}</p>
          <p>الحالة: {L[d.status]}</p>
          {role === 'owner' && ['pending', 'awaiting_purchase'].includes(d.status) && <div>
            <button className="btn" onClick={() => set(r.id, 'accepted')}>قبول</button>
            <button className="btn ghost" onClick={() => set(r.id, 'rejected')}>رفض</button></div>}
        </div>) })}
    </section>
  )
}

function Settings({ S }) {
  const [s, setS] = useState({ ...S, intro: { chroma: {}, ...S.intro }, countdown: { ...S.countdown }, notice: { ...S.notice } })
  const [lb, setLb] = useState(JSON.stringify(S.labels || {})), [m, setM] = useState('')
  const u = (k, v) => setS({ ...s, [k]: v })
  const ui = (k, v) => u('intro', { ...s.intro, [k]: v })
  const save = async () => {
    try {
      const n = { ...s, labels: JSON.parse(lb || '{}') }
      const strip = (i) => JSON.stringify({ ...i, v: 0 })
      if (strip(s.intro) !== strip(S.intro || { chroma: {} })) n.intro = { ...s.intro, v: Date.now() }
      if (s.notice.text !== S.notice?.text) n.notice = { text: s.notice.text, id: Date.now() }
      await api('/api/settings', 'PUT', n); location.reload()
    } catch (e) { setM('خطأ: ' + e.message) }
  }
  return (
    <section><h2>إعدادات الموقع</h2>
      <div className="card form">
        <Field f={['title', 'اسم الموقع']} v={s.title} set={u} />
        <Field f={['c1', 'اللون البنفسجي الفاتح', 'color']} v={s.c1} set={u} />
        <Field f={['c2', 'اللون البنفسجي الغامق', 'color']} v={s.c2} set={u} />
        <Field f={['discord', 'رابط سيرفر الدسكورد']} v={s.discord} set={u} />
        <Field f={['map', 'رابط الماب']} v={s.map} set={u} />
        <Field f={['contact', 'اسم التواصل في دسكورد (يظهر للعميل بعد قبول التحويل)']} v={s.contact} set={u} />
        <Field f={['text', 'إشعار يظهر لكل اللاعبين (اتركه فاضي للإلغاء)']} v={s.notice.text} set={(k, v) => u('notice', { ...s.notice, text: v })} />
        <Field f={['label', 'عنوان العداد التنازلي']} v={s.countdown.label} set={(k, v) => u('countdown', { ...s.countdown, label: v })} />
        <Field f={['date', 'تاريخ العداد', 'date']} v={s.countdown.date} set={(k, v) => u('countdown', { ...s.countdown, date: v })} />
        <h3>فيديو أو صورة الدخول</h3>
        <Field f={['url', 'الملف أو الرابط', 'image']} v={s.intro.url} set={ui} />
        <Field f={['type', 'النوع', 'select', [['video', 'فيديو'], ['image', 'صورة']]]} v={s.intro.type} set={ui} />
        <Field f={['mode', 'متى يظهر', 'select', [['first', 'أول دخول فقط'], ['always', 'كل دخول']]]} v={s.intro.mode} set={ui} />
        <Field f={['fade', 'مدة الظهور التدريجي (مللي ثانية)', 'number']} v={s.intro.fade} set={ui} />
        <Field f={['feather', 'تنعيم الحواف (0 إلى 50)', 'number']} v={s.intro.feather} set={ui} />
        <Field f={['on', 'تفعيل مفتاح كروم (إزالة الخلفية)', 'check']} v={s.intro.chroma.on} set={(k, v) => ui('chroma', { ...s.intro.chroma, on: v })} />
        <Field f={['color', 'لون الخلفية المراد إزالتها', 'color']} v={s.intro.chroma.color || '#00ff00'} set={(k, v) => ui('chroma', { ...s.intro.chroma, color: v })} />
        <Field f={['tol', 'قوة الإزالة (0 إلى 100)', 'number']} v={s.intro.chroma.tol ?? 40} set={(k, v) => ui('chroma', { ...s.intro.chroma, tol: v })} />
        <Field f={['q', 'أسئلة الاختبار (سؤال في كل سطر)', 'area']} v={s.questions.join('\n')} set={(k, v) => u('questions', v.split('\n'))} />
        <label>تسمية القوائم JSON مثل {'{"rules":"القوانين"}'}<textarea value={lb} onChange={(e) => setLb(e.target.value)} /></label>
        <div><button className="btn" onClick={save}>حفظ الإعدادات</button></div>{m && <p className="err">{m}</p>}
      </div>
    </section>
  )
}

function Countdown({ d, l }) {
  const [n, setN] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(t) }, [])
  let s = Math.max(0, Math.floor((new Date(d) - n) / 1000))
  return <div className="cd"><h3>{l}</h3><div>{[['يوم', 86400], ['ساعة', 3600], ['دقيقة', 60], ['ثانية', 1]].map(([t, x]) => { const v = Math.floor(s / x); s %= x; return <span key={t}><b>{v}</b>{t}</span> })}</div></div>
}

function Intro({ m, close }) {
  const ext = (m.url || '').split('?')[0].split('.').pop().toLowerCase()
  const vid = ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(ext) ? true
    : ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext) ? false : m.type === 'video'
  const ch = m.chroma?.on, f = m.feather || 0
  const mask = f ? `radial-gradient(ellipse closest-side,#000 ${100 - f}%,transparent 100%)` : 'none'
  const box = { maxWidth: '90vw', maxHeight: '75vh' }
  const el = useRef(), cv = useRef()
  const [blk, setBlk] = useState(false)
  const [snd, setSnd] = useState(false)
  const toggleSound = () => { const e = el.current; if (!e) return; e.muted = !e.muted; setSnd(!e.muted); e.play().catch(() => {}) }
  useEffect(() => {
    const e = el.current
    if (!vid || !e) return
    e.muted = true
    e.play().catch(() => setBlk(true))
  }, [])
  useEffect(() => {
    if (!ch) return
    const e = el.current, c = cv.current, x = c.getContext('2d', { willReadFrequently: true })
    const [kr, kg, kb] = [1, 3, 5].map((i) => parseInt((m.chroma.color || '#00ff00').slice(i, i + 2), 16))
    const t = (m.chroma.tol ?? 40) * 4.4; let raf
    const draw = () => {
      const w = e.videoWidth || e.naturalWidth
      if (w) {
        c.width = w; c.height = e.videoHeight || e.naturalHeight; x.drawImage(e, 0, 0)
        try {
          const im = x.getImageData(0, 0, c.width, c.height), p = im.data
          for (let i = 0; i < p.length; i += 4) if (Math.hypot(p[i] - kr, p[i + 1] - kg, p[i + 2] - kb) < t) p[i + 3] = 0
          x.putImageData(im, 0, 0)
        } catch { return }
        if (!vid) return
      }
      raf = requestAnimationFrame(draw)
    }
    draw(); if (!vid) e.onload = draw
    return () => cancelAnimationFrame(raf)
  }, [])
  const P = vid ? { autoPlay: true, muted: true, playsInline: true, controls: blk, onEnded: close } : {}
  const E = vid ? 'video' : 'img'
  return (
    <div className="intro">
      <div style={{ animation: `fade ${m.fade || 1000}ms both`, WebkitMaskImage: mask, maskImage: mask, ...box }}>
        {ch && <canvas ref={cv} style={box} />}
        <E ref={el} src={m.url} crossOrigin="anonymous" {...P} style={ch ? { position: 'absolute', opacity: 0, width: 1, height: 1 } : box} />
      </div>
      <div>
        {vid && <button className="btn ghost" onClick={toggleSound}>{snd ? 'إيقاف الصوت' : 'تشغيل الصوت'}</button>}
        <button className="btn" onClick={close}>دخول</button>
      </div>
    </div>
  )
}

export default function App() {
  const { data: ses, status } = useSession()
  const [S, setS] = useState(DEF), [tab, setTab] = useState('home'), [pg, setPg] = useState([]), [intro, setIntro] = useState(false), [hideN, setHideN] = useState(false)
  useEffect(() => {
    if (status !== 'authenticated') return
    api('/api/settings').then((s) => {
      const m = { ...DEF, ...s, questions: s.questions?.length ? s.questions : DEF.questions }
      setS(m)
      document.documentElement.style.setProperty('--c1', m.c1); document.documentElement.style.setProperty('--c2', m.c2)
      if (m.intro?.url && (m.intro.mode === 'always' || localStorage.getItem('intro') !== String(m.intro.v))) setIntro(true)
      setHideN(localStorage.getItem('notice') === String(m.notice?.id))
    })
    api('/api/items/pages').then(setPg).catch(() => {})
  }, [status])

  if (status === 'loading') return null
  if (status === 'unauthenticated') return (
    <main className="hero"><h1>SKAM CITY</h1><p>سجّل دخولك بحساب دسكورد عشان تدخل الموقع</p>
      <button className="btn" onClick={() => signIn('discord')}>تسجيل الدخول عبر Discord</button></main>
  )
  const role = ses?.user?.role, staff = ['owner', 'admin'].includes(role), rev = staff || role === 'reviewer'
  const tabs = [['home', 'الرئيسية'], ['rules', 'قوانين الرول بلاي'], ['criminals', 'أخطر المجرمين'], ['soldiers', 'أفضل العساكر'], ['apply', 'اختبار الرول بلاي'], ['staff', 'المسؤولين'], ['products', 'متجر الماب'],
    ...pg.map((p) => ['p:' + p.id, p.data.title]),
    rev && ['results', 'نتائج التقديمات'], staff && ['orders', 'الطلبات'], staff && ['roles', 'التوظيف'], staff && ['pages', 'الصفحات'], staff && ['settings', 'الإعدادات']].filter(Boolean)
  const closeIntro = () => { localStorage.setItem('intro', String(S.intro.v)); setIntro(false) }
  const page = tab.startsWith('p:') && pg.find((p) => 'p:' + p.id === tab)
  return (
    <>
      {intro && <Intro m={S.intro} close={closeIntro} />}
      <div className="nav">
        <b>{S.title}</b>
        {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{S.labels?.[k] || l}</button>)}
        <button onClick={() => signOut()}>خروج</button>
      </div>
      {S.notice?.text && !hideN && <div className="notice">{S.notice.text}<button onClick={() => { localStorage.setItem('notice', String(S.notice.id)); setHideN(true) }}>إغلاق</button></div>}
      <main>
        {tab === 'home' && <div className="hero"><h1>{S.title}</h1>
          <a className="btn" href={S.discord} target="_blank" rel="noreferrer">سيرفر الدسكورد</a>
          <a className="btn" href={S.map} target="_blank" rel="noreferrer">ماب {S.title}</a>
          {S.countdown?.date && <Countdown d={S.countdown.date} l={S.countdown.label} />}</div>}
        {ITEMS[tab] && <Items key={tab} kind={tab} edit={staff} S={S} />}
        {tab === 'apply' && <Apply S={S} />}
        {tab === 'results' && <Results />}
        {tab === 'orders' && <Orders role={role} />}
        {tab === 'settings' && <Settings S={S} />}
        {page && <section><h2>{page.data.title}</h2>{page.data.image && <img src={page.data.image} alt="" style={{ maxWidth: '100%' }} />}<p>{page.data.body}</p></section>}
      </main>
    </>
  )
}
