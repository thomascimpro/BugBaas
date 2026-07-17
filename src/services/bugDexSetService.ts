export type BugDexSet = {
  badgeId: string;
  descriptionKey: string;
  id: string;
  labelKey: string;
  bugIds: string[];
};

export const allBugDexSetId = "all";

export const bugDexSets: BugDexSet[] = [
  {
    id: "beetle_brigade",
    badgeId: "bugdex-set-beetle-brigade",
    labelKey: "bugdex.set.beetle_brigade",
    descriptionKey: "bugdex.set.beetle_brigade.description",
    bugIds: ["snuitkever", "boktor", "tapijtkever", "mestkever", "neushoornkever", "atlaskever", "herculeskever", "goliathkever", "kniptor", "loopkever", "waterkever", "goudtor", "tijgerkever", "doodgraver", "vliegend-hert", "juweelkever", "goudschildkever", "rozekever", "kardinaalkever", "gouden-tor", "soldaatje", "doodgraverkever", "olifantskever", "regenboogmestkever", "titanus-kever", "langsprietboktor", "schildpadkever", "vuurkever", "wespboktor", "groene-zandloopkever", "giraffekevertje", "glorieuze-scarabee", "groene-junikever", "meikever", "lieveheersbeestje"]
  },
  {
    id: "wings_of_color",
    badgeId: "bugdex-set-wings-of-color",
    labelKey: "bugdex.set.wings_of_color",
    descriptionKey: "bugdex.set.wings_of_color.description",
    bugIds: ["mot", "doodshoofdvlinder", "kolibrievlinder", "koninginnenpage", "atalanta", "dagpauwoog", "eikenprocessierups", "pijlstaartrups", "gespikkelde-houtvlinder", "glasvleugelvlinder", "komeetmot", "maanmot", "atlasvlinder", "rouwmantelvlinder", "keizersmantel", "koningin-alexandravlinder", "zonsondergangsmot", "roze-esdoornmot", "kleermot", "voorraadmot", "witte-tijger"]
  },
  {
    id: "buzz_squad",
    badgeId: "bugdex-set-buzz-squad",
    labelKey: "bugdex.set.buzz_squad",
    descriptionKey: "bugdex.set.buzz_squad.description",
    bugIds: ["fruitvlieg", "mug", "motmug", "langpootmug", "gaasvlieg", "dobsonvlieg", "lantaarnvlieg", "tijgermug", "roofvlieg", "kameelhalsvlieg", "zweefvlieg", "lantaarndrager", "bromvlieg", "huisvlieg", "whitefly"]
  },
  {
    id: "sting_team",
    badgeId: "bugdex-set-sting-team",
    labelKey: "bugdex.set.sting_team",
    descriptionKey: "bugdex.set.sting_team.description",
    bugIds: ["mier", "wesp", "hoornaar", "faraomier", "houtmier", "juweelwesp", "dolksteekwesp", "goudwesp", "sluipwesp", "fluweelmier", "blauwe-ertsbij", "hommel"]
  },
  {
    id: "pattern_warnings",
    badgeId: "bugdex-set-pattern-warnings",
    labelKey: "bugdex.set.pattern_warnings",
    descriptionKey: "bugdex.set.pattern_warnings.description",
    bugIds: ["stinkwants", "roofwants", "schildwants", "cicade", "schuimcicade", "harlekijnwants", "vuurwants", "bladpootwants", "assassin-bug", "picasso-wants", "reuzenwaterwants", "dwergcicade"]
  },
  {
    id: "web_and_sting",
    badgeId: "bugdex-set-web-and-sting",
    labelKey: "bugdex.set.web_and_sting",
    descriptionKey: "bugdex.set.web_and_sting.description",
    bugIds: ["schorpioen", "duizendpoot", "vogelspin", "reuzen-duizendpoot", "wespspin", "kruisspin", "springspin", "pauwspin", "vioolspin", "zebra-springspin", "waterschorpioen", "zweepschorpioen", "schorpioenvlieg"]
  },
  {
    id: "jump_and_hide",
    badgeId: "bugdex-set-jump-and-hide",
    labelKey: "bugdex.set.jump_and_hide",
    descriptionKey: "bugdex.set.jump_and_hide.description",
    bugIds: ["sprinkhaan", "wandelende-tak", "bidsprinkhaan", "wandelend-blad", "orchidee-bidsprinkhaan", "sabelsprinkhaan", "spookinsect", "doornbloembidsprinkhaan", "mierenleeuw"]
  },
  {
    id: "water_hunters",
    badgeId: "bugdex-set-water-hunters",
    labelKey: "bugdex.set.water_hunters",
    descriptionKey: "bugdex.set.water_hunters.description",
    bugIds: ["waterkever", "schrijvertje", "schaatsenrijder", "waterschorpioen", "libel", "waterjuffer", "smaragdlibel", "helikopterjuffer", "azuren-waterjuffer", "reuzenwaterwants"]
  },
  {
    id: "house_raiders",
    badgeId: "bugdex-set-house-raiders",
    labelKey: "bugdex.set.house_raiders",
    descriptionKey: "bugdex.set.house_raiders.description",
    bugIds: ["zilvervisje", "bladluis", "mug", "mot", "mier", "vlo", "pissebed", "kakkerlak", "oorworm", "termiet", "boekluis", "stofluis", "teek", "fluweelmijt", "tapijtkever", "reuzenkakkerlak", "bromvlieg", "huisvlieg", "kleermot", "voorraadmot", "whitefly"]
  },
  {
    id: "mythic_showcase",
    badgeId: "bugdex-set-mythic-showcase",
    labelKey: "bugdex.set.mythic_showcase",
    descriptionKey: "bugdex.set.mythic_showcase.description",
    bugIds: ["koningin-alexandravlinder", "zonsondergangsmot", "picasso-wants", "roze-esdoornmot", "giraffekevertje", "doornbloembidsprinkhaan", "lantaarndrager", "glorieuze-scarabee"]
  },
  {
    id: "night_crew",
    badgeId: "bugdex-set-night-crew",
    labelKey: "bugdex.set.night_crew",
    descriptionKey: "bugdex.set.night_crew.description",
    bugIds: ["mot", "kakkerlak", "oorworm", "schorpioen", "vogelspin", "reuzenkakkerlak", "doodshoofdvlinder", "vioolspin", "komeetmot", "maanmot", "rouwmantelvlinder", "zweepschorpioen", "kleermot", "voorraadmot"]
  }
];

export function bugDexSetById(id: string): BugDexSet | null {
  return bugDexSets.find((set) => set.id === id) ?? null;
}
