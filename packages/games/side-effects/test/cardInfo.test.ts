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
      expect(info.imagePath).toBe(`/cards/${d.id}.jpg`);
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
      expect(info.imagePath).toBe(`/cards/${drug.id}.jpg`);
    }
  });

  it('trả về thông tin cho Triệu Chứng và Liệu Pháp', () => {
    const ep = getCardInfoVi('episode#2');
    expect(ep.nameVi).toBe('Triệu Chứng');
    expect(ep.typeVi).toBe('Triệu Chứng');
    expect(ep.color).toBe('#f97316');
    expect(ep.imagePath).toBe('/cards/episode.jpg');

    const th = getCardInfoVi('therapy#1');
    expect(th.nameVi).toBe('Liệu Pháp');
    expect(th.typeVi).toBe('Liệu Pháp');
    expect(th.color).toBe('#10b981');
    expect(th.imagePath).toBe('/cards/therapy.jpg');
  });

  it('mọi cardId (trừ Gia Vị) có mục trong manifest.json, file tồn tại và sha256 trùng khớp', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const crypto = await import('node:crypto');

    const manifestPath = path.resolve(__dirname, '../../../../packages/client/public/cards/manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const requiredCardIds = [
      ...cardsData.disorders.map((d: { id: string }) => d.id),
      ...cardsData.drugs.map((dr: { id: string }) => dr.id),
      'episode',
      'therapy',
      'back',
    ];

    for (const cardId of requiredCardIds) {
      const entry = manifest[cardId];
      expect(entry, `Thiếu mục manifest cho cardId=${cardId}`).toBeDefined();
      expect(entry.file).toBe(`${cardId}.jpg`);

      const filePath = path.resolve(path.dirname(manifestPath), entry.file);
      expect(fs.existsSync(filePath), `File không tồn tại: ${filePath}`).toBe(true);

      const fileBuffer = fs.readFileSync(filePath);
      const computedSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      expect(computedSha256).toBe(entry.sha256);

      if (cardId === 'back') {
        expect(entry.width).toBe(496);
        expect(entry.height).toBe(822);
      } else {
        expect(entry.width).toBe(520);
        expect(entry.height).toBe(864);
      }
    }
  });
});

