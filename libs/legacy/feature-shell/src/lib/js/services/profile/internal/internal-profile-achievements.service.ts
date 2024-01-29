import { Injectable } from '@angular/core';
import { ProfileAchievementCategory } from '@firestone-hs/api-user-profile';
import { SceneMode } from '@firestone-hs/reference-data';
import { SceneService } from '@firestone/memory';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { AchievementsMemoryMonitor } from '../../achievement/data/achievements-memory-monitor.service';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../utils';

@Injectable()
export class InternalProfileAchievementsService {
	public achievementCategories$$ = new SubscriberAwareBehaviorSubject<readonly ProfileAchievementCategory[]>([]);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly achievementsMonitor: AchievementsMemoryMonitor,
		private readonly sceneService: SceneService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		await this.sceneService.isReady();

		this.achievementCategories$$.onFirstSubscribe(() => {
			combineLatest([this.sceneService.currentScene$$, this.store.enablePremiumFeatures$()])
				.pipe(
					// I don't have a good way to detect when the Journal is being opened
					filter(([scene, premium]) => premium && [SceneMode.COLLECTIONMANAGER].includes(scene)),
					take(1),
				)
				.subscribe(() => {
					this.initAchievements();
				});
		});
	}

	private initAchievements() {
		const achievementsToUpload$: Observable<readonly ProfileAchievementCategory[]> = combineLatest([
			this.achievementsMonitor.achievementCategories$$,
			this.sceneService.currentScene$$,
		]).pipe(
			filter(([achievementCategories, currentScene]) => [SceneMode.COLLECTIONMANAGER].includes(currentScene)),
			debounceTime(2000),
			map(([achievementCategories]) => {
				return (
					achievementCategories?.map((category) => {
						return {
							id: category.id,
							availablePoints: category.availablePoints,
							points: category.points,
							totalAchievements: category.totalAchievements,
							completedAchievements: category.completedAchievements,
						} as ProfileAchievementCategory;
					}) ?? []
				);
			}),
		);
		achievementsToUpload$
			.pipe(
				filter((achievementCategories) => !!achievementCategories?.length),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(async (achievementCategories) => {
				console.debug('[profile] achievementCategories', achievementCategories);
				this.achievementCategories$$.next(achievementCategories);
			});
	}
}
