/**
 * Maps Lucide icon names (from API/fallback data) to emoji characters.
 * Used by Step2GroupPicker and Step3SubtypePicker to render icons
 * when the data source returns Lucide string names instead of emojis.
 */
export const ICON_MAP: Record<string, string> = {
  // Groups
  Droplet: '💧', TestTube: '🧪', ScanLine: '📡', Activity: '💓',
  ClipboardCheck: '📋', Sparkles: '⚡', Network: '🌐',
  
  // Collection
  MapPin: '📍', Home: '🏠',
  
  // Pathology  
  Microscope: '🔬', Dna: '🧬', Bug: '🦠', Droplets: '🩸',
  
  // Imaging
  Target: '🎯', Atom: '⚛️', Shield: '🛡️', Bone: '🦴',
  Smile: '😁', Eye: '👁️',
  
  // Physiological
  Heart: '❤️', Wind: '💨', Brain: '🧠', Flower: '🌸',
  Moon: '🌙', Ear: '👂', Gauge: '📊', Telescope: '🔭',
  
  // Packages
  Briefcase: '💼',
  
  // Specialty
  Baby: '👶', Layers: '🧫', ShieldAlert: '⚠️',
  
  // Hub-digital
  Radio: '📻', Globe: '🌍',
};

/** Convert a Lucide icon name to emoji. If already an emoji, return as-is. */
export function toEmoji(icon: string | null | undefined): string {
  if (!icon) return '🏥';
  // If it's already an emoji (starts with non-ASCII), return as-is
  if (icon.charCodeAt(0) > 255) return icon;
  // Look up in map
  return ICON_MAP[icon] || '🏥';
}
