import cardsDataJson from './data/cards.json' with { type: 'json' };
import type { EKCard, EKCardCategory, EKCardCode } from './types.js';

interface RawCard {
  id: string;
  card_number: number;
  code: string;
  name_en: string;
  name_vi: string;
  variant_subtitle_en?: string;
  variant_subtitle_vi?: string;
  category: string;
  color_hex?: string;
  description_en?: string;
  description_vi?: string;
  sample_image_url?: string;
  image_file?: string;
  image_url?: string;
}

interface RawData {
  cards: RawCard[];
}

const rawData = cardsDataJson as unknown as RawData;

export const ALL_EK_CARDS: EKCard[] = rawData.cards.map((c) => ({
  id: c.id,
  cardNumber: c.card_number,
  code: c.code as EKCardCode,
  nameEn: c.name_en,
  nameVi: c.name_vi,
  variantSubtitleEn: c.variant_subtitle_en,
  variantSubtitleVi: c.variant_subtitle_vi,
  category: c.category as EKCardCategory,
  colorHex: c.color_hex,
  descriptionEn: c.description_en,
  descriptionVi: c.description_vi,
  sampleImageUrl: c.sample_image_url,
  imageFile: c.image_file,
  imageUrl: c.image_url ?? (c.image_file ? `/games/exploding-kittens/cards/${c.image_file}` : undefined),
}));

const cardMap = new Map<string, EKCard>();
for (const card of ALL_EK_CARDS) {
  cardMap.set(card.id, card);
}

export function getAllCards(): EKCard[] {
  return ALL_EK_CARDS;
}

export function getCardById(id: string): EKCard | undefined {
  return cardMap.get(id);
}

export function getCardsByIds(ids: string[]): EKCard[] {
  return ids.map((id) => cardMap.get(id)).filter((c): c is EKCard => c !== undefined);
}

export function isCatCard(card: EKCard): boolean {
  return card.category === 'CAT' || card.code.startsWith('CAT_');
}

export function isActionCard(card: EKCard): boolean {
  return (
    card.code === 'ATTACK' ||
    card.code === 'SKIP' ||
    card.code === 'FAVOR' ||
    card.code === 'SHUFFLE' ||
    card.code === 'SEE_THE_FUTURE'
  );
}

export function getCardCodeNameVi(code: EKCardCode): string {
  switch (code) {
    case 'EXPLODING_KITTEN':
      return 'Mèo Nổ';
    case 'DEFUSE':
      return 'Gỡ Bom (Defuse)';
    case 'NOPE':
      return 'Chặn (Nope)';
    case 'ATTACK':
      return 'Tấn Công (Attack)';
    case 'SKIP':
      return 'Bỏ Lượt (Skip)';
    case 'FAVOR':
      return 'Xin Xỏ (Favor)';
    case 'SHUFFLE':
      return 'Xáo Bài (Shuffle)';
    case 'SEE_THE_FUTURE':
      return 'Nhìn Tương Lai (See the Future)';
    case 'CAT_TACOCAT':
      return 'Mèo Tacocat';
    case 'CAT_CATTERMELON':
      return 'Mèo Dưa Hấu';
    case 'CAT_HAIRY_POTATO':
      return 'Mèo Khoai Tây';
    case 'CAT_BEARD':
      return 'Mèo Râu Riê';
    case 'CAT_RAINBOW_RALPHING':
      return 'Mèo Cầu Vồng';
  }
}
