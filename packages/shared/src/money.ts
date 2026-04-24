/**
 * Round a cent-based money value using the platform half-up rule.
 *
 * @example
 * roundHalfUp(1519.5)
 */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`value must be finite, received ${value}`);
  }

  return Math.round(value);
}

function parseRateParts(rate: number): {
  numerator: number;
  denominator: number;
} {
  const normalizedRate = rate.toString();

  if (!/^\d+(?:\.\d+)?$/.test(normalizedRate)) {
    throw new RangeError(
      `discountRate must be a decimal between 0 and 1, received ${rate}`,
    );
  }

  const [wholePart, fractionPart = ""] = normalizedRate.split(".");
  const denominator = 10 ** fractionPart.length;
  const numerator = Number(`${wholePart}${fractionPart}`);

  return {
    numerator,
    denominator,
  };
}

/**
 * Apply a discount rate to integer cents and return integer cents.
 *
 * @example
 * applyDiscount(15990, 0.05)
 */
export function applyDiscount(
  priceCents: number,
  discountRate: number,
): number {
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new TypeError(
      `priceCents must be a non-negative integer, received ${priceCents}`,
    );
  }

  if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 1) {
    throw new RangeError(
      `discountRate must be between 0 and 1, received ${discountRate}`,
    );
  }

  const { numerator, denominator } = parseRateParts(discountRate);
  const discountCents = Math.round((priceCents * numerator) / denominator);
  return priceCents - discountCents;
}

/**
 * Split a total into installment values whose exact sum matches the original total.
 * The first installments absorb the remainder so the last installment never exceeds the others.
 *
 * @example
 * splitInstallments(100, 3)
 */
export function splitInstallments(
  totalCents: number,
  installments: number,
): number[] {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new TypeError(
      `totalCents must be a non-negative integer, received ${totalCents}`,
    );
  }

  if (!Number.isInteger(installments) || installments <= 0) {
    throw new RangeError(
      `installments must be a positive integer, received ${installments}`,
    );
  }

  const baseInstallment = Math.floor(totalCents / installments);
  const remainder = totalCents - baseInstallment * installments;

  return Array.from({ length: installments }, (_, index) => {
    if (index < remainder) {
      return baseInstallment + 1;
    }

    return baseInstallment;
  });
}

/**
 * Format integer cents as BRL for display.
 *
 * @example
 * formatBRL(15990)
 */
export function formatBRL(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`cents must be an integer, received ${cents}`);
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
