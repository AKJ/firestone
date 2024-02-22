import { CardIds, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';

const DK_BLOOD_HAND = [
	CardIds.BloodBoil_RLK_730,
	CardIds.Soulstealer_RLK_741,
	CardIds.GnomeMuncherCore_RLK_720,
	CardIds.AlexandrosMograine,
	CardIds.VampiricBlood_RLK_051,
	CardIds.ObliterateCore_RLK_125,
	CardIds.Asphyxiate_RLK_087,
	CardIds.PatchwerkCore_RLK_071,
];
const DK_FROST_HAND = [
	CardIds.GlacialAdvance_RLK_512,
	CardIds.LadyDeathwhisper_RLK_713,
	CardIds.FrostwyrmsFury_RLK_063,
	CardIds.FrostStrike,
	CardIds.SchoolTeacher,
	CardIds.ThassarianCore_RLK_223,
	CardIds.HornOfWinter_RLK_042,
	CardIds.HowlingBlast_RLK_015,
];
const DK_UNHOLY_HAND = [
	CardIds.GraveStrengthCore_RLK_707,
	CardIds.NerubianSwarmguard_RLK_062,
	CardIds.BattlefieldNecromancerCore_RLK_061,
	CardIds.PlagueStrike_RLK_018,
	CardIds.Blightfang,
	CardIds.SkeletalSidekickCore_RLK_958,
	CardIds.HawkstriderRancher,
	CardIds.AmalgamOfTheDeep,
];
const DEMONHUNTER_HAND = [
	CardIds.TwinSlice_BT_175,
	CardIds.AltruisTheOutcast,
	CardIds.ImprisonedAntaen,
	CardIds.Metamorphosis_BT_429,
	CardIds.PriestessOfFury,
	CardIds.SkullOfGuldan_BT_601,
	CardIds.EyeBeam,
	CardIds.WarglaivesOfAzzinoth_BT_430,
];
const DRUID_HAND = [
	CardIds.TwigOfTheWorldTree,
	CardIds.BranchingPaths,
	CardIds.KingTogwaggle,
	CardIds.MalfurionThePestilent_ICC_832,
	CardIds.NaturalizeLegacy,
	CardIds.AzalinaSoulthief,
	CardIds.LesserJasperSpellstone,
	CardIds.SpreadingPlague_ICC_054,
];
const MAGE_HAND = [
	CardIds.IceBlockLegacy,
	CardIds.FrostNovaLegacy,
	CardIds.IceLanceLegacy,
	CardIds.FireballLegacy,
	CardIds.FrostboltLegacy,
	CardIds.ArchmageAntonidasLegacy,
	CardIds.AlexstraszaLegacy,
	CardIds.SorcerersApprenticeLegacy,
];
const HUNTER_HAND = [
	CardIds.CloakedHuntress_KAR_006,
	CardIds.DeathstalkerRexxar_ICC_828,
	CardIds.LesserEmeraldSpellstone,
	CardIds.WanderingMonster,
	CardIds.CatTrick,
	CardIds.FreezingTrapLegacy,
	CardIds.ExplosiveTrapLegacy_EX1_610,
	CardIds.MisdirectionLegacy,
];
const PALADIN_HAND = [
	CardIds.LadyLiadrin,
	CardIds.AldorTruthseeker,
	CardIds.LibramOfHope,
	CardIds.PenFlinger,
	CardIds.LibramOfJudgment,
	CardIds.LibramOfJustice_BT_011,
	CardIds.LibramOfWisdom_BT_025,
	CardIds.AldorAttendant,
];
const PRIEST_HAND = [
	CardIds.GalakrondTheUnspeakable,
	CardIds.SoulMirror,
	CardIds.KronxDragonhoof,
	CardIds.TimeRip,
	CardIds.FateWeaver,
	CardIds.DiscipleOfGalakrond,
	CardIds.ShieldOfGalakrond,
	CardIds.DevotedManiac,
];
const SHAMAN_HAND = [
	CardIds.Lifedrinker,
	CardIds.ZolaTheGorgon,
	CardIds.HealingRain,
	CardIds.Shudderwock_GIL_820,
	CardIds.Volcano,
	CardIds.SaroniteChainGang_ICC_466,
	CardIds.GlacialShard,
	CardIds.GrumbleWorldshaker,
];
const ROGUE_HAND = [
	CardIds.YouthfulBrewmasterLegacy,
	CardIds.GangUp,
	CardIds.PreparationLegacy,
	CardIds.ColdlightOracleLegacy,
	CardIds.BrannBronzebeard_LOE_077,
	CardIds.AntiqueHealbot,
	CardIds.ShadowstepLegacy,
	CardIds.VanishLegacy,
];
const WARRIOR_HAND = [
	CardIds.WhirlwindLegacy,
	CardIds.GrimPatron,
	CardIds.InnerRageLegacy,
	CardIds.ExecuteLegacy,
	CardIds.FrothingBerserkerCore,
	CardIds.DeathsBite,
	CardIds.EmperorThaurissan_BRM_028,
	CardIds.WarsongCommanderLegacy,
];
const WARLOCK_HAND = [
	CardIds.SkullOfTheManari,
	CardIds.CarnivorousCube,
	CardIds.BloodreaverGuldan_ICC_831,
	CardIds.FacelessManipulatorLegacy,
	CardIds.DoomguardLegacy,
	CardIds.Voidlord_LOOT_368,
	CardIds.Defile_ICC_041,
	CardIds.DarkPact_LOOT_017,
];
const ALL_HANDS = [
	DK_BLOOD_HAND,
	DK_FROST_HAND,
	DK_UNHOLY_HAND,
	DEMONHUNTER_HAND,
	DRUID_HAND,
	MAGE_HAND,
	HUNTER_HAND,
	PALADIN_HAND,
	PRIEST_HAND,
	SHAMAN_HAND,
	ROGUE_HAND,
	WARRIOR_HAND,
	WARLOCK_HAND,
];
let ALL_HANDS_DBFIDs = null;

export const updateHandWithStonebrewInfo = (
	playedCard: DeckCard,
	hand: readonly DeckCard[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	console.debug('[stonebrew] updating hand with stonebrew info', playedCard, hand);
	const playedCardBaseId = getBaseCardId(playedCard.cardId);
	for (const iconicHand of ALL_HANDS) {
		if (iconicHand.includes(playedCardBaseId as CardIds)) {
			console.debug(
				'[stonebrew] found iconic hand',
				iconicHand,
				playedCardBaseId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}

	// if I missed the correct ID, use the "base id" to still get something
	ALL_HANDS_DBFIDs =
		ALL_HANDS_DBFIDs ??
		ALL_HANDS.map((hand) =>
			hand.map((cardId) => allCards.getCard(cardId).deckDuplicateDbfId ?? allCards.getCard(cardId).dbfId),
		);
	const playedCardBaseDbfId =
		allCards.getCard(playedCardBaseId).deckDuplicateDbfId ?? allCards.getCard(playedCardBaseId).dbfId;
	for (const iconicHand of ALL_HANDS_DBFIDs) {
		if (iconicHand.includes(playedCardBaseDbfId)) {
			console.debug(
				'[stonebrew] found iconic hand with dbfid',
				iconicHand,
				playedCardBaseId,
				playedCardBaseDbfId,
				playedCard.cardId,
				playedCardBaseId,
			);
			return newHand(hand, iconicHand, allCards);
		}
	}
	console.warn('Could not find iconic hand for card', playedCardBaseId, playedCardBaseDbfId);
	return hand;
};

const newHand = (
	hand: readonly DeckCard[],
	iconicHand: readonly string[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	return hand.map((card) => {
		if (
			![CardIds.HarthStonebrew_CORE_GIFT_01, CardIds.HarthStonebrew_GIFT_01].includes(
				card.creatorCardId as CardIds,
			)
		) {
			return card;
		}
		const positionInIconicHand: number = card.creatorAdditionalInfo;
		const guessedCardId = iconicHand[positionInIconicHand];
		const refCard = allCards.getCard(guessedCardId);
		console.debug('[stonebrew] updating card', card, refCard, positionInIconicHand, iconicHand);
		return card.update({
			cardId: refCard.id,
			cardName: refCard.name,
			manaCost: refCard.cost,
			rarity: refCard.rarity,
		});
	});
};
