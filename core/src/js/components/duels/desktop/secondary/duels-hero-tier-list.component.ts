import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DuelsHeroPlayerStat } from '../../../../models/duels/duels-player-stats';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { buildDuelsHeroPlayerStats, filterDuelsHeroStats } from '../../../../services/ui-store/duels-ui-helper';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-hero-tier-list',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-hero-tier-list.component.scss`,
	],
	template: `
		<div class="duels-hero-tier-list" *ngIf="tiers$ | async as tiers">
			<div class="title" helpTooltip="The tiers are computed for your current filters">Tier List</div>
			<duels-tier class="duels-tier" *ngFor="let tier of tiers" [tier]="tier"></duels-tier>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsHeroTierListComponent {
	tiers$: Observable<readonly DuelsTier[]>;

	constructor(private readonly store: AppUiStoreService, private readonly cdr: ChangeDetectorRef) {
		this.tiers$ = this.store
			.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
			)
			.pipe(
				filter(([duelsStats, statType, gameMode, timeFilter, classFilter, mmrFilter]) => !!duelsStats?.length),
				map(
					([duelStats, statType, gameMode, timeFilter, classFilter, mmrFilter]) =>
						[filterDuelsHeroStats(duelStats, timeFilter, classFilter, mmrFilter), statType] as [
							readonly DuelsHeroStat[],
							DuelsStatTypeFilterType,
						],
				),
				// distinctUntilChanged((a, b) => this.areEqual(a, b)),
				map(([duelsStats, statType]) => {
					const stats = buildDuelsHeroPlayerStats(duelsStats, statType).sort(
						(a, b) => b.globalWinrate - a.globalWinrate,
					);
					return [
						{
							label: 'S',
							tooltip: 'Must pick',
							items: this.filterItems(stats, 60, 101),
						},
						{
							label: 'A',
							tooltip: 'Strong pick',
							items: this.filterItems(stats, 57, 60),
						},
						{
							label: 'B',
							tooltip: 'Good pick',
							items: this.filterItems(stats, 54, 57),
						},
						{
							label: 'C',
							tooltip: 'Fair pick',
							items: this.filterItems(stats, 50, 54),
						},
						{
							label: 'D',
							tooltip: 'Preferably avoid',
							items: this.filterItems(stats, 45, 50),
						},
						{
							label: 'E',
							tooltip: 'Defnitely avoid',
							items: this.filterItems(stats, 0, 45),
						},
					].filter((tier) => tier.items?.length);
				}),
				// FIXME: see filters
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
			);
	}

	private filterItems(
		stats: readonly DuelsHeroPlayerStat[],
		threshold: number,
		upper: number,
	): readonly DuelsTierItem[] {
		return stats
			.filter((stat) => stat.globalWinrate)
			.filter((stat) => stat.globalWinrate >= threshold && stat.globalWinrate < upper)
			.map((stat) => ({
				cardId: stat.cardId,
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${stat.cardId}.jpg`,
			}));
	}
}
