import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { DeckState } from '../../../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-twitch-title-bar',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/decktracker-title-bar.component.scss',
		'../../../../../css/component/decktracker/overlay/twitch/decktracker-twitch-title-bar.component.scss',
	],
	template: `
		<div class="title-bar">
			<i class="logo">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#decktracker_logo"/>
				</svg>
            </i>
            <i *ngIf="deckState.deckstring" class="copy-deckstring" 
                    (click)="copyDeckstring()" 
                    (mouseenter)="onMouseEnter()"
                    (mouseleave)="onMouseLeave()">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#copy_deckstring"/>
				</svg>
            </i>
            <div class="copy-text">{{copyText}}</div>
            <button class="i-30 close-button" (click)="closeWindow()">
                <svg class="svg-icon-fill">
                    <use xlink:href="assets/svg/sprite.svg#window-control_minimize"></use>
                </svg>
            </button>   
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerTwitchTitleBarComponent {

    @Input() deckState: DeckState;
    copyText: string;

    private copied = false;

    constructor(private cdr: ChangeDetectorRef) { }
    
    copyDeckstring() {
        (navigator as any).clipboard.writeText(this.deckState.deckstring);
        this.copyText = 'Copied';
        this.copied = true;
        console.log('copied deckstring to clipboard', this.deckState.deckstring);
        this.cdr.detectChanges();
        setTimeout(() => {
            this.copied = false;
            this.copyText = null;
            this.cdr.detectChanges();
        }, 3000);
    }

    onMouseEnter() {
        if (this.copied) {
            return;
        }
        this.copyText = 'Copy';
        this.cdr.detectChanges();
    }

    onMouseLeave() {
        if (this.copied) {
            return;
        }
        this.copyText = null;
        this.cdr.detectChanges();
    }

    closeWindow() {
        console.log('minimizing window');
        (window as any).Twitch.ext.actions.minimize();
    }
}