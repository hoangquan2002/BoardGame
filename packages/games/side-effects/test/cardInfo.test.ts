import { describe, it, expect } from 'vitest';
import { getCardInfoVi, getCardBaseId } from '../src/cardInfo.js';
import cardsData from '../src/data/cards.json' with { type: 'json' };

describe('getCardInfoVi', () => {
  it('tách đúng baseId từ cardId có suffix #', () => {
    expect(getCardBaseId('depression#1')).toBe('depression');
    expect(getCardBaseId('fluoxetine#3')).toBe('fluoxetine');
    expect(getCardBaseId('episode#10')).toBe('episode');
    expect(getCardBaseId('therapy#5')).toBe('therapy');
  });

  it('trả về đầy đủ thông tin tiếng Việt cho mọi Bệnh Lý', () => {
    for (const d of cardsData.disorders) {
      const info = getCardInfoVi(`${d.id}#1`);
      expect(info.id).toBe(d.id);
      expect(info.type).toBe('disorder');
      expect(info.typeVi).toBe('Bệnh Lý');
      expect(info.nameVi).toBe(d.nameVi);
      expect(info.punishmentVi).toBe(d.punishment.textVi);
      expect(info.color).toBe('#ef4444');
      expect(info.imagePath).toBe(`/cards/${d.id}.webp`);
    }
  });

  it('trả về đầy đủ thông tin thuốc, trị bệnh và tác dụng phụ tiếng Việt', () => {
    for (const drug of cardsData.drugs) {
      const info = getCardInfoVi(drug.id);
      expect(info.id).toBe(drug.id);
      expect(info.type).toBe('drug');
      expect(info.typeVi).toBe('Thuốc');
      expect(info.nameVi).toBe(drug.nameVi);
      expect(info.treatsVi).toBeDefined();
      expect(info.sideEffectsVi?.length).toBeGreaterThan(0);
      expect(info.color).toBe('#3b82f6');
      expect(info.imagePath).toBe(`/cards/${drug.id}.webp`);
    }
  });

  it('trả về thông tin cho Triệu Chứng và Liệu Pháp', () => {
    const ep = getCardInfoVi('episode#2');
    expect(ep.nameVi).toBe('Triệu Chứng');
    expect(ep.typeVi).toBe('Triệu Chứng');
    expect(ep.color).toBe('#f97316');
    expect(ep.imagePath).toBe('/cards/episode.webp');

    const th = getCardInfoVi('therapy#1');
    expect(th.nameVi).toBe('Liệu Pháp');
    expect(th.typeVi).toBe('Liệu Pháp');
    expect(th.color).toBe('#10b981');
    expect(th.imagePath).toBe('/cards/therapy.webp');
  });
});
