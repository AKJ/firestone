import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckHandlerService } from '../deck-handler.service';
import { DeckstringOverrideEvent } from '../event/deckstring-override-event';
import { EventParser } from './event-parser';

export class DeckstringOverrideParser implements EventParser {
	constructor(private readonly deckHandler: DeckHandlerService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.DECKSTRING_OVERRIDE;
	}

	async parse(currentState: GameState, gameEvent: DeckstringOverrideEvent): Promise<GameState> {
		const deckName = gameEvent.deckName;
		const deckstring = gameEvent.deckstring;
		const initialDeck = currentState.opponentDeck;
		//console.debug('[deckstring-override-parser]', deckName, deckstring, initialDeck);

		if (!deckstring) {
			console.warn('[deckstring-override-parser] no deckstring passed, returning', gameEvent);
			return currentState;
		}

		// We take the contents of the current deck, and we put aside all the cards that have
		// been added afterwards (ie cards that have a creator)
		// These are the cards that we will have to put back in the deck after the decklist
		// has been overridden
		const deckInfo = initialDeck.deck;
		const cardsNotInInitialDeck = deckInfo.filter(card => card.creatorCardId);
		//console.debug('[deckstring-override-parser] cardsNotInInitialDeck', cardsNotInInitialDeck);

		// Now we do the opposite: on all the other zones, we need to find out the cards
		// that were part of the initial deck and are not in the "deck" zone anymore
		const cardsMovedOutOfInitialDeck = [...initialDeck.board, ...initialDeck.hand, ...initialDeck.otherZone]
			.filter(card => card.cardId)
			.filter(card => !card.creatorCardId);
		//console.debug('[deckstring-override-parser] cardsMovedOutOfInitialDeck', cardsMovedOutOfInitialDeck);

		const cardsFromDeckstring = this.deckHandler.buildDeckList(deckstring);
		//console.debug('[deckstring-override-parser] cardsFromDeckstring', cardsFromDeckstring);

		// Now remove the from this list the cards that were moved out of the initial deck
		const newDeckContents = [...cardsFromDeckstring];
		for (const movedOut of cardsMovedOutOfInitialDeck) {
			const index = newDeckContents.map(card => card.cardId).indexOf(movedOut.cardId);
			if (index !== -1) {
				newDeckContents.splice(index, 1);
			}
		}
		//console.debug('[deckstring-override-parser] updating new decks after cards moved out', newDeckContents);

		// And add back the other cards
		const finalDeckContents = [...newDeckContents, ...cardsNotInInitialDeck];
		//console.debug('[deckstring-override-parser] finalDeckContents', finalDeckContents);

		const newDeck = Object.assign(new DeckState(), currentState.opponentDeck, {
			deckstring: deckstring,
			name: deckName,
			deckList: cardsFromDeckstring,
			deck: finalDeckContents as readonly DeckCard[],
		} as DeckState);
		//console.log('newDeck', newDeck);
		return Object.assign(new GameState(), currentState, {
			opponentDeck: newDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.DECKSTRING_OVERRIDE;
	}
}
