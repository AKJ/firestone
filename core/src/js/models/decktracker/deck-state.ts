import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { AttackOnBoard } from './attack-on-board';
import { BoardSecret } from './board-secret';
import { DeckCard } from './deck-card';
import { HeroCard } from './hero-card';
import { DynamicZone } from './view/dynamic-zone';

export class DeckState {
	private static readonly GALAKROND_CARD_IDS = [
		CardIds.Collectible.Priest.GalakrondTheUnspeakable,
		CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Priest.GalakrondtheUnspeakable_GalakrondAzerothsEndToken,
		CardIds.Collectible.Rogue.GalakrondTheNightmare,
		CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondAzerothsEndToken,
		CardIds.Collectible.Shaman.GalakrondTheTempest,
		CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Shaman.GalakrondtheTempest_GalakrondAzerothsEndToken,
		CardIds.Collectible.Warlock.GalakrondTheWretched,
		CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Warlock.GalakrondtheWretched_GalakrondAzerothsEndToken,
		CardIds.Collectible.Warrior.GalakrondTheUnbreakable,
		CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondTheApocalypseToken,
		CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondAzerothsEndToken,
	];

	private static readonly POGO_CARD_IDS = [
		CardIds.Collectible.Rogue.PogoHopper,
		CardIds.NonCollectible.Rogue.PogoHopper,
		CardIds.NonCollectible.Rogue.PogoHopperTavernBrawl,
	];

	private static readonly SPELL_COUNTER_CARD_IDS = [
		CardIds.Collectible.Neutral.YoggSaronHopesEnd,
		CardIds.Collectible.Neutral.YoggSaronMasterOfFate,
	];

	private static readonly NEW_CTHUN_CARD_IDS = [
		CardIds.Collectible.Neutral.CthunTheShattered,
		CardIds.NonCollectible.Neutral.CThuntheShattered_BodyOfCthunToken,
		CardIds.NonCollectible.Neutral.CThuntheShattered_CthunsBodyToken,
		CardIds.NonCollectible.Neutral.CThuntheShattered_EyeOfCthunToken,
		CardIds.NonCollectible.Neutral.CThuntheShattered_HeartOfCthunToken,
		CardIds.NonCollectible.Neutral.CThuntheShattered_MawOfCthunToken,
		CardIds.Collectible.Mage.MaskOfCthun,
	];

	readonly isFirstPlayer: boolean;
	readonly isActivePlayer: boolean;
	readonly isOpponent: boolean;
	readonly deckstring?: string;
	readonly name?: string;
	readonly hero?: HeroCard;
	readonly heroPower: DeckCard;
	readonly weapon: DeckCard;
	readonly deckList: readonly DeckCard[] = [];
	readonly unknownRealCardsInDeck: boolean;
	// This is too cumbersome to compute for the opponent deck when the decklist is known,
	// so we just read it form the game entities
	readonly cardsLeftInDeck: number;
	readonly showDecklistWarning: boolean;

	readonly secrets: readonly BoardSecret[] = [];
	readonly secretHelperActive: boolean = true;

	readonly totalAttackOnBoard: AttackOnBoard;
	readonly galakrondInvokesCount: number = 0;
	readonly cthunSize: number = 0;
	readonly jadeGolemSize: number = 0;
	readonly pogoHopperSize: number = 0;
	readonly fatigue: number = 0;
	readonly spellsPlayedThisMatch: number = 0;
	readonly elementalsPlayedThisTurn: number = 0;
	readonly elementalsPlayedLastTurn: number = 0;
	// readonly secretHelperActiveHover: boolean = false;

	// Graveyard is not so easy in fact - we want to know the cards that
	// can be interacted with, which means dead minions for Priest, or
	// discarded cards for warlock (if the warlock decks contains specific
	// cards)
	// readonly graveyard: ReadonlyArray<DeckCard> = [];
	readonly hand: readonly DeckCard[] = [];
	readonly deck: readonly DeckCard[] = [];
	readonly board: readonly DeckCard[] = [];
	readonly otherZone: readonly DeckCard[] = [];
	readonly globalEffects: readonly DeckCard[] = [];
	readonly dynamicZones: readonly DynamicZone[] = [];

	readonly cardsPlayedThisTurn: readonly DeckCard[] = [];
	readonly damageTakenThisTurn: number;
	readonly cardsPlayedFromInitialDeck: readonly { entityId: number; cardId: string }[] = [];

	public static create(value: DeckState): DeckState {
		return Object.assign(new DeckState(), value);
	}

	public update(value: DeckState): DeckState {
		return Object.assign(new DeckState(), this, value);
	}

	// TODO: Probably not the place for these methods
	public containsGalakrond(allCards?: AllCardsService): boolean {
		if (this.galakrondInvokesCount > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter(card => card.cardId)
			.some(
				card =>
					DeckState.GALAKROND_CARD_IDS.indexOf(card.cardId) !== -1 ||
					card.cardId === CardIds.Collectible.Neutral.KronxDragonhoof ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf('Invoke Galakrond') !== -1),
			);
	}

	public containsCthun(allCards: AllCardsService): boolean {
		if (this.cthunSize > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter(card => card.cardId)
			.filter(card => !DeckState.NEW_CTHUN_CARD_IDS.includes(card.cardId))
			.some(
				card =>
					card.cardId === CardIds.Collectible.Neutral.Cthun ||
					(allCards &&
						allCards.getCard(card.cardId)?.text &&
						allCards.getCard(card.cardId)?.text?.indexOf("C'Thun") !== -1),
			);
	}

	public containsJade(allCards?: AllCardsService): boolean {
		if (this.jadeGolemSize > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter(card => card.cardId)
			.some(
				card =>
					allCards &&
					allCards.getCard(card.cardId)?.referencedTags &&
					allCards.getCard(card.cardId)?.referencedTags.includes('JADE_GOLEM'),
			);
	}

	public containsPogoHopper(): boolean {
		if (this.pogoHopperSize > 0) {
			return true;
		}

		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		return allCardsInDeck
			.filter(card => card.cardId)
			.some(card => DeckState.POGO_CARD_IDS.indexOf(card.cardId) !== -1);
	}

	public containsSpellCounterMinion(): boolean {
		const allCardsInDeck = [...this.deckList, ...this.hand, ...this.deck, ...this.board, ...this.otherZone];
		const result = allCardsInDeck
			.filter(card => card.cardId)
			.some(card => DeckState.SPELL_COUNTER_CARD_IDS.includes(card.cardId));
		// console.log('spell counter', 'has', result, allCardsInDeck, DeckState.SPELL_COUNTER_CARD_IDS);
		return result;
	}
}
