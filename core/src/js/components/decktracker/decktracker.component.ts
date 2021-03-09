import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'decktracker',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/app-section.component.scss`,
		`../../../css/component/decktracker/decktracker.component.scss`,
	],
	template: `
		<div class="app-section decktracker">
			<section class="main divider">
				<with-loading [isLoading]="!_state?.decktracker || _state?.decktracker.isLoading">
					<div class="content main-content">
						<global-header
							[navigation]="navigation"
							*ngIf="
								navigation.text && navigation?.navigationDecktracker.menuDisplayType === 'breadcrumbs'
							"
						></global-header>
						<menu-selection-decktracker
							class="menu-selection"
							*ngxCacheIf="navigation.navigationDecktracker.menuDisplayType === 'menu'"
							[selectedTab]="navigation.navigationDecktracker.currentView"
						>
						</menu-selection-decktracker>
						<decktracker-filters [state]="_state" [navigation]="navigation"></decktracker-filters>
						<decktracker-decks
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'decks'"
							[decks]="_state?.decktracker?.decks"
						></decktracker-decks>
						<decktracker-deck-details
							*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
							[state]="_state"
							[navigation]="navigation"
						></decktracker-deck-details>
					</div>
				</with-loading>
			</section>
			<section
				class="secondary"
				[ngClass]="{
					'second-display': !showAds && navigation.navigationDecktracker.currentView === 'deck-details'
				}"
			>
				<decktracker-deck-recap
					*ngxCacheIf="navigation.navigationDecktracker.currentView === 'deck-details'"
					[state]="_state"
					[navigation]="navigation"
				></decktracker-deck-recap>
				<decktracker-replays-recap
					*ngxCacheIf="showReplaysRecap()"
					[state]="_state"
					[navigation]="navigation"
				></decktracker-replays-recap>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerComponent {
	@Input() set state(value: MainWindowState) {
		if (this._state === value) {
			return;
		}
		this._state = value;
		this.showAds = this._state?.showAds;
	}

	@Input() navigation: NavigationState;

	_state: MainWindowState;
	showAds: boolean;

	showReplaysRecap(): boolean {
		return (
			this.navigation.navigationDecktracker.currentView === 'decks' ||
			(this.navigation.navigationDecktracker.currentView === 'deck-details' && !this.showAds)
		);
	}
}
