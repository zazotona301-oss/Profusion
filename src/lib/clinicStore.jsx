import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "clinic-management-ar-v1";

export const initialClinicData = {
  clinic: {
    name: "مركز نبض الطبي",
    specialty: "الطب الباطني وأمراض القلب",
    phone: "+966 11 456 7821",
    address: "الرياض، حي المروج، شارع الأمير تركي",
    logo: "",
    signature: "",
  },
  patients: [
    { id: "PT-1048", name: "سارة أحمد العتيبي", phone: "966501234567", gender: "أنثى", age: 34, bloodType: "O+", lastVisit: "2026-09-22", status: "متابعة", tags: ["ضغط", "سكري"] },
    { id: "PT-1047", name: "عبدالله محمد القحطاني", phone: "966553219876", gender: "ذكر", age: 52, bloodType: "A+", lastVisit: "2026-09-20", status: "مستقر", tags: ["قلب"] },
    { id: "PT-1046", name: "نورة خالد الغامدي", phone: "966566789012", gender: "أنثى", age: 28, bloodType: "B+", lastVisit: "2026-09-18", status: "جديدة", tags: ["فحص دوري"] },
    { id: "PT-1045", name: "خالد صالح الدوسري", phone: "966507654321", gender: "ذكر", age: 47, bloodType: "AB+", lastVisit: "2026-09-16", status: "متابعة", tags: ["كوليسترول"] },
    { id: "PT-1044", name: "ريم وليد الشهري", phone: "966598765432", gender: "أنثى", age: 39, bloodType: "O-", lastVisit: "2026-09-14", status: "مستقر", tags: ["غدة درقية"] },
    { id: "PT-1043", name: "يوسف عبدالرحمن الحربي", phone: "966512345678", gender: "ذكر", age: 61, bloodType: "A-", lastVisit: "2026-09-11", status: "متابعة", tags: ["ضغط", "قلب"] },
  ],
  appointments: [
    { id: "AP-2201", patientId: "PT-1048", patientName: "سارة أحمد العتيبي", time: "08:30", date: "2026-09-24", type: "متابعة ضغط الدم", doctor: "د. ليان السالم", status: "مؤكد", phone: "966501234567" },
    { id: "AP-2202", patientId: "PT-1047", patientName: "عبدالله محمد القحطاني", time: "09:15", date: "2026-09-24", type: "استشارة قلب", doctor: "د. ليان السالم", status: "في الانتظار", phone: "966553219876" },
    { id: "AP-2203", patientId: "PT-1046", patientName: "نورة خالد الغامدي", time: "10:00", date: "2026-09-24", type: "فحص دوري", doctor: "د. رامي الحربي", status: "مؤكد", phone: "966566789012" },
    { id: "AP-2204", patientId: "PT-1045", patientName: "خالد صالح الدوسري", time: "11:30", date: "2026-09-24", type: "مراجعة تحاليل", doctor: "د. رامي الحربي", status: "مؤكد", phone: "966507654321" },
    { id: "AP-2205", patientId: "PT-1044", patientName: "ريم وليد الشهري", time: "13:00", date: "2026-09-24", type: "متابعة الغدة", doctor: "د. ليان السالم", status: "ملغي", phone: "966598765432" },
  ],
  bills: [
    { id: "INV-7842", patient: "سارة أحمد العتيبي", patientId: "PT-1048", date: "2026-09-22", amount: 380, status: "مدفوعة", category: "تحاليل", service: "تحليل سكر تراكمي وضغط" },
    { id: "INV-7841", patient: "عبدالله محمد القحطاني", patientId: "PT-1047", date: "2026-09-20", amount: 520, status: "معلقة", category: "كشف / زيارة", service: "استشارة قلب" },
    { id: "INV-7840", patient: "نورة خالد الغامدي", patientId: "PT-1046", date: "2026-09-18", amount: 250, status: "مدفوعة", category: "خروج", service: "كشف خروج ومتابعة" },
    { id: "INV-7839", patient: "خالد صالح الدوسري", patientId: "PT-1045", date: "2026-09-16", amount: 310, status: "مدفوعة", category: "كشف / زيارة", service: "مراجعة تحاليل" },
  ],
  prescriptions: [
    { id: "RX-3019", patient: "سارة أحمد العتيبي", doctor: "د. ليان السالم", date: "2026-09-22", medicines: 3, diagnosis: "ارتفاع ضغط الدم" },
    { id: "RX-3018", patient: "عبدالله محمد القحطاني", doctor: "د. ليان السالم", date: "2026-09-20", medicines: 2, diagnosis: "خفقان متقطع" },
    { id: "RX-3017", patient: "خالد صالح الدوسري", doctor: "د. رامي الحربي", date: "2026-09-16", medicines: 1, diagnosis: "ارتفاع الكوليسترول" },
  ],
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(initialClinicData));
}

function readStoredData() {
  if (typeof window === "undefined") return cloneSeed();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneSeed();
    const parsed = JSON.parse(saved);
    const bills = (parsed.bills || []).map((bill) => ({
      ...bill,
      category: bill.category || (bill.service?.includes("تحاليل") ? "تحاليل" : "كشف / زيارة"),
    }));
    return { ...cloneSeed(), ...parsed, clinic: { ...cloneSeed().clinic, ...(parsed.clinic || {}) }, bills };
  } catch {
    return cloneSeed();
  }
}

export function useClinicData() {
  const [data, setData] = useState(readStoredData);
  const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const actions = useMemo(() => ({
    addPatient: (patient) => setData((current) => ({ ...current, patients: [patient, ...current.patients] })),
    addAppointment: (appointment) => setData((current) => ({ ...current, appointments: [appointment, ...current.appointments] })),
    updateAppointmentStatus: (id, status) => setData((current) => ({ ...current, appointments: current.appointments.map((item) => item.id === id ? { ...item, status } : item) })),
    addBill: (bill) => setData((current) => ({ ...current, bills: [bill, ...current.bills] })),
    updateClinicLogo: (logo) => setData((current) => ({ ...current, clinic: { ...current.clinic, logo } })),
    updateClinicSignature: (signature) => setData((current) => ({ ...current, clinic: { ...current.clinic, signature } })),
    resetDemo: () => setData(cloneSeed()),
  }), []);

  return { data, isOnline, ...actions };
}

export function formatArabicDate(dateValue) {
  return new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateValue));
}

export function openWhatsApp(phone, message) {
  const normalized = String(phone || "").replace(/[^\d]/g, "");
  if (!normalized) return;
  window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}
