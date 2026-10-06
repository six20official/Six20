export type GiftCatalogEntry = {
  name: string; category: string; priceNaira: number; rarity: string;
  description: string; country?: string; sport?: string; brand?: string; team?: string;
  assetSource: string; licenseStatus: "ORIGINAL_FAN";
};

const entries: GiftCatalogEntry[] = [];
function add(category: string, names: string, priceNaira: number, rarity = "common", description = "Original SIX20 fan art concept", extra: Partial<GiftCatalogEntry> = {}) {
  for (const name of names.split("|").map((value) => value.trim()).filter(Boolean)) entries.push({ name, category, priceNaira, rarity, description, assetSource: "SIX20_ORIGINAL", licenseStatus: "ORIGINAL_FAN", ...extra });
}

for (const [name, priceNaira] of [
  ["Afro Spark", 200], ["Drum Pulse", 500], ["Adire Flow", 1_000],
  ["Golden Calabash", 2_500], ["Baobab Bloom", 5_000], ["Sankofa Flight", 10_000],
  ["African Sun", 25_000], ["Aso-Oke Royale", 50_000], ["Heritage Crown", 100_000],
  ["Golden Continent", 250_000], ["SIX20 Legacy", 500_000], ["SIX20 Universe", 1_000_000],
] as const) add("AFRICAN_HERITAGE", name, priceNaira, priceNaira >= 100_000 ? "legendary" : priceNaira >= 10_000 ? "epic" : "rare");
add("TASTE_OF_AFRICA", "Jollof Burst|Suya Flame|Puff-Puff Party|Egusi Royal Bowl|Pounded Yam Feast|Pepper Soup Fire", 200, "common", "Respectful original food celebration", { country: "Nigeria" });
add("TASTE_OF_AFRICA", "Waakye Wave|Kelewele Fire|Banku & Tilapia", 500, "common", "Respectful original food celebration", { country: "Ghana" });
add("TASTE_OF_AFRICA", "Thieboudienne Celebration|Yassa Flame", 500, "common", "Respectful original food celebration", { country: "Senegal" });
add("TASTE_OF_AFRICA", "Injera Feast|Coffee Ceremony", 1000, "rare", "Respectful original food celebration", { country: "Ethiopia" });
add("TASTE_OF_AFRICA", "Nyama Choma|Ugali Celebration", 500, "common", "Respectful original food celebration", { country: "Kenya" });
add("TASTE_OF_AFRICA", "Bunny Chow|Braai Night", 1000, "rare", "Respectful original food celebration", { country: "South Africa" });
add("TASTE_OF_AFRICA", "Tagine Royale|Mint Tea Celebration", 1000, "rare", "Respectful original food celebration", { country: "Morocco" });
add("TASTE_OF_AFRICA", "Attiéké Celebration", 500, "common", "Respectful original food celebration", { country: "Côte d’Ivoire" });
add("AFRICAN_FOOTBALL", "Stadium Roar|Golden Boot|Super Striker|90th Minute|Penalty Drama|Champions Night|World-Class Goal|Football Legend|Golden Trophy|Champions Continent|Football Dynasty|SIX20 World Cup", 1000, "epic", "Original football supporter artwork; no official marks", { sport: "Football" });
for (const country of ["Nigeria", "Ghana", "Senegal", "Côte d’Ivoire", "Cameroon", "South Africa", "Morocco", "Egypt", "Algeria", "Tunisia", "DR Congo", "Kenya", "Tanzania", "Uganda"]) add("AFRICAN_FOOTBALL", `${country} Matchday|${country} Fan Pulse`, 500, "rare", "Original fan art. No federation affiliation.", { country, sport: "Football", team: country, brand: "SIX20 ORIGINAL FAN" });
const european: Record<string, string[]> = {
  England: ["Arsenal", "Chelsea", "Liverpool", "Manchester United", "Manchester City", "Tottenham Hotspur"],
  Spain: ["Real Madrid", "Barcelona", "Atlético Madrid"], Italy: ["Juventus", "AC Milan", "Inter Milan", "Napoli", "Roma"],
  Germany: ["Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen"], France: ["Paris Saint-Germain", "Marseille", "Lyon"],
  Netherlands: ["Ajax", "PSV", "Feyenoord"], Portugal: ["Benfica", "Porto", "Sporting CP"], Scotland: ["Celtic", "Rangers"],
};
for (const [country, teams] of Object.entries(european)) for (const team of teams) add("EUROPEAN_FOOTBALL", `${team} Matchday`, 1000, "rare", "Original fan art only. Not official, endorsed, or licensed.", { country, sport: "Football", team, brand: "SIX20 ORIGINAL FAN" });
add("SPORTS", "Buzzer Beater|Slam Dunk|Triple Threat", 1000, "rare", "Original basketball supporter artwork", { sport: "Basketball" });
add("SPORTS", "Knockout|Golden Gloves", 1000, "rare", "Original boxing supporter artwork", { sport: "Boxing" });
add("SPORTS", "Grand Slam|Match Point", 1000, "rare", "Original tennis supporter artwork", { sport: "Tennis" });
add("SPORTS", "Lightning Sprint|Victory Lap", 2500, "epic", "Original athletics and motorsport celebration", { sport: "Athletics" });
add("SPORTS", "Championship Ring", 5000, "epic", "Original global sports supporter artwork", { sport: "Global Sports" });
add("SPORTS", "Try Line Thunder|Boundary Blast|Ace Serve", 1000, "rare", "Original global sports supporter artwork", { sport: "Rugby, Cricket, Volleyball" });
add("FAN_BATTLES", "Team A Rally|Team B Rally|Country Face-Off|Food Face-Off|Derby Pulse", 500, "rare", "Support your side in a LIVE fan battle");
add("PREMIUM", "Golden Calabash Royale|Adire Starlight|Stadium Skyfire|Continental Crown", 25000, "epic");
add("PREMIUM", "Sankofa Flight: Royal Edition", 10000, "epic");
add("PREMIUM", "Aso-Oke Royale: Imperial Frame", 50000, "epic");
add("LEGENDARY", "Heritage Crown: Mythic", 250000, "legendary");
add("LEGENDARY", "Stadium Roar: World Final", 500000, "legendary");
add("LEGENDARY", "SIX20 Legacy Edition|SIX20 Universe Ascension|Africa to the World", 100000, "legendary");
add("LEGENDARY", "SIX20 Universe: Eternal", 1000000, "legendary");
export const GIFT_CATALOG = entries;
export const GIFT_CATEGORIES = ["TRENDING", "AFRICAN_HERITAGE", "TASTE_OF_AFRICA", "AFRICAN_FOOTBALL", "EUROPEAN_FOOTBALL", "SPORTS", "FAN_BATTLES", "PREMIUM", "LEGENDARY"] as const;
