import { Injectable } from '@angular/core';
import { Achievement } from '../../models/achievement';
import { AchievementProgress, AchievementsProgress } from '../../models/achievement/achievement-progress';
import { HsRawAchievement } from '../../models/achievement/hs-raw-achievement';
import { CompletedAchievement } from '../../models/completed-achievement';
import { GameEvent } from '../../models/game-event';
import { MemoryUpdate } from '../../models/memory-update';
import { Events } from '../events.service';
import { FeatureFlags } from '../feature-flags';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { AchievementCompletedEvent } from '../mainwindow/store/events/achievements/achievement-completed-event';
import { MainWindowStoreService } from '../mainwindow/store/main-window-store.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { ProcessingQueue } from '../processing-queue.service';
import { HsAchievementInfo, HsAchievementsInfo } from './achievements-info';
import { AchievementsManager } from './achievements-manager.service';
import { Challenge } from './achievements/challenges/challenge';
import { AchievementsLoaderService } from './data/achievements-loader.service';
import { AchievementsLocalDbService } from './indexed-db.service';
import { RemoteAchievementsService } from './remote-achievements.service';

@Injectable()
export class AchievementsMonitor {
	private processingQueue = new ProcessingQueue<InternalEvent>(
		eventQueue => this.processQueue(eventQueue),
		1000,
		'achievement-monitor',
	);
	private lastReceivedTimestamp;
	private achievementQuotas: { [achievementId: number]: number };
	private previousAchievements: readonly HsAchievementInfo[];

	private achievementsProgressInterval;

	constructor(
		private gameEvents: GameEventsEmitterService,
		private achievementLoader: AchievementsLoaderService,
		private events: Events,
		private store: MainWindowStoreService,
		private remoteAchievements: RemoteAchievementsService,
		private achievementsStorage: AchievementsLocalDbService,
		private achievementsManager: AchievementsManager,
		private memory: MemoryInspectionService,
	) {
		this.lastReceivedTimestamp = Date.now();
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => {
			this.handleEvent(gameEvent);

			if (gameEvent.type === GameEvent.GAME_START) {
				this.assignPreviousAchievements();
				if (FeatureFlags.SHOW_CONSTRUCTED_SECONDARY_WINDOW) {
					this.startAchievementsProgressDetection();
				}
			} else if (gameEvent.type === GameEvent.GAME_END) {
				this.stopAchievementsProgressDetection();
			}
		});

		this.events.on(Events.MEMORY_UPDATE).subscribe(event => {
			const changes: MemoryUpdate = event.data[0];
			if (changes.DisplayingAchievementToast) {
				setTimeout(() => {
					this.detectNewAchievementFromMemory();
				}, 500);
			}
		});
		this.init();
	}

	private async init() {
		const rawAchievements: readonly HsRawAchievement[] = await this.remoteAchievements.loadHsRawAchievements();
		this.achievementQuotas = {};
		for (const ach of rawAchievements) {
			this.achievementQuotas[ach.id] = ach.quota;
		}
	}

	private async detectNewAchievementFromMemory(retriesLeft = 10, forceAchievementsUpdate = false) {
		if (retriesLeft < 0) {
			return;
		}

		// TODO: the "progress step" (like Setting the Standard) achievements are not
		// returned here by the in game achievements progress
		// Trying to read the achievements directly from memory, instead of from the
		// indexeddb, to see if this solves the issue
		console.log('[achievement-monitor] detecting achievements from memory');
		const [existingAchievements, achievementsProgress] = await Promise.all([
			this.achievementsManager.getAchievements(),
			this.memory.getInGameAchievementsProgressInfo(),
		]);
		if (process.env.NODE_ENV !== 'production') {
			console.log(
				'[achievement-monitor] retrieved achievements from memory',
				existingAchievements, // This doesn't have 1876, which is normal since it has not been unlocked
				achievementsProgress, // This has the correct progress
				this.achievementQuotas,
				this.previousAchievements,
				(achievementsProgress?.achievements || [])?.filter(
					progress => progress.progress >= this.achievementQuotas[progress.id],
				),
			);
		} else {
			console.log('[achievement-monitor] retrieved achievements from memory');
		}
		const unlockedAchievements = (achievementsProgress?.achievements || [])
			?.filter(progress => progress.progress >= this.achievementQuotas[progress.id])
			.map(progress => progress.id)
			.map(
				id =>
					// Only achievement with a current progress are in the game's memory, so the ones that are simply
					// yes/no will always be missing
					existingAchievements.find(ach => ach.id === id) || {
						id: id,
						progress: 0,
						completed: false,
					},
			)
			.filter(
				ach =>
					!ach.completed ||
					// It looks like the game might be flagging the achievements as completed right away now
					// Using a === false check doesn't work if the achievement was not part of the previous
					// achievements, which is the case for BG top finishes
					(this.previousAchievements && !this.previousAchievements.find(a => a.id === ach.id)?.completed),
			);
		console.log('[achievement-monitor] unlocked achievements', unlockedAchievements);
		if (!unlockedAchievements.length) {
			if (process.env.NODE_ENV !== 'production') {
				console.log(
					'[achievement-monitor] nothing from memory',
					existingAchievements, // This doesn't have 1876, which is normal since it has not been unlocked
					achievementsProgress, // This has the correct progress
					(achievementsProgress?.achievements || [])?.filter(
						progress => progress.progress >= this.achievementQuotas[progress.id],
					),
					unlockedAchievements,
				);
			}
			setTimeout(() => {
				this.detectNewAchievementFromMemory(retriesLeft - 1, true);
				return;
			}, 150);
			return;
		}
		const achievements = await Promise.all(
			unlockedAchievements.map(ach => this.achievementLoader.getAchievement(`hearthstone_game_${ach.id}`)),
		);
		console.log('[achievement-monitor] built achievements, emitting events', achievements);
		await Promise.all(achievements.map(ach => this.sendUnlockEventFromAchievement(ach)));
		this.previousAchievements = existingAchievements;
	}

	private async handleEvent(gameEvent: GameEvent) {
		// TODO: handle reconnects
		for (const challenge of await this.achievementLoader.getChallengeModules()) {
			try {
				challenge.detect(gameEvent, () => {
					this.sendUnlockEvent(challenge);
				});
			} catch (e) {
				console.error('Exception while trying to handle challenge', challenge.achievementId, e);
			}
		}
	}

	private async sendUnlockEvent(challenge: Challenge) {
		const achievement: Achievement = await this.achievementLoader.getAchievement(challenge.achievementId);
		await this.sendUnlockEventFromAchievement(achievement);
	}

	private async sendUnlockEventFromAchievement(achievement: Achievement) {
		const autoGrantAchievements = await this.achievementLoader.getAchievementsById(
			achievement.linkedAchievementIds,
		);
		const allAchievements =
			autoGrantAchievements.length > 0 ? [achievement, ...autoGrantAchievements] : [achievement];
		// console.debug('[achievement-monitor] will grant achievements?', allAchievements, achievement);
		for (const achv of allAchievements) {
			// console.debug('no-format', '[achievement-monitor] starting process of completed achievement', achv.id);
			const existingAchievement: CompletedAchievement = this.achievementsStorage.getAchievement(achv.id);
			// From now on, stop counting how many times each achievement has been unlocked
			if (existingAchievement.numberOfCompletions >= 1) {
				// console.debug('[achievement-monitor] achievement can be completed only once', achievement.id);
				continue;
			}
			const completedAchievement = new CompletedAchievement(
				existingAchievement.id,
				existingAchievement.numberOfCompletions + 1,
			);
			console.log(
				'[achievement-monitor] starting process of completed achievement',
				achievement.id,
				existingAchievement,
				completedAchievement,
			);
			const mergedAchievement = Object.assign(new Achievement(), achv, {
				numberOfCompletions: completedAchievement.numberOfCompletions,
			} as Achievement);

			this.achievementsStorage.save(completedAchievement);
			console.log('[achievement-monitor] saved achievement', this.achievementsStorage.getAchievement(achv.id));
			this.remoteAchievements.publishRemoteAchievement(mergedAchievement);
			console.log('[achievement-monitor] broadcasting event completion event', mergedAchievement);

			this.enqueue({ achievement: mergedAchievement } as InternalEvent);
		}
	}

	private enqueue(event: InternalEvent) {
		this.lastReceivedTimestamp = Date.now();
		this.processingQueue.enqueue(event);
	}

	private async processQueue(eventQueue: readonly InternalEvent[]): Promise<readonly InternalEvent[]> {
		// Don't process an event if we've just received one, as it could indicate that other
		// related events will come soon as well
		if (Date.now() - this.lastReceivedTimestamp < 500) {
			// console.log('[achievements-monitor] too soon, waiting before processing');
			return eventQueue;
		}
		const candidate: InternalEvent = eventQueue[0];
		// console.debug('[achievements-monitor] found a candidate', candidate);
		// Is there a better candidate?
		const betterCandidate: InternalEvent = eventQueue
			.filter(event => event.achievement.type === candidate.achievement.type)
			.sort((a, b) => b.achievement.priority - a.achievement.priority)[0];
		// console.debug(
		// 	'[achievements-monitor] emitted achievement completed event',
		// 	betterCandidate,
		// 	betterCandidate.achievement.id,
		// );
		this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, betterCandidate.achievement);
		this.prepareAchievementCompletedEvent(betterCandidate.achievement);

		// Now remove all the related events
		return eventQueue.filter(event => event.achievement.type !== betterCandidate.achievement.type);
	}

	private async prepareAchievementCompletedEvent(achievement: Achievement) {
		this.store.stateUpdater.next(new AchievementCompletedEvent(achievement));
	}

	private async startAchievementsProgressDetection() {
		this.achievementsProgressInterval = setInterval(() => this.detectAchievementProgress(), 5000);
	}

	private async stopAchievementsProgressDetection() {
		if (this.achievementsProgressInterval) {
			clearInterval(this.achievementsProgressInterval);
		}
	}

	private async assignPreviousAchievements() {
		const existingAchievements = await this.achievementsStorage.retrieveInGameAchievements();
		// console.debug('existing achievements', existingAchievements, this.previousAchievements);
		if (!existingAchievements) {
			return;
		}

		if (!this.previousAchievements) {
			// console.debug('assigning previous achievements', existingAchievements);
			this.previousAchievements = existingAchievements?.achievements;
		}
	}

	private async detectAchievementProgress() {
		const achievementsProgress: HsAchievementsInfo = await this.memory.getInGameAchievementsProgressInfo();
		const allAchievements = await this.achievementLoader.getAchievements();
		if (!achievementsProgress?.achievements?.length) {
			return;
		}

		const achievementInfos: readonly AchievementProgress[] = achievementsProgress.achievements.map(ach => {
			const ref = allAchievements.find(a => a.id === `hearthstone_game_${ach.id}`);
			const quota = this.achievementQuotas[ach.id];
			return {
				id: ref.id,
				progress: ach.progress,
				quota: quota,
				completed: ach.completed || ref.numberOfCompletions > 0 || ach.progress >= quota,
				text: ref.text,
				name: ref.name,
				step: ref.priority,
				type: ref.type,
				ref: ref,
			};
		});
		const achievementsInfo: AchievementsProgress = {
			achievements: achievementInfos,
		};
		this.events.broadcast(Events.ACHIEVEMENT_PROGRESSION, achievementsInfo);
	}
}

interface InternalEvent {
	readonly achievement: Achievement;
	// readonly challenge: Challenge;
}
