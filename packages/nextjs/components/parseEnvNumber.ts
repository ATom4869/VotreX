/**
 * Parses a number from env string.
 * Supports optional underscore separator (e.g. "1_000_000").
 * Fallbacks to default if not valid.
 */
export const parseEnvNumber = (
    rawValue: string | undefined,
    defaultValue: number = 0
  ): number => {
    if (!rawValue) return defaultValue;
  
    // Remove underscore if any
    const cleaned = rawValue.replace(/_/g, "");
  
    const parsed = Number(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  