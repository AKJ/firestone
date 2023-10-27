import { Injectable } from '@angular/core';
import { TavernBrawlService } from '../../libs/tavern-brawl/services/tavern-brawl.service';
import { BgsBestUserStatsService } from './battlegrounds/bgs-best-user-stats.service';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { BgsMetaHeroStatsService } from './battlegrounds/bgs-meta-hero-stats.service';
import { BgsMetaHeroStrategiesService } from './battlegrounds/bgs-meta-hero-strategies.service';
import { GlobalStatsService } from './global-stats/global-stats.service';
import { QuestsService } from './quests.service';

// Called from the data model, which lives in the main window (even though it is often accessed from
// other windows). So there is no need for a facade
@Injectable()
export class LazyDataInitService {
	constructor(
		private readonly globalStatsService: GlobalStatsService,
		private readonly bgsPerfectGamesStateBuilder: BgsInitService,
		private readonly bgsBestStatsService: BgsBestUserStatsService,
		private readonly bgsMetaHeroStatsStateBuilder: BgsMetaHeroStatsService,
		private readonly bgsMetaHeroStrategiesService: BgsMetaHeroStrategiesService,
		private readonly questsService: QuestsService,
		private readonly tavernBrawlService: TavernBrawlService,
	) {}

	public async requestLoad(dataType: StateDataType) {
		switch (dataType) {
			case 'battlegrounds-perfect-games':
				return this.bgsPerfectGamesStateBuilder.loadInitialPerfectGames();
			case 'bgs-meta-hero-stats':
				return this.bgsMetaHeroStatsStateBuilder.loadInitialMetaHeroStats();
			case 'bgs-meta-hero-strategies':
				return this.bgsMetaHeroStrategiesService.loadMetaHeroStrategies();
			case 'user-global-stats':
				return this.globalStatsService.loadInitialGlobalStats();
			case 'user-bgs-best-stats':
				return this.bgsBestStatsService.loadBgsBestUserStats();
			case 'reference-quests':
				return this.questsService.loadReferenceQuests();
			case 'tavern-brawl-stats':
				return this.tavernBrawlService.loadStats();
		}
	}
}

export type StateDataType =
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'user-global-stats'
	| 'user-bgs-best-stats'
	| 'reference-quests'
	| 'duels-top-decks'
	| 'bgs-meta-hero-stats'
	| 'bgs-meta-hero-strategies'
	| 'tavern-brawl-stats'
	| 'battlegrounds-perfect-games';
