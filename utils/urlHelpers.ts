// URL Helpers and Validators

export function isValidUrl(urlString: string): boolean {
  if (!urlString || urlString.trim() === '') return false;
  const trimmed = urlString.trim();
  // Allow wifi format or standard URLs
  if (trimmed.startsWith('WIFI:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return true;
  }
  try {
    const url = new URL(
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`
    );
    return url.hostname.includes('.') && url.hostname.length > 3;
  } catch {
    return false;
  }
}

export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('WIFI:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  // Clean phone: keep only numbers
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return '';
  const encodedMsg = message ? encodeURIComponent(message.trim()) : '';
  return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

export function buildInstagramUrl(handle: string): string {
  const cleanHandle = handle.trim().replace(/^@/, '');
  if (!cleanHandle) return '';
  return `https://instagram.com/${cleanHandle}`;
}

export function buildDiscordUrl(invite: string): string {
  const cleanInvite = invite
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(discord\.gg\/|discord\.com\/invite\/)/, '');
  if (!cleanInvite) return '';
  return `https://discord.gg/${cleanInvite}`;
}

export function buildWifiString(
  ssid: string,
  password: string,
  encryption: 'WPA' | 'WEP' | 'nopass' = 'WPA'
): string {
  return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
}
