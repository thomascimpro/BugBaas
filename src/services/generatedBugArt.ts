export type GeneratedBugArtKind =
  | "silverfish"
  | "flatBug"
  | "fly"
  | "mite"
  | "fluffy"
  | "spider"
  | "cellarSpider"
  | "butterfly"
  | "moth"
  | "springtail"
  | "millipede"
  | "isopod"
  | "caterpillar"
  | "grub"
  | "beetle"
  | "wasp"
  | "bee"
  | "slug"
  | "snail"
  | "worm";

export type GeneratedBugArtPattern = "plain" | "spots" | "stripes" | "bands" | "eyes" | "veins" | "map";

export type GeneratedBugArtDefinition = {
  kind: GeneratedBugArtKind;
  body: string;
  accent: string;
  detail: string;
  pattern?: GeneratedBugArtPattern;
  glow?: string;
};

export const generatedBugArt = {
  "papiervisje": { kind: "silverfish", body: "#8d99a7", accent: "#d8dee5", detail: "#39424d", pattern: "bands" },
  "ovenvisje": { kind: "silverfish", body: "#8a6b58", accent: "#e5c4a8", detail: "#3f2d24", pattern: "bands", glow: "#f59e5b" },
  "bedwants": { kind: "flatBug", body: "#7b3328", accent: "#b95e43", detail: "#351713", pattern: "bands" },
  "varenrouwmug": { kind: "fly", body: "#252b32", accent: "#a5b4c2", detail: "#11151a", pattern: "plain" },
  "trips": { kind: "silverfish", body: "#5f4a2f", accent: "#d4bd82", detail: "#251d14", pattern: "bands" },
  "spintmijt": { kind: "mite", body: "#b8422f", accent: "#f0a059", detail: "#4f1b16", pattern: "spots" },
  "wolluis": { kind: "fluffy", body: "#f4f0df", accent: "#ffffff", detail: "#9a8f79", pattern: "bands" },
  "schildluis": { kind: "flatBug", body: "#8c6337", accent: "#c99c5c", detail: "#3e2a17", pattern: "plain" },
  "grote-huisspin": { kind: "spider", body: "#5a4637", accent: "#a38467", detail: "#231b16", pattern: "bands" },
  "trilspin": { kind: "cellarSpider", body: "#b9a58b", accent: "#e4d4bc", detail: "#615544", pattern: "plain" },
  "klein-koolwitje": { kind: "butterfly", body: "#faf8ec", accent: "#d8d7cb", detail: "#32363a", pattern: "spots" },
  "klein-geaderd-witje": { kind: "butterfly", body: "#f4f1dc", accent: "#d7d1ad", detail: "#4f514b", pattern: "veins" },
  "citroenvlinder": { kind: "butterfly", body: "#e6df32", accent: "#fff47a", detail: "#7d6d14", pattern: "veins", glow: "#f4e44c" },
  "bont-zandoogje": { kind: "butterfly", body: "#5a3827", accent: "#e8c96d", detail: "#1f1712", pattern: "eyes" },
  "icarusblauwtje": { kind: "butterfly", body: "#2778cf", accent: "#84c8ff", detail: "#1b3158", pattern: "spots", glow: "#54a8ff" },
  "kleine-vos": { kind: "butterfly", body: "#dd6a24", accent: "#f7b13f", detail: "#28211e", pattern: "eyes", glow: "#ef7d32" },
  "landkaartje": { kind: "butterfly", body: "#2d241f", accent: "#e99147", detail: "#f3e1bc", pattern: "map" },
  "boomblauwtje": { kind: "butterfly", body: "#81bce7", accent: "#d7efff", detail: "#566675", pattern: "spots", glow: "#9fd6f5" },
  "springstaart": { kind: "springtail", body: "#47535a", accent: "#8fa5ad", detail: "#1d2529", pattern: "bands" },
  "miljoenpoot": { kind: "millipede", body: "#593b2d", accent: "#9c704c", detail: "#251a14", pattern: "bands" },
  "kelderpissebed": { kind: "isopod", body: "#747d84", accent: "#aab2b8", detail: "#30383e", pattern: "bands" },
  "oprolpissebed": { kind: "isopod", body: "#4e555d", accent: "#87919b", detail: "#20262c", pattern: "bands", glow: "#8fa0ad" },
  "buxusmot": { kind: "moth", body: "#f0eee0", accent: "#9c7554", detail: "#3e3127", pattern: "bands" },
  "buxusrups": { kind: "caterpillar", body: "#71a83d", accent: "#d9e856", detail: "#1d2d16", pattern: "stripes" },
  "leliehaantje": { kind: "beetle", body: "#d82e23", accent: "#ff6d4d", detail: "#231412", pattern: "plain", glow: "#e64231" },
  "engerling": { kind: "grub", body: "#efe0b9", accent: "#fff4d4", detail: "#7b5034", pattern: "bands" },
  "emelt": { kind: "grub", body: "#73716a", accent: "#a8a49a", detail: "#30302d", pattern: "bands" },
  "gamma-uil": { kind: "moth", body: "#705542", accent: "#a98a6f", detail: "#ebe5c8", pattern: "map" },
  "huismoeder": { kind: "moth", body: "#6a4a32", accent: "#a77a54", detail: "#2b211a", pattern: "bands" },
  "agaatvlinder": { kind: "moth", body: "#756650", accent: "#b8a77c", detail: "#ded5ae", pattern: "map" },
  "windevedermot": { kind: "moth", body: "#c4a783", accent: "#e2d2b8", detail: "#62503d", pattern: "veins" },
  "jakobsvlinder": { kind: "moth", body: "#202227", accent: "#d93339", detail: "#0c0d0f", pattern: "spots", glow: "#df4147" },
  "jakobsvlinderrups": { kind: "caterpillar", body: "#f0c92d", accent: "#23252a", detail: "#111216", pattern: "stripes" },
  "distelvlinder": { kind: "butterfly", body: "#d8753c", accent: "#f2b26f", detail: "#2c2523", pattern: "spots", glow: "#e49357" },
  "groot-koolwitje": { kind: "butterfly", body: "#f9f6e7", accent: "#dedccb", detail: "#22272c", pattern: "bands" },
  "hooibeestje": { kind: "butterfly", body: "#b7894f", accent: "#e1bd78", detail: "#3c2b1d", pattern: "eyes" },
  "koevinkje": { kind: "butterfly", body: "#3f3029", accent: "#7d604b", detail: "#e2c88a", pattern: "eyes" },
  "geelpoothoornaar": { kind: "wasp", body: "#252528", accent: "#e3a923", detail: "#111113", pattern: "bands", glow: "#e2b43b" },
  "daas": { kind: "fly", body: "#6d5c49", accent: "#a99a83", detail: "#2a241d", pattern: "bands" },
  "stadsreus": { kind: "fly", body: "#4b3423", accent: "#d49a36", detail: "#17120e", pattern: "bands", glow: "#d8a340" },
  "bijvlieg": { kind: "fly", body: "#6e4a27", accent: "#e6b654", detail: "#2d2117", pattern: "bands" },
  "rosse-metselbij": { kind: "bee", body: "#a94f27", accent: "#d99857", detail: "#342016", pattern: "bands", glow: "#c76a35" },
  "blauwzwarte-houtbij": { kind: "bee", body: "#171d27", accent: "#355d91", detail: "#080b10", pattern: "bands", glow: "#3e72ad" },
  "gewone-wolfspin": { kind: "spider", body: "#6e5842", accent: "#a58762", detail: "#2d241c", pattern: "stripes" },
  "venstersectorspin": { kind: "spider", body: "#8d765a", accent: "#c1a77e", detail: "#3c3024", pattern: "map" },
  "grote-wegslak": { kind: "slug", body: "#493d35", accent: "#75665b", detail: "#211b18", pattern: "spots" },
  "segrijnslak": { kind: "snail", body: "#88735c", accent: "#b69774", detail: "#493725", pattern: "map" },
  "regenworm": { kind: "worm", body: "#ad665c", accent: "#d9978c", detail: "#623631", pattern: "bands" }
} as const satisfies Record<string, GeneratedBugArtDefinition>;

export type GeneratedBugArtId = keyof typeof generatedBugArt;

export const allGeneratedBugArtIds = Object.keys(generatedBugArt) as GeneratedBugArtId[];

export function getGeneratedBugArtDefinition(id: string | undefined): GeneratedBugArtDefinition | null {
  if (!id) return null;
  return (generatedBugArt as Record<string, GeneratedBugArtDefinition>)[id] ?? null;
}
