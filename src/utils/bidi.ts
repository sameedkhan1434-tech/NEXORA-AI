const URDU_ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

export type DetectedScript = 'urdu' | 'hindi' | 'latin';

export function detectTextScript(text: string): DetectedScript {
  if (!text) return 'latin';
  // Count script characters in the first 300 chars for fast, reliable detection
  const sample = text.slice(0, 300);
  let urduCount = 0;
  let hindiCount = 0;
  let latinCount = 0;

  for (const ch of sample) {
    if (URDU_ARABIC_REGEX.test(ch)) {
      urduCount++;
    } else if (DEVANAGARI_REGEX.test(ch)) {
      hindiCount++;
    } else if (/[A-Za-z]/.test(ch)) {
      latinCount++;
    }
  }

  if (urduCount >= 3 && urduCount >= hindiCount && urduCount >= latinCount * 0.4) {
    return 'urdu';
  }
  if (hindiCount >= 3 && hindiCount >= urduCount && hindiCount >= latinCount * 0.4) {
    return 'hindi';
  }
  return 'latin';
}

export function getScriptClass(text: string): string {
  const script = detectTextScript(text);
  if (script === 'urdu') return 'font-urdu';
  if (script === 'hindi') return 'font-hindi';
  return '';
}

export function getTextDir(text: string): 'rtl' | 'ltr' {
  return detectTextScript(text) === 'urdu' ? 'rtl' : 'ltr';
}
