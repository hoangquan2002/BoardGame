import { describe, expect, it } from 'vitest';
import { cardsData } from '../src/index.js';
import type { EffectType } from '../src/index.js';

const ALLOWED_EFFECT_TYPES: EffectType[] = [
  'ATTACKER_STEALS_CHOSEN_CARD',
  'PREVENT_DRAW',
  'SKIP_TURN',
  'ATTACKER_STEALS_RANDOM_CARDS',
  'DISCARD_ALL_DRUGS_FROM_PSYCHE',
  'DISCARD_ENTIRE_HAND',
  'PREVENT_PLAY_CARDS',
  'DISCARD_CARDS_OR_ENTIRE_HAND',
];

describe('Side Effects Cards Data Validation (Task T0)', () => {
  it('validates schema and ensures all IDs are unique', () => {
    expect(cardsData.disorders).toBeDefined();
    expect(cardsData.drugs).toBeDefined();
    expect(cardsData.episodes).toBeDefined();
    expect(cardsData.therapies).toBeDefined();
    expect(cardsData.spice).toBeDefined();

    // Check unique disorder IDs
    const disorderIds = cardsData.disorders.map((d) => d.id);
    const uniqueDisorderIds = new Set(disorderIds);
    expect(uniqueDisorderIds.size).toBe(disorderIds.length);

    // Check unique drug IDs
    const drugIds = cardsData.drugs.map((d) => d.id);
    const uniqueDrugIds = new Set(drugIds);
    expect(uniqueDrugIds.size).toBe(drugIds.length);
  });

  it('validates treats and sideEffects relationships', () => {
    const disorderIdSet = new Set(cardsData.disorders.map((d) => d.id));

    for (const drug of cardsData.drugs) {
      // treats points to existing disorder
      expect(disorderIdSet.has(drug.treats)).toBe(true);

      // every side effect points to existing disorder
      for (const sideEffect of drug.sideEffects) {
        expect(disorderIdSet.has(sideEffect)).toBe(true);
      }

      // drug does not cause the disorder it treats
      expect(drug.sideEffects.includes(drug.treats)).toBe(false);
    }
  });

  it('ensures each disorder has at most one drug, and anorexia has no drug', () => {
    const treatsMap: Record<string, string[]> = {};
    for (const drug of cardsData.drugs) {
      if (!treatsMap[drug.treats]) {
        treatsMap[drug.treats] = [];
      }
      treatsMap[drug.treats]!.push(drug.id);
    }

    for (const disorder of cardsData.disorders) {
      const treatingDrugs = treatsMap[disorder.id] ?? [];
      expect(treatingDrugs.length).toBeLessThanOrEqual(1);

      if (disorder.id === 'anorexia') {
        expect(treatingDrugs.length).toBe(0);
      }
    }
  });

  it('verifies all punishment effect types are valid and texts are present', () => {
    for (const disorder of cardsData.disorders) {
      const { punishment } = disorder;
      expect(punishment).toBeDefined();
      expect(punishment.textVi.trim().length).toBeGreaterThan(0);
      expect(punishment.textEn.trim().length).toBeGreaterThan(0);
      expect(ALLOWED_EFFECT_TYPES).toContain(punishment.effect.type);
    }
  });

  it('calculates and prints card counts compared to reference figures', () => {
    const totalDisorders = cardsData.disorders.reduce((sum, d) => sum + d.count, 0);
    const totalDrugs = cardsData.drugs.reduce((sum, d) => sum + d.count, 0);
    const totalEpisodes = cardsData.episodes.count;
    const totalTherapies = cardsData.therapies.count;
    const totalHighTolerance = cardsData.spice.highTolerance;
    const totalMisdiagnosis = cardsData.spice.misdiagnosis;
    const totalCards =
      totalDisorders +
      totalDrugs +
      totalEpisodes +
      totalTherapies +
      totalHighTolerance +
      totalMisdiagnosis;

    // Output formatted comparison for reviewer
    console.log('\n--- BẢNG ĐỐI CHIẾU SỐ LƯỢNG LÁ BÀI ---');
    console.log(`Disorders (Bệnh Lý):      ${totalDisorders} lá (tham khảo: 38)`);
    console.log(`Drugs (Thuốc):            ${totalDrugs} lá (tham khảo: 36)`);
    console.log(`Episodes (Triệu Chứng):   ${totalEpisodes} lá (tham khảo: 10)`);
    console.log(`Therapies (Liệu Pháp):    ${totalTherapies} lá (tham khảo: 5)`);
    console.log(`High Tolerance (Kháng T): ${totalHighTolerance} lá (tham khảo: 3, PDF: 5)`);
    console.log(`Misdiagnosis (Chuẩn ĐS):  ${totalMisdiagnosis} lá (tham khảo: 3, PDF: 5)`);
    console.log(`TỔNG SỐ LÁ BỘ BÀI:        ${totalCards} lá (tham khảo: 95, PDF: 99)`);
    console.log('-------------------------------------\n');

    expect(totalDisorders).toBe(38);
    expect(totalDrugs).toBe(36);
    expect(totalEpisodes).toBe(10);
    expect(totalTherapies).toBe(5);
    expect(totalHighTolerance).toBe(5);
    expect(totalMisdiagnosis).toBe(5);
    expect(totalCards).toBe(99);
  });

  it('verifies therapy immunity is marked on tremors only', () => {
    const tremors = cardsData.disorders.find((d) => d.id === 'tremors');
    expect(tremors).toBeDefined();
    expect(tremors?.therapyImmune).toBe(true);

    for (const d of cardsData.disorders) {
      if (d.id !== 'tremors') {
        expect(d.therapyImmune).toBeFalsy();
      }
    }
  });
});
