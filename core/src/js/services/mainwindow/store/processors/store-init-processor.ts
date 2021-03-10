import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationDecktracker } from '../../../../models/mainwindow/navigation/navigation-decktracker';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../../../../models/preferences';
import { Events } from '../../../events.service';
import { PreferencesService } from '../../../preferences.service';
import { ChangeVisibleApplicationEvent } from '../events/change-visible-application-event';
import { StoreInitEvent } from '../events/store-init-event';
import { ChangeVisibleApplicationProcessor } from './change-visible-application-processor';
import { Processor } from './processor';

export class StoreInitProcessor implements Processor {
	constructor(private readonly events: Events, private prefs: PreferencesService) {}

	public async process(
		event: StoreInitEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		console.log('[store-init] populating store');
		const newState = currentState.update(event.initialState);
		console.log('[store-init] emitting STORE_READY event');
		this.events.broadcast(Events.STORE_READY);
		const prefs = await this.prefs.getPreferences();
		const navState = await this.buildCurrentAppNavState(currentState, navigationState, prefs);
		const navStateWithPrefs = navState.update({
			navigationDecktracker: navState.navigationDecktracker.update({
				showMatchupAsPercentages: prefs.desktopDeckShowMatchupAsPercentages,
			} as NavigationDecktracker),
		} as NavigationState);
		return [newState, navStateWithPrefs];
	}

	private async buildCurrentAppNavState(
		currentState: MainWindowState,
		navigationState: NavigationState,
		prefs: Preferences,
	): Promise<NavigationState> {
		const currentAppFromPrefs = prefs.currentMainVisibleSection;
		if (currentAppFromPrefs) {
			console.debug('setting current app from prefs', currentAppFromPrefs);
			const [, navState] = await new ChangeVisibleApplicationProcessor(this.prefs).process(
				new ChangeVisibleApplicationEvent(currentAppFromPrefs),
				currentState,
				null,
				navigationState,
			);
			return navState;
		}

		const currentApp = !prefs.ftue.hasSeenGlobalFtue ? undefined : navigationState.currentApp ?? 'decktracker';
		return navigationState.update({
			currentApp: currentApp,
		} as NavigationState);
	}
}
