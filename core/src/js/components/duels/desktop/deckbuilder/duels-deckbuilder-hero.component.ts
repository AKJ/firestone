import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { duelsHeroConfigs } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { DuelsDeckbuilderHeroSelectedEvent } from '@services/mainwindow/store/events/duels/duels-deckbuilder-hero-selected-decks-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-deckbuilder-hero',
	styleUrls: [`../../../../../css/component/duels/desktop/deckbuilder/duels-deckbuilder-hero.component.scss`],
	template: `
		<div class="duels-deckbuilder-hero" role="list">
			<button
				class="hero"
				role="listitem"
				tabindex="0"
				*ngFor="let hero of heroOptions; trackBy: trackByCardId"
				(click)="onHeroCardClicked(hero)"
			>
				<img [src]="hero.cardImage" [alt]="hero.name" class="portrait" />
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckbuilderHeroComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroOptions: readonly HeroOption[];

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroOptions = duelsHeroConfigs.map((config) => {
			return {
				cardId: config.hero,
				cardImage: this.i18n.getCardImage(config.hero, { isHeroSkin: true }),
				name: this.allCards.getCard(config.hero).name,
				classes: config.heroClasses,
			};
		});
	}

	trackByCardId(index: number, item: HeroOption) {
		return item.cardId;
	}

	onHeroCardClicked(hero: HeroOption) {
		console.debug('clicked on', hero);
		this.store.send(new DuelsDeckbuilderHeroSelectedEvent(hero.cardId));
	}
}

interface HeroOption {
	readonly cardId: string;
}
