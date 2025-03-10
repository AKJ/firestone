import { EventEmitter, Injectable } from '@angular/core';
import { BgsBestStat, Input as BgsComputeRunStatsInput, buildNewStats } from '@firestone-hs/user-bgs-post-match-stats';
import {
	BgsGame,
	BgsPostMatchStats,
	BgsPostMatchStatsForReview,
	RealTimeStatsState,
} from '@firestone/battlegrounds/common';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/common';
import { Events } from '../events.service';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from '../mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { BgsPostMatchStatsComputedEvent } from '../mainwindow/store/events/battlegrounds/bgs-post-match-stats-computed-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { ShowMatchStatsEvent } from '../mainwindow/store/events/replays/show-match-stats-event';
import { UserService } from '../user.service';
import { sleep } from '../utils';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';
import { BgsGameEndEvent } from './store/events/bgs-game-end-event';

const POST_MATCH_STATS_UPDATE_URL = 'https://bvs52e46c6yaqlt4o257eagbpu0iqfog.lambda-url.us-west-2.on.aws/';
const POST_MATCH_STATS_RETRIEVE_URL = 'https://4nsgpj3i3anf6qc3c7zugsdjvm0sadln.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BgsRunStatsService {
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly apiRunner: ApiRunner,
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly userService: UserService,
	) {
		this.events.on(Events.START_BGS_RUN_STATS).subscribe(async (event) => {
			console.debug(
				'[bgs-run-stats] starting run stats',
				event.data[0],
				event.data[1],
				event.data[2],
				event.data[3],
			);
			this.computeRunStats(event.data[0], event.data[1], event.data[2], event.data[3]);
		});
		this.events.on(Events.POPULATE_HERO_DETAILS_FOR_BG).subscribe(async (event) => {
			this.computeHeroDetailsForBg(event.data[0]);
		});
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async retrieveReviewPostMatchStats(reviewId: string): Promise<void> {
		const results = await this.apiRunner.callPostApi<readonly BgsPostMatchStatsForReview[]>(
			`${POST_MATCH_STATS_RETRIEVE_URL}`,
			{
				reviewId: reviewId,
			},
		);
		const result = results && results.length > 0 ? results[0] : null;
		console.log('[bgs-run-stats] post-match results for review', reviewId, results && results.length > 0);
		console.debug('[bgs-run-stats] post-match results for review', results);
		this.stateUpdater.next(new ShowMatchStatsEvent(reviewId, result?.stats));
	}

	private async computeHeroDetailsForBg(heroCardId: string) {
		const lastHeroPostMatchStats = await this.retrieveLastBgsRunStats(heroCardId);
		this.stateUpdater.next(
			new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent(lastHeroPostMatchStats, heroCardId),
		);
	}

	private async retrieveLastBgsRunStats(
		heroCardId: string,
		numberOfStats?: number,
	): Promise<readonly BgsPostMatchStatsForReview[]> {
		const user = await this.userService.getCurrentUser();
		const input = {
			userId: user.userId,
			userName: user.username,
			heroCardId: heroCardId,
			limitResults: numberOfStats,
		};
		const results = await this.apiRunner.callPostApi<readonly BgsPostMatchStatsForReview[]>(
			`${POST_MATCH_STATS_RETRIEVE_URL}`,
			input,
		);
		return results;
	}

	public buildInput(
		reviewId: string,
		game: GameForUpload,
		currentGame: BgsGame,
		userId: string,
		userName: string,
	): BgsComputeRunStatsInput {
		const newMmr = parseInt(game.newPlayerRank);
		const input: BgsComputeRunStatsInput = {
			reviewId: reviewId,
			heroCardId: currentGame.getMainPlayer()?.cardId,
			userId: userId,
			userName: userName,
			battleResultHistory: currentGame.buildBattleResultHistory().map((history) => ({
				...history,
				simulationResult: { ...history.simulationResult, outcomeSamples: undefined },
			})),
			mainPlayer: currentGame.getMainPlayer(),
			faceOffs: currentGame.faceOffs.map((faceOff) => ({
				damage: faceOff.damage,
				opponentCardId: faceOff.opponentCardId,
				opponentPlayerId: faceOff.opponentPlayerId,
				playerCardId: faceOff.playerCardId,
				result: faceOff.result,
				turn: faceOff.turn,
			})),
			oldMmr: currentGame.mmrAtStart,
			newMmr: isNaN(newMmr) ? null : newMmr,
		};
		return input;
	}

	private async computeRunStats(
		reviewId: string,
		currentGame: BgsGame,
		bestBgsUserStats: readonly BgsBestStat[],
		game: GameForUpload,
	) {
		const liveStats = currentGame.liveStats;
		const user = await this.userService.getCurrentUser();
		const input = this.buildInput(reviewId, game, currentGame, user.userId, user.username);

		const [postMatchStats, newBestValues] = this.populateObject(
			liveStats,
			input,
			bestBgsUserStats || [],
			currentGame.getMainPlayer(true)?.playerId,
		);
		console.debug('[bgs-run-stats] newBestVaues');

		// Even if stats are computed locally, we still do it on the server so that we can
		// archive the data. However, this is non-blocking
		// this.buildStatsRemotely(input);
		this.bgsStateUpdater.next(new BgsGameEndEvent(postMatchStats, newBestValues, reviewId));
		// Wait a bit, to be sure that the stats have been created
		await sleep(1000);
		this.stateUpdater.next(new BgsPostMatchStatsComputedEvent(reviewId, postMatchStats, newBestValues));
	}

	private async buildStatsRemotely(input: BgsComputeRunStatsInput): Promise<void> {
		console.debug('[bgs-run-stats] preparing to build stats remotely', input.reviewId);
		// Because it takes some time for the review to be processed, and we don't want to
		// use a lambda simply to wait, as it costs money :)
		await sleep(5000);
		console.debug('[bgs-run-stats] contacting remote endpoint', input.reviewId);
		try {
			await this.apiRunner.callPostApi(POST_MATCH_STATS_UPDATE_URL, input);
			return;
		} catch (e) {
			console.error('[bgs-run-stats] issue while posting post-match stats', input.reviewId, e);
		}
	}

	private populateObject(
		realTimeStatsState: RealTimeStatsState,
		input: BgsComputeRunStatsInput,
		existingBestStats: readonly BgsBestStat[],
		mainPlayerId: number,
	): [BgsPostMatchStats, readonly BgsBestStat[]] {
		const result: BgsPostMatchStats = BgsPostMatchStats.create({
			...realTimeStatsState,
			boardHistory: !!realTimeStatsState?.boardHistory?.length
				? realTimeStatsState?.boardHistory
				: input.mainPlayer?.boardHistory?.length
				? input.mainPlayer?.boardHistory
				: [],
			tripleTimings:
				input.mainPlayer && realTimeStatsState?.triplesPerHero[mainPlayerId]
					? new Array(realTimeStatsState.triplesPerHero[mainPlayerId])
					: [],
			playerIdToCardIdMapping: realTimeStatsState.playerIdToCardIdMapping,
		});
		const newBestStats = buildNewStats(
			existingBestStats,
			result,
			{
				mainPlayer: input.mainPlayer,
				reviewId: input.reviewId,
				userId: input.userName || input.userId,
			} as any as BgsComputeRunStatsInput,
			`${new Date().toISOString().slice(0, 19).replace('T', ' ')}.${new Date().getMilliseconds()}`,
		);
		const finalStats = this.mergeStats(existingBestStats, newBestStats);

		return [result, finalStats];
	}

	private mergeStats(existingBestStats: readonly BgsBestStat[], newBestStats: readonly BgsBestStat[]) {
		const statsToKeep = existingBestStats.filter((existing) => !this.isStatIncluded(existing, newBestStats));
		return [...newBestStats, ...statsToKeep];
	}

	private isStatIncluded(toFind: BgsBestStat, list: readonly BgsBestStat[]) {
		return list.find((existing) => existing.statName === toFind.statName) != null;
	}
}
