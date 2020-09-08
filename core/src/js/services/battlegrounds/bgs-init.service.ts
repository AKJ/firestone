import { EventEmitter, Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsCategory } from '../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsGlobalCategory } from '../../models/mainwindow/battlegrounds/battlegrounds-global-category';
import { BattlegroundsPersonalHeroesCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-heroes-category';
import { BattlegroundsPersonalRatingCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-rating-category';
import { BattlegroundsPersonalStatsCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-category';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Events } from '../events.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PatchesConfigService } from '../patches-config.service';
import { PreferencesService } from '../preferences.service';
import { BgsGlobalStatsService } from './bgs-global-stats.service';
import { BgsStatUpdateParser } from './store/event-parsers/bgs-stat-update-parser';
import { BgsInitEvent } from './store/events/bgs-init-event';
import { BgsStatUpdateEvent } from './store/events/bgs-stat-update-event';
import { BattlegroundsStoreEvent } from './store/events/_battlegrounds-store-event';

@Injectable()
export class BgsInitService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;
	private bgsStateUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
		private readonly patchesService: PatchesConfigService,
		private readonly prefs: PreferencesService,
	) {
		this.events.on(Events.GAME_STATS_UPDATED).subscribe(event => {
			const newGameStats: GameStats = event.data[0];
			console.log('[bgs-init] match stats updated', newGameStats);
			this.bgsStateUpdater.next(new BgsStatUpdateEvent(newGameStats));
		});
		setTimeout(() => {
			this.bgsStateUpdater = this.ow.getMainWindow().battlegroundsUpdater;
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async init(matchStats: GameStats): Promise<BgsStats> {
		console.log('[bgs-init] bgs init starting');
		const [bgsGlobalStats] = await Promise.all([this.bgsGlobalStats.loadGlobalStats()]);
		const bgsMatchStats = matchStats?.stats?.filter(stat => stat.gameMode === 'battlegrounds');
		if (!bgsMatchStats || bgsMatchStats.length === 0) {
			console.log('[bgs-init] no bgs match stats');
			this.bgsStateUpdater.next(new BgsInitEvent([], bgsGlobalStats));
			return;
		}
		const currentBattlegroundsMetaPatch = (await this.patchesService.getConf()).currentBattlegroundsMetaPatch;
		const bgsStatsForCurrentPatch = bgsMatchStats.filter(stat => stat.buildNumber >= currentBattlegroundsMetaPatch);
		const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
			bgsGlobalStats,
			bgsStatsForCurrentPatch,
			this.cards,
		);

		const statsWithPatch = bgsGlobalStats?.update({
			currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		} as BgsStats);

		const statsWithPlayer = statsWithPatch?.update({
			heroStats: heroStatsWithPlayer,
		} as BgsStats);
		this.bgsStateUpdater.next(new BgsInitEvent(bgsStatsForCurrentPatch, statsWithPlayer));
		return statsWithPatch;
	}

	public async initBattlegoundsAppState(bgsGlobalStats: BgsStats): Promise<BattlegroundsAppState> {
		const globalCategories: readonly BattlegroundsGlobalCategory[] = [
			this.buildPersonalStatsGlobalCategory(bgsGlobalStats),
			this.buildMetaStatsGlobalCategory(),
		];
		return BattlegroundsAppState.create({
			globalCategories: globalCategories,
			globalStats: bgsGlobalStats,
			loading: false,
		} as BattlegroundsAppState);
	}

	private buildPersonalStatsGlobalCategory(bgsGlobalStats: BgsStats): BattlegroundsGlobalCategory {
		const categories: readonly BattlegroundsCategory[] = [
			this.buildPersonalHeroesCategory(bgsGlobalStats),
			this.buildPersonalRatingCategory(),
			this.buildPersonalStatsCategory(),
			this.buildPersonalAICategory(),
		];
		return BattlegroundsGlobalCategory.create({
			id: 'bgs-global-category-personal-stats',
			name: 'Personal stats',
			enabled: true,
			categories: categories,
		} as BattlegroundsGlobalCategory);
	}

	private buildPersonalHeroesCategory(bgsGlobalStats: BgsStats): BattlegroundsCategory {
		// console.log('building stats', bgsGlobalStats);
		const heroDetailCategories: readonly BattlegroundsCategory[] = bgsGlobalStats.heroStats
			.filter(heroStat => heroStat.id !== 'average')
			.map(heroStat =>
				BattlegroundsPersonalStatsHeroDetailsCategory.create({
					id: 'bgs-category-personal-hero-details-' + heroStat.id,
					name: this.cards.getCard(heroStat.id)?.name,
					heroId: heroStat.id,
				} as BattlegroundsPersonalStatsHeroDetailsCategory),
			);
		return BattlegroundsPersonalHeroesCategory.create({
			enabled: true,
			categories: heroDetailCategories,
		} as BattlegroundsPersonalHeroesCategory);
	}

	private buildPersonalRatingCategory(): BattlegroundsCategory {
		return BattlegroundsPersonalRatingCategory.create({
			enabled: true,
		} as BattlegroundsPersonalRatingCategory);
	}

	private buildPersonalStatsCategory(): BattlegroundsCategory {
		return BattlegroundsPersonalStatsCategory.create({
			enabled: true,
		} as BattlegroundsPersonalStatsCategory);
	}

	private buildPersonalAICategory(): BattlegroundsCategory {
		return BattlegroundsCategory.create({
			id: 'bgs-category-personal-ai',
			name: 'AI Insights',
			enabled: false,
			disabledTooltip:
				'AI insights are still in development. They will likely be a perk for subscribers, but nothing is decided yet. Thanks for your patience!',
		} as BattlegroundsCategory);
	}

	private buildMetaStatsGlobalCategory(): BattlegroundsGlobalCategory {
		return BattlegroundsGlobalCategory.create({
			id: 'bgs-global-category-meta-stats',
			name: 'Meta',
			enabled: false,
			disabledTooltip: 'Meta stats will likely arrive towards the end of the year. Thanks for your patience!',
		} as BattlegroundsGlobalCategory);
	}
}
