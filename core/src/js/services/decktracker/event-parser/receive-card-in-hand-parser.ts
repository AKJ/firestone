import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { cardsRevealedWhenDrawn, publicCardCreators } from '../../hs-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ReceiveCardInHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.RECEIVE_CARD_IN_HAND;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const creatorCardId = gameEvent.additionalData.creatorCardId;
		// console.log('[receive-card-in-hand] handling event', cardId, entityId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const lastInfluencedByCardId = gameEvent.additionalData?.lastInfluencedByCardId;
		const isCardInfoPublic =
			isPlayer ||
			cardsRevealedWhenDrawn.includes(cardId) ||
			publicCardCreators.indexOf(lastInfluencedByCardId) !== -1;

		// First try and see if this card doesn't come from the board or from the other zone (in case of discovers)
		const boardCard = this.helper.findCardInZone(deck.board, null, entityId);
		const otherCard = this.helper.findCardInZone(deck.otherZone, null, entityId);
		// If a C'Thun piece was set aside, we know its data when getting the card back to hand, so we want to hide it
		const otherCardWithObfuscation =
			isCardInfoPublic || !otherCard
				? otherCard
				: otherCard.update({
						creatorCardId: undefined,
						cardId: undefined,
						cardName: undefined,
						lastAffectedByCardId: undefined,
				  } as DeckCard);
		// console.log(
		// 	'[receive-card-in-hand] trying to get card from zone',
		// 	deck.board,
		// 	entityId,
		// 	boardCard,
		// 	otherCard,
		// 	otherCardWithObfuscation,
		// 	cardId,
		// );
		const newBoard = boardCard
			? this.helper.removeSingleCardFromZone(deck.board, null, entityId, deck.deckList.length === 0)[0]
			: deck.board;
		const newOther = otherCardWithObfuscation
			? this.helper.removeSingleCardFromZone(deck.otherZone, null, entityId)[0]
			: deck.otherZone;
		// console.log('[receive-card-in-hand] new board', newBoard, newOther);

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const cardWithDefault =
			boardCard ||
			otherCardWithObfuscation ||
			DeckCard.create({
				cardId: cardId,
				entityId: entityId,
				cardName: cardData && cardData.name,
				manaCost: cardData && cardData.cost,
				rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
				creatorCardId: creatorCardId,
			} as DeckCard);
		// console.log('[receive-card-in-hand] cardWithDefault', cardWithDefault, cardData);
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(previousHand, cardWithDefault);
		// console.log('[receive-card-in-hand] new hand', newHand);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
			board: newBoard,
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.RECEIVE_CARD_IN_HAND;
	}
}
