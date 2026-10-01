import cardsData from './data/cards.json' with { type: 'json' };

export type CardTypeCategory = 'disorder' | 'drug' | 'episode' | 'therapy' | 'spice';

export interface CardInfoVi {
  id: string;
  nameVi: string;
  nameEn: string;
  type: CardTypeCategory;
  typeVi: string;
  color: string;
  treatsDisorderId?: string;
  treatsVi?: string;
  sideEffectDisorderIds?: string[];
  sideEffectsVi?: string[];
  punishmentVi?: string;
  imagePath: string;
}

const DISORDER_MAP = new Map<string, (typeof cardsData.disorders)[number]>();
for (const d of cardsData.disorders) {
  DISORDER_MAP.set(d.id, d);
}

const DRUG_MAP = new Map<string, (typeof cardsData.drugs)[number]>();
for (const d of cardsData.drugs) {
  DRUG_MAP.set(d.id, d);
}

export function getCardBaseId(rawCardId: string): string {
  if (!rawCardId) return '';
  return rawCardId.split('#')[0]!;
}

export function getCardInfoVi(rawCardId: string): CardInfoVi {
  const baseId = getCardBaseId(rawCardId);

  // 1. Kiểm tra Bệnh Lý (Disorders)
  const disorder = DISORDER_MAP.get(baseId);
  if (disorder) {
    return {
      id: disorder.id,
      nameVi: disorder.nameVi,
      nameEn: disorder.nameEn,
      type: 'disorder',
      typeVi: 'Bệnh Lý',
      color: '#ef4444',
      punishmentVi: disorder.punishment.textVi,
      imagePath: `/cards/${disorder.id}.jpg`,
    };
  }

  // 2. Kiểm tra Thuốc (Drugs)
  const drug = DRUG_MAP.get(baseId);
  if (drug) {
    const treatedDisorder = DISORDER_MAP.get(drug.treats);
    const sideEffectsVi = drug.sideEffects
      .map((sid) => DISORDER_MAP.get(sid)?.nameVi ?? sid);

    return {
      id: drug.id,
      nameVi: drug.nameVi,
      nameEn: drug.nameEn,
      type: 'drug',
      typeVi: 'Thuốc',
      color: '#3b82f6',
      treatsDisorderId: drug.treats,
      treatsVi: treatedDisorder?.nameVi ?? drug.treats,
      sideEffectDisorderIds: drug.sideEffects,
      sideEffectsVi,
      imagePath: `/cards/${drug.id}.jpg`,
    };
  }

  // 3. Triệu Chứng (Episode)
  if (baseId === 'episode' || baseId.startsWith('episode')) {
    return {
      id: 'episode',
      nameVi: 'Triệu Chứng',
      nameEn: 'Episode',
      type: 'episode',
      typeVi: 'Triệu Chứng',
      color: '#f97316',
      imagePath: '/cards/episode.jpg',
    };
  }

  // 4. Liệu Pháp (Therapy)
  if (baseId === 'therapy' || baseId.startsWith('therapy')) {
    return {
      id: 'therapy',
      nameVi: 'Liệu Pháp',
      nameEn: 'Therapy',
      type: 'therapy',
      typeVi: 'Liệu Pháp',
      color: '#10b981',
      imagePath: '/cards/therapy.jpg',
    };
  }

  // 5. Gia Vị (Spice)
  if (baseId === 'misdiagnosis') {
    return {
      id: 'misdiagnosis',
      nameVi: 'Chuẩn đoán sai',
      nameEn: 'Misdiagnosis',
      type: 'spice',
      typeVi: 'Gia Vị',
      color: '#8b5cf6',
      imagePath: '/cards/back.jpg',
    };
  }
  if (baseId === 'highTolerance') {
    return {
      id: 'highTolerance',
      nameVi: 'Kháng thuốc',
      nameEn: 'High Tolerance',
      type: 'spice',
      typeVi: 'Gia Vị',
      color: '#8b5cf6',
      imagePath: '/cards/back.jpg',
    };
  }

  // Fallback
  return {
    id: baseId,
    nameVi: baseId,
    nameEn: baseId,
    type: 'disorder',
    typeVi: 'Lá bài',
    color: '#64748b',
    imagePath: '/cards/back.jpg',
  };
}
