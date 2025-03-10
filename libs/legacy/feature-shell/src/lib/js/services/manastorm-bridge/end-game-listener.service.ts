import { Injectable } from '@angular/core';
import { BattlegroundsInfo, MatchInfo, MemoryInspectionService, MemoryUpdatesService } from '@firestone/memory';
import { GameStatusService } from '@firestone/shared/common/service';
import { sanitizeDeckstring } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, merge } from 'rxjs';
import { concatMap, distinctUntilChanged, filter, map, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { GameSettingsEvent } from '../../models/mainwindow/game-events/game-settings-event';
import { ArenaInfoService } from '../arena/arena-info.service';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { BattlegroundsStoreService } from '../battlegrounds/store/battlegrounds-store.service';
import { DeckInfo } from '../decktracker/deck-parser.service';
import { DuelsStateBuilderService } from '../duels/duels-state-builder.service';
import { isDuels } from '../duels/duels-utils';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { LotteryService } from '../lottery/lottery.service';
import { MercenariesMemoryCacheService } from '../mercenaries/mercenaries-memory-cache.service';
import { ReviewIdService } from '../review-id.service';
import { RewardMonitorService } from '../rewards/rewards-monitor';
import { EndGameUploaderService, UploadInfo } from './end-game-uploader.service';

@Injectable()
export class EndGameListenerService {
	private uploadStarted$$ = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memoryUpdates: MemoryUpdatesService,
		private readonly endGameUploader: EndGameUploaderService,
		private readonly mercsMemoryCache: MercenariesMemoryCacheService,
		private readonly memoryInspection: MemoryInspectionService,
		private readonly rewards: RewardMonitorService,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly reviewIdService: ReviewIdService,
		private readonly bgStore: BattlegroundsStoreService,
		private readonly lottery: LotteryService,
		private readonly allCards: CardsFacadeService,
		private readonly gameStatus: GameStatusService,
		private readonly arenaInfo: ArenaInfoService,
	) {
		this.init();
	}

	private init(): void {
		this.gameStatus.inGame$$
			.pipe(
				filter((inGame) => inGame),
				take(1),
			)
			.subscribe(async () => {
				console.log('[manastorm-bridge] game started, initializing');
				const metadata$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.MATCH_METADATA),
					map((event) => event.additionalData.metaData as HsGameMetaData),
					startWith(null),
				);
				const matchInfo$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.MATCH_INFO),
					map((event) => event.additionalData.matchInfo as MatchInfo),
					startWith(null),
				);
				const playerDeck$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.PLAYER_DECK_INFO),
					map((event) => event.additionalData.playerDeck as DeckInfo),
					startWith(null),
					map((deck) =>
						// Remove signature treasures from the decklists
						isDuels(deck?.gameType)
							? {
									...deck,
									deckstring: sanitizeDeckstring(deck.deckstring, this.allCards),
							  }
							: deck,
					),
					tap((info) => console.log('[manastorm-bridge] playerDeck', info)),
				);
				const duelsInfo$ = this.duelsState.duelsInfo$$;
				const duelsRunId$ = duelsInfo$.pipe(map((info) => info?.DeckId));
				const arenaInfo$ = this.arenaInfo.arenaInfo$$;

				await this.mercsMemoryCache.isReady();
				const mercsInfo$ = this.mercsMemoryCache.memoryMapInfo$$.pipe(startWith(null));
				const mercsCollectionInfo$ = this.mercsMemoryCache.memoryCollectionInfo$$.pipe(startWith(null));
				const bgInfo$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.BATTLEGROUNDS_INFO),
					map((event) => event.additionalData.bgInfo as BattlegroundsInfo),
					startWith(null),
				);
				const gameSettings$ = this.gameEvents.allEvents.asObservable().pipe(
					filter((event) => event.type === GameEvent.GAME_SETTINGS),
					map((event) => event as GameSettingsEvent),
					map((event) => event.additionalData),
					startWith(null),
				);
				// This is triggered really early: as soon as the GameState match is over (no need to wait for
				// the final combat animations)
				const bgNewRating$ = this.memoryUpdates.memoryUpdates$$.pipe(
					filter((changes) => !!changes.BattlegroundsNewRating),
					map((changes) => changes.BattlegroundsNewRating),
					startWith(null),
					tap((info) => console.debug('[manastorm-bridge] bgNewRating', info)),
				);
				const reviewId$ = this.reviewIdService.reviewId$;
				// Doesn't work, reviewId arrives earlier
				const gameEnded$: Observable<{
					ended: boolean;
					spectating: boolean;
					replayXml: string;
					GameType: number | null;
					FormatType: number | null;
					ScenarioID: number | null;
				}> = merge(
					this.gameEvents.allEvents.asObservable().pipe(filter((event) => event.type === GameEvent.GAME_END)),
					this.gameEvents.allEvents
						.asObservable()
						.pipe(filter((event) => event.type === GameEvent.GAME_START)),
					this.uploadStarted$$,
				).pipe(
					// tap((info) => console.log('[manastorm-bridge] game ended', info)),
					map((event) => {
						// The uploadStarted subject fired, we reset the "ended" flag so that a new review id
						// won't trigger a new upload
						if (!(event as GameEvent).type) {
							return {
								ended: false,
								spectating: false,
								FormatType: null,
								GameType: null,
								ScenarioID: null,
								replayXml: null,
							};
						}
						if ((event as GameEvent).type === GameEvent.GAME_END) {
							const endEvent = event as GameEvent;
							return {
								ended: true,
								spectating: endEvent.additionalData.spectating,
								FormatType: endEvent.additionalData.FormatType,
								GameType: endEvent.additionalData.GameType,
								ScenarioID: endEvent.additionalData.ScenarioID,
								replayXml: endEvent.additionalData.replayXml,
							};
						}
						if ((event as GameEvent).type === GameEvent.GAME_START) {
							const startEvent = event as GameEvent;
							return {
								ended: false,
								spectating: startEvent.additionalData.spectating,
								FormatType: null,
								GameType: null,
								ScenarioID: null,
								replayXml: null,
							};
						}
					}),
					startWith({
						ended: false,
						spectating: false,
						FormatType: null,
						GameType: null,
						ScenarioID: null,
						replayXml: null,
					}),
				);

				// Ideally we should retrieve this after the bgNewRating$ emits. However, since it's possible
				// that the rating doesn't change, this obersvable isn't reliable enough
				// It actually emits even if the ranking doesn't change, so we can use that
				const bgMemoryInfo$ = bgNewRating$.pipe(
					concatMap(async (_) => {
						return await this.getBattlegroundsEndGame();
					}),
					startWith(null),
					tap((info) => console.debug('[manastorm-bridge] bgMemoryInfo', info)),
				);

				combineLatest([
					reviewId$,
					metadata$,
					gameEnded$,
					gameSettings$,
					mercsInfo$,
					mercsCollectionInfo$,
					duelsRunId$,
					duelsInfo$,
					matchInfo$,
					playerDeck$,
					arenaInfo$,
					bgInfo$,
				])
					.pipe(
						withLatestFrom(bgMemoryInfo$, bgNewRating$),
						map(
							([
								[
									reviewId,
									metadata,
									gameEnded,
									gameSettings,
									mercsInfo,
									mercsCollectionInfo,
									duelsRunId,
									duelsInfo,
									matchInfo,
									playerDeck,
									arenaInfo,
									bgInfo,
								],
								bgMemoryInfo,
								bgNewRating,
							]) =>
								({
									reviewId: reviewId,
									metadata: metadata,
									gameEnded: gameEnded,
									matchInfo: matchInfo,
									playerDeck: playerDeck,
									duelsInfo: duelsInfo,
									arenaInfo: arenaInfo,
									mercsInfo: mercsInfo,
									mercsCollectionInfo: mercsCollectionInfo,
									duelsRunId: duelsRunId,
									bgInfo: bgInfo,
									bgNewRating: bgNewRating,
									battlegroundsInfoAfterGameOver: bgMemoryInfo,
									gameSettings: gameSettings,
								} as UploadInfo),
						),
						// tap((info) => console.debug('[manastorm-bridge] triggering final observable', info)),
						// We don't want to trigger anything unless the gameEnded status changed (to mark the end of
						// the current game) or the reviewId changed (to mark the start)
						distinctUntilChanged((a, b) => {
							// console.debug('[manastorm-bridge] comparing', a, b);
							return a?.reviewId === b?.reviewId && a?.gameEnded?.ended === b?.gameEnded?.ended;
						}),
						filter((info) => !!info.reviewId && info.gameEnded.ended),
						// tap((info) =>
						// 	console.debug(
						// 		'[manastorm-bridge] end game, uploading? spectating=',
						// 		info.gameEnded.spectating,
						// 	),
						// ),
						filter((info) => !info.gameEnded.spectating),
						tap((info) =>
							console.debug(
								'[manastorm-bridge] not a spectate game, continuing',
								info.metadata,
								info.playerDeck,
							),
						),
					)
					.subscribe((info) => {
						this.prepareUpload(info);
						this.uploadStarted$$.next(!this.uploadStarted$$.value);
					});
			});
	}

	// Load all the memory info that has to be loaded once the game is over
	private async prepareUpload(info: UploadInfo) {
		// Get the memory info first, because parsing the XML can take some time and make the
		// info in memory stale / unavailable
		console.log('[manastorm-bridge] preparing to upload');
		// Here we get the information that is only available once the game is over
		// TODO: move this elsewhere? So that this method doesn't care about memory reading at all anymore
		// const duelsInitialRank =
		// 	info.metadata.GameType === GameType.GT_PVPDR_PAID
		// 		? info.duelsInfo?.PaidRating
		// 		: info.metadata.GameType === GameType.GT_PVPDR
		// 		? info.duelsInfo?.Rating
		// 		: null;
		// Try to get the BG new rank info as soon as possible. If that doesn't work, we have a fallback
		const bgNewRatingMemoryUpdate = info.bgNewRating && info.bgNewRating !== -1 ? info.bgNewRating : null;
		const afterInfoNewRating =
			info.battlegroundsInfoAfterGameOver?.NewRating != null &&
			info.battlegroundsInfoAfterGameOver.NewRating !== -1
				? info.battlegroundsInfoAfterGameOver.NewRating
				: null;
		const bgNewRating = bgNewRatingMemoryUpdate ?? afterInfoNewRating;
		console.log('[manastorm-bridge] final bgNewRating', bgNewRating);
		const newBgInfo =
			info.battlegroundsInfoAfterGameOver?.NewRating != null &&
			info.battlegroundsInfoAfterGameOver.NewRating !== -1
				? info.battlegroundsInfoAfterGameOver
				: isBattlegrounds(info.metadata.GameType)
				? await this.getBattlegroundsEndGame()
				: null;
		const newBgInfoWithRating: BattlegroundsInfo = !!newBgInfo
			? {
					...newBgInfo,
					NewRating: bgNewRating ?? newBgInfo.NewRating,
			  }
			: null;
		const [
			// battlegroundsInfoAfterGameOver,
			// The timing doesn't work, the diff is only computed later apparently, once the user is on the
			// end screen
			// Maybe this could be sent asynchronously via another API call, but for now I think it's
			// ok to not have the new rank
			//  duelsPlayerRankAfterGameOver,
			xpForGame,
		] = await Promise.all([
			// isBattlegrounds(info.metadata.GameType) ? this.getBattlegroundsEndGame() : null,
			// isDuels(info.metadata.GameType) ? this.getDuelsNewPlayerRank(duelsInitialRank, info.duelsInfo) : null,
			this.rewards.getXpForGameInfo(),
		]);
		console.log('[manastorm-bridge] read memory info');

		const battleOdds = this.bgStore?.state?.currentGame?.faceOffs?.map((f) => ({
			turn: f.turn,
			wonPercent: f.battleResult?.wonPercent,
		}));
		const augmentedInfo: UploadInfo = {
			...info,
			battlegroundsInfoAfterGameOver: newBgInfoWithRating,
			// duelsPlayerRankAfterGameOver: duelsPlayerRankAfterGameOver,
			xpForGame: xpForGame,
			bgBattleOdds: battleOdds,
			// Here we purposefully don't want to init the lottery if it hasn't been initialized yet
			lotteryPoints: this.lottery.lottery$$.getValue()?.currentPoints(),
			bgGame: this.bgStore.state.currentGame,
		};
		console.debug('[manastorm-bridge] augmentedInfo', augmentedInfo);
		await this.endGameUploader.upload2(augmentedInfo);
	}

	private async getBattlegroundsEndGame(): Promise<BattlegroundsInfo> {
		const result = await this.memoryInspection.getBattlegroundsEndGame();
		console.log('[manastorm-bridge] received BG rank result', result?.Rating, result?.NewRating);
		return result;
	}

	// private async getDuelsNewPlayerRank(initialRank: number, existingDuelsInfo: DuelsInfo): Promise<number> {
	// 	// Ideally should trigger this only when winning at 11 or losing at 2, but we don't have the match result yet
	// 	// Could add it somewhere, but for now I think it's good enough like that
	// 	if (existingDuelsInfo.Wins !== 11 && existingDuelsInfo.Losses !== 2) {
	// 		return null;
	// 	}
	// 	// This only matters when a run is over, so we need to be careful no to take too much time
	// 	let duelsInfo = await this.memoryInspection.getDuelsInfo();
	// 	let retriesLeft = 10;
	// 	while (!duelsInfo?.LastRatingChange && retriesLeft >= 0) {
	// 		await sleep(500);
	// 		duelsInfo = await this.memoryInspection.getDuelsInfo();
	// 		retriesLeft--;
	// 	}
	// 	if (!duelsInfo) {
	// 		return null;
	// 	}
	// 	return duelsInfo.LastRatingChange + initialRank;
	// }
}
