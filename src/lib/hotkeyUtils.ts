export const KEY_MAP: Record<string, string> = {
  'Ф': 'A', 'И': 'B', 'С': 'C', 'В': 'D', 'У': 'E', 'А': 'F', 'П': 'G', 'Р': 'H', 'Ш': 'I', 'О': 'J',
  'Л': 'K', 'Д': 'L', 'Ь': 'M', 'Т': 'N', 'Щ': 'O', 'З': 'P', 'Й': 'Q', 'К': 'R', 'Ы': 'S', 'Е': 'T',
  'Г': 'U', 'М': 'V', 'Ц': 'W', 'Ч': 'X', 'Н': 'Y', 'Я': 'Z',
  'ф': 'a', 'и': 'b', 'с': 'c', 'в': 'd', 'у': 'e', 'а': 'f', 'п': 'g', 'р': 'h', 'ш': 'i', 'о': 'j',
  'л': 'k', 'д': 'l', 'ь': 'm', 'т': 'n', 'щ': 'o', 'з': 'p', 'й': 'q', 'к': 'r', 'ы': 's', 'е': 't',
  'г': 'u', 'м': 'v', 'ц': 'w', 'ч': 'x', 'н': 'y', 'я': 'z'
};

export const normalizeToEnglish = (hotkey: string): string => {
  if (!hotkey || typeof hotkey !== 'string') return '';
  return hotkey.split('+').map(part => {
    if (!part) return '';
    if (part.length === 1 && KEY_MAP[part]) return KEY_MAP[part].toUpperCase();
    return part.toUpperCase();
  }).join('+');
};

export const matchesHotkey = (pressedCombo: string, storedCombo: string): boolean => {
  const normalizedPressed = normalizeToEnglish(pressedCombo);
  const normalizedStored = normalizeToEnglish(storedCombo);
  
  return normalizedPressed === normalizedStored;
};
