import { Injectable } from '@angular/core';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { UserService } from '../user.service';

const BGS_BEST_USER_STATS_ENDPOINT = 'https://ituxwmzobarpdbza5ayj2emdgq0nyhzp.lambda-url.us-west-2.on.aws';

@Injectable()
export class BgsBestUserStatsService extends AbstractFacadeService<BgsBestUserStatsService> {
	public bestStats$$: SubscriberAwareBehaviorSubject<readonly BgsBestStat[]>;

	private api: ApiRunner;
	private userService: UserService;
	private localStorage: LocalStorageService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'bgsBestUserStats', () => !!this.bestStats$$);
	}

	protected override assignSubjects() {
		this.bestStats$$ = this.mainInstance.bestStats$$;
	}

	protected async init() {
		this.bestStats$$ = new SubscriberAwareBehaviorSubject<readonly BgsBestStat[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.userService = AppInjector.get(UserService);
		this.localStorage = AppInjector.get(LocalStorageService);

		this.bestStats$$.onFirstSubscribe(async () => {
			const localInfo = this.localStorage.getItem<LocalBgsBestStats>(LocalStorageService.USER_BGS_BEST_STATS);
			if (localInfo?.stats?.length) {
				console.debug('[bgs-best-user-stats] using local info', localInfo);
				this.bestStats$$.next(localInfo.stats);
			}

			const currentUser = await this.userService.getCurrentUser();
			const remoteData: readonly BgsBestStat[] = await this.api.callGetApi(
				`${BGS_BEST_USER_STATS_ENDPOINT}/${currentUser.username || currentUser.userId}`,
			);

			const newInfo: LocalBgsBestStats = {
				lastUpdateDate: new Date(),
				stats: remoteData,
			};
			this.localStorage.setItem(LocalStorageService.USER_BGS_BEST_STATS, newInfo);
			console.debug('[bgs-best-user-stats] using remote info', remoteData);
			this.bestStats$$.next(remoteData);
		});
	}

	// TODO: recompute the best values when a game is over
	// For now you'll need to refresh the app to get the info, which IMO is ok since I don't think the feature is used much
}

interface LocalBgsBestStats {
	readonly lastUpdateDate: Date;
	readonly stats: readonly BgsBestStat[];
}
