export interface Circuit {
  id: string;
  name: string;
  gpName: string;
  country: string;
  flag: string;
  flagCode: string;
  lengthKm: number;
  totalLaps: number;
  sectorBest: [number, number, number];
  pitLaneDelta: number;
  characteristics: string;
  keyCorners: string[];
  svgPath: string;
  viewBox: string;
  sectorSplitPoints: {
    s1: { x: number; y: number; label: string };
    s2: { x: number; y: number; label: string };
    s3: { x: number; y: number; label: string };
  };
  cornerMarkers: Array<{ name: string; x: number; y: number }>;
}

export const ACTIVE_CIRCUITS: Circuit[] = [
  {
    id: "bahrain",
    name: "Bahrain International Circuit",
    gpName: "Bahrain Grand Prix",
    country: "Bahrain",
    flag: "🇧🇭",
    flagCode: "BH",
    lengthKm: 5.412,
    totalLaps: 57,
    sectorBest: [29.100, 39.800, 22.800],
    pitLaneDelta: 22.0,
    characteristics: "Desert abrasiveness, high rear tire thermal degradation, heavy traction zones",
    keyCorners: ["Turn 1 Hairpin", "Turn 4", "Turn 9/10 Downhill", "Turn 11", "Turn 13"],
    svgPath: "M 90 190 L 90 70 L 130 65 L 155 100 L 195 100 L 225 65 L 310 65 L 330 90 L 305 130 L 330 160 L 290 190 L 230 150 L 175 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 155, y: 100, label: "S1" },
      s2: { x: 305, y: 130, label: "S2" },
      s3: { x: 175, y: 190, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 HAIRPIN", x: 90, y: 55 },
      { name: "T4", x: 165, y: 90 },
      { name: "T9/10", x: 295, y: 120 },
      { name: "T13", x: 320, y: 175 }
    ]
  },
  {
    id: "jeddah",
    name: "Jeddah Corniche Circuit",
    gpName: "Saudi Arabian Grand Prix",
    country: "Saudi Arabia",
    flag: "🇸🇦",
    flagCode: "SA",
    lengthKm: 6.174,
    totalLaps: 50,
    sectorBest: [32.100, 28.300, 27.800],
    pitLaneDelta: 20.5,
    characteristics: "Fastest street track on the planet, blind high-speed esses, wall proximity",
    keyCorners: ["Turn 1/2 Chicane", "Turn 13 Banked Hairpin", "Turn 22", "Turn 27 Final Curve"],
    svgPath: "M 80 190 L 95 140 C 110 110 100 80 120 60 C 145 40 170 50 200 45 L 340 45 C 370 50 380 75 365 95 L 310 130 C 280 150 240 160 190 175 L 110 195 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 145, y: 40, label: "S1" },
      s2: { x: 365, y: 95, label: "S2" },
      s3: { x: 190, y: 175, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1/2", x: 95, y: 130 },
      { name: "T13 BANKED", x: 360, y: 65 },
      { name: "T22", x: 280, y: 140 },
      { name: "T27 FINAL", x: 90, y: 205 }
    ]
  },
  {
    id: "melbourne",
    name: "Albert Park Circuit",
    gpName: "Australian Grand Prix",
    country: "Australia",
    flag: "🇦🇺",
    flagCode: "AU",
    lengthKm: 5.278,
    totalLaps: 58,
    sectorBest: [26.800, 17.500, 33.200],
    pitLaneDelta: 20.0,
    characteristics: "Semi-street parkland, rapid directional changes, high front-wing sensitivity",
    keyCorners: ["Turn 1 Jones", "Turn 3 Sports Center", "Turn 9/10 High-speed sweep", "Turn 11/12 Waite"],
    svgPath: "M 100 195 L 85 140 C 80 110 105 85 130 85 L 180 85 C 205 70 240 70 270 85 L 330 110 C 355 125 365 155 345 180 L 300 200 C 265 210 215 190 175 195 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 130, y: 85, label: "S1" },
      s2: { x: 330, y: 110, label: "S2" },
      s3: { x: 265, y: 210, label: "S3" }
    },
    cornerMarkers: [
      { name: "JONES (T1)", x: 85, y: 130 },
      { name: "SPORTS CENTER", x: 140, y: 75 },
      { name: "LAKESIDE SWEEP", x: 340, y: 100 },
      { name: "WAITE", x: 345, y: 190 }
    ]
  },
  {
    id: "suzuka",
    name: "Suzuka International Racing Course",
    gpName: "Japanese Grand Prix",
    country: "Japan",
    flag: "🇯🇵",
    flagCode: "JP",
    lengthKm: 5.807,
    totalLaps: 53,
    sectorBest: [31.500, 39.800, 17.700],
    pitLaneDelta: 22.5,
    characteristics: "Figure-8 crossover layout, rhythm S-curves, extreme tire wear",
    keyCorners: ["First Curve", "S-Curves", "Degner", "Hairpin", "Spoon", "130R", "Casio Triangle"],
    svgPath: "M 80 180 C 70 160 80 130 95 110 C 110 90 140 80 165 95 C 185 110 200 140 225 150 C 250 160 280 145 300 120 C 320 95 340 70 360 85 C 375 100 360 130 340 160 C 320 190 285 200 255 190 C 230 180 210 150 190 135 C 170 120 140 130 125 150 C 110 170 95 195 80 180 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 165, y: 95, label: "S1" },
      s2: { x: 360, y: 85, label: "S2" },
      s3: { x: 100, y: 185, label: "S3" }
    },
    cornerMarkers: [
      { name: "S-CURVES", x: 115, y: 85 },
      { name: "DEGNER", x: 200, y: 155 },
      { name: "HAIRPIN", x: 305, y: 110 },
      { name: "SPOON", x: 365, y: 75 },
      { name: "130R", x: 260, y: 205 }
    ]
  },
  {
    id: "shanghai",
    name: "Shanghai International Circuit",
    gpName: "Chinese Grand Prix",
    country: "China",
    flag: "🇨🇳",
    flagCode: "CN",
    lengthKm: 5.451,
    totalLaps: 56,
    sectorBest: [24.800, 28.500, 41.200],
    pitLaneDelta: 23.0,
    characteristics: "Endless snail Turn 1-3, front-left tire graining, 1.2km back straight",
    keyCorners: ["Turn 1/2/3 Snail", "Turn 6 Hairpin", "Turn 7/8 High-G", "Turn 13 Banked Entry", "Turn 14 Hairpin"],
    svgPath: "M 90 180 C 70 150 85 100 120 80 C 150 65 170 95 150 125 C 135 140 115 130 130 110 L 220 110 C 245 90 270 90 290 110 L 350 110 L 360 170 L 260 175 L 180 175 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 150, y: 125, label: "S1" },
      s2: { x: 290, y: 110, label: "S2" },
      s3: { x: 260, y: 175, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1-3 SNAIL", x: 135, y: 70 },
      { name: "T6 HAIRPIN", x: 210, y: 125 },
      { name: "1.2KM STRAIGHT", x: 330, y: 95 },
      { name: "T14 HAIRPIN", x: 350, y: 185 }
    ]
  },
  {
    id: "miami",
    name: "Miami International Autodrome",
    gpName: "Miami Grand Prix",
    country: "United States",
    flag: "🇺🇸",
    flagCode: "US",
    lengthKm: 5.412,
    totalLaps: 57,
    sectorBest: [29.200, 33.700, 26.800],
    pitLaneDelta: 21.0,
    characteristics: "Hard Rock Stadium complex, technical chicane under flyovers, heavy braking zones",
    keyCorners: ["Turn 1", "Turn 7 Marina", "Turn 11 Hairpin", "Turn 14/15 Chicane", "Turn 17"],
    svgPath: "M 95 185 L 95 85 L 145 85 L 175 55 L 255 55 L 285 85 L 345 85 L 345 140 L 290 140 L 260 185 L 160 185 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 175, y: 55, label: "S1" },
      s2: { x: 345, y: 85, label: "S2" },
      s3: { x: 260, y: 185, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1", x: 95, y: 75 },
      { name: "MARINA COMPLEX", x: 220, y: 45 },
      { name: "T14/15 CHICANE", x: 340, y: 155 },
      { name: "T17 HAIRPIN", x: 245, y: 195 }
    ]
  },
  {
    id: "imola",
    name: "Autodromo Enzo e Dino Ferrari",
    gpName: "Emilia Romagna Grand Prix",
    country: "Italy",
    flag: "🇮🇹",
    flagCode: "IT",
    lengthKm: 4.909,
    totalLaps: 63,
    sectorBest: [24.300, 27.100, 24.500],
    pitLaneDelta: 25.0,
    characteristics: "Old-school natural rollercoaster, aggressive kerb hopping, minimal overtaking width",
    keyCorners: ["Tamburello", "Villeneuve", "Tosa", "Piratella", "Acque Minerali", "Rivazza"],
    svgPath: "M 85 185 L 95 125 C 105 105 130 100 150 110 L 195 90 C 215 75 240 85 250 105 L 305 75 C 330 65 355 85 345 110 L 310 145 C 290 170 250 160 220 185 L 130 185 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 150, y: 110, label: "S1" },
      s2: { x: 305, y: 75, label: "S2" },
      s3: { x: 220, y: 185, label: "S3" }
    },
    cornerMarkers: [
      { name: "TAMBURELLO", x: 95, y: 115 },
      { name: "TOSA", x: 195, y: 80 },
      { name: "ACQUE MINERALI", x: 340, y: 95 },
      { name: "RIVAZZA", x: 120, y: 195 }
    ]
  },
  {
    id: "monaco",
    name: "Circuit de Monaco",
    gpName: "Monaco Grand Prix",
    country: "Monaco",
    flag: "🇲🇨",
    flagCode: "MC",
    lengthKm: 3.337,
    totalLaps: 78,
    sectorBest: [19.200, 33.800, 19.500],
    pitLaneDelta: 21.0,
    characteristics: "Narrow street circuit, maximum downforce, zero margin for error",
    keyCorners: ["Sainte Dévote", "Beau Rivage", "Casino", "Hairpin", "Tunnel", "Rascasse"],
    svgPath: "M 120 195 L 90 180 C 80 170 85 150 95 140 L 130 105 C 145 90 165 70 190 65 C 220 60 240 80 245 100 L 245 120 C 245 130 230 135 220 130 C 210 125 220 110 210 105 C 200 100 180 120 180 135 L 200 160 C 215 175 250 175 270 165 L 320 135 C 335 125 345 140 335 155 L 300 190 C 280 210 240 210 200 200 L 140 200 Z",
    viewBox: "0 0 400 240",
    sectorSplitPoints: {
      s1: { x: 190, y: 65, label: "S1" },
      s2: { x: 270, y: 165, label: "S2" },
      s3: { x: 110, y: 195, label: "S3" }
    },
    cornerMarkers: [
      { name: "STE DÉVOTE", x: 75, y: 175 },
      { name: "CASINO", x: 215, y: 55 },
      { name: "HAIRPIN", x: 210, y: 145 },
      { name: "TUNNEL", x: 270, y: 155 },
      { name: "RASCASSE", x: 285, y: 205 }
    ]
  },
  {
    id: "montreal",
    name: "Circuit Gilles Villeneuve",
    gpName: "Canadian Grand Prix",
    country: "Canada",
    flag: "🇨🇦",
    flagCode: "CA",
    lengthKm: 4.361,
    totalLaps: 70,
    sectorBest: [21.500, 23.200, 26.800],
    pitLaneDelta: 18.5,
    characteristics: "Stop-start chicanes, fierce brake energy punishment, Wall of Champions exit",
    keyCorners: ["Turn 1/2 Senna", "Turn 3/4", "Turn 8/9", "Turn 10 Hairpin", "Turn 13/14 Wall of Champions"],
    svgPath: "M 90 190 L 85 110 C 85 90 105 85 125 95 L 180 85 L 210 110 L 270 85 L 340 85 C 360 85 365 110 345 130 L 290 155 L 220 155 L 170 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 180, y: 85, label: "S1" },
      s2: { x: 345, y: 130, label: "S2" },
      s3: { x: 220, y: 155, label: "S3" }
    },
    cornerMarkers: [
      { name: "SENNA S", x: 80, y: 95 },
      { name: "CHICANE T8/9", x: 220, y: 95 },
      { name: "HAIRPIN T10", x: 355, y: 105 },
      { name: "WALL OF CHAMPIONS", x: 155, y: 200 }
    ]
  },
  {
    id: "barcelona",
    name: "Circuit de Barcelona-Catalunya",
    gpName: "Spanish Grand Prix",
    country: "Spain",
    flag: "🇪🇸",
    flagCode: "ES",
    lengthKm: 4.657,
    totalLaps: 66,
    sectorBest: [21.600, 29.800, 21.500],
    pitLaneDelta: 21.5,
    characteristics: "Aero benchmark, continuous high lateral loads through Turn 3 and Campsa",
    keyCorners: ["Turn 1/2 Elf", "Turn 3 Renault", "Turn 4 Repsol", "Turn 9 Campsa", "Turn 13/14 Final Sweeps"],
    svgPath: "M 90 190 L 90 85 L 135 70 C 175 70 190 110 230 110 C 265 110 270 70 310 70 L 345 95 L 310 150 L 250 150 L 210 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 190, y: 110, label: "S1" },
      s2: { x: 310, y: 70, label: "S2" },
      s3: { x: 250, y: 150, label: "S3" }
    },
    cornerMarkers: [
      { name: "ELF CHICANE", x: 90, y: 75 },
      { name: "TURN 3 BANKED", x: 175, y: 60 },
      { name: "CAMPSA", x: 335, y: 65 },
      { name: "FINAL SWEEP", x: 195, y: 200 }
    ]
  },
  {
    id: "red_bull_ring",
    name: "Red Bull Ring",
    gpName: "Austrian Grand Prix",
    country: "Austria",
    flag: "🇦🇹",
    flagCode: "AT",
    lengthKm: 4.318,
    totalLaps: 71,
    sectorBest: [16.500, 28.900, 19.600],
    pitLaneDelta: 19.5,
    characteristics: "Short high-intensity lap, steep climbs, massive slipstream straights",
    keyCorners: ["Niki Lauda", "Remus", "Schlossgold", "Rauch", "Würth", "Rindt"],
    svgPath: "M 90 190 L 90 120 C 90 100 110 85 130 85 L 210 65 C 235 60 250 75 240 95 L 200 130 C 190 140 200 155 215 155 L 280 155 C 310 155 330 175 320 200 C 310 220 280 220 250 210 L 130 205 C 105 205 90 200 90 190 Z",
    viewBox: "0 0 400 240",
    sectorSplitPoints: {
      s1: { x: 210, y: 65, label: "S1" },
      s2: { x: 280, y: 155, label: "S2" },
      s3: { x: 110, y: 205, label: "S3" }
    },
    cornerMarkers: [
      { name: "NIKI LAUDA", x: 80, y: 105 },
      { name: "REMUS", x: 235, y: 50 },
      { name: "SCHLOSSGOLD", x: 180, y: 145 },
      { name: "RINDT", x: 310, y: 215 }
    ]
  },
  {
    id: "silverstone",
    name: "Silverstone Circuit",
    gpName: "British Grand Prix",
    country: "Great Britain",
    flag: "🇬🇧",
    flagCode: "GB",
    lengthKm: 5.891,
    totalLaps: 52,
    sectorBest: [28.200, 36.100, 25.700],
    pitLaneDelta: 20.0,
    characteristics: "High speed, heavy lateral aerodynamic loading",
    keyCorners: ["Copse", "Maggots", "Becketts", "Stowe", "Club"],
    svgPath: "M 75 145 C 80 135 110 135 125 125 C 140 115 145 95 160 90 C 180 85 200 110 220 100 C 240 90 270 50 280 60 C 290 70 260 110 270 120 C 280 130 330 110 340 130 C 350 150 310 170 290 175 C 270 180 230 170 200 180 C 170 190 130 200 100 180 C 85 170 70 160 75 145 Z",
    viewBox: "0 0 400 240",
    sectorSplitPoints: {
      s1: { x: 160, y: 90, label: "S1" },
      s2: { x: 330, y: 120, label: "S2" },
      s3: { x: 90, y: 180, label: "S3" }
    },
    cornerMarkers: [
      { name: "COPSE", x: 175, y: 78 },
      { name: "MAGGOTTS/BECKETTS", x: 260, y: 48 },
      { name: "STOWE", x: 345, y: 145 },
      { name: "CLUB", x: 80, y: 195 }
    ]
  },
  {
    id: "hungaroring",
    name: "Hungaroring",
    gpName: "Hungarian Grand Prix",
    country: "Hungary",
    flag: "🇭🇺",
    flagCode: "HU",
    lengthKm: 4.381,
    totalLaps: 70,
    sectorBest: [28.200, 27.600, 21.400],
    pitLaneDelta: 20.5,
    characteristics: "Monaco without the walls, narrow twisty bowl, suffocating ambient heat",
    keyCorners: ["Turn 1 Downhill", "Turn 2 Off-camber", "Turn 4 Blind Crest", "Turn 11 Mansell", "Turn 14 Entry"],
    svgPath: "M 95 190 L 95 95 C 105 70 135 65 155 85 L 180 130 L 225 105 L 260 140 L 310 115 C 335 115 345 140 330 160 L 265 190 L 175 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 155, y: 85, label: "S1" },
      s2: { x: 260, y: 140, label: "S2" },
      s3: { x: 265, y: 190, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 DOWNHILL", x: 95, y: 80 },
      { name: "T4 CREST", x: 175, y: 120 },
      { name: "MANSELL CHICANE", x: 295, y: 105 },
      { name: "T14 FINAL", x: 165, y: 200 }
    ]
  },
  {
    id: "spa",
    name: "Circuit de Spa-Francorchamps",
    gpName: "Belgian Grand Prix",
    country: "Belgium",
    flag: "🇧🇪",
    flagCode: "BE",
    lengthKm: 7.004,
    totalLaps: 44,
    sectorBest: [30.100, 44.300, 28.600],
    pitLaneDelta: 22.0,
    characteristics: "Longest calendar lap, massive elevation changes, microclimates",
    keyCorners: ["La Source", "Eau Rouge", "Raidillon", "Kemmel", "Pouhon", "Blanchimont", "Bus Stop"],
    svgPath: "M 110 190 L 95 175 C 90 160 100 145 115 145 L 140 150 C 155 145 160 120 165 100 L 215 45 C 225 35 245 40 255 55 L 290 105 C 300 120 330 125 345 145 C 355 160 340 185 320 190 L 265 195 C 240 195 230 175 215 170 L 180 170 C 160 170 145 195 125 195 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 215, y: 45, label: "S1" },
      s2: { x: 340, y: 140, label: "S2" },
      s3: { x: 135, y: 195, label: "S3" }
    },
    cornerMarkers: [
      { name: "LA SOURCE", x: 80, y: 185 },
      { name: "EAU ROUGE", x: 155, y: 125 },
      { name: "KEMMEL", x: 235, y: 35 },
      { name: "POUHON", x: 345, y: 170 },
      { name: "BUS STOP", x: 120, y: 210 }
    ]
  },
  {
    id: "zandvoort",
    name: "Circuit Zandvoort",
    gpName: "Dutch Grand Prix",
    country: "Netherlands",
    flag: "🇳🇱",
    flagCode: "NL",
    lengthKm: 4.259,
    totalLaps: 72,
    sectorBest: [24.200, 25.800, 21.500],
    pitLaneDelta: 21.0,
    characteristics: "Steep 18-degree banking, coastal North Sea sand drift, roller-coaster dunes",
    keyCorners: ["Tarzan", "Gerlach", "Hugenholtz Banked", "Scheivlak", "Arie Luyendykbocht"],
    svgPath: "M 90 195 L 90 100 C 90 75 120 65 140 85 L 175 120 C 190 140 215 130 230 110 L 290 85 C 320 75 345 100 330 135 L 290 180 C 265 210 200 210 140 195 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 85, label: "S1" },
      s2: { x: 290, y: 85, label: "S2" },
      s3: { x: 200, y: 210, label: "S3" }
    },
    cornerMarkers: [
      { name: "TARZAN", x: 85, y: 80 },
      { name: "HUGENHOLTZ", x: 165, y: 135 },
      { name: "SCHEIVLAK", x: 310, y: 70 },
      { name: "LUYENDYK BANKING", x: 255, y: 220 }
    ]
  },
  {
    id: "monza",
    name: "Autodromo Nazionale Monza",
    gpName: "Italian Grand Prix",
    country: "Italy",
    flag: "🇮🇹",
    flagCode: "IT",
    lengthKm: 5.793,
    totalLaps: 53,
    sectorBest: [26.400, 27.200, 26.900],
    pitLaneDelta: 24.0,
    characteristics: "Temple of Speed · High-speed chicanes, heavy braking into Variante del Rettifilo, Curva del Serraglio straight, low downforce aero package",
    keyCorners: [
      "Turn 1/2 Variante del Rettifilo",
      "Turn 3 Curva Biassono (Curva Grande)",
      "Turn 4/5 Variante della Roggia",
      "Turn 6 Curva di Lesmo 1",
      "Turn 7 Curva di Lesmo 2",
      "Turn 8/9/10 Variante Ascari",
      "Turn 11 Curva Parabolica (Alboreto)"
    ],
    svgPath: "M 260 205 L 155 205 C 135 205 125 203 120 196 C 115 188 122 182 118 174 C 110 160 76 155 68 135 C 64 122 65 110 65 98 C 65 90 52 88 52 80 C 52 72 62 70 66 65 C 70 58 65 42 72 32 C 78 24 90 25 102 27 L 115 28 C 125 29 132 36 134 46 C 138 60 162 90 180 112 C 186 118 190 126 195 126 C 202 126 208 120 214 128 C 218 134 224 140 234 144 L 310 160 L 335 165 C 362 170 380 180 380 194 C 380 208 360 214 340 212 C 320 210 300 205 260 205 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 65, y: 105, label: "S1" },
      s2: { x: 165, y: 94, label: "S2" },
      s3: { x: 230, y: 205, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1/T2 RETTIFILO", x: 110, y: 226 },
      { name: "T3 BIASSONO", x: 35, y: 142 },
      { name: "T4/T5 ROGGIA", x: 25, y: 78 },
      { name: "T6 LESMO 1", x: 75, y: 16 },
      { name: "T7 LESMO 2", x: 145, y: 28 },
      { name: "T8-T10 ASCARI", x: 220, y: 112 },
      { name: "T11 PARABOLICA", x: 365, y: 230 }
    ]
  },
  {
    id: "baku",
    name: "Baku City Circuit",
    gpName: "Azerbaijan Grand Prix",
    country: "Azerbaijan",
    flag: "🇦🇿",
    flagCode: "AZ",
    lengthKm: 6.003,
    totalLaps: 51,
    sectorBest: [35.500, 41.200, 25.200],
    pitLaneDelta: 21.0,
    characteristics: "2.2km flat-out boulevard into 90-degree city corners, tightest 7.6m castle section",
    keyCorners: ["Turn 1", "Turn 3", "Turn 8-12 Castle Section", "Turn 15 Downhill", "Turn 16 Main Straight Entry"],
    svgPath: "M 85 190 L 85 90 L 135 90 L 135 130 L 195 130 L 195 70 L 265 70 L 285 110 L 355 110 L 355 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 135, y: 90, label: "S1" },
      s2: { x: 285, y: 110, label: "S2" },
      s3: { x: 355, y: 190, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 90-DEG", x: 85, y: 75 },
      { name: "CASTLE SECTION", x: 195, y: 55 },
      { name: "T16 STRAIGHT ENTRY", x: 330, y: 100 },
      { name: "2.2KM SPEED TRAP", x: 220, y: 200 }
    ]
  },
  {
    id: "singapore",
    name: "Marina Bay Street Circuit",
    gpName: "Singapore Grand Prix",
    country: "Singapore",
    flag: "🇸🇬",
    flagCode: "SG",
    lengthKm: 4.940,
    totalLaps: 62,
    sectorBest: [27.500, 37.800, 26.200],
    pitLaneDelta: 28.0,
    characteristics: "Night race in 85% equatorial humidity, 2-hour physical stamina limit, bumpy kerbs",
    keyCorners: ["Sheares Turn 1-3", "Turn 7 Memorial", "Turn 9", "Turn 13 Anderson Bridge", "Turn 14"],
    svgPath: "M 95 190 L 95 125 L 140 125 L 140 75 L 210 75 L 240 115 L 290 85 L 340 120 L 310 165 L 250 165 L 210 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 75, label: "S1" },
      s2: { x: 290, y: 85, label: "S2" },
      s3: { x: 250, y: 165, label: "S3" }
    },
    cornerMarkers: [
      { name: "SHEARES (T1)", x: 95, y: 110 },
      { name: "MEMORIAL (T7)", x: 200, y: 65 },
      { name: "ANDERSON BRIDGE", x: 325, y: 105 },
      { name: "T14 CONNAUGHT", x: 235, y: 180 }
    ]
  },
  {
    id: "cota",
    name: "Circuit of the Americas",
    gpName: "United States Grand Prix",
    country: "United States",
    flag: "🇺🇸",
    flagCode: "US",
    lengthKm: 5.513,
    totalLaps: 56,
    sectorBest: [25.200, 37.800, 31.500],
    pitLaneDelta: 21.5,
    characteristics: "Steep 11% climb into blind Turn 1 hairpin, rapid Maggotts-inspired esses",
    keyCorners: ["Turn 1 Big Hill", "Turn 3-6 Esses", "Turn 11 Hairpin", "Turn 12 End of Straight", "Turn 16-18 Triple Apex"],
    svgPath: "M 95 185 L 85 110 C 85 80 115 50 140 70 L 195 90 C 230 110 260 85 285 75 L 345 75 C 365 75 365 110 340 135 L 285 160 L 225 150 L 165 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 70, label: "S1" },
      s2: { x: 285, y: 75, label: "S2" },
      s3: { x: 225, y: 150, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 BIG HILL", x: 85, y: 60 },
      { name: "T3-6 ESSES", x: 195, y: 105 },
      { name: "T11 HAIRPIN", x: 350, y: 65 },
      { name: "TRIPLE APEX", x: 205, y: 165 }
    ]
  },
  {
    id: "mexico",
    name: "Autódromo Hermanos Rodríguez",
    gpName: "Mexico City Grand Prix",
    country: "Mexico",
    flag: "🇲🇽",
    flagCode: "MX",
    lengthKm: 4.304,
    totalLaps: 71,
    sectorBest: [27.400, 30.800, 20.200],
    pitLaneDelta: 22.0,
    characteristics: "High altitude 2200m thin air, cooling starvation, iconic Foro Sol baseball stadium",
    keyCorners: ["Turn 1-3 Chicane", "Turn 4-6", "Turn 7-11 Esses", "Turn 12 Stadium Entry", "Turn 14 Peraltada exit"],
    svgPath: "M 90 190 L 90 80 L 140 80 L 165 110 L 225 110 L 260 70 L 335 70 C 355 70 365 95 345 125 L 305 155 L 245 155 L 180 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 80, label: "S1" },
      s2: { x: 335, y: 70, label: "S2" },
      s3: { x: 245, y: 155, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1-3 CHICANE", x: 90, y: 65 },
      { name: "HIGH SPEED ESSES", x: 245, y: 95 },
      { name: "FORO SOL STADIUM", x: 345, y: 140 },
      { name: "PERALTADA EXIT", x: 160, y: 200 }
    ]
  },
  {
    id: "interlagos",
    name: "Autódromo José Carlos Pace",
    gpName: "São Paulo Grand Prix",
    country: "Brazil",
    flag: "🇧🇷",
    flagCode: "BR",
    lengthKm: 4.309,
    totalLaps: 71,
    sectorBest: [18.400, 35.200, 17.500],
    pitLaneDelta: 21.0,
    characteristics: "Anti-clockwise natural amphitheatre, Senna S descent, high rain probability",
    keyCorners: ["Senna S Turn 1/2", "Curva do Sol", "Descida do Lago", "Ferradura", "Bico de Pato", "Junção"],
    svgPath: "M 100 185 C 80 160 85 125 110 105 L 145 75 C 175 55 210 65 235 90 L 290 65 C 320 50 350 75 340 105 L 305 145 C 280 180 235 170 190 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 145, y: 75, label: "S1" },
      s2: { x: 290, y: 65, label: "S2" },
      s3: { x: 235, y: 170, label: "S3" }
    },
    cornerMarkers: [
      { name: "SENNA S", x: 95, y: 95 },
      { name: "CURVA DO SOL", x: 175, y: 65 },
      { name: "FERRADURA", x: 335, y: 85 },
      { name: "JUNÇÃO", x: 180, y: 200 }
    ]
  },
  {
    id: "las_vegas",
    name: "Las Vegas Strip Circuit",
    gpName: "Las Vegas Grand Prix",
    country: "United States",
    flag: "🇺🇸",
    flagCode: "US",
    lengthKm: 6.201,
    totalLaps: 50,
    sectorBest: [27.100, 31.800, 34.600],
    pitLaneDelta: 20.5,
    characteristics: "Cold night desert temperatures, low tire thermal grip, 1.9km flat out on the Strip",
    keyCorners: ["Turn 1 Hairpin", "Turn 5-9 Sphere Complex", "Turn 12 Koval Straight", "Turn 14 Strip Braking"],
    svgPath: "M 85 190 L 85 100 L 140 100 C 165 75 195 75 220 100 L 285 100 L 355 100 L 355 155 L 245 155 L 165 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 100, label: "S1" },
      s2: { x: 355, y: 100, label: "S2" },
      s3: { x: 245, y: 155, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 HAIRPIN", x: 85, y: 85 },
      { name: "THE SPHERE", x: 195, y: 70 },
      { name: "KOVAL STRAIGHT", x: 320, y: 85 },
      { name: "LAS VEGAS STRIP", x: 240, y: 170 }
    ]
  },
  {
    id: "lusail",
    name: "Lusail International Circuit",
    gpName: "Qatar Grand Prix",
    country: "Qatar",
    flag: "🇶🇦",
    flagCode: "QA",
    lengthKm: 5.419,
    totalLaps: 57,
    sectorBest: [30.400, 28.200, 24.100],
    pitLaneDelta: 24.0,
    characteristics: "Relentless high-speed lateral sustained G-forces, aggressive 50mm pyramid kerbs",
    keyCorners: ["Turn 1", "Turn 6", "Turn 10", "Turn 12-14 Triple-Apex Right", "Turn 16"],
    svgPath: "M 90 185 L 90 85 C 105 60 135 60 155 80 L 195 80 C 215 60 250 60 270 85 L 340 85 C 365 100 365 130 335 155 L 270 170 L 180 170 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 155, y: 80, label: "S1" },
      s2: { x: 340, y: 85, label: "S2" },
      s3: { x: 270, y: 170, label: "S3" }
    },
    cornerMarkers: [
      { name: "T1 SPEED", x: 90, y: 70 },
      { name: "T6 HAIRPIN", x: 185, y: 70 },
      { name: "TRIPLE APEX T12-14", x: 350, y: 115 },
      { name: "T16 FINAL", x: 165, y: 185 }
    ]
  },
  {
    id: "yas_marina",
    name: "Yas Marina Circuit",
    gpName: "Abu Dhabi Grand Prix",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    flagCode: "AE",
    lengthKm: 5.281,
    totalLaps: 58,
    sectorBest: [17.500, 36.200, 29.800],
    pitLaneDelta: 22.0,
    characteristics: "Day-into-night season finale, illuminated hotel complex, modified high-speed banking",
    keyCorners: ["Turn 5 Banked Hairpin", "Turn 6/7 Chicane", "Turn 9 Banked Curve", "Turn 12 Marina Entry"],
    svgPath: "M 95 190 L 95 80 L 140 80 L 165 110 L 245 110 C 275 80 315 80 345 105 L 345 160 L 285 160 L 230 190 Z",
    viewBox: "0 0 420 240",
    sectorSplitPoints: {
      s1: { x: 140, y: 80, label: "S1" },
      s2: { x: 345, y: 105, label: "S2" },
      s3: { x: 285, y: 160, label: "S3" }
    },
    cornerMarkers: [
      { name: "T5 BANKED HAIRPIN", x: 95, y: 65 },
      { name: "1.2KM CHICANE", x: 195, y: 125 },
      { name: "T9 BANKED CURVE", x: 345, y: 85 },
      { name: "YAS HOTEL COMPLEX", x: 280, y: 175 }
    ]
  }
];

export const DEFAULT_CIRCUIT_ID = "monza";

export function getCircuitById(id: string): Circuit {
  const norm = (id || "").toLowerCase().trim().replace(/[-_]/g, "");
  const found = ACTIVE_CIRCUITS.find(c => {
    const cNorm = c.id.toLowerCase().replace(/[-_]/g, "");
    if (cNorm === norm) return true;
    if (norm === "australia" && cNorm === "melbourne") return true;
    if (norm === "melbourne" && cNorm === "australia") return true;
    if (norm === "italy" && cNorm === "monza") return true;
    if (norm === "monza" && cNorm === "italy") return true;
    if ((norm === "greatbritain" || norm === "britain") && cNorm === "silverstone") return true;
    if (norm === "silverstone" && (cNorm === "greatbritain" || cNorm === "britain")) return true;
    if (norm === "belgium" && cNorm === "spa") return true;
    if (norm === "spa" && cNorm === "belgium") return true;
    if (norm === "saudiarabia" && cNorm === "jeddah") return true;
    if (norm === "jeddah" && cNorm === "saudiarabia") return true;
    if ((norm === "emiliaromagna" || norm === "emilia_romagna") && cNorm === "imola") return true;
    if (norm === "imola" && (cNorm === "emiliaromagna" || cNorm === "emilia_romagna")) return true;
    return false;
  });
  return found || ACTIVE_CIRCUITS[0];
}
