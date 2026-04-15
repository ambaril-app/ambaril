export type MaskType = "cpf" | "phone" | "email" | "token" | "card" | "generic";

/**
 * Masks a single sensitive string value for safe display or logging.
 * Does not mutate — returns masked copy.
 */
export function maskSensitive(
  value: string,
  type: MaskType = "generic",
): string {
  if (!value || typeof value !== "string") return value;

  switch (type) {
    case "cpf": {
      // "123.456.789-00" → "***.***.789-00"
      return value.replace(
        /^(\d{3})[.\-]?(\d{3})[.\-]?(\d{3})[.\-]?(\d{2})$/,
        "***.***.***-**",
      );
    }
    case "phone": {
      // "(11) 99999-0000" → "(11) 9****-0000"
      if (value.length <= 4) return "****";
      return (
        value.slice(0, 4) +
        "*".repeat(Math.max(value.length - 8, 1)) +
        value.slice(-4)
      );
    }
    case "email": {
      const atIdx = value.indexOf("@");
      if (atIdx <= 0) return "***@***";
      const local = value.slice(0, atIdx);
      const domain = value.slice(atIdx);
      const dotIdx = domain.lastIndexOf(".");
      const tld = dotIdx > 0 ? domain.slice(dotIdx) : "";
      return local[0] + "***" + "@" + "***" + tld;
    }
    case "token": {
      // Keep first 6 chars, mask rest
      if (value.length <= 8) return "***";
      return value.slice(0, 6) + "...";
    }
    case "card": {
      // "**** **** **** 3456"
      const digits = value.replace(/\D/g, "");
      if (digits.length < 4) return "****";
      const last4 = digits.slice(-4);
      return "**** **** **** " + last4;
    }
    default: {
      // generic: first 2 + *** + last 2
      if (value.length <= 4) return "***";
      return value.slice(0, 2) + "***" + value.slice(-2);
    }
  }
}
