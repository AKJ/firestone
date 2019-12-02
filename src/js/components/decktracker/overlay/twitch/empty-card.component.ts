import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'empty-card',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/empty-card.component.scss',
	],
	template: `
		<div class="card" [cardTooltip]="_cardId" [cardTooltipPosition]="'right'">
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyCardComponent {
	_cardId: string;

	@Input('cardId') set cardId(value: string) {
		this._cardId = value;
		const imageUrl = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png`;
		// Preload
		const image = new Image();
		image.onload = () => console.log('[image-preloader] preloaded image', imageUrl);
		image.src = imageUrl;
	}
}
