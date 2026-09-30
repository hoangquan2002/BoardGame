import cardsDataJson from './data/cards.json' with { type: 'json' };
import type { CardsData, DisorderCard, DrugCard } from './data/types.js';
import type { CardInstance } from './types.js';

export const cardsData: CardsData = cardsDataJson as unknown as CardsData;

export function createDeck(cards: CardsData = cardsData): CardInstance[] {
  const deck: CardInstance[] = [];

  for (const d of cards.disorders) {
    for (let i = 0; i < d.count; i++) {
      deck.push({
        instanceId: `${d.id}#${i + 1}`,
        cardId: d.id,
        type: 'disorder',
      });
    }
  }

  for (const dr of cards.drugs) {
    for (let i = 0; i < dr.count; i++) {
      deck.push({
        instanceId: `${dr.id}#${i + 1}`,
        cardId: dr.id,
        type: 'drug',
      });
    }
  }

  for (let i = 0; i < cards.episodes.count; i++) {
    deck.push({
      instanceId: `episode#${i + 1}`,
      cardId: 'episode',
      type: 'episode',
    });
  }

  for (let i = 0; i < cards.therapies.count; i++) {
    deck.push({
      instanceId: `therapy#${i + 1}`,
      cardId: 'therapy',
      type: 'therapy',
    });
  }

  return deck;
}

export function getDisorderDef(cardId: string): DisorderCard | undefined {
  return cardsData.disorders.find((d) => d.id === cardId);
}

export function getDrugDef(cardId: string): DrugCard | undefined {
  return cardsData.drugs.find((dr) => dr.id === cardId);
}

export function getDisorderNameVi(cardId: string): string {
  const def = getDisorderDef(cardId);
  return def ? def.nameVi : cardId;
}

export function getDrugNameVi(cardId: string): string {
  const def = getDrugDef(cardId);
  return def ? def.nameVi : cardId;
}

export function getCardDisplayNameVi(card: CardInstance): string {
  if (card.type === 'disorder') {
    return getDisorderNameVi(card.cardId);
  }
  if (card.type === 'drug') {
    return getDrugNameVi(card.cardId);
  }
  if (card.type === 'episode') {
    return 'Triệu Chứng';
  }
  if (card.type === 'therapy') {
    return 'Liệu Pháp';
  }
  return card.cardId;
}
