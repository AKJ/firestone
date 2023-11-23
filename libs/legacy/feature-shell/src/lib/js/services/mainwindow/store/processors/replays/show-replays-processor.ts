import { PreferencesService } from '@firestone/shared/common/service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { ShowReplaysEvent } from '../../events/replays/show-replays-event';
import { Processor } from '../processor';

export class ShowReplaysProcessor implements Processor {
	constructor(private readonly prefs: PreferencesService) {}

	public async process(
		event: ShowReplaysEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const prefs = await this.prefs.getPreferences();
		this.prefs.savePreferences({
			...prefs,
			replaysActiveDeckstringsFilter: [event.deckstring],
			replaysActiveGameModeFilter: event.gameMode,
		});
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'replays',
				text: null,
				image: null,
			} as NavigationState),
		];
	}
}
