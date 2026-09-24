import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CheckCircle2, Copy, ImagePlus, Loader2, QrCode, RefreshCw, ScanLine, X } from "lucide-react";

export default function CameraCapture({ onClose, onCapture }) {
  const [mode, setMode] = useState("camera");
  const [capturedImage, setCapturedImage] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const webcamRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (mode !== "scan") return undefined;
    let scanner;
    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode("clinic-qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            setScanResult(decodedText);
            scanner.stop().catch(() => undefined);
          },
          () => undefined,
        );
      } catch {
        setCameraError(true);
      }
    };
    startScanner();
    return () => {
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => undefined);
      scannerRef.current = null;
    };
  }, [mode]);

  const capture = () => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setCapturedImage(image);
      onCapture?.({ type: "image", value: image });
    }
  };

  const confirmScan = () => {
    if (scanResult) onCapture?.({ type: "qr", value: scanResult });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-600">ملفات المرضى</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">التقاط صورة أو قراءة كود المريض</h2>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="إغلاق"><X size={19} /></button>
        </div>

        <div className="flex gap-2 border-b border-slate-100 px-5 pt-4 sm:px-7">
          <button onClick={() => setMode("camera")} className={`capture-tab ${mode === "camera" ? "capture-tab-active" : ""}`}><Camera size={16} /> التقاط صورة</button>
          <button onClick={() => setMode("scan")} className={`capture-tab ${mode === "scan" ? "capture-tab-active" : ""}`}><QrCode size={16} /> مسح QR / باركود</button>
        </div>

        <div className="p-5 sm:p-7">
          {mode === "camera" ? (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-900">
                {capturedImage ? <img src={capturedImage} alt="المعاينة الملتقطة" className="h-full w-full object-cover" /> : <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} onUserMediaError={() => setCameraError(true)} className="h-full w-full object-cover" />}
                {!capturedImage && <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="h-40 w-64 rounded-2xl border-2 border-dashed border-white/70" /></div>}
                {cameraError && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 px-6 text-center text-white"><Camera size={30} className="mb-3 text-teal-300" /><p className="text-sm font-bold">تعذر الوصول إلى الكاميرا</p><p className="mt-1 text-xs text-slate-300">تأكد من منح المتصفح الإذن أو استخدم رفع صورة من جهازك.</p></div>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={capturedImage ? () => setCapturedImage("") : capture} className="primary-button flex-1"><Camera size={17} /> {capturedImage ? "التقاط من جديد" : "التقاط الآن"}</button>
                <label className="secondary-button flex-1 cursor-pointer"><ImagePlus size={17} /> رفع صورة<input type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => { setCapturedImage(String(reader.result)); onCapture?.({ type: "image", value: String(reader.result) }); }; reader.readAsDataURL(file); } }} /></label>
              </div>
              {capturedImage && <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><span className="flex items-center gap-2"><CheckCircle2 size={17} /> تم حفظ المعاينة محلياً</span><button onClick={onClose} className="text-emerald-900 underline">إغلاق</button></div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-3"><div id="clinic-qr-reader" className="min-h-64 w-full overflow-hidden rounded-xl" />{!scanResult && <div className="pointer-events-none absolute inset-x-12 top-1/2 h-px animate-pulse bg-teal-300 shadow-[0_0_18px_4px_rgba(45,212,191,0.65)]" />}</div>
              {cameraError && <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">لم يبدأ الماسح تلقائياً. يمكنك إدخال الكود يدوياً في الحقل أدناه.</div>}
              <label className="field-label">كود المريض أو التذكرة<input value={scanResult} onChange={(event) => setScanResult(event.target.value)} placeholder="مثال: PT-1048" className="input mt-2" /></label>
              <div className="flex gap-2"><button onClick={() => { setScanResult(""); setMode("scan"); }} className="secondary-button"><RefreshCw size={16} /> إعادة المسح</button><button onClick={confirmScan} disabled={!scanResult} className="primary-button flex-1 disabled:cursor-not-allowed disabled:opacity-40"><ScanLine size={17} /> اعتماد الكود</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
