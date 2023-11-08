import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { DungeonCrawlOptionType, SceneMode } from '@firestone-hs/reference-data';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { SceneService } from '../../services/game/scene.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from './_widget-wrapper.component';

@Component({
	selector: 'duels-ooc-hero-power-selection-widget-wrapper',
	styleUrls: ['../../../css/component/overlays/background-widget.component.scss'],
	template: `
		<duels-ooc-hero-power-selection
			class="widget"
			*ngIf="showWidget$ | async"
			[style.width.px]="windowWidth"
			[style.height.px]="windowHeight"
		></duels-ooc-hero-power-selection>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroPowerSelectionWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit
{
	protected defaultPositionLeftProvider = (gameWidth: number, gameHeight: number) => gameHeight * 0.2 * 0.45;
	protected defaultPositionTopProvider = (gameWidth: number, gameHeight: number) => 0.2 * gameHeight;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = () => this.el.nativeElement.querySelector('.widget')?.getBoundingClientRect();

	showWidget$: Observable<boolean>;
	windowWidth: number;
	windowHeight: number;

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly scene: SceneService,
	) {
		super(ow, el, prefs, renderer, store, cdr);
	}

	async ngAfterContentInit() {
		await this.scene.isReady();

		this.showWidget$ = combineLatest([
			this.store.listenPrefs$((prefs) => prefs.duelsShowInfoOnHeroSelection),
			this.store.listen$(([main, prefs]) => main?.duels),
			this.scene.currentScene$$,
		]).pipe(
			this.mapData(([[displayFromPrefs], [duels], currentScene]) => {
				return false;
				return (
					displayFromPrefs &&
					currentScene === SceneMode.PVP_DUNGEON_RUN &&
					duels.currentOption === DungeonCrawlOptionType.HERO_POWER
				);
			}),
			this.handleReposition(),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	protected async doResize(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.height;
		this.windowWidth = gameHeight * 0.9;
		this.windowHeight = gameHeight * 0.72;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
