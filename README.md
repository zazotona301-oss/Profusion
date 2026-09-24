# عيادتي | نظام إدارة العيادة الطبية

تطبيق React + Vite عربي RTL لإدارة العيادة، مبني على لوحة تشغيل يومية تشمل المرضى والسجلات والمواعيد والفواتير والروشتات. يعمل التطبيق فوراً ببيانات تجريبية محفوظة في `localStorage`، ويحتوي كذلك على مخطط Neon PostgreSQL وواجهات CRUD HTTP جاهزة للنشر على Vercel.

## ما تم تنفيذه

- لوحة تحكم طبية حديثة متجاوبة مع RTL، بخط Cairo، وألوان teal / navy هادئة.
- لوحة نظرة عامة تعرض المواعيد والإحصائيات ومؤشر الإيرادات ومعدل الانتظار.
- إدارة ملفات المرضى مع البحث، إضافة مريض، بطاقة التفاصيل، التشخيصات، وفصيلة الدم.
- إدارة الحجوزات مع جدول اليوم، حجز موعد جديد، تغيير الحالة، ورسائل التذكير.
- شاشة الفواتير والمدفوعات مع الإجمالي والمحصّل والفواتير المعلقة.
- شاشة الروشتات والتقارير مع مشاركة الوصفة عبر واتساب.
- `localStorage` مع مراقبة online/offline لاستمرار العمل عند انقطاع الإنترنت.
- التقاط صورة بالكاميرا أو رفع صورة ملف باستخدام `react-webcam`.
- مسح QR / باركود باستخدام `html5-qrcode` وتسجيل حضور سريع.
- إنشاء روابط `wa.me` جاهزة لتذكير المواعيد ومشاركة الفواتير والروشتات.
- `neon/schema.sql` يحتوي الجداول المترابطة والفهارس والـ enums والـ triggers والبيانات الابتدائية.
- `api/clinic/[resource].js` يقدم CRUD عبر HTTP لموارد المرضى والأطباء والمواعيد والروشتات والفواتير.

## التشغيل المحلي

```bash
pnpm install
pnpm dev
```

يفتح الخادم المحلي عبر معاينة Vite. لا يحتاج العرض التجريبي إلى قاعدة بيانات أو مفاتيح سرية، لأن الواجهة تستخدم البيانات الأولية والتخزين المحلي.

## ربط Neon PostgreSQL

1. أنشئ مشروعاً جديداً في Neon.
2. انسخ محتوى [`neon/schema.sql`](./neon/schema.sql) وشغّله من Neon SQL Editor.
3. أضف المتغير السري التالي إلى مشروع Vercel أو بيئة الخادم:

```env
DATABASE_URL=postgresql://user:password@ep-example.eu-central-1.aws.neon.tech/clinic?sslmode=require
CORS_ORIGIN=https://your-domain.vercel.app
```

4. اختبر صحة API بعد النشر عبر:

```text
GET /api/clinic
```

سيعيد حالة الخدمة وما إذا كان `DATABASE_URL` مضبوطاً.

## واجهات HTTP

القاعدة العامة: `/api/clinic/:resource`

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/clinic/patients` | قائمة المرضى |
| GET | `/api/clinic/patients?q=سارة` | البحث بالاسم أو رقم الملف أو الجوال |
| GET | `/api/clinic/patients?id=<uuid>` | قراءة سجل واحد |
| POST | `/api/clinic/patients` | إنشاء مريض |
| PATCH | `/api/clinic/patients?id=<uuid>` | تحديث حقول المريض |
| DELETE | `/api/clinic/patients?id=<uuid>` | حذف سجل |
| GET | `/api/clinic/appointments?from=...&to=...` | حجوزات ضمن فترة زمنية |
| CRUD | `/api/clinic/doctors` | إدارة الأطباء |
| CRUD | `/api/clinic/prescriptions` | الروشتات مع قائمة الأدوية |
| CRUD | `/api/clinic/invoices` | الفواتير مع بنودها |

مثال إنشاء مريض:

```bash
curl -X POST https://your-domain.vercel.app/api/clinic/patients \
  -H 'Content-Type: application/json' \
  -d '{
    "file_number": "PT-1050",
    "full_name": "منى عبدالله",
    "phone": "966500000000",
    "gender": "female",
    "blood_type": "O+"
  }'
```

## النشر على Vercel

1. ارفع المشروع إلى GitHub أو اربطه مباشرة بمشروع Vercel.
2. اجعل **Framework Preset** هو Vite، وأمر البناء `pnpm build`، ومجلد الإخراج `dist/public` إذا كان إعداد Vercel يستخدم مخرجات الخادم المضمنة، أو `dist` عند نشر Vite فقط.
3. أضف `DATABASE_URL` و`CORS_ORIGIN` إلى **Project Settings → Environment Variables** لكل من Preview وProduction.
4. انشر المشروع. ملفات `api/clinic/*.js` ستعمل كـ Vercel Functions تلقائياً.
5. شغّل `neon/schema.sql` قبل استعمال عمليات الكتابة.
6. عند تفعيل المزامنة من الواجهة، اجعل طبقة خدمة الواجهة ترسل الطلبات إلى `/api/clinic`. التصميم الحالي يبقى محلياً إذا لم يوجد الاتصال، وهو ما يسمح باستمرار العمل أثناء انقطاع الشبكة.

> لا تضع `DATABASE_URL` داخل ملفات الواجهة أو أي متغير يبدأ بـ `VITE_`؛ يجب أن يبقى مفتاح Neon في بيئة الخادم فقط.

## ملاحظات الأمان والتشغيل

- روابط واتساب تفتح نافذة جديدة ولا ترسل الرسالة تلقائياً دون تفاعل المستخدم.
- الصور الملتقطة في العرض التجريبي تبقى داخل المتصفح. للإنتاج، خزّن `file_url` في `patient_attachments` بعد رفع الملف إلى خدمة تخزين خاصة.
- يوصى بإضافة مصادقة أطباء وصلاحيات قبل فتح API للعامة، وتقييد `CORS_ORIGIN` إلى نطاقك الفعلي بدلاً من `*`.
- بيانات العرض محفوظة في `localStorage` للمحاكاة. يمكن لاحقاً استبدال دوال `useClinicData` بطبقة مزامنة تعتمد على HTTP مع queue للطلبات غير المتصلة.


## نسخة Android والبناء عبر GitHub

تمت إضافة نسخة Android مبنية على Capacitor داخل مجلد `android/` مع المعرّف `com.profusion.clinic`. تستخدم النسخة نفس واجهة React بعد إنتاج ملفات Vite، ولذلك لا يوجد تكرار لكود الواجهة.

للبناء محلياً بعد تثبيت Android SDK:

```bash
pnpm install
pnpm android:sync
cd android
./gradlew assembleDebug
```

كما تمت إضافة سير العمل `.github/workflows/android.yml`. عند كل دفع إلى `main` أو عند تشغيله يدوياً من تبويب **Actions**، سيقوم GitHub بتثبيت Node وJava، بناء الواجهة، مزامنة Capacitor، بناء `app-debug.apk`، ثم رفعه كـArtifact باسم `profusion-clinic-debug-apk`.

بعد الدفع إلى GitHub:

1. افتح تبويب **Actions** في مستودع `Profusion`.
2. اختر **Build Android APK**.
3. انتظر اكتمال المهمة، ثم نزّل Artifact باسم `profusion-clinic-debug-apk`.
4. لإصدار إنتاجي، أضف لاحقاً keystore مشفراً ووقّع `assembleRelease` عبر GitHub Secrets.
