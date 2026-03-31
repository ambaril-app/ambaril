"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const FREE_PROVIDERS = [
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com",
  "live.com", "yahoo.com", "yahoo.com.br", "icloud.com",
  "me.com", "uol.com.br", "bol.com.br", "terra.com.br",
  "ig.com.br", "r7.com", "msn.com",
];

function isCommercialEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? !FREE_PROVIDERS.includes(domain) : false;
}

type StepDef = {
  id: string;
  question: string;
  hint?: string;
  type: "email" | "text" | "select" | "textarea";
  placeholder?: string;
  required: boolean;
  options?: { value: string; label: string }[];
};

const STEPS: StepDef[] = [
  {
    id: "email",
    question: "Qual o seu melhor e-mail?",
    hint: "Apenas endereços corpotativos",
    type: "email",
    placeholder: "voce@suaempresa.com",
    required: true,
  },
  {
    id: "name",
    question: "Qual o seu nome?",
    type: "text",
    placeholder: "Seu nome",
    required: true,
  },
  {
    id: "brand",
    question: "Qual o nome da sua empresa?",
    type: "text",
    placeholder: "Nome da marca",
    required: true,
  },
  {
    id: "platform",
    question: "Onde você vende hoje?",
    type: "select",
    required: true,
    options: [
      { value: "shopify", label: "Shopify" },
      { value: "nuvemshop", label: "Nuvemshop" },
      { value: "vnda", label: "VNDA" },
      { value: "vtex", label: "VTEX" },
      { value: "outra", label: "Outra" },
    ],
  },
  {
    id: "revenue",
    question: "Faturamento mensal da operação?",
    type: "select",
    required: true,
    options: [
      { value: "até_50k", label: "Até R$ 50k" },
      { value: "50k_200k", label: "R$ 50k – 200k" },
      { value: "200k_500k", label: "R$ 200k – 500k" },
      { value: "500k_2m", label: "R$ 500k – 2M" },
      { value: "acima_2m", label: "Acima de R$ 2M" },
    ],
  },
  {
    id: "pain",
    question: "O que trava sua operação hoje?",
    hint: "Opcional. Pode ser direto.",
    type: "textarea",
    placeholder: "Descreva com suas palavras.",
    required: false,
  },
];

interface WaitlistFormProps {
  onBack: () => void;
}

export function WaitlistForm({ onBack }: WaitlistFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepKey, setStepKey] = useState(0); // increments to trigger re-mount + entrance anim
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pendingSelect, setPendingSelect] = useState(""); // visual feedback for select
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const step = STEPS[currentStep];
  const currentValue = answers[step.id] ?? "";

  // Clear error + autofocus on every step transition
  useEffect(() => {
    setError("");
    setPendingSelect(answers[step.id] ?? "");
    const t = setTimeout(() => {
      inputRef.current?.focus();
      textareaRef.current?.focus();
    }, 150); // after entrance animation starts
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);

  const advance = useCallback(
    async (value: string) => {
      const newAnswers = { ...answers, [step.id]: value };
      setAnswers(newAnswers);

      if (currentStep < STEPS.length - 1) {
        setStepKey((k) => k + 1);
        setCurrentStep((s) => s + 1);
      } else {
        setSubmitting(true);
        try {
          const res = await fetch("/api/waitlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newAnswers),
          });
          if (!res.ok) throw new Error();
          router.push("/acesso/confirmacao");
        } catch {
          setSubmitting(false);
          setError("Algo deu errado. Tente novamente.");
        }
      }
    },
    [answers, currentStep, step.id, router]
  );

  const handleNext = useCallback(() => {
    const value = currentValue;
    if (step.required && !value.trim()) {
      setError("Este campo é obrigatório.");
      return;
    }
    if (step.id === "email" && value && !isCommercialEmail(value)) {
      setError("Use o email corporativo da sua marca. Sem Gmail, Hotmail etc.");
      return;
    }
    advance(value.trim());
  }, [currentValue, step, advance]);

  const handleSelectOption = useCallback(
    (value: string) => {
      setPendingSelect(value);
      // Short delay so user sees the selection before advancing
      setTimeout(() => advance(value), 200);
    },
    [advance]
  );

  const goBack = useCallback(() => {
    if (currentStep === 0) {
      onBack();
    } else {
      setStepKey((k) => k + 1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep, onBack]);

  // Enter key to advance (not for select/textarea)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && step.type !== "textarea" && step.type !== "select") {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, step.type]);

  // Shared styles for bottom-border text inputs
  const textInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "16px 0 14px",
    border: "none",
    borderBottom: `1px solid ${error ? "oklch(52% 0.18 25)" : "oklch(32% 0.016 220)"}`,
    borderRadius: 0,
    background: "transparent",
    fontFamily: step.type === "email" ? "var(--font-mono)" : "var(--font)",
    fontSize: "22px",
    fontWeight: 400,
    color: "#E8EAF0",
    outline: "none",
    letterSpacing: step.type === "email" ? "0.02em" : "-0.01em",
    caretColor: "oklch(68% 0.052 215)",
    transition: "border-bottom-color 200ms ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#07080B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        overflow: "hidden",
      }}
    >
      {/* Background Silmaril */}
      <div aria-hidden="true" className="acesso-silmaril" />

      {/* Top nav: back + step counter */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <button
          onClick={goBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "oklch(50% 0.020 220)",
            fontSize: "12px",
            fontFamily: "var(--font)",
            padding: 0,
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(66% 0.024 220)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(50% 0.020 220)"; }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "oklch(44% 0.018 220)",
            letterSpacing: "0.06em",
          }}
        >
          {currentStep + 1}&thinsp;/&thinsp;{STEPS.length}
        </span>
      </div>

      {/* Step — key changes on every navigation, triggering entrance animation */}
      <div
        key={stepKey}
        className="interview-step-enter"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "520px",
        }}
      >
        {/* Question */}
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px, 3.5vw, 34px)",
            fontWeight: 500,
            letterSpacing: "-0.022em",
            lineHeight: 1.15,
            color: "#E8EAF0",
            marginBottom: step.hint ? "8px" : "28px",
          }}
        >
          {step.question}
        </h2>

        {step.hint && (
          <p
            style={{
              fontSize: "13px",
              color: "oklch(52% 0.020 220)",
              marginBottom: "28px",
              lineHeight: 1.5,
            }}
          >
            {step.hint}
          </p>
        )}

        {/* ── Select: option buttons ── */}
        {step.type === "select" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {step.options?.map((opt) => {
              const isSelected = pendingSelect === opt.value || (pendingSelect === "" && currentValue === opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectOption(opt.value)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "6px",
                    border: `1px solid ${isSelected ? "oklch(60% 0.050 215)" : "oklch(30% 0.016 220)"}`,
                    background: isSelected ? "oklch(14% 0.012 220)" : "transparent",
                    color: isSelected ? "#E8EAF0" : "oklch(60% 0.022 220)",
                    fontFamily: "var(--font)",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "border-color 150ms, color 150ms, background 150ms",
                    letterSpacing: "-0.01em",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "oklch(46% 0.022 220)";
                      e.currentTarget.style.color = "oklch(74% 0.024 220)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = "oklch(30% 0.016 220)";
                      e.currentTarget.style.color = "oklch(60% 0.022 220)";
                    }
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Textarea ── */}
        {step.type === "textarea" && (
          <>
            <textarea
              ref={textareaRef}
              name={step.id}
              value={currentValue}
              onChange={(e) => {
                setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }));
                setError("");
              }}
              placeholder={step.placeholder}
              rows={4}
              className="interview-field"
              style={{
                width: "100%",
                padding: "16px 0 12px",
                border: "none",
                borderBottom: `1px solid ${error ? "oklch(52% 0.18 25)" : "oklch(32% 0.016 220)"}`,
                borderRadius: 0,
                background: "transparent",
                fontFamily: "var(--font)",
                fontSize: "18px",
                color: "#E8EAF0",
                outline: "none",
                resize: "none",
                caretColor: "oklch(68% 0.052 215)",
                lineHeight: 1.65,
                transition: "border-bottom-color 200ms ease",
              }}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderBottomColor = "oklch(58% 0.032 220)";
              }}
              onBlur={(e) => {
                if (!error) e.currentTarget.style.borderBottomColor = "oklch(32% 0.016 220)";
              }}
            />
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                style={{
                  padding: "12px 28px",
                  borderRadius: "7px",
                  border: "none",
                  background: submitting ? "oklch(16% 0.012 220)" : "#F7F8FA",
                  color: submitting ? "oklch(36% 0.018 220)" : "#07080B",
                  fontFamily: "var(--font)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 200ms ease",
                  letterSpacing: "-0.01em",
                }}
                onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#E8EAF0"; }}
                onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = "#F7F8FA"; }}
              >
                {submitting ? "Enviando..." : "Enviar"}
              </button>
              {!step.required && (
                <button
                  type="button"
                  onClick={() => advance("")}
                  disabled={submitting}
                  style={{
                    padding: "12px 0",
                    background: "none",
                    border: "none",
                    cursor: submitting ? "not-allowed" : "pointer",
                    color: "oklch(48% 0.020 220)",
                    fontFamily: "var(--font)",
                    fontSize: "13px",
                    letterSpacing: "0.01em",
                    transition: "color 150ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(64% 0.022 220)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(48% 0.020 220)"; }}
                >
                  Pular
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Text / Email input ── */}
        {(step.type === "text" || step.type === "email") && (
          <>
            <input
              ref={inputRef}
              type={step.type}
              name={step.id}
              value={currentValue}
              onChange={(e) => {
                setAnswers((prev) => ({ ...prev, [step.id]: e.target.value }));
                setError("");
              }}
              placeholder={step.placeholder}
              autoComplete={
                step.type === "email" ? "email" :
                  step.id === "name" ? "name" : "off"
              }
              className="interview-field"
              style={textInputStyle}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderBottomColor = "oklch(58% 0.032 220)";
              }}
              onBlur={(e) => {
                if (!error) e.currentTarget.style.borderBottomColor = "oklch(32% 0.016 220)";
              }}
            />

            {/* Continue affordance */}
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={handleNext}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "oklch(54% 0.022 220)",
                  fontFamily: "var(--font)",
                  fontSize: "12px",
                  letterSpacing: "0.01em",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(70% 0.026 220)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(54% 0.022 220)"; }}
              >
                Continuar
                <svg
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <span style={{ fontSize: "11px", color: "oklch(40% 0.018 220)", letterSpacing: "0.02em" }}>
                ou pressione Enter ↵
              </span>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p
            style={{
              marginTop: "12px",
              fontSize: "12px",
              color: "oklch(62% 0.16 25)",
              letterSpacing: "0.01em",
            }}
          >
            {error}
          </p>
        )}
      </div>

      {/* Progress bar — 1px at very bottom */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "oklch(20% 0.013 220)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: "100%",
            background: "oklch(50% 0.044 215)",
            transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            width: `${((currentStep + 1) / STEPS.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
