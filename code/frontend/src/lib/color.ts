export function hashHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

export interface SlimeColors {
  light: string;
  base: string;
  deep: string;
}

export function slimeColors(hue: number): SlimeColors {
  return {
    light: `oklch(0.87 0.09 ${hue})`,
    base: `oklch(0.74 0.13 ${hue})`,
    deep: `oklch(0.50 0.12 ${hue})`,
  };
}
