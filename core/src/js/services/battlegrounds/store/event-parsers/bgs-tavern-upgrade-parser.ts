import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsTavernUpgrade } from '../../../../models/battlegrounds/in-game/bgs-tavern-upgrade';
import { BgsTriple } from '../../../../models/battlegrounds/in-game/bgs-triple';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsTavernUpgradeEvent } from '../events/bgs-tavern-upgrade-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsTavernUpgradeParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsTavernUpgradeEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsTavernUpgradeEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			player => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		if (!playerToUpdate) {
			console.error(
				'No player found to update the history',
				event.heroCardId,
				normalizeHeroCardId(event.heroCardId),
				currentState.currentGame.players.map(player => player.cardId),
			);
			return currentState;
		}
		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const newHistory: readonly BgsTavernUpgrade[] = [
			...playerToUpdate.tavernUpgradeHistory,
			BgsTavernUpgrade.create({
				tavernTier: event.tavernTier,
				turn: turn,
			}),
		];
		// If the upgrade happens after a triple has been done on the same turn, it's very likely that they
		// dioscovered the triple once the upgrade occured, so we adjust the tavern tier
		const newTripleHistory: readonly BgsTriple[] = playerToUpdate.tripleHistory.map(triple => {
			if (triple.turn === turn) {
				return {
					tierOfTripledMinion: triple.tierOfTripledMinion + 1,
					cardId: triple.cardId,
					turn: triple.turn,
				};
			} else {
				return triple;
			}
		});
		const newPlayer = playerToUpdate.update({
			tavernUpgradeHistory: newHistory,
			tripleHistory: newTripleHistory,
		} as BgsPlayer);
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map(player =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
