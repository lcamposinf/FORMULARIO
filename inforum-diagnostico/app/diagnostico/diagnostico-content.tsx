"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

// Forzar renderizado sólo en cliente (el wrapper ya está en page.tsx)
export const dynamic = "force-dynamic";

// ---- Configuración del cuestionario (tus 7 preguntas originales) ----
const QUESTIONS = [
  {
    id: "industria",
    label: "¿En qué industria opera la compañía?",
    type: "single" as const,
    options: [
      { value: "produccion", label: "Producción", score: 2 },
      { value: "distribucion", label: "Distribución", score: 2 },
      { value: "retail", label: "Retail", score: 2 },
      { value: "servicios", label: "Servicios", score: 1 },
      { value: "otro", label: "Otro (especificar)", score: 1, requiresText: true },
    ],
    required: true,
  },
  {
    id: "erp",
    label: "¿Qué sistema empresarial (ERP) utiliza actualmente su empresa?",
    type: "single" as const,
    options: [
      { value: "sapb1", label: "SAP Business One", score: 2 },
      { value: "odoo", label: "Odoo", score: 2 },
      { value: "oracle", label: "Oracle", score: 2 },
      { value: "msdynamics", label: "Microsoft Dynamics", score: 1 },
      { value: "sistema_propio", label: "Sistema Propio", score: 2 },
      { value: "erp_otro", label: "Otro (especificar)", score: 2, requiresText: true },
    ],
    required: true,
  },
  {
    id: "personas",
    label: "¿Cuántas personas dependen del sistema para su trabajo diario?",
    type: "single" as const,
    options: [
      { value: ">20", label: "+20 personas", score: 2 },
      { value: "<=20", label: "-20 personas", score: 1 },
    ],
    required: true,
  },
  {
    id: "paises",
    label: "¿La compañía opera en 1 o varios países?",
    type: "single" as const,
    options: [
      { value: "1", label: "1 país", score: 1 },
      { value: ">1", label: "Varios países", score: 2 },
    ],
    required: true,
  },
  {
    id: "lineas",
    label: "¿Cuántas líneas de negocio tiene la compañía?",
    type: "single" as const,
    options: [
      { value: "1", label: "1 línea de negocio", score: 1 },
      { value: ">1", label: "Múltiples líneas de negocio", score: 2 },
    ],
    required: true,
  },
  {
    id: "satisfaccion",
    label: "¿Nivel de satisfacción con el sistema actual?",
    type: "single" as const,
    options: [
      { value: "1-3", label: "1-3 (insatisfecho)", score: 2 },
      { value: "4-6", label: "4-6 (puede mejorar)", score: 2 },
      { value: "7-10", label: "7-10 (cumple)", score: 1 },
    ],
    required: true,
  },
  {
    id: "protecnologia",
    label: "¿La empresa es pro-tecnología?",
    type: "single" as const,
    options: [
      { value: "si", label: "Sí", score: 2 },
      { value: "no", label: "No", score: 1 },
    ],
    required: true,
  },
] as const;

type Answer = {
  id: string;
  value: string;
  score: 1 | 2;
  extraText?: string;
};

const COUNTRIES = [
  { value: "GT", label: "Guatemala" },
  { value: "SV", label: "El Salvador" },
  { value: "HN", label: "Honduras" },
  { value: "PA", label: "Panamá" },
  { value: "DO", label: "República Dominicana" },
  { value: "EC", label: "Ecuador" },
] as const;

type CountryValue = typeof COUNTRIES[number]["value"];

const FREE_EMAIL_DOMAINS = [
  "gmail.com","hotmail.com","outlook.com","yahoo.com","icloud.com","proton.me","aol.com","live.com","msn.com"
];

function isCorporateEmail(email: string) {
  const domain = email.split("@").pop()?.toLowerCase().trim();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.includes(domain);
}

/* =========================
   HELPER: Enviar a la API
   ========================= */
async function submitDiagnostico(payload: {
  name: string;
  company?: string;
  email: string;
  country?: string;
  answers?: any;
}) {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Error ${res.status}`);
  }
  return json; // { ok: true }
}

export default function DiagnosticoContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1 preguntas, 2 datos, 3 consentimiento
  const [answers, setAnswers] = useState<Record<string, Answer | undefined>>({});
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    country: "GT" as CountryValue,
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverResp, setServerResp] = useState<null | { ok: boolean; message: string; title: string; resultKey: "califica" | "nocupo" }>(null);

  const utms = useMemo(() => {
    const keys = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"] as const;
    const x: Record<string,string> = {};
    keys.forEach(k => { const v = searchParams.get(k); if (v) x[k] = v; });
    return x;
  }, [searchParams]);

  const progressPct = useMemo(() => (step / 3) * 100, [step]);

  const handleSelect = (qid: string, optionValue: string) => {
    const q = QUESTIONS.find(q => q.id === qid)!;
    const opt = q.options.find(o => o.value === optionValue)!;
    setAnswers(prev => ({ ...prev, [qid]: { id: qid, value: optionValue, score: (opt.score as 1|2) } }));
  };

  const handleExtraText = (qid: string, text: string) => {
    const existing = answers[qid];
    if (!existing) return;
    setAnswers(prev => ({ ...prev, [qid]: { ...existing, extraText: text } }));
  };

  const canContinueQuestions = useMemo(() => {
    return QUESTIONS.every(q => !!answers[q.id]);
  }, [answers]);

  const canContinueData = useMemo(() => {
    return (
      form.name.trim().length > 1 &&
      form.company.trim().length > 1 &&
      /.+@.+\..+/.test(form.email) &&
      isCorporateEmail(form.email)
    );
  }, [form]);

  /* =========================
     SUBMIT final (usa helper)
     ========================= */
  const onSubmit = async () => {
    setErrorMsg(null);
    if (!form.consent) {
      setErrorMsg("Debes aceptar el consentimiento para continuar.");
      return;
    }
    setLoading(true);
    setServerResp(null);

    try {
      // Construir respuestas de forma compacta
      const finalAnswers = Object.values(answers);

      // Convertir código de país a etiqueta legible (ej. GT -> Guatemala)
      const countryLabel = COUNTRIES.find(c => c.value === form.country)?.label || form.country;

      // Payload que espera la API (/api/submit)
      const payload = {
        name: form.name,
        company: form.company,
        email: form.email,
        country: countryLabel,
        answers: {
          utms,         // útil para notas en Pipedrive
          items: finalAnswers,
        },
      };

      await submitDiagnostico(payload);

      // Como el endpoint devuelve { ok: true }, armamos el mensaje localmente
      setServerResp({
        ok: true,
        title: "¡Listo! Aquí está tu resultado",
        message:
          "Hemos registrado tus respuestas y te contactaremos en breve. Si calificas, puedes escribirnos por WhatsApp para acelerar el proceso.",
        resultKey: "califica",
      });
    } catch (e: any) {
      setServerResp({
        ok: false,
        title: "Error",
        message: e?.message || "No se logró enviar. Intenta de nuevo.",
        resultKey: "nocupo",
      });
    } finally {
      setLoading(false);
    }
  };

  if (serverResp?.ok) {
    return (
      <main className="mx-auto max-w-3xl"><div className="card p-6">
        <div className="progress-track mb-6">
          <div className="progress-fill" style={{ width: "100%" }} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">{serverResp.title}</h1>
        <p className="text-gray-700 mb-6">{serverResp.message}</p>
        {serverResp.resultKey === "califica" ? (
          <a
            href="https://wa.me/50242170962?text=Hola%2C%20vengo%20del%20diagn%C3%B3stico"
            className="btn-primary"
          >
            Ir a WhatsApp
          </a>
        ) : null}
      </div></main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl"><div className="card p-6">
      {/* Barra de progreso */}
      <div className="progress-track mb-6">
        <div className="h-2 bg-blue-500 rounded transition-all" style={{ width: `${progressPct}%` }} />
      </div>

      <h1 className="text-2xl font-semibold mb-4">Diagnóstico para Radiografía de Software de Gestión Empresarial</h1>
      <p className="text-gray-600 mb-4">Completa el cuestionario y conoce tu resultado al instante.</p>
      {errorMsg && <p className="text-sm text-red-600 mb-4">{errorMsg}</p>}

      {/* Paso 1: Preguntas */}
      {step === 1 && (
        <section className="space-y-6">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="p-4 rounded-2xl border border-gray-200">
              <label className="font-medium block mb-3">{q.label}</label>
              <div className="space-y-2">
                {q.options.map((o) => (
                  <div key={o.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`${q.id}_${o.value}`}
                      name={q.id}
                      className="cursor-pointer"
                      onChange={() => handleSelect(q.id, o.value)}
                      checked={answers[q.id]?.value === o.value}
                    />
                    <label htmlFor={`${q.id}_${o.value}`} className="cursor-pointer">
                      {o.label}
                    </label>
                  </div>
                ))}
              </div>
              {q.options.some(o => (o as any).requiresText) && answers[q.id]?.value?.includes("otro") && (
                <input
                  type="text"
                  placeholder="Especifica aquí"
                  className="mt-3 w-full border rounded-xl px-3 py-2"
                  onChange={(e) => handleExtraText(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canContinueQuestions}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 2: Datos de contacto */}
      {step === 2 && (
        <section className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Empresa</label>
            <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <label className="label">Correo empresarial</label>
            <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            {form.email && !isCorporateEmail(form.email) && (
              <p className="text-sm text-red-600 mt-1">Usa un correo corporativo (no gmail/hotmail/outlook/yahoo, etc.).</p>
            )}
          </div>
          <div>
            <label className="label">País</label>
            <select className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value as CountryValue })}>
              {COUNTRIES.map(c => (<option key={c.value} value={c.value}>{c.label}</option>))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-5 py-3 rounded-2xl border">Atrás</button>
            <button
              onClick={() => setStep(3)}
              disabled={!canContinueData}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {/* Paso 3: Consentimiento y envío */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl border border-gray-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={e => setForm({ ...form, consent: e.target.checked })}
              />
              <span>
                Autorizo a Grupo Inforum a contactarme respecto a esta evaluación y servicios relacionados. He leído la{" "}
                {process.env.NEXT_PUBLIC_PRIVACY_URL ? (
                  <a
                    href={process.env.NEXT_PUBLIC_PRIVACY_URL}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Política de Privacidad
                  </a>
                ) : (
                  <span className="font-medium">Política de Privacidad</span>
                )}.
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setStep(2)} className="px-5 py-3 rounded-2xl border">Atrás</button>
            <button
              onClick={onSubmit}
              disabled={loading || !form.consent}
              className="px-5 py-3 rounded-2xl shadow bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Haz clic para conocer tu resultado"}
            </button>
          </div>
        </section>
      )}
    </div></main>
  );
}
