import { AllCardsService } from '@firestone-hs/replay-parser';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsHeroStat } from '../../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../../../models/battlegrounds/stats/bgs-stats';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { PatchesConfigService } from '../../../patches-config.service';
import { getHeroPower } from '../../bgs-utils';
import { BgsStatUpdateEvent } from '../events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsStatUpdateParser implements EventParser {
	constructor(private readonly cards: AllCardsService, private readonly patchesService: PatchesConfigService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsStatUpdateEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsStatUpdateEvent): Promise<BattlegroundsState> {
		//console.log('[debug] state before update', currentState);
		const bgsMatchStats = event.newGameStats?.stats?.filter(stat => stat.gameMode === 'battlegrounds');
		if (!bgsMatchStats || bgsMatchStats.length === 0) {
			return currentState;
		}

		console.log('[bgs-stat-update] bgsMatchStats', bgsMatchStats.length);
		const currentBattlegroundsMetaPatch =
			currentState.globalStats?.currentBattlegroundsMetaPatch ||
			(await this.patchesService.getConf()).currentBattlegroundsMetaPatch;
		const bgsStatsForCurrentPatch = bgsMatchStats.filter(stat => stat.buildNumber >= currentBattlegroundsMetaPatch);
		console.log(
			'[bgs-stat-update] bgsStatsForCurrentPatch',
			bgsStatsForCurrentPatch.length,
			currentBattlegroundsMetaPatch,
		);

		const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
			currentState.globalStats,
			bgsStatsForCurrentPatch,
			this.cards,
		);
		console.log(
			'[bgs-stat-update] heroStatsWithPlayer',
			heroStatsWithPlayer.length > 0 && heroStatsWithPlayer[0].playerGamesPlayed,
		);
		const statsWithPlayer = currentState.globalStats?.update({
			heroStats: heroStatsWithPlayer,
			currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		} as BgsStats);
		//console.log('[debug] state after update', statsWithPlayer);
		return currentState.update({
			globalStats: statsWithPlayer,
		} as BattlegroundsState);
	}

	public static buildHeroStats(
		globalStats: BgsStats,
		bgsStatsForCurrentPatch: readonly GameStat[],
		cards: AllCardsService,
	) {
		const heroStats =
			globalStats?.heroStats?.map(heroStat => {
				const playerGamesPlayed = bgsStatsForCurrentPatch.filter(stat => stat.playerCardId === heroStat.id)
					.length;
				const playerPopularity = (100 * playerGamesPlayed) / bgsStatsForCurrentPatch.length;
				return BgsHeroStat.create({
					...heroStat,
					top4: heroStat.top4 || 0,
					top1: heroStat.top1 || 0,
					name: heroStat.id !== 'average' ? cards.getCard(heroStat.id)?.name : heroStat.id,
					heroPowerCardId: getHeroPower(heroStat.id),
					playerGamesPlayed: playerGamesPlayed,
					playerPopularity: playerPopularity,
					playerAveragePosition:
						playerPopularity === 0
							? 0
							: bgsStatsForCurrentPatch
									.filter(stat => stat.playerCardId === heroStat.id)
									.map(stat => parseInt(stat.additionalResult))
									.reduce((a, b) => a + b, 0) / playerGamesPlayed,
					playerAverageMmr:
						playerPopularity === 0
							? 0
							: bgsStatsForCurrentPatch
									.filter(stat => stat.playerCardId === heroStat.id)
									.filter(stat => stat.newPlayerRank != null && stat.playerRank != null)
									.map(stat => parseInt(stat.newPlayerRank) - parseInt(stat.playerRank))
									.filter(mmr => !isNaN(mmr))
									.reduce((a, b) => a + b, 0) / playerGamesPlayed,
					playerTop4:
						playerPopularity === 0
							? 0
							: bgsStatsForCurrentPatch
									.filter(stat => stat.playerCardId === heroStat.id)
									.map(stat => parseInt(stat.additionalResult))
									.filter(position => position <= 4).length / playerGamesPlayed,
					playerTop1:
						playerPopularity === 0
							? 0
							: bgsStatsForCurrentPatch
									.filter(stat => stat.playerCardId === heroStat.id)
									.map(stat => parseInt(stat.additionalResult))
									.filter(position => position == 1).length / playerGamesPlayed,
				} as BgsHeroStat);
			}) ||
			[] ||
			[];
		return heroStats.sort((a, b) => a.averagePosition - b.averagePosition);
	}
}
