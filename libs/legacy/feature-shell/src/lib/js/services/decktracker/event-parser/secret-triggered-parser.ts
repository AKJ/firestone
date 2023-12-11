import { BoardSecret, DeckCard, DeckState, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class SecretTriggeredParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const newSecrets: readonly BoardSecret[] = deck.secrets
			.filter((secret) => secret.entityId !== entityId)
			.map((secret) => this.helper.removeSecretOptionFromSecret(secret, cardId));
		const newOther: readonly DeckCard[] = this.helper.updateCardInZone(deck.otherZone, entityId, cardId, null);

		const newPlayerDeck = deck.update({
			secrets: newSecrets,
			otherZone: newOther,
		} as DeckState);

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.SECRET_TRIGGERED;
	}
}
