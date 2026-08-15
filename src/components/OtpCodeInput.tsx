"use client";

import { useRef } from "react";

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  dark?: boolean;
  autoFocus?: boolean;
}

/** Six separate single-digit boxes instead of one text field — auto-advances
 * focus as each digit is typed, supports backspace-to-previous, and fills
 * every box at once when a full code is pasted (from a password manager or
 * copied out of the e-mail). */
export default function OtpCodeInput({ value, onChange, length = 6, disabled, dark, autoFocus }: OtpCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setDigit(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
    if (digit && index < length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  const boxClass = dark
    ? "border-white/10 bg-white/5 text-white focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]"
    : "border-gray-200 bg-white text-gray-900 focus:border-[#1E8E5A] focus:ring-1 focus:ring-[#1E8E5A]";

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          value={digit}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`h-12 w-full min-w-0 rounded-xl border text-center text-lg font-semibold outline-none transition disabled:opacity-50 ${boxClass}`}
        />
      ))}
    </div>
  );
}
