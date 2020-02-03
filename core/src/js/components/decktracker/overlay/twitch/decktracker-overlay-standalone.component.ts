import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';
import { CardTooltipPositionType } from '../../../../directives/card-tooltip-position.type';
import { GameState } from '../../../../models/decktracker/game-state';
import { Events } from '../../../../services/events.service';

@Component({
	selector: 'decktracker-overlay-standalone',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/cdk-overlay.scss`,
		'../../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-overlay-standalone.component.scss',
		`../../../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			*ngIf="gameState"
			class="root"
			[ngClass]="{ 'dragging': dragging }"
			[activeTheme]="'decktracker'"
			cdkDrag
			(cdkDragStarted)="startDragging()"
			(cdkDragReleased)="stopDragging()"
			(resized)="onResized($event)"
		>
			<div class="scalable">
				<div class="decktracker-container">
					<div class="decktracker" *ngIf="gameState">
						<decktracker-twitch-title-bar [deckState]="gameState.playerDeck">
						</decktracker-twitch-title-bar>
						<decktracker-deck-list
							*ngIf="gameState.playerDeck?.deck.length > 0"
							[deckState]="gameState.playerDeck"
							[displayMode]="displayMode"
							[tooltipPosition]="tooltipPosition"
						>
						</decktracker-deck-list>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayStandaloneComponent implements AfterViewInit {
	@Input('gameState') gameState: GameState;
	displayMode: string;
	dragging: boolean;
	tooltipPosition: CardTooltipPositionType = 'left';

	@Output() dragStart = new EventEmitter<void>();
	@Output() dragEnd = new EventEmitter<void>();

	constructor(
		private events: Events,
		private cdr: ChangeDetectorRef,
		private el: ElementRef,
		private renderer: Renderer2,
	) {}

	ngAfterViewInit() {
		this.displayMode = 'DISPLAY_MODE_GROUPED';
	}

	onResized(event: ResizedEvent) {
		try {
			console.log('resize event', event);
			// Resize the tracker
			const scale = event.newHeight / 800;
			// console.log('proposed scale', scale);
			// Now shrink the scale is the tracker is taller than a portion of the container's height
			const containerHeight = this.el.nativeElement.parentNode.parentNode.getBoundingClientRect().height;
			const maxTrackerHeight = containerHeight;
			const finalScale = Math.min(scale, maxTrackerHeight / event.newHeight);
			const element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${finalScale})`);
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
			this.keepOverlayInBounds();
		} catch (e) {
			console.log('Caught exception while trying to resize overlay', e);
		}
	}

	private keepOverlayInBounds() {
		setTimeout(() => {
			try {
				// Move the tracker so that it doesn't go over the edges
				const rect = this.el.nativeElement.querySelector('.scalable').getBoundingClientRect();
				const parentRect = this.el.nativeElement.parentNode.getBoundingClientRect();
				// Get current transform values
				const transform = window.getComputedStyle(this.el.nativeElement.querySelector('.root')).transform;
				const matrix = new DOMMatrix(transform);
				const matrixCurrentLeftMove = matrix.m41;
				const matrixCurrentTopMove = matrix.m42;
				let newTranslateLeft = matrixCurrentLeftMove;
				let newTranslateTop = matrixCurrentTopMove;
				if (rect.left < 0) {
					// We move it so that the left is 0
					const amountToMove = Math.abs(rect.left);
					newTranslateLeft = matrixCurrentLeftMove + amountToMove;
				} else if (rect.right > parentRect.right) {
					const amountToMove = rect.right - parentRect.right;
					newTranslateLeft = matrixCurrentLeftMove - amountToMove;
				}
				if (rect.top < 0) {
					const amountToMove = Math.abs(rect.top);
					newTranslateTop = matrixCurrentTopMove + amountToMove;
				} else if (rect.bottom > parentRect.bottom) {
					const amountToMove = rect.bottom - parentRect.bottom;
					newTranslateTop = matrixCurrentTopMove - amountToMove;
				}
				const newTransform = `translate3d(${newTranslateLeft}px, ${newTranslateTop}px, 0px)`;
				this.renderer.setStyle(this.el.nativeElement.querySelector('.root'), 'transform', newTransform);
			} catch (e) {
				// Usually happens in edge where DOMMatrix is not defined
				console.log('Exception while keeping overlay in bounds', e);
			}
			// this.cdr.detectChanges();
			// console.log('resizing done', rect, parentRect, matrix);
			// console.log('updating transform', newTransform, matrixCurrentLeftMove, matrixCurrentTopMove, newTranslateLeft);
		});
	}

	startDragging() {
		this.tooltipPosition = 'none';
		this.dragging = true;
		console.log('starting dragging');
		// this.events.broadcast(Events.HIDE_TOOLTIP);
		this.dragStart.next();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		this.dragging = false;
		console.log('stopped dragging');
		this.dragEnd.next();
		await this.updateTooltipPosition();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		this.keepOverlayInBounds();
	}

	private async updateTooltipPosition() {
		// Move the tracker so that it doesn't go over the edges
		const rect = this.el.nativeElement.querySelector('.scalable').getBoundingClientRect();
		if (rect.left < 300) {
			this.tooltipPosition = 'right';
		} else {
			this.tooltipPosition = 'left';
		}
		console.log('updated tooltip position', rect, this.tooltipPosition);
		// console.log('[decktracker-overlay] tooltip position updated', this.tooltipPosition);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
