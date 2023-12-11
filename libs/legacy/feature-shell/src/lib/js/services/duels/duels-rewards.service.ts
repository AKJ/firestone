import { Injectable } from '@angular/core';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsInfo, MemoryInspectionService, MemoryUpdatesService } from '@firestone/memory';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { filter, withLatestFrom } from 'rxjs/operators';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { ReviewIdService } from '../review-id.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { DUNGEON_LOOT_INFO_URL } from './duels-loot-parser.service';
import { DuelsRunIdService } from './duels-run-id.service';

@Injectable()
export class DuelsRewardsService {
	constructor(
		private memory: MemoryInspectionService,
		private ow: OverwolfService,
		private memoryUpdates: MemoryUpdatesService,
		private api: ApiRunner,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly store: AppUiStoreFacadeService,
		private readonly reviewIdService: ReviewIdService,
		private readonly duelsRunIdService: DuelsRunIdService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.memoryUpdates.memoryUpdates$$
			.pipe(
				filter((changes) => changes.IsDuelsRewardsPending),
				withLatestFrom(
					this.duelsRunIdService.lastDuelsGame$,
					this.duelsState.duelsInfo$$,
					this.reviewIdService.reviewId$,
				),
				filter(([changes, lastDuelsGame, duelsInfo, reviewId]) => !!duelsInfo?.DeckId),
			)
			.subscribe(([changes, lastDuelsGame, duelsInfo, reviewId]) => {
				this.handleRewards(duelsInfo.DeckId, lastDuelsGame, duelsInfo, reviewId);
			});
	}

	// If we launch the app on the rewards screen, we already dismiss the duels run as being over,
	// so we can't attach the rewards to the run. It's not big enough an issue to warrant changing
	// the current behavior
	public async handleRewards(duelsRunId: string, lastDuelsGame: GameStat, duelsInfo: DuelsInfo, reviewId: string) {
		console.log('[duels-rewards] trying to get rewards');
		// Force try it without reset to speed up the process
		let rewards = await this.memory.getDuelsRewardsInfo();
		console.log('[duels-rewards] reward', rewards);
		if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
			console.log('[duels-rewards] no rewards, missed the timing? Retrying with force reset', rewards);
			rewards = await this.memory.getDuelsRewardsInfo(true);
			if (!rewards?.Rewards || rewards?.Rewards.length === 0) {
				console.log('[duels-rewards] no rewards, missed the timing?', rewards);
				return;
			}
		}

		const user = await this.ow.getCurrentUser();
		const rewardsInput = {
			type: lastDuelsGame.gameMode,
			reviewId: reviewId,
			runId: duelsRunId,
			userId: user.userId,
			userName: user.username,
			rewards: rewards,
			currentWins: duelsInfo.Wins,
			currentLosses: duelsInfo.Losses,
			rating: lastDuelsGame.gameMode === 'paid-duels' ? duelsInfo?.Rating : duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		} as Input;
		console.log('[duels-rewards] sending rewards info', rewardsInput);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, rewardsInput);
		this.store.send(new DungeonLootInfoUpdatedEvent(rewardsInput));
	}
}
