/**
 * Multi-language Excel function name translation, entirely local/offline —
 * no Groq call, no network round-trip, no token cost.
 *
 * Architecture: English is the pivot. Every function is registered once
 * with its canonical EN name plus whichever other-language names are
 * known; lookups/translations always go through EN internally. This is
 * what makes adding an 11th, 12th, ... language a one-column change
 * instead of an N² set of pairwise dictionaries.
 *
 * Coverage note (read before trusting a translation): FR and EN are
 * complete for the ~65 functions below. ES/DE/PT/IT/NL have good coverage
 * of everyday functions. TR and SV cover a solid common-function set.
 * PL/RU cover the most common ~30 functions — their long tail is
 * intentionally left blank rather than guessed, since a wrong function
 * name is worse than an untranslated one. ZH and JA are populated
 * automatically as identical to EN: Chinese and Japanese Excel do NOT
 * localize function names, only the UI chrome. Arabic and Korean are
 * deliberately not offered: Korean Excel also keeps English function names
 * (no translation value to add), and Arabic function names could not be
 * verified with enough confidence to include safely. Any cell left empty
 * simply means that token passes through untranslated instead of being
 * silently guessed — extend FUNCTIONS below to fill gaps.
 */

export type LangCode = "en" | "fr" | "es" | "de" | "pt" | "it" | "nl" | "pl" | "ru" | "tr" | "sv" | "zh" | "ja";

export const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: "en", label: "Anglais (EN)" },
  { code: "fr", label: "Français (FR)" },
  { code: "es", label: "Espagnol (ES)" },
  { code: "de", label: "Allemand (DE)" },
  { code: "pt", label: "Portugais (PT)" },
  { code: "it", label: "Italien (IT)" },
  { code: "nl", label: "Néerlandais (NL)" },
  { code: "pl", label: "Polonais (PL)" },
  { code: "ru", label: "Russe (RU)" },
  { code: "tr", label: "Turc (TR)" },
  { code: "sv", label: "Suédois (SV)" },
  { code: "zh", label: "Chinois (ZH)" },
  { code: "ja", label: "Japonais (JA)" },
];

/** Partial: only EN is guaranteed. Any other key may be absent — see coverage note above. */
type FunctionEntry = { en: string } & Partial<Record<Exclude<LangCode, "en">, string>>;

// ---------------------------------------------------------------------------
// Boolean constants — NOT function calls (never followed by "("), so they're
// matched with a different regex (see buildConstantRegex below).
// ---------------------------------------------------------------------------
const CONSTANTS: FunctionEntry[] = [
  {
    en: "TRUE",
    fr: "VRAI",
    es: "VERDADERO",
    de: "WAHR",
    pt: "VERDADEIRO",
    it: "VERO",
    nl: "WAAR",
    pl: "PRAWDA",
    ru: "ИСТИНА",
    tr: "DOĞRU",
    sv: "SANT",
  },
  {
    en: "FALSE",
    fr: "FAUX",
    es: "FALSO",
    de: "FALSCH",
    pt: "FALSO",
    it: "FALSO",
    nl: "ONWAAR",
    pl: "FAŁSZ",
    ru: "ЛОЖЬ",
    tr: "YANLIŞ",
    sv: "FALSKT",
  },
];

// ---------------------------------------------------------------------------
// Functions, grouped by category to keep the list maintainable.
// ---------------------------------------------------------------------------
const FUNCTIONS: FunctionEntry[] = [
  // Logique
  { en: "IF", fr: "SI", es: "SI", de: "WENN", pt: "SE", it: "SE", nl: "ALS", pl: "JEŻELI", ru: "ЕСЛИ", tr: "EĞER", sv: "OM" },
  { en: "AND", fr: "ET", es: "Y", de: "UND", pt: "E", it: "E", nl: "EN", pl: "ORAZ", ru: "И", tr: "VE", sv: "OCH" },
  { en: "OR", fr: "OU", es: "O", de: "ODER", pt: "OU", it: "O", nl: "OF", pl: "LUB", ru: "ИЛИ", tr: "YADA", sv: "ELLER" },
  { en: "NOT", fr: "NON", es: "NO", de: "NICHT", pt: "NÃO", it: "NON", nl: "NIET", pl: "NIE", ru: "НЕ", tr: "DEĞİL", sv: "ICKE" },
  {
    en: "IFERROR",
    fr: "SIERREUR",
    es: "SI.ERROR",
    de: "WENNFEHLER",
    pt: "SEERRO",
    it: "SE.ERRORE",
    nl: "ALS.FOUT",
    ru: "ЕСЛИОШИБКА",
    tr: "EĞERHATA",
    sv: "OMFEL",
  },
  { en: "IFNA", fr: "SI.NON.DISP", es: "SI.ND", de: "WENNNV", pt: "SEND", it: "SE.NON.DISP." },
  { en: "IFS", fr: "SI.CONDITIONS", es: "SI.CONJUNTO", de: "WENNS", pt: "SES", it: "SE.PIÙ" },

  // Recherche et référence
  {
    en: "VLOOKUP",
    fr: "RECHERCHEV",
    es: "BUSCARV",
    de: "SVERWEIS",
    pt: "PROCV",
    it: "CERCA.VERT",
    nl: "VERT.ZOEKEN",
    pl: "WYSZUKAJ.PIONOWO",
    ru: "ВПР",
    tr: "DÜŞEYARA",
    sv: "LETARAD",
  },
  {
    en: "HLOOKUP",
    fr: "RECHERCHEH",
    es: "BUSCARH",
    de: "WVERWEIS",
    pt: "PROCH",
    it: "CERCA.ORIZZ",
    nl: "HORIZ.ZOEKEN",
    pl: "WYSZUKAJ.POZIOMO",
    ru: "ГПР",
    tr: "YATAYARA",
  },
  { en: "XLOOKUP", fr: "RECHERCHEX", es: "BUSCARX", de: "XVERWEIS", nl: "X.ZOEKEN" },
  {
    en: "MATCH",
    fr: "EQUIV",
    es: "COINCIDIR",
    de: "VERGLEICH",
    pt: "CORRESP",
    it: "CONFRONTA",
    nl: "VERGELIJKEN",
    pl: "PODAJ.POZYCJĘ",
    ru: "ПОИСКПОЗ",
    tr: "KAÇINCI",
    sv: "PASSA",
  },
  {
    en: "INDEX",
    fr: "INDEX",
    es: "INDICE",
    de: "INDEX",
    pt: "ÍNDICE",
    it: "INDICE",
    nl: "INDEX",
    pl: "INDEKS",
    ru: "ИНДЕКС",
    tr: "İNDİS",
    sv: "INDEX",
  },
  {
    en: "OFFSET",
    fr: "DECALER",
    es: "DESREF",
    de: "BEREICH.VERSCHIEBEN",
    pt: "DESLOC",
    it: "SCARTO",
    nl: "VERSCHUIVING",
    ru: "СМЕЩ",
    tr: "KAYDIR",
  },
  {
    en: "INDIRECT",
    fr: "INDIRECT",
    es: "INDIRECTO",
    de: "INDIREKT",
    pt: "INDIRETO",
    it: "INDIRETTO",
    nl: "INDIRECT",
    ru: "ДВССЫЛ",
    tr: "DOLAYLI",
    sv: "INDIREKT",
  },
  {
    en: "CHOOSE",
    fr: "CHOISIR",
    es: "ELEGIR",
    de: "WAHL",
    pt: "ESCOLHER",
    it: "SCEGLI",
    nl: "KIEZEN",
    ru: "ВЫБОР",
    tr: "ELEMAN",
    sv: "VÄLJ",
  },
  { en: "ROW", fr: "LIGNE", es: "FILA", de: "ZEILE", pt: "LIN", it: "RIGA", nl: "RIJ", ru: "СТРОКА", tr: "SATIR", sv: "RAD" },
  {
    en: "COLUMN",
    fr: "COLONNE",
    es: "COLUMNA",
    de: "SPALTE",
    pt: "COL",
    it: "COLONNA",
    nl: "KOLOM",
    ru: "СТОЛБЕЦ",
    tr: "SÜTUN",
    sv: "KOLUMN",
  },

  // Math et trigonométrie
  {
    en: "SUM",
    fr: "SOMME",
    es: "SUMA",
    de: "SUMME",
    pt: "SOMA",
    it: "SOMMA",
    nl: "SOM",
    pl: "SUMA",
    ru: "СУММ",
    tr: "TOPLA",
    sv: "SUMMA",
  },
  {
    en: "SUMPRODUCT",
    fr: "SOMMEPROD",
    es: "SUMAPRODUCTO",
    de: "SUMMENPRODUKT",
    pt: "SOMARPRODUTO",
    it: "MATR.SOMMA.PRODOTTO",
    nl: "SOMPRODUCT",
    ru: "СУММПРОИЗВ",
    tr: "TOPLA.ÇARPIM",
    sv: "SUMPRODUKT",
  },
  {
    en: "SUMIF",
    fr: "SOMME.SI",
    es: "SUMAR.SI",
    de: "SUMMEWENN",
    pt: "SOMASE",
    it: "SOMMA.SE",
    nl: "SOM.ALS",
    pl: "SUMA.JEŻELI",
    ru: "СУММЕСЛИ",
    tr: "ETOPLA",
    sv: "SUMMA.OM",
  },
  {
    en: "SUMIFS",
    fr: "SOMME.SI.ENS",
    es: "SUMAR.SI.CONJUNTO",
    de: "SUMMEWENNS",
    pt: "SOMASES",
    it: "SOMMA.PIÙ.SE",
    nl: "SOMMEN.ALS",
    ru: "СУММЕСЛИМН",
    tr: "ÇOKETOPLA",
  },
  {
    en: "PRODUCT",
    fr: "PRODUIT",
    es: "PRODUCTO",
    de: "PRODUKT",
    pt: "PRODUTO",
    it: "PRODOTTO",
    nl: "PRODUCT",
    pl: "ILOCZYN",
    ru: "ПРОИЗВЕД",
    tr: "ÇARPIM",
    sv: "PRODUKT",
  },
  {
    en: "ROUND",
    fr: "ARRONDI",
    es: "REDONDEAR",
    de: "RUNDEN",
    pt: "ARRED",
    it: "ARROTONDA",
    nl: "AFRONDEN",
    pl: "ZAOKR",
    ru: "ОКРУГЛ",
    tr: "YUVARLA",
    sv: "AVRUNDA",
  },
  {
    en: "ROUNDUP",
    fr: "ARRONDI.SUP",
    es: "REDONDEAR.MAS",
    de: "AUFRUNDEN",
    pt: "ARREDONDAR.PARA.CIMA",
    it: "ARROTONDA.PER.ECC",
    nl: "AFRONDEN.NAAR.BOVEN",
    ru: "ОКРУГЛВВЕРХ",
    tr: "YUVARLA.YUKARI",
  },
  {
    en: "ROUNDDOWN",
    fr: "ARRONDI.INF",
    es: "REDONDEAR.MENOS",
    de: "ABRUNDEN",
    pt: "ARREDONDAR.PARA.BAIXO",
    it: "ARROTONDA.PER.DIF",
    nl: "AFRONDEN.NAAR.BENEDEN",
    ru: "ОКРУГЛВНИЗ",
    tr: "YUVARLA.AŞAĞI",
  },
  { en: "INT", fr: "ENT", es: "ENTERO", de: "GANZZAHL", pt: "INT", it: "INT", ru: "ЦЕЛОЕ", tr: "TAMSAYI", sv: "HELTAL" },
  {
    en: "ABS",
    fr: "ABS",
    es: "ABS",
    de: "ABS",
    pt: "ABS",
    it: "ASS",
    nl: "ABS",
    pl: "MODUŁ.LICZBY",
    ru: "ABS",
    tr: "MUTLAK",
    sv: "ABS",
  },
  {
    en: "SQRT",
    fr: "RACINE",
    es: "RAIZ",
    de: "WURZEL",
    pt: "RAIZ",
    it: "RADQ",
    nl: "WORTEL",
    pl: "PIERWIASTEK",
    ru: "КОРЕНЬ",
    tr: "KAREKÖK",
    sv: "ROT",
  },
  {
    en: "POWER",
    fr: "PUISSANCE",
    es: "POTENCIA",
    de: "POTENZ",
    pt: "POTÊNCIA",
    it: "POTENZA",
    nl: "MACHT",
    pl: "POTĘGA",
    ru: "СТЕПЕНЬ",
    tr: "KUVVET",
    sv: "UPPHÖJT.TILL",
  },
  { en: "MOD", fr: "MOD", es: "RESIDUO", de: "REST", pt: "MOD", it: "RESTO", nl: "REST", ru: "ОСТАТ", tr: "MOD", sv: "REST" },
  {
    en: "RAND",
    fr: "ALEA",
    es: "ALEATORIO",
    de: "ZUFALLSZAHL",
    pt: "ALEATÓRIO",
    it: "CASUALE",
    nl: "ASELECT",
    ru: "СЛЧИС",
    tr: "RASGELE",
    sv: "SLUMP",
  },

  // Statistiques
  {
    en: "AVERAGE",
    fr: "MOYENNE",
    es: "PROMEDIO",
    de: "MITTELWERT",
    pt: "MÉDIA",
    it: "MEDIA",
    nl: "GEMIDDELDE",
    pl: "ŚREDNIA",
    ru: "СРЗНАЧ",
    tr: "ORTALAMA",
    sv: "MEDEL",
  },
  {
    en: "AVERAGEIF",
    fr: "MOYENNE.SI",
    es: "PROMEDIO.SI",
    de: "MITTELWERTWENN",
    pt: "MÉDIASE",
    it: "MEDIA.SE",
    nl: "GEMIDDELDE.ALS",
    ru: "СРЗНАЧЕСЛИ",
    tr: "EĞERORTALAMA",
    sv: "MEDEL.OM",
  },
  {
    en: "AVERAGEIFS",
    fr: "MOYENNE.SI.ENS",
    es: "PROMEDIO.SI.CONJUNTO",
    de: "MITTELWERTWENNS",
    pt: "MÉDIASES",
    it: "MEDIA.PIÙ.SE",
    nl: "GEMIDDELDEN.ALS",
    ru: "СРЗНАЧЕСЛИМН",
    tr: "ÇOKEĞERORTALAMA",
  },
  {
    en: "COUNT",
    fr: "NB",
    es: "CONTAR",
    de: "ANZAHL",
    pt: "CONT.NÚM",
    it: "CONTA.NUMERI",
    nl: "AANTAL",
    pl: "ILE.LICZB",
    ru: "СЧЁТ",
    tr: "BAĞ_DEĞ_SAY",
    sv: "ANTAL",
  },
  {
    en: "COUNTIF",
    fr: "NB.SI",
    es: "CONTAR.SI",
    de: "ZÄHLENWENN",
    pt: "CONT.SE",
    it: "CONTA.SE",
    nl: "AANTAL.ALS",
    pl: "LICZ.JEŻELI",
    ru: "СЧЁТЕСЛИ",
    tr: "EĞERSAY",
    sv: "ANTAL.OM",
  },
  {
    en: "COUNTIFS",
    fr: "NB.SI.ENS",
    es: "CONTAR.SI.CONJUNTO",
    de: "ZÄHLENWENNS",
    pt: "CONT.SES",
    it: "CONTA.PIÙ.SE",
    nl: "AANTALLEN.ALS",
    ru: "СЧЁТЕСЛИМН",
    tr: "ÇOKEĞERSAY",
  },
  {
    en: "COUNTA",
    fr: "NBVAL",
    es: "CONTARA",
    de: "ANZAHL2",
    pt: "CONT.VALORES",
    it: "CONTA.VALORI",
    nl: "AANTALARG",
    ru: "СЧЁТЗ",
    tr: "BAĞ_DEĞ_DOLU_SAY",
    sv: "ANTALV",
  },
  {
    en: "COUNTBLANK",
    fr: "NB.VIDE",
    es: "CONTAR.BLANCO",
    de: "ANZAHLLEEREZELLEN",
    pt: "CONTAR.VAZIO",
    it: "CONTA.VUOTE",
    nl: "AANTAL.LEGE.CELLEN",
    ru: "СЧИТАТЬПУСТОТЫ",
    tr: "BOŞLUKSAY",
    sv: "ANTAL.TOMMA",
  },
  { en: "MAX", fr: "MAX", es: "MAX", de: "MAX", pt: "MÁXIMO", it: "MAX", nl: "MAX", pl: "MAKS", ru: "МАКС", tr: "MAK", sv: "MAX" },
  { en: "MIN", fr: "MIN", es: "MIN", de: "MIN", pt: "MÍNIMO", it: "MIN", nl: "MIN", pl: "MIN", ru: "МИН", tr: "MİN", sv: "MIN" },

  // Texte
  {
    en: "LEFT",
    fr: "GAUCHE",
    es: "IZQUIERDA",
    de: "LINKS",
    pt: "ESQUERDA",
    it: "SINISTRA",
    nl: "LINKS",
    pl: "LEWY",
    ru: "ЛЕВСИМВ",
    tr: "SOL",
    sv: "VÄNSTER",
  },
  {
    en: "RIGHT",
    fr: "DROITE",
    es: "DERECHA",
    de: "RECHTS",
    pt: "DIREITA",
    it: "DESTRA",
    nl: "RECHTS",
    pl: "PRAWY",
    ru: "ПРАВСИМВ",
    tr: "SAĞ",
    sv: "HÖGER",
  },
  {
    en: "MID",
    fr: "STXT",
    es: "EXTRAE",
    de: "TEIL",
    pt: "EXT.TEXTO",
    it: "STRINGA.ESTRAI",
    nl: "DEEL",
    pl: "FRAGMENT.TEKSTU",
    ru: "ПСТР",
    tr: "PARÇAAL",
    sv: "EXTEXT",
  },
  {
    en: "LEN",
    fr: "NBCAR",
    es: "LARGO",
    de: "LÄNGE",
    pt: "NÚM.CARACT",
    it: "LUNGHEZZA",
    nl: "LENGTE",
    pl: "DŁ",
    ru: "ДЛСТР",
    tr: "UZUNLUK",
    sv: "LÄNGD",
  },
  {
    en: "UPPER",
    fr: "MAJUSCULE",
    es: "MAYUSC",
    de: "GROSS",
    pt: "MAIÚSCULA",
    it: "MAIUSC",
    nl: "HOOFDLETTERS",
    ru: "ПРОПИСН",
    tr: "BÜYÜKHARF",
    sv: "VERSALER",
  },
  {
    en: "LOWER",
    fr: "MINUSCULE",
    es: "MINUSC",
    de: "KLEIN",
    pt: "MINÚSCULA",
    it: "MINUSC",
    nl: "KLEINE.LETTERS",
    ru: "СТРОЧН",
    tr: "KÜÇÜKHARF",
    sv: "GEMENER",
  },
  {
    en: "PROPER",
    fr: "NOMPROPRE",
    es: "NOMPROPIO",
    de: "GROSS2",
    pt: "PRI.MAIÚSCULA",
    it: "MAIUSC.INIZ",
    nl: "BEGINLETTERS",
    ru: "ПРОПНАЧ",
  },
  { en: "TRIM", fr: "SUPPRESPACE", es: "ESPACIOS", de: "GLÄTTEN", pt: "ARRUMAR", it: "ANNULLA.SPAZI", nl: "SPATIES.WISSEN", ru: "СЖПРОБЕЛЫ", tr: "KIRP" },
  {
    en: "CONCATENATE",
    fr: "CONCATENER",
    es: "CONCATENAR",
    de: "VERKETTEN",
    pt: "CONCATENAR",
    it: "CONCATENA",
    nl: "TEKST.SAMENVOEGEN",
    ru: "СЦЕПИТЬ",
    tr: "BİRLEŞTİR",
    sv: "SAMMANFOGA",
  },
  { en: "CONCAT", fr: "CONCAT", es: "CONCAT", de: "TEXTKETTE", pt: "CONCAT", it: "CONCAT", nl: "TEKSTCOMBINEREN" },
  {
    en: "SUBSTITUTE",
    fr: "SUBSTITUE",
    es: "SUSTITUIR",
    de: "WECHSELN",
    pt: "SUBSTITUIR",
    it: "SOSTITUISCI",
    nl: "SUBSTITUEREN",
    ru: "ПОДСТАВИТЬ",
    tr: "YERİNEKOY",
    sv: "BYT.UT",
  },
  {
    en: "TEXT",
    fr: "TEXTE",
    es: "TEXTO",
    de: "TEXT",
    pt: "TEXTO",
    it: "TESTO",
    nl: "TEKST",
    pl: "TEKST",
    ru: "ТЕКСТ",
    tr: "METNEÇEVİR",
    sv: "TEXT",
  },
  {
    en: "TEXTJOIN",
    fr: "JOINDRE.TEXTE",
    es: "UNIRCADENAS",
    de: "TEXTVERKETTEN",
    pt: "UNIRTEXTO",
    it: "TESTO.UNISCI",
    nl: "TEKST.COMBINEREN",
  },

  // Date et heure
  {
    en: "TODAY",
    fr: "AUJOURDHUI",
    es: "HOY",
    de: "HEUTE",
    pt: "HOJE",
    it: "OGGI",
    nl: "VANDAAG",
    pl: "DZIŚ",
    ru: "СЕГОДНЯ",
    tr: "BUGÜN",
    sv: "IDAG",
  },
  { en: "NOW", fr: "MAINTENANT", es: "AHORA", de: "JETZT", pt: "AGORA", it: "ADESSO", nl: "NU", ru: "ТДАТА", tr: "ŞİMDİ", sv: "NU" },
  { en: "DATE", fr: "DATE", es: "FECHA", de: "DATUM", pt: "DATA", it: "DATA", nl: "DATUM", pl: "DATA", ru: "ДАТА", tr: "TARİH", sv: "DATUM" },
  { en: "YEAR", fr: "ANNEE", es: "AÑO", de: "JAHR", pt: "ANO", it: "ANNO", nl: "JAAR", pl: "ROK", ru: "ГОД", tr: "YIL", sv: "ÅR" },
  {
    en: "MONTH",
    fr: "MOIS",
    es: "MES",
    de: "MONAT",
    pt: "MÊS",
    it: "MESE",
    nl: "MAAND",
    pl: "MIESIĄC",
    ru: "МЕСЯЦ",
    tr: "AY",
    sv: "MÅNAD",
  },
  { en: "DAY", fr: "JOUR", es: "DIA", de: "TAG", pt: "DIA", it: "GIORNO", nl: "DAG", pl: "DZIEŃ", ru: "ДЕНЬ", tr: "GÜN", sv: "DAG" },
  {
    en: "WEEKDAY",
    fr: "JOURSEM",
    es: "DIASEM",
    de: "WOCHENTAG",
    pt: "DIA.DA.SEMANA",
    it: "GIORNO.SETTIMANA",
    nl: "WEEKDAG",
    ru: "ДЕНЬНЕД",
    tr: "HAFTANINGÜNÜ",
    sv: "VECKODAG",
  },

  // Information
  {
    en: "ISBLANK",
    fr: "ESTVIDE",
    es: "ESBLANCO",
    de: "ISTLEER",
    pt: "ÉCÉL.VAZIA",
    it: "VAL.VUOTO",
    nl: "ISLEEG",
    ru: "ЕПУСТО",
    tr: "EBOŞSA",
  },
  {
    en: "ISERROR",
    fr: "ESTERREUR",
    es: "ESERROR",
    de: "ISTFEHLER",
    pt: "ÉERROS",
    it: "VAL.ERRORE",
    nl: "ISFOUT",
    ru: "ЕОШИБКА",
    tr: "EHATALIYSA",
    sv: "ÄRFEL",
  },
  { en: "ISNA", fr: "ESTNA", es: "ESNOD", de: "ISTNV", pt: "ÉND", it: "VAL.NON.DISP", nl: "ISNB", ru: "ЕНД", tr: "EYOKSA" },
  {
    en: "ISNUMBER",
    fr: "ESTNUM",
    es: "ESNUMERO",
    de: "ISTZAHL",
    pt: "ÉNÚM",
    it: "VAL.NUMERO",
    nl: "ISGETAL",
    ru: "ЕЧИСЛО",
    tr: "ESAYIYSA",
  },
  {
    en: "ISTEXT",
    fr: "ESTTEXTE",
    es: "ESTEXTO",
    de: "ISTTEXT",
    pt: "ÉTEXTO",
    it: "VAL.TESTO",
    nl: "ISTEKST",
    ru: "ЕТЕКСТ",
    tr: "EMETİNSE",
  },
];

// ZH and JA Excel do not localize function names — every entry above
// already has an accurate zh/ja value: the EN name itself.
for (const entry of [...CONSTANTS, ...FUNCTIONS]) {
  entry.zh = entry.zh ?? entry.en;
  entry.ja = entry.ja ?? entry.en;
}

function escapeForRegex(name: string): string {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface LangIndex {
  /** UPPERCASE localized name -> EN canonical name, functions only (paren-position). */
  functionsToEn: Map<string, string>;
  /** UPPERCASE localized name -> EN canonical name, constants only (bare word). */
  constantsToEn: Map<string, string>;
  functionCallRegex: RegExp | null;
  constantRegex: RegExp | null;
}

const langIndexCache = new Map<LangCode, LangIndex>();

function getLangIndex(lang: LangCode): LangIndex {
  const cached = langIndexCache.get(lang);
  if (cached) return cached;

  const functionsToEn = new Map<string, string>();
  const constantsToEn = new Map<string, string>();

  for (const entry of FUNCTIONS) {
    const name = lang === "en" ? entry.en : entry[lang];
    if (name) functionsToEn.set(name.toUpperCase(), entry.en);
  }
  for (const entry of CONSTANTS) {
    const name = lang === "en" ? entry.en : entry[lang];
    if (name) constantsToEn.set(name.toUpperCase(), entry.en);
  }

  const buildRegex = (names: string[], requireParen: boolean) => {
    if (names.length === 0) return null;
    const escaped = names
      .slice()
      .sort((a, b) => b.length - a.length) // longest first: "SUMIFS" before "SUMIF" before "SUM"
      .map(escapeForRegex);
    const suffix = requireParen ? "(?=\\s*\\()" : "\\b";
    return new RegExp(`\\b(${escaped.join("|")})${suffix}`, "gi");
  };

  const index: LangIndex = {
    functionsToEn,
    constantsToEn,
    functionCallRegex: buildRegex([...functionsToEn.keys()], true),
    constantRegex: buildRegex([...constantsToEn.keys()], false),
  };
  langIndexCache.set(lang, index);
  return index;
}

/** Reverse lookup: EN canonical name -> localized name for `lang` (falls back to the EN name itself if untranslated). */
function localize(enName: string, lang: LangCode): string {
  if (lang === "en") return enName;
  const entry = [...CONSTANTS, ...FUNCTIONS].find((e) => e.en === enName);
  return entry?.[lang] ?? enName;
}

/**
 * Splits a formula into alternating [code, "quoted string", code, ...]
 * segments so translation/separator-swapping never touches text literals.
 */
function splitOutsideQuotes(formula: string): string[] {
  return formula.split(/("(?:[^"]|"")*")/g);
}

/**
 * Translates every recognized function/constant name in `formula` from
 * `sourceLang` to `targetLang`, case-insensitively, leaving quoted text
 * literals untouched. Unknown identifiers (custom names, functions with no
 * translation on record for one of the two languages) pass through
 * unchanged — never guessed.
 */
export function translateFormula(formula: string, sourceLang: LangCode, targetLang: LangCode): string {
  if (sourceLang === targetLang) return formula;

  const source = getLangIndex(sourceLang);
  const translate = (map: Map<string, string>) => (match: string) => {
    const enName = map.get(match.toUpperCase());
    return enName ? localize(enName, targetLang) : match;
  };

  return splitOutsideQuotes(formula)
    .map((segment, i) => {
      const isQuoted = i % 2 === 1;
      if (isQuoted) return segment;
      let result = segment;
      if (source.functionCallRegex) result = result.replace(source.functionCallRegex, translate(source.functionsToEn));
      if (source.constantRegex) result = result.replace(source.constantRegex, translate(source.constantsToEn));
      return result;
    })
    .join("");
}

// Placeholder used to swap `;` and `,` in a single pass without one
// replacement clobbering the other. A long, formula-unrealistic token so it
// can never collide with real formula content.
const SEPARATOR_SWAP_PLACEHOLDER = "@@ASECXEL_SEP@@";

/**
 * Swaps top-level argument separators (`;` ↔ `,`) outside of quoted text —
 * most non-English Excel locales use `;`, English-language locales use `,`.
 * Caveat: several locales also use `,` as the decimal separator inside
 * numbers (e.g. `1,5`) — this swap is purely character-based and does not
 * distinguish that case, so formulas with decimal numbers should be
 * double-checked after swapping.
 */
export function swapSeparators(formula: string): string {
  return splitOutsideQuotes(formula)
    .map((segment, i) => {
      const isQuoted = i % 2 === 1;
      if (isQuoted) return segment;
      return segment
        .split(";")
        .join(SEPARATOR_SWAP_PLACEHOLDER)
        .split(",")
        .join(";")
        .split(SEPARATOR_SWAP_PLACEHOLDER)
        .join(",");
    })
    .join("");
}

/**
 * Best-effort guess at which language a formula is written in: counts
 * recognized function/constant names per language and returns the best
 * match, or null if nothing recognizable was found (e.g. empty input).
 * ZH/JA are excluded from detection since they're identical to EN and
 * would otherwise always tie with it.
 */
export function detectLanguage(formula: string): LangCode | null {
  let best: LangCode | null = null;
  let bestCount = 0;

  for (const { code } of LANGUAGES) {
    if (code === "zh" || code === "ja") continue;
    const index = getLangIndex(code);
    const count =
      (formula.match(index.functionCallRegex ?? /$^/) ?? []).length +
      (formula.match(index.constantRegex ?? /$^/) ?? []).length;
    if (count > bestCount) {
      bestCount = count;
      best = code;
    }
  }

  return bestCount > 0 ? best : null;
}
