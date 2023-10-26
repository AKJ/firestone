/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ArenaState } from '../../models/arena/arena-state';
import { ArenaCategory } from '../../models/mainwindow/arena/arena-category';
import { PatchInfo } from '../../models/patches';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { PreferencesService } from '../preferences.service';

const REWARDS_RETRIEVE_URL = 'https://b763ob2h6h3ewimg7ztsl72p240qvfyr.lambda-url.us-west-2.on.aws/';

@Injectable()
export class ArenaStateBuilderService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly i18n: LocalizationFacadeService,
	) {
		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initState(
		initialState: ArenaState,
		currentArenaMetaPatch: PatchInfo,
		// rewards: readonly ArenaRewardInfo[],
	): Promise<ArenaState> {
		const prefs = await this.prefs.getPreferences();
		return initialState.update({
			categories: [
				ArenaCategory.create({
					id: 'arena-runs',
					name: this.i18n.translateString('app.arena.menu.my-runs'),
					enabled: true,
					icon: undefined,
					categories: null,
				} as ArenaCategory),
			] as readonly ArenaCategory[],
			loading: false,
			activeHeroFilter: prefs.arenaActiveClassFilter,
			activeTimeFilter: prefs.arenaActiveTimeFilter,
			currentArenaMetaPatch: currentArenaMetaPatch,
			// rewards: rewards,
		});
	}
}
