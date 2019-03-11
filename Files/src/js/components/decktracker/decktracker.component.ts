import { Component, AfterViewInit, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, HostListener } from '@angular/core';

import { DebugService } from '../../services/debug.service';
import { GameState } from '../../models/decktracker/game-state';
import { DeckEvents } from '../../services/decktracker/event-parser/deck-events';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../../services/preferences.service';
import { GameType } from '../../models/enums/game-type';

declare var overwolf: any;

@Component({
	selector: 'decktracker',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/decktracker.component.scss',
	],
	template: `
		<div class="root">
			<div class="decktracker" *ngIf="gameState">
				<decktracker-title-bar [windowId]="windowId"></decktracker-title-bar>
				<decktracker-deck-name 
					[hero]="gameState.playerDeck.hero"
					[deckName]="gameState.playerDeck.name">				
				</decktracker-deck-name>
				<decktracker-deck-list [deckState]="gameState.playerDeck"></decktracker-deck-list>
			</div>

			<i class="i-54 gold-theme corner top-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner top-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-right">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
			<i class="i-54 gold-theme corner bottom-left">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner"/>
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerComponent implements AfterViewInit {

	gameState: GameState;
	windowId: string;

	constructor(
			private prefs: PreferencesService,
			private cdr: ChangeDetectorRef,
			private debugService: DebugService,
			private elRef: ElementRef) {
		overwolf.windows.getCurrentWindow((result) => {
			this.windowId = result.window.id;
		});
		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.closeApp();
			}
		});
	}

	ngAfterViewInit() {
		// We get the changes via event updates, so automated changed detection isn't useful in PUSH mode
		this.cdr.detach();
		const deckEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().deckEventBus;
		deckEventBus.subscribe((event) => {
			console.log('received deck event', event);
			this.gameState = event.state;
			this.processEvent(event.event);
			this.cdr.detectChanges();
		})
		const preferencesEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe((event) => {
			console.log('received pref event', event);
			if (event.name === PreferencesService.DECKTRACKER_OVERLAY_DISPLAY) {
				this.handleDisplayPreferences(event.preferences);
			}
		})
		console.warn("Should remove the restoreWindow from prod code");
		this.gameState = overwolf.windows.getMainWindow().deckDebug.state;
		console.log('game state', this.gameState);
		this.handleDisplayPreferences();
		this.cdr.detectChanges();
	}

	@HostListener('mousedown')
	dragMove() {
		overwolf.windows.dragMove(this.windowId);
	};

	private processEvent(event) {
		switch(event.name) {
			case DeckEvents.MATCH_METADATA:
				this.handleDisplayPreferences();
				break;
			case DeckEvents.GAME_END:
				this.hideWindow();
				break;
		}
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		if (await this.shouldDisplayOverlay(preferences)) {
			this.restoreWindow();
		}
		else {
			this.hideWindow();
		}
	}

	private async shouldDisplayOverlay(preferences: Preferences = null): Promise<boolean> {
		if (!this.gameState || !this.gameState.metadata) { 
			return;
		}
		const prefs = preferences || await this.prefs.getPreferences();
		switch (this.gameState.metadata.gameType as GameType) {
			case GameType.ARENA: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowArena;
			case GameType.CASUAL: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowCasual;
			case GameType.RANKED: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowRanked;
			case GameType.VS_AI: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowPractice;
			case GameType.VS_FRIEND: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowFriendly;
			case GameType.FSG_BRAWL: 
			case GameType.FSG_BRAWL_1P_VS_AI: 
			case GameType.FSG_BRAWL_2P_COOP: 
			case GameType.FSG_BRAWL_VS_FRIEND: 
			case GameType.TB_1P_VS_AI: 
			case GameType.TB_2P_COOP: 
			case GameType.TAVERNBRAWL: 
				return this.gameState.playerDeck.deckList.length > 0 && prefs.decktrackerShowTavernBrawl;
		}
		return this.gameState.playerDeck.deckList.length > 0;
	}

	private restoreWindow() {
		overwolf.windows.restore(this.windowId, (result) => {
			let width = 270;
			overwolf.games.getRunningGameInfo((gameInfo) => {
				if (!gameInfo) {
					return;
				}
				let gameWidth = gameInfo.logicalWidth;
				let gameHeight = gameInfo.logicalHeight;
				let dpi = gameWidth / gameInfo.width;
				// console.log('computed stuff', gameWidth, gameHeight, dpi);
				overwolf.windows.changeSize(this.windowId, width, gameHeight, (changeSize) => {
					// https://stackoverflow.com/questions/8388440/converting-a-double-to-an-int-in-javascript-without-rounding
					let newLeft = ~~(gameWidth - width* dpi - 20); // Leave a bit of room to the right
					let newTop = 0;
					// console.log('changing position', newLeft, newTop, width, gameHeight, changeSize);
					overwolf.windows.changePosition(this.windowId, newLeft, newTop, (changePosition) => {
						// console.log('changed window position', changePosition);
					});
				});
			});
		});
	}

	private hideWindow() {
		overwolf.windows.hide(this.windowId, (result) => {
		})
	}

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private closeApp() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				// console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}
}