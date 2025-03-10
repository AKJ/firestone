import { ReferenceCard } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { reverseIfNeeded } from './card-dredged-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardRevealedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		// const creatorCardId = gameEvent.additionalData.creatorCardId;
		// For some reason, during a reconnect, the logs contain the full list of all cards
		// in our deck and puts them in the SETASIDE zone.
		if (currentState.reconnectOngoing) {
			return currentState;
		}

		const isPlayer = reverseIfNeeded(controllerId === localPlayer.PlayerId, gameEvent.additionalData.creatorCardId);
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId, false) ?? ({} as ReferenceCard);
		let positionFromBottom = undefined;
		if (gameEvent.additionalData.revealedFromBlock === 'DREDGE') {
			// Make sure there is no overlap with existing cards
			// When we dredge we are at the very bottom, so we can increase the current index by any big number
			// Only increase it at the first time of the dredge block
			if (gameEvent.additionalData.indexInBlock === 0) {
				DeckCard.deckIndexFromBottom += 4;
			}
			positionFromBottom = DeckCard.deckIndexFromBottom + 3 - gameEvent.additionalData.indexInBlock;
			console.debug(
				'[card-revealed] dredge',
				positionFromBottom,
				DeckCard.deckIndexFromBottom,
				gameEvent.additionalData.indexInBlock,
			);
		}
		// else {
		// 	positionFromBottom = DeckCard.deckIndexFromBottom++;
		// }
		const card = DeckCard.create({
			cardId: cardId,
			entityId: entityId,
			cardName: this.i18n.getCardName(dbCard.id, dbCard.name),
			manaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'SETASIDE',
			temporaryCard: true,
			lastAffectedByCardId: gameEvent.additionalData.creatorCardId || gameEvent.additionalData.originEntityCardId,
			positionFromBottom: positionFromBottom,
		} as DeckCard);
		// console.debug('[debug]', 'card revealed', card, DeckCard.deckIndexFromBottom, gameEvent);

		// Simply adding the card to the zone doesn't work if the card already exist (eg we have put a card at the
		// bottom of the deck with another card previously)
		// The issue here is that we used "REVEALED" for both when a new card arrives, and when we show an existing card
		// If the entityId already exists, we remove then add back. Otherwise, we just add
		const newOther: readonly DeckCard[] =
			// Replacing doesn't work when we resurrect a minion: if we replace, we will find a card ith the same cardId
			// and dfifferent entityId, and will remove the previous one.
			// However, that's exactly the behavior we want to have for dredge.
			// So for now, let's keep this hack and only replace in case of Dredge
			gameEvent.additionalData.revealedFromBlock === 'DREDGE'
				? this.helper.empiricReplaceCardInZone(deck.otherZone, card, false)
				: this.helper.addSingleCardToZone(deck.otherZone, card);
		// console.debug('[debug]', 'newOther', newOther);
		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			otherZone: newOther,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_REVEALED;
	}
}
