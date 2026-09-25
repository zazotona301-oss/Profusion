function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function createPrintWindow(title, clinic, body) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;
  const clinicName = escapeHtml(clinic?.name || "العيادة");
  const specialty = escapeHtml(clinic?.specialty || "الخدمات الطبية");
  const phone = escapeHtml(clinic?.phone || "");
  const address = escapeHtml(clinic?.address || "");
  const logo = clinic?.logo ? `<img class="logo" src="${escapeHtml(clinic.logo)}" alt="شعار ${clinicName}">` : `<div class="mark">+</div>`;
  printWindow.document.write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${clinicName}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#172033;font-family:Arial,"Tahoma",sans-serif;direction:rtl}.sheet{min-height:267mm;position:relative;padding-bottom:30mm}.header{border-bottom:3px solid #0f766e;padding:0 0 16px;display:flex;justify-content:space-between;gap:24px;align-items:flex-start}.brand{display:flex;align-items:center;gap:12px}.mark,.logo{width:58px;height:58px;border-radius:15px}.mark{background:#dff8f4;color:#0f766e;display:grid;place-items:center;font-size:22px;font-weight:bold}.logo{display:block;object-fit:contain;border:1px solid #dcefeb;padding:4px;background:#fff}.clinic h1{font-size:22px;color:#0f766e;margin:0 0 5px}.clinic p,.meta p{margin:3px 0;color:#64748b;font-size:11px}.meta{text-align:left}.title{text-align:center;margin:28px 0 20px}.title h2{font-size:24px;margin:0 0 8px;color:#0f172a}.title p{margin:0;color:#0f766e;font-size:12px;font-weight:bold}.patient{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.tile{background:#f5faf9;border:1px solid #dcefeb;border-radius:10px;padding:10px}.tile span{display:block;color:#64748b;font-size:10px;margin-bottom:5px}.tile strong{font-size:12px;color:#172033}.section{border:1px solid #dce2e8;border-radius:12px;overflow:hidden;margin-top:16px}.section h3{font-size:13px;margin:0;padding:11px 14px;background:#effaf8;color:#0f766e}.section-content{padding:14px}.diagnosis{font-size:13px;font-weight:bold;line-height:1.9}.meds{width:100%;border-collapse:collapse}.meds th,.meds td{border-bottom:1px solid #e8edf0;padding:11px 9px;text-align:right;font-size:11px}.meds th{color:#64748b;background:#fafcfd}.lines{height:125px;border-bottom:1px dashed #a9b8bd;background:repeating-linear-gradient(to bottom,transparent 0,transparent 30px,#dfe7ea 31px)}.signature{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:48px}.signature div{border-top:1px solid #94a3b8;text-align:center;padding-top:9px;color:#64748b;font-size:11px}.signature-image{display:block;width:145px;height:52px;object-fit:contain;margin:0 auto 7px}.footer{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #dce2e8;padding-top:10px;display:flex;justify-content:space-between;color:#64748b;font-size:10px}.note{margin-top:14px;color:#64748b;font-size:10px}@media print{.no-print{display:none}}
  </style></head><body><main class="sheet"><header class="header"><div class="brand">${logo}<div class="clinic"><h1>${clinicName}</h1><p>${specialty}</p><p>${address}</p></div></div><div class="meta"><p>${phone}</p><p>تاريخ الإصدار: ${new Intl.DateTimeFormat("ar-SA", { dateStyle: "long" }).format(new Date())}</p></div></header>${body}<footer class="footer"><span>${clinicName} · مستند طبي رسمي</span><span>يُرجى الاحتفاظ بهذا المستند في ملف المريض</span></footer></main><script>window.onload=function(){window.print()}</script></body></html>`);
  printWindow.document.close();
}

export function printMedicalDocument(type, prescription, clinic, patient) {
  const safePatient = patient || {};
  const signatureImage = clinic?.signature ? `<img class="signature-image" src="${escapeHtml(clinic.signature)}" alt="توقيع الطبيب">` : "";
  const patientTiles = `<div class="patient"><div class="tile"><span>المريض</span><strong>${escapeHtml(prescription.patient)}</strong></div><div class="tile"><span>رقم الملف</span><strong>${escapeHtml(safePatient.id || "غير مسجل")}</strong></div><div class="tile"><span>العمر / النوع</span><strong>${escapeHtml(safePatient.age ? `${safePatient.age} سنة · ${safePatient.gender || ""}` : "غير مسجل")}</strong></div><div class="tile"><span>تاريخ المستند</span><strong>${escapeHtml(new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(new Date(prescription.date)))}</strong></div></div>`;
  if (type === "report") {
    const body = `<section class="title"><h2>تقرير طبي</h2><p>ملخص حالة المريض · ${escapeHtml(prescription.id)}</p></section>${patientTiles}<section class="section"><h3>الملخص الطبي</h3><div class="section-content"><p class="diagnosis">التشخيص المسجل: ${escapeHtml(prescription.diagnosis)}</p><p class="note">هذا التقرير صادر بناءً على السجل الطبي المتاح لدى ${escapeHtml(clinic?.name || "العيادة")}، ويُستخدم للغرض الطبي والإداري المناسب.</p></div></section><section class="section"><h3>ملاحظات الطبيب</h3><div class="section-content"><div class="lines"></div></div></section><div class="signature"><div>${signatureImage}الطبيب المعالج<br>${escapeHtml(prescription.doctor)}</div><div>ختم العيادة وتاريخ الاعتماد</div></div>`;
    createPrintWindow("تقرير طبي", clinic, body);
    return;
  }
  const medicineRows = Array.from({ length: Math.max(1, Number(prescription.medicines) || 1) }, (_, index) => `<tr><td>${index + 1}</td><td>دواء ${index + 1}</td><td>________________</td><td>________________</td></tr>`).join("");
  const body = `<section class="title"><h2>روشتة طبية</h2><p>وصفة علاجية · ${escapeHtml(prescription.id)}</p></section>${patientTiles}<section class="section"><h3>التشخيص</h3><div class="section-content"><p class="diagnosis">${escapeHtml(prescription.diagnosis)}</p></div></section><section class="section"><h3>الأدوية والتعليمات</h3><div class="section-content"><table class="meds"><thead><tr><th>#</th><th>اسم الدواء</th><th>الجرعة</th><th>المدة / الملاحظات</th></tr></thead><tbody>${medicineRows}</tbody></table></div></section><div class="signature"><div>${signatureImage}الطبيب المعالج<br>${escapeHtml(prescription.doctor)}</div><div>ختم العيادة وتاريخ الاعتماد</div></div>`;
  createPrintWindow("روشتة طبية", clinic, body);
}
