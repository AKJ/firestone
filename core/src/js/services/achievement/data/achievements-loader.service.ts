import { Injectable } from '@angular/core';
import { Achievement } from '../../../models/achievement';
import { RawAchievement } from '../../../models/achievement/raw-achievement';
import { ApiRunner } from '../../api-runner';
import { Challenge } from '../achievements/challenges/challenge';
import { ChallengeBuilderService } from '../achievements/challenges/challenge-builder.service';

const ACHIEVEMENTS_URL = 'https://static.zerotoheroes.com/hearthstone/data/achievements';

@Injectable()
export class AchievementsLoaderService {
	public challengeModules: readonly Challenge[];

	private achievements: readonly Achievement[];

	constructor(private api: ApiRunner, private challengeBuilder: ChallengeBuilderService) {}

	public async getAchievement(achievementId: string): Promise<Achievement> {
		await this.waitForInit();
		return this.achievements.find(achievement => achievement.id === achievementId);
	}

	public async getAchievementsById(achievementIds: readonly string[]): Promise<readonly Achievement[]> {
		if (!achievementIds) {
			return [];
		}
		await this.waitForInit();
		return this.achievements.filter(achievement => achievementIds.indexOf(achievement.id) !== -1);
	}

	public async getAchievements(): Promise<readonly Achievement[]> {
		// console.log('[achievements-loader] Getting achievements');
		await this.waitForInit();
		return this.achievements;
	}

	public async getChallengeModules(): Promise<readonly Challenge[]> {
		// console.log('[achievements-loader] Getting modules');
		await this.waitForInit();
		return this.challengeModules;
	}

	public async initializeAchievements(): Promise<[readonly Achievement[], readonly Challenge[]]> {
		console.log('[achievements-loader] Initializing achievements');
		const rawAchievements: readonly RawAchievement[] = await this.loadAll();
		console.log('[achievements-loader] loaded all', rawAchievements.length);
		return new Promise<[readonly Achievement[], readonly Challenge[]]>(resolve => {
			this.achievements = rawAchievements.map(rawAchievement => this.wrapRawAchievement(rawAchievement));
			this.challengeModules = rawAchievements
				.map(rawAchievement => this.challengeBuilder.buildChallenge(rawAchievement))
				.filter(challenge => challenge);
			console.log('[achievements-loader] init over', this.achievements.length, this.challengeModules.length);
			resolve([this.achievements, this.challengeModules]);
		});
	}

	private async loadAll(): Promise<readonly RawAchievement[]> {
		console.log('[achievements-loader] loading all achievements');
		const achievementFiles = [
			'hearthstone_game',
			'global',
			'battlegrounds2',
			'dungeon_run',
			'monster_hunt',
			'rumble_run',
			'dalaran_heist',
			'tombs_of_terror',
			'amazing_plays',
			'competitive_ladder',
			'deckbuilding',
			'galakrond',
			'thijs',
		];
		const achievementsFromRemote = await Promise.all(
			achievementFiles.map(fileName => this.loadAchievements(fileName)),
		);
		const result = achievementsFromRemote.reduce((a, b) => a.concat(b), []);
		console.log(
			'[achievements-loader] returning full achievements',
			result && result.length,
			result.find(ach => ach.id === 'battlegrounds_lock_all_1500'),
		);
		return result;
	}

	private async loadAchievements(fileName: string): Promise<readonly RawAchievement[]> {
		return this.api.callGetApiWithRetries(`${ACHIEVEMENTS_URL}/${fileName}.json?v=10`);
	}

	private wrapRawAchievement(raw: RawAchievement): Achievement {
		const { requirements, resetEvents, ...achievement } = raw;
		return Object.assign(new Achievement(), achievement, {
			numberOfCompletions: 0,
		} as Achievement);
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.achievements && this.challengeModules) {
					resolve();
				} else {
					// console.log('[achievements-loader] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
