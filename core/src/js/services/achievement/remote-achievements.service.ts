import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { HsRawAchievement } from '../../models/achievement/hs-raw-achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { ApiRunner } from '../api-runner';
import { GameStateService } from '../decktracker/game-state.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { UserService } from '../user.service';
import { AchievementsManager } from './achievements-manager.service';
import { AchievementsLocalDbService } from './indexed-db.service';

const ACHIEVEMENTS_POST_URL = 'https://d37acgsdwl.execute-api.us-west-2.amazonaws.com/Prod/achievementstats';
const ACHIEVEMENTS_RETRIEVE_URL = 'https://mtpdm7a1e5.execute-api.us-west-2.amazonaws.com/Prod/completedAchievements';
const RAW_HS_ACHIEVEMENTS_RETRIEVE_URL = 'https://static.zerotoheroes.com/hearthstone/jsoncards/hs-achievements.json';

@Injectable()
export class RemoteAchievementsService {
	private completedAchievementsFromRemote: readonly CompletedAchievement[] = [];

	constructor(
		private api: ApiRunner,
		private indexedDb: AchievementsLocalDbService,
		private ow: OverwolfService,
		private manager: AchievementsManager,
		private userService: UserService,
		private gameService: GameStateService,
		private prefs: PreferencesService,
	) {}

	public async loadAchievements(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			await this.indexedDb.setAll([]);
			return [];
		}
		const currentUser = await this.userService.getCurrentUser();
		// Load from remote
		const postEvent = {
			userName: currentUser.username,
			userId: currentUser.userId,
			machineId: currentUser.machineId,
		};
		console.log('[remote-achievements] loading from server');
		const [achievementsFromRemote, achievementsFromMemory] = await Promise.all([
			this.loadRemoteAchievements(postEvent),
			this.manager.getAchievements(),
		]);
		console.log('[remote-achievements] loaded', achievementsFromRemote.length, achievementsFromMemory.length);
		if (!achievementsFromRemote.length && !achievementsFromMemory.length) {
			return [];
		}

		// Update local cache
		const completedAchievementsFromRemote = achievementsFromRemote.map(ach => CompletedAchievement.create(ach));
		this.completedAchievementsFromRemote = completedAchievementsFromRemote;
		const completedAchievementsFromMemory = achievementsFromMemory.map(ach =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		const achievements = [...completedAchievementsFromRemote, ...completedAchievementsFromMemory];
		await this.indexedDb.setAll(achievements);
		console.log('[remote-achievements] updated local cache');
		return achievements;
	}

	public async reloadFromMemory(): Promise<readonly CompletedAchievement[]> {
		const prefs = this.prefs.getPreferences();
		if (process.env.NODE_ENV !== 'production' && (await prefs).resetAchievementsOnAppStart) {
			console.log('[remote-achievements] not loading achievements from remote - streamer mode');
			await this.indexedDb.setAll([]);
			return [];
		}

		const achievementsFromMemory = await this.manager.getAchievements();
		const completedAchievementsFromMemory = achievementsFromMemory.map(ach =>
			CompletedAchievement.create({
				id: `hearthstone_game_${ach.id}`,
				numberOfCompletions: ach.completed ? 1 : 0,
			} as CompletedAchievement),
		);
		const achievements = [...this.completedAchievementsFromRemote, ...completedAchievementsFromMemory];
		await this.indexedDb.setAll(achievements);
		console.log('[remote-achievements] re-updated local cache');
		return achievements;
	}

	public async publishRemoteAchievement(achievement: Achievement, retriesLeft = 5): Promise<void> {
		const [currentUser, reviewId] = await Promise.all([
			this.userService.getCurrentUser(),
			this.gameService.getCurrentReviewId(),
		]);
		// const achievement: Achievement = event.data[0];
		const statEvent = {
			'creationDate': new Date(),
			'reviewId': reviewId,
			'userId': currentUser.userId,
			'userMachineId': currentUser.machineId,
			'userName': currentUser.username,
			'achievementId': achievement.id,
			'name': achievement.name,
			'type': achievement.type,
			'cardId': achievement.displayCardId,
			'numberOfCompletions': achievement.numberOfCompletions,
		};
		this.api.callPostApiWithRetries(ACHIEVEMENTS_POST_URL, statEvent, retriesLeft);
	}

	public async loadHsRawAchievements(): Promise<readonly HsRawAchievement[]> {
		const raw: any = await this.api.callGetApiWithRetries(RAW_HS_ACHIEVEMENTS_RETRIEVE_URL);
		return raw?.achievements || [];
	}

	private async loadRemoteAchievements(userInfo): Promise<readonly CompletedAchievement[]> {
		return ((await this.api.callPostApiWithRetries(ACHIEVEMENTS_RETRIEVE_URL, userInfo)) as any)?.results || [];
	}
}
