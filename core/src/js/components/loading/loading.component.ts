import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { DebugService } from '../../services/debug.service';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'loading',
	styleUrls: [`../../../css/global/components-global.scss`, `../../../css/component/loading/loading.component.scss`],
	template: `
		<window-wrapper [activeTheme]="'general'">
			<section class="menu-bar">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
					</svg>
				</i>
				<div class="controls">
					<control-settings [windowId]="thisWindowId"></control-settings>
					<control-discord></control-discord>
					<button class="i-30 pink-button" (mousedown)="minimizeWindow()">
						<svg class="svg-icon-fill">
							<use
								xmlns:xlink="https://www.w3.org/1999/xlink"
								xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"
							></use>
						</svg>
					</button>
					<button class="i-30 close-button" (mousedown)="closeWindow()">
						<svg class="svg-icon-fill">
							<use
								xmlns:xlink="https://www.w3.org/1999/xlink"
								xlink:href="/Files/assets/svg/sprite.svg#window-control_close"
							></use>
						</svg>
					</button>
				</div>
			</section>
			<section class="content-container">
				<div class="app-title">
					<i class="i-35 gold-theme left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#title_decor" />
						</svg>
					</i>
					<span class="title">{{ title }}</span>
					<i class="i-35 gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#title_decor" />
						</svg>
					</i>
				</div>
				<i class="i-54 loading-icon gold-theme" *ngIf="loading">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#loading_spiral" />
					</svg>
				</i>
				<div class="sub-title" *ngIf="!loading">
					<span>Hit</span>
					<hotkey></hotkey>
					<span>to view the app</span>
				</div>
			</section>
			<ads [parentComponent]="'loading-window'"></ads>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // TODO: clean this
})
export class LoadingComponent implements AfterViewInit, OnDestroy {
	title = 'Getting ready';
	loading = true;
	thisWindowId: string;

	private stateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;

	constructor(private debugService: DebugService, private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		this.positionWindow();
		this.messageReceivedListener = this.ow.addMessageReceivedListener(message => {
			console.log('received', message);
			if (message.id === 'ready') {
				this.title = 'Your abilities are ready!';
				this.loading = false;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}

	closeWindow() {
		if (this.loading) {
			amplitude.getInstance().logEvent('loading', { 'timing': 'close-before-complete' });
		}
		this.ow.closeWindow(this.thisWindowId);
	}

	minimizeWindow() {
		this.ow.minimizeWindow(this.thisWindowId);
	}

	private async positionWindow() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const gameHeight = gameInfo.logicalHeight;
		const newLeft = ~~(gameWidth * 0.4) - 440;
		const newTop = ~~(gameHeight * 0.1);
		console.log('changing loading window position', this.thisWindowId, newLeft, newTop);
		this.ow.changeWindowPosition(this.thisWindowId, newLeft, newTop);
	}
}
