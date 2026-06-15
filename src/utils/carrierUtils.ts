import type { CarrierInfo } from '@/types';

const carriers: CarrierInfo[] = [
  {
    name: '顺丰速运',
    patterns: [/^SF\d{12}$/i, /^90\d{10}$/, /^95\d{10}$/],
    color: '#000000',
  },
  {
    name: '京东物流',
    patterns: [/^JD\d{13}$/i, /^01\d{11}$/, /^66\d{11}$/],
    color: '#E4393C',
  },
  {
    name: '圆通速递',
    patterns: [/^8\d{11}$/, /^D\d{12}$/i, /^G\d{12}$/i],
    color: '#FF6600',
  },
  {
    name: '中通快递',
    patterns: [/^7\d{13}$/, /^5\d{13}$/, /^6\d{13}$/],
    color: '#00A0E9',
  },
  {
    name: '韵达快递',
    patterns: [/^3\d{12}$/, /^4\d{12}$/],
    color: '#0078D7',
  },
  {
    name: '申通快递',
    patterns: [/^55\d{11}$/, /^22\d{11}$/, /^77\d{11}$/],
    color: '#FF5000',
  },
  {
    name: '百世快递',
    patterns: [/^51\d{12}$/, /^52\d{12}$/, /^70\d{12}$/],
    color: '#009B72',
  },
  {
    name: '邮政EMS',
    patterns: [/^E[A-Z]\d{9}[A-Z]{2}$/i, /^9[5-9]\d{11}$/, /^10\d{11}$/],
    color: '#00885A',
  },
  {
    name: '极兔速递',
    patterns: [/^JT\d{13}$/i, /^50\d{12}$/],
    color: '#E60012',
  },
];

export function detectCarrier(trackingNumber: string): string {
  const cleanedNumber = trackingNumber.replace(/\s/g, '').toUpperCase();
  
  for (const carrier of carriers) {
    for (const pattern of carrier.patterns) {
      if (pattern.test(cleanedNumber)) {
        return carrier.name;
      }
    }
  }
  
  return '其他快递';
}

export function getCarrierColor(carrierName: string): string {
  const carrier = carriers.find(c => c.name === carrierName);
  return carrier?.color || '#6B7280';
}

export function formatTrackingNumber(trackingNumber: string): string {
  const cleaned = trackingNumber.replace(/\s/g, '');
  if (cleaned.length <= 8) return cleaned;
  
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function validateTrackingNumber(trackingNumber: string): boolean {
  const cleaned = trackingNumber.replace(/\s/g, '');
  return cleaned.length >= 8 && cleaned.length <= 20 && /^[A-Za-z0-9]+$/.test(cleaned);
}
