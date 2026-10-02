import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { cardsData, getCardInfoVi, getDisorderDef } from '@boardgame/game-side-effects';
import { RulesModal } from '../src/games/side-effects/RulesModal.js';

describe('Rules Content Validation (Task R2)', () => {
  const renderedHtml = renderToString(React.createElement(RulesModal, { isOpen: true, onClose: () => {} }));

  it('contains all 8 Disorders with accurate Vietnamese names', () => {
    expect(cardsData.disorders).toHaveLength(8);
    for (const disorder of cardsData.disorders) {
      expect(renderedHtml).toContain(disorder.nameVi);
      const info = getCardInfoVi(disorder.id);
      expect(info.typeVi).toBe('Bệnh Lý');
    }
  });

  it('contains all 7 Drugs with accurate Vietnamese names and correct side effects', () => {
    expect(cardsData.drugs).toHaveLength(7);
    for (const drug of cardsData.drugs) {
      expect(renderedHtml).toContain(drug.nameVi);
      const treatedDef = getDisorderDef(drug.treats);
      expect(treatedDef).toBeDefined();
      expect(renderedHtml).toContain(treatedDef!.nameVi);

      for (const sid of drug.sideEffects) {
        const sideEffectDef = getDisorderDef(sid);
        expect(sideEffectDef).toBeDefined();
        expect(renderedHtml).toContain(sideEffectDef!.nameVi);
      }
    }
  });

  it('does NOT contain forbidden words: Kháng Thuốc, Chẩn Đoán Sai, Psyche, Disorder in rendered text', () => {
    const forbiddenWords = [
      'Kháng Thuốc',
      'Chẩn Đoán Sai',
      'Psyche',
      'Disorder',
    ];

    for (const word of forbiddenWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      expect(regex.test(renderedHtml), `Found forbidden word "${word}" in rendered rules`).toBe(false);
    }
  });

  it('includes specific rules: Tremors 7s, Anxiety/Gambling, Depression/Impotence/Anorexia accumulation', () => {
    expect(renderedHtml).toContain('7 giây');
    expect(renderedHtml).toContain('quá giờ mất hết bài tay');
    expect(renderedHtml).toContain('Cộng dồn số vòng phạt');
    expect(renderedHtml).toContain('tối đa 3 lá');
    expect(renderedHtml).not.toContain('Loại bỏ vĩnh viễn');
    expect(renderedHtml).toContain('Tay quá 6 lá: bấm Kết thúc lượt rồi chọn lá để bỏ');
    expect(renderedHtml).toContain('thông báo sẽ hiện ngay trên màn hình');
  });
});
