# SKAM CITY

موقع Next.js + تسجيل دخول Discord + قاعدة بيانات Supabase. جاهز للرفع على Vercel.

## الإعداد (مرة واحدة)

1. **Discord**: افتح https://discord.com/developers/applications وأنشئ Application جديد.
   - OAuth2 > Redirects أضف: `https://موقعك.vercel.app/api/auth/callback/discord` (ولـ التجربة المحلية `http://localhost:3000/api/auth/callback/discord`)
   - انسخ Client ID و Client Secret.
   - من تبويب Bot اضغط Reset Token وانسخه (يستخدم لجلب صور وأسماء المسؤولين).
   - آيدي حسابك: فعّل Developer Mode في دسكورد، كليك يمين على نفسك > Copy User ID.
2. **Supabase**: أنشئ مشروع مجاني، شغّل محتوى `supabase.sql` في SQL Editor، ثم من Storage أنشئ Bucket اسمه `media` واجعله Public.
   انسخ Project URL و service_role key.
3. **المتغيرات**: انسخ `.env.example` إلى `.env.local` وعبّها (وفي Vercel: Settings > Environment Variables).
4. **التشغيل**: `npm install` ثم `npm run dev`. للنشر: ارفع المجلد على GitHub واربطه بـ Vercel.

## الصلاحيات
- **المالك** (OWNER_DISCORD_ID): كل شيء.
- **مشرف/أدمن**: كل شيء ماعدا قبول/رفض طلبات المتجر.
- **مراجع اختبارات**: قبول/رفض الاختبارات فقط.
يتم التعيين من قائمة «التوظيف» بآيدي الدسكورد.

## ملاحظات
- طلبات المتجر تُسجَّل لحظة ضغط اللاعب على «شراء» ثم يتحول لصفحة Game Pass؛ المالك يؤكد القبول يدوياً.
- رفع الملفات من الموقع حده حوالي 4 ميجا في Vercel؛ للفيديوهات الأكبر ارفعها في Supabase Storage والصق الرابط.
- مفتاح كروم يحتاج الملف من Supabase أو موقع يسمح بـ CORS.
