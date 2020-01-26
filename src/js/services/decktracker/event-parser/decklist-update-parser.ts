import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { AiDeckService } from '../ai-deck-service.service';
import { DeckParserService } from '../deck-parser.service';
import { EventParser } from './event-parser';

export class DecklistUpdateParser implements EventParser {
	constructor(
		private readonly aiDecks: AiDeckService,
		private readonly deckParser: DeckParserService,
		private readonly prefs: PreferencesService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && state.opponentDeck && gameEvent.type === GameEvent.DECKLIST_UPDATE;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [, controllerId, localPlayer, ] = gameEvent.parse();
		// console.debug('applying create card in deck', cardId, entityId);

		const isPlayer = controllerId === localPlayer.PlayerId;
		// For now we don't handle player deck updates
		if (isPlayer) {
			// console.log('[decklist-update] player deck update not supported yet, returning', gameEvent);
			return currentState;
		}
		const shouldLoadDecklist = (await this.prefs.getPreferences()).opponentLoadAiDecklist;
		if (!shouldLoadDecklist) {
			return currentState;
		}
		const deckId = gameEvent.additionalData.deckId;
		const aiDeck = shouldLoadDecklist
			? this.aiDecks.getAiDeck(gameEvent.opponentPlayer.CardID, currentState.metadata.scenarioId)
			: null;
		const newDeckstring = aiDeck && aiDeck.decks && aiDeck.decks[deckId];
		if (!newDeckstring) {
			// console.log('[decklist-update] could not find new deck', gameEvent, aiDeck);
			return currentState;
		}
		const decklist = this.deckParser.buildDeckList(newDeckstring);
		// console.log('[decklist-update] parsed decklist', decklist);
		const newPlayerDeck = currentState.opponentDeck.update({
			deckList: shouldLoadDecklist ? decklist : currentState.opponentDeck.deckList,
			deck: decklist,
		} as DeckState);
		// console.log('[decklist-update] newPlayerDeck', newPlayerDeck);
		return currentState.update({
			opponentDeck: newPlayerDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.DECKLIST_UPDATE;
	}
}
