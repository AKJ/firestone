import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-replays-recap',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component.scss`,
	],
	template: `
		<div class="battlegrounds-replays-recap" *ngIf="replays$ | async as replays">
			<div
				class="title"
				[owTranslate]="'app.decktracker.replays-recap.header'"
				[translateParams]="{ value: replays.length }"
			></div>
			<ul class="list">
				<li *ngFor="let replay of replays; trackBy: trackByFn">
					<replay-info
						[replay]="replay"
						[showStatsLabel]="null"
						[showReplayLabel]="null"
						[displayTime]="false"
					></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsReplaysRecapComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.replays$ = combineLatest([
			this.store.gameStats$(),
			this.store.listen$(([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId),
		]).pipe(
			this.mapData(([replays, [selectedCategoryId]]) => {
				const heroId = selectedCategoryId?.split('bgs-category-personal-hero-details-')?.[1];
				return replays
					.filter((replay) => isBattlegrounds(replay.gameMode))
					.filter((replay) => replay.playerRank != null)
					.filter(
						(replay) =>
							!heroId ||
							normalizeHeroCardId(heroId, this.allCards) ===
								normalizeHeroCardId(replay.playerCardId, this.allCards),
					)
					.slice(0, 10);
			}),
		);
	}

	trackByFn(index, item: GameStat) {
		return item.reviewId;
	}
}
