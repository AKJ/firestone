export interface ArenaCardStatInfo {
	readonly cardId: string;
	readonly deckTotal: number;
	readonly deckWinrate: number | null | undefined;
	readonly drawnTotal: number;
	readonly drawWinrate: number | null | undefined;
	readonly pickRateImpact: number | null | undefined;
	readonly totalOffered: number | null | undefined;
	readonly totalPicked: number | null | undefined;
	readonly pickRate: number | null | undefined;
	readonly totalOfferedHighWins: number | null | undefined;
	readonly totalPickedHighWins: number | null | undefined;
	readonly pickRateHighWins: number | null | undefined;
}
