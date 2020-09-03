import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { NavigationNextEvent } from '../../events/navigation/navigation-next-event';
import { NavigationHistory } from '../../navigation-history';
import { Processor } from '../processor';

export class NavigationNextProcessor implements Processor {
	public async process(
		event: NavigationNextEvent,
		currentState: MainWindowState,
		history: NavigationHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newState =
			history.currentIndexInHistory >= history.stateHistory.length
				? null
				: history.stateHistory[history.currentIndexInHistory + 1].state;
		return [null, newState];
	}
}
