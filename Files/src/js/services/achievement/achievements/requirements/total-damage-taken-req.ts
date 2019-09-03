import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { GameEvent } from '../../../../models/game-event';
import { Requirement } from './_requirement';

export class TotalDamageTakenReq implements Requirement {
	private totalDamageTaken: number = 0;

	constructor(private readonly targetDamage: number) {}

	public static create(rawReq: RawRequirement): Requirement {
		if (!rawReq.values || rawReq.values.length === 0) {
			console.error('invalid parameters for TotalDamageTakenReq', rawReq);
		}
		return new TotalDamageTakenReq(parseInt(rawReq.values[0]));
	}

	reset(): void {
		this.totalDamageTaken = 0;
	}

	afterAchievementCompletionReset(): void {
		this.totalDamageTaken = 0;
	}

	isCompleted(): boolean {
		return this.totalDamageTaken === this.targetDamage;
	}

	test(gameEvent: GameEvent): void {
		if (gameEvent.type === GameEvent.DAMAGE) {
			this.handleDamageEvent(gameEvent);
		} else if (gameEvent.type === GameEvent.FATIGUE_DAMAGE) {
			this.handleFatigueDamageEvent(gameEvent);
		}
	}

	private handleDamageEvent(gameEvent: GameEvent) {
		const localPlayerCardId = gameEvent.localPlayer.CardID;
		const localPlayerId = gameEvent.localPlayer.PlayerId;
		const damageForLocalPlayer = gameEvent.additionalData.targets[localPlayerCardId];
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (damageForLocalPlayer && damageForLocalPlayer.TargetControllerId === localPlayerId) {
			this.totalDamageTaken += damageForLocalPlayer.Damage;
		}
	}

	private handleFatigueDamageEvent(gameEvent: GameEvent) {
		const localPlayerId = gameEvent.localPlayer.PlayerId;
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		if (gameEvent.additionalData.playerId === localPlayerId) {
			this.totalDamageTaken += gameEvent.additionalData.fatigueDamage;
		}
	}
}
