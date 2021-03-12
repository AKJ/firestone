import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';
import { GameEvent } from '../../models/game-event';
import { DebugService } from '../../services/debug.service';
import { CARDS_VERSION } from '../../services/hs-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AttackCounterDefinition } from './definitions/attack-counter';
import { BgsPogoCounterDefinition } from './definitions/bgs-pogo-counter';
import { CthunCounterDefinition } from './definitions/cthun-counter';
import { ElementalCounterDefinition } from './definitions/elemental-counter';
import { FatigueCounterDefinition } from './definitions/fatigue-counter';
import { GalakrondCounterDefinition } from './definitions/galakrond-counter';
import { JadeCounterDefinition } from './definitions/jade-counter';
import { PogoCounterDefinition } from './definitions/pogo-counter';
import { SpellCounterDefinition } from './definitions/spell-counter';
import { CounterDefinition, CounterType } from './definitions/_counter-definition';

declare let amplitude;

@Component({
	selector: 'game-counters',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		`../../../css/themes/decktracker-theme.scss`,
		'../../../css/component/game-counters/game-counters.component.scss',
	],
	template: `
		<div class="root overlay-container-parent" [ngClass]="{ 'isBgs': isBgs }" [activeTheme]="'decktracker'">
			<generic-counter
				*ngIf="definition && activeCounter === definition.type"
				[image]="definition.image"
				[helpTooltipText]="definition.tooltip"
				[value]="definition.value"
				[counterClass]="definition.cssClass"
				[standardCounter]="definition.standardCounter"
			></generic-counter>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameCountersComponent implements AfterViewInit, OnDestroy {
	activeCounter: CounterType;
	side: 'player' | 'opponent';
	isBgs: boolean;

	definition: CounterDefinition;

	private windowId: string;
	private stateSubscription: Subscription;
	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private el: ElementRef,
		private init_DebugService: DebugService,
		private cards: AllCardsService,
	) {
		cards.initializeCardsDb(CARDS_VERSION);
		const nativeElement = el.nativeElement;
		this.activeCounter = nativeElement.getAttribute('counter');
		this.side = nativeElement.getAttribute('side');
		this.isBgs = this.activeCounter.includes('bgs');
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		console.log('[shutdown] unsubscribing game-counters', this.activeCounter, this.side);
		this.stateSubscription?.unsubscribe();
		this.preferencesSubscription?.unsubscribe();
		console.log('[shutdown] unsubscribed from game-counters');
	}

	@HostListener('mousedown')
	dragMove() {
		this.ow.dragMove(this.windowId, async result => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateCounterPosition(this.activeCounter, this.side, window.left, window.top);
		});
	}

	async ngAfterViewInit() {
		if (!this.activeCounter.includes('bgs')) {
			const deckEventBus: BehaviorSubject<any> = this.ow.getMainWindow().deckEventBus;
			const subscriber = new Subscriber<any>(async event => {
				// Ideally this should not be necessary, but it looks like that doing things in the beforeunload
				// handler is not always enough
				if (event.event.name === GameEvent.GAME_END) {
					console.log('unsubscribing');
					this.stateSubscription?.unsubscribe();
					this.preferencesSubscription?.unsubscribe();
					return;
				}
				if (!event?.state) {
					return;
				}
				this.definition = this.buildDefinition(event?.state as GameState, this.activeCounter, this.side);
				// console.log('built definition', this.definition, event?.state, this.activeCounter, this.side);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
			this.stateSubscription = deckEventBus.subscribe(subscriber);
			console.log('subscribed in game counters', subscriber, this.stateSubscription, deckEventBus);
		} else {
			const deckEventBus: BehaviorSubject<BattlegroundsState> = this.ow.getMainWindow().battlegroundsStore;
			const subscriber = new Subscriber<any>(async newState => {
				if (!newState) {
					return;
				}
				this.definition = this.buildBgsDefinition(newState, this.activeCounter, this.side);
				// console.log('built definition', this.definition, newState, this.activeCounter, this.side);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
			subscriber['identifier'] = 'game-counters-bgs';
			this.stateSubscription = deckEventBus.subscribe(subscriber);
		}
		this.windowId = (await this.ow.getCurrentWindow()).id;
		await this.restoreWindowPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildDefinition(gameState: GameState, activeCounter: CounterType, side: string): CounterDefinition {
		switch (activeCounter) {
			case 'galakrond':
				return GalakrondCounterDefinition.create(gameState, side);
			case 'jadeGolem':
				return JadeCounterDefinition.create(gameState, side);
			case 'cthun':
				return CthunCounterDefinition.create(gameState, side);
			case 'fatigue':
				return FatigueCounterDefinition.create(gameState, side);
			case 'attack':
				return AttackCounterDefinition.create(gameState, side);
			case 'pogo':
				return PogoCounterDefinition.create(gameState, side);
			case 'spells':
				return SpellCounterDefinition.create(gameState, side);
			case 'elemental':
				return ElementalCounterDefinition.create(gameState, side);
			default:
				console.error('unexpected activeCounter for non-bgs', activeCounter);
		}
	}

	private buildBgsDefinition(
		gameState: BattlegroundsState,
		activeCounter: CounterType,
		side: string,
	): CounterDefinition {
		switch (activeCounter) {
			case 'bgsPogo':
				return BgsPogoCounterDefinition.create(gameState, side);
			default:
				console.warn('unexpected activeCounter for bgs', activeCounter);
		}
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const trackerPosition = await this.prefs.getCounterPosition(this.activeCounter, this.side);
		const newLeft = (trackerPosition && trackerPosition.left) || (await this.getDefaultLeft());
		const newTop = (trackerPosition && trackerPosition.top) || (await this.getDefaultTop());
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}

	private async getDefaultLeft() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.activeCounter === 'attack') {
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.16;
		} else {
			const offset = this.activeCounter === 'galakrond' ? 0 : 150;
			return gameInfo.logicalWidth * 0.5 + gameInfo.logicalHeight * 0.2 + offset;
		}
	}

	private async getDefaultTop() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (this.side === 'player') {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.65;
			} else {
				return gameInfo.logicalHeight * 0.7;
			}
		} else {
			if (this.activeCounter === 'attack') {
				return gameInfo.logicalHeight * 0.1;
			} else {
				return gameInfo.logicalHeight * 0.1;
			}
		}
	}
}
