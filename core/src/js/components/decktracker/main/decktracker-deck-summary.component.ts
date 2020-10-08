import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { FeatureFlags } from '../../../services/feature-flags';
import { HideDeckSummaryEvent } from '../../../services/mainwindow/store/events/decktracker/hide-deck-summary-event';
import { RestoreDeckSummaryEvent } from '../../../services/mainwindow/store/events/decktracker/restore-deck-summary-event';
import { SelectDeckDetailsEvent } from '../../../services/mainwindow/store/events/decktracker/select-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-summary',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-summary.component.scss`,
	],
	template: `
		<div
			class="decktracker-deck-summary"
			[ngClass]="{ 'hidden': hidden, 'no-click': !enableClick }"
			(click)="selectDeck()"
		>
			<div class="deck-name" [helpTooltip]="deckName">{{ deckName }}</div>
			<div class="deck-image">
				<img class="skin" [src]="skin" />
				<img class="frame" src="assets/images/deck/hero_frame.png" />
			</div>
			<div class="stats">
				<div class="text total-games">{{ totalGames }} games</div>
				<div class="text win-rate">{{ winRatePercentage }}% win rate</div>
				<div class="last-used">Last used: {{ lastUsed }}</div>
			</div>
			<button
				class="close-button"
				helpTooltip="Archive deck (you can restore it later)"
				(mousedown)="hideDeck($event)"
				*ngIf="!hidden"
			>
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
			<button class="restore-button" helpTooltip="Restore deck" (mousedown)="restoreDeck($event)" *ngIf="hidden">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#copy_deckstring"
					></use>
				</svg>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckSummaryComponent implements AfterViewInit {
	@Input() set deck(value: DeckSummary) {
		// console.log('[decktracker-deck-summary] setting value', value);
		this._deck = value;
		this.deckName = value.deckName || 'Deck name';
		this.totalGames = value.totalGames;
		this.winRatePercentage = parseFloat('' + value.winRatePercentage).toLocaleString('en-US', {
			minimumIntegerDigits: 1,
			maximumFractionDigits: 2,
		});
		this.lastUsed = this.buildLastUsedDate(value.lastUsedTimestamp);
		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.skin}.jpg`;
		this.hidden = value.hidden;
	}

	_deck: DeckSummary;
	deckName: string;
	deckNameClass: string;
	totalGames: number;
	winRatePercentage: string;
	lastUsed: string;
	skin: string;
	hidden: boolean;

	enableClick = FeatureFlags.ENABLE_DECK_DETAILS;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	hideDeck(event: MouseEvent) {
		this.stateUpdater.next(new HideDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
	}

	restoreDeck(event: MouseEvent) {
		this.stateUpdater.next(new RestoreDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
	}

	selectDeck() {
		if (this.enableClick) {
			this.stateUpdater.next(new SelectDeckDetailsEvent(this._deck.deckstring));
		}
	}

	private buildLastUsedDate(lastUsedTimestamp: number): string {
		const date = new Date(lastUsedTimestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric',
		});
	}
}
