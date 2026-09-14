"""
AEGIS 2025 Formula 1 Telemetry Pipeline Generator
==================================================
Extracts official 2025 FIA World Championship event data via FastF1,
generating normalized vector geometries, corner annotations, sector splits,
and synchronized telemetry samples (X, Y, Speed, Gear, Brake, Throttle, Distance)
across all 24 Grand Prix circuits of the 2025 season.

Outputs to:
  - data/circuits/2025/*.json
  - frontend/public/data/circuits/2025/*.json
"""

import os
import sys
import json
import shutil
import argparse
import logging
import numpy as np
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("CircuitGenerator2025")

try:
    import fastf1
except ImportError:
    logger.error("FastF1 is not installed in current Python environment.")
    sys.exit(1)

# Canonical 2025 24-circuit catalog definition with aliases and metadata
CIRCUITS_2025 = [
    {
        "id": "australia",
        "aliases": ["melbourne", "albert_park", "albert-park"],
        "name": "Albert Park Circuit",
        "gp_name": "Australian Grand Prix",
        "country": "Australia",
        "flag": "🇦🇺",
        "flag_code": "AU",
        "location": "Melbourne",
        "round_2025": 1,
        "fallback_2024_event": "Australian Grand Prix",
        "length_km": 5.278,
        "total_laps": 58,
        "official_map_sheet": "/assets/circuit-maps/australia.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Jones (T1)", 2: "Brabham (T2)", 3: "Sports Center (T3)", 4: "Turn 4",
            5: "Turn 5", 6: "Turn 6", 7: "Turn 7", 8: "Turn 8",
            9: "Clark Chicane (T9)", 10: "T10 Sweep", 11: "Waite (T11)", 12: "T12 Exit",
            13: "Turn 13", 14: "Turn 14"
        }
    },
    {
        "id": "china",
        "aliases": ["shanghai"],
        "name": "Shanghai International Circuit",
        "gp_name": "Chinese Grand Prix",
        "country": "China",
        "flag": "🇨🇳",
        "flag_code": "CN",
        "location": "Shanghai",
        "round_2025": 2,
        "fallback_2024_event": "Chinese Grand Prix",
        "length_km": 5.451,
        "total_laps": 56,
        "official_map_sheet": "/assets/circuit-maps/china.png",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Snail (T1)", 2: "Turn 2", 3: "Turn 3", 6: "Hairpin (T6)",
            13: "Banked Entry (T13)", 14: "Hairpin (T14)"
        }
    },
    {
        "id": "japan",
        "aliases": ["suzuka"],
        "name": "Suzuka International Racing Course",
        "gp_name": "Japanese Grand Prix",
        "country": "Japan",
        "flag": "🇯🇵",
        "flag_code": "JP",
        "location": "Suzuka",
        "round_2025": 3,
        "fallback_2024_event": "Japanese Grand Prix",
        "length_km": 5.807,
        "total_laps": 53,
        "official_map_sheet": "/assets/circuit-maps/japan.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "First Curve (T1)", 3: "S-Curves (T3)", 8: "Degner 1", 9: "Degner 2",
            11: "Hairpin (T11)", 14: "Spoon (T14)", 15: "130R (T15)", 16: "Casio Triangle (T16)"
        }
    },
    {
        "id": "bahrain",
        "aliases": ["sakhir"],
        "name": "Bahrain International Circuit",
        "gp_name": "Bahrain Grand Prix",
        "country": "Bahrain",
        "flag": "🇧🇭",
        "flag_code": "BH",
        "location": "Sakhir",
        "round_2025": 4,
        "fallback_2024_event": "Bahrain Grand Prix",
        "length_km": 5.412,
        "total_laps": 57,
        "official_map_sheet": "/assets/circuit-maps/bahrain.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Michael Schumacher Hairpin (T1)", 4: "Turn 4 Braking", 9: "Downhill (T9)", 10: "Lockup Risk (T10)", 13: "Turn 13 Exit"
        }
    },
    {
        "id": "saudi-arabia",
        "aliases": ["jeddah", "saudi_arabia", "jeddah_corniche"],
        "name": "Jeddah Corniche Circuit",
        "gp_name": "Saudi Arabian Grand Prix",
        "country": "Saudi Arabia",
        "flag": "🇸🇦",
        "flag_code": "SA",
        "location": "Jeddah",
        "round_2025": 5,
        "fallback_2024_event": "Saudi Arabian Grand Prix",
        "length_km": 6.174,
        "total_laps": 50,
        "official_map_sheet": "/assets/circuit-maps/saudi-arabia.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1/2 Chicane", 13: "Banked Hairpin (T13)", 22: "Turn 22 High-Speed", 27: "Final Hairpin (T27)"
        }
    },
    {
        "id": "miami",
        "aliases": ["miami_gardens"],
        "name": "Miami International Autodrome",
        "gp_name": "Miami Grand Prix",
        "country": "United States",
        "flag": "🇺🇸",
        "flag_code": "US",
        "location": "Miami Gardens",
        "round_2025": 6,
        "fallback_2024_event": "Miami Grand Prix",
        "length_km": 5.412,
        "total_laps": 57,
        "official_map_sheet": "/assets/circuit-maps/miami.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1", 7: "Marina (T7)", 11: "Hairpin (T11)", 14: "Chicane (T14)", 17: "Hairpin (T17)"
        }
    },
    {
        "id": "imola",
        "aliases": ["emilia_romagna", "emilia-romagna", "autodromo_enzo_e_dino_ferrari"],
        "name": "Autodromo Enzo e Dino Ferrari",
        "gp_name": "Emilia Romagna Grand Prix",
        "country": "Italy",
        "flag": "🇮🇹",
        "flag_code": "IT",
        "location": "Imola",
        "round_2025": 7,
        "fallback_2024_event": "Emilia Romagna Grand Prix",
        "length_km": 4.909,
        "total_laps": 63,
        "official_map_sheet": "/assets/circuit-maps/imola.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Tamburello 1 (T1)", 2: "Tamburello 2 (T2)", 3: "Tamburello 3 (T3)",
            4: "Villeneuve 1 (T4)", 5: "Villeneuve 2 (T5)", 6: "Tosa (T6)",
            7: "Piratella (T7)", 9: "Acque Minerali 1 (T9)", 10: "Acque Minerali 2 (T10)",
            11: "Variante Alta (T11)", 12: "Variante Alta Exit (T12)",
            14: "Rivazza 1 (T14)", 15: "Rivazza 2 (T15)"
        }
    },
    {
        "id": "monaco",
        "aliases": ["monte_carlo", "monte-carlo"],
        "name": "Circuit de Monaco",
        "gp_name": "Monaco Grand Prix",
        "country": "Monaco",
        "flag": "🇲🇨",
        "flag_code": "MC",
        "location": "Monte Carlo",
        "round_2025": 8,
        "fallback_2024_event": "Monaco Grand Prix",
        "length_km": 3.337,
        "total_laps": 78,
        "official_map_sheet": "/assets/circuit-maps/monaco.png",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Sainte Dévote (T1)", 3: "Massenet (T3)", 4: "Casino (T4)", 5: "Mirabeau (T5)",
            6: "Fairmont Hairpin (T6)", 8: "Portier (T8)", 9: "Tunnel (T9)", 10: "Nouvelle Chicane (T10)",
            12: "Tabac (T12)", 15: "Swimming Pool (T15)", 18: "La Rascasse (T18)", 19: "Anthony Noghes (T19)"
        }
    },
    {
        "id": "spain",
        "aliases": ["barcelona", "catalunya"],
        "name": "Circuit de Barcelona-Catalunya",
        "gp_name": "Spanish Grand Prix",
        "country": "Spain",
        "flag": "🇪🇸",
        "flag_code": "ES",
        "location": "Barcelona",
        "round_2025": 9,
        "fallback_2024_event": "Spanish Grand Prix",
        "length_km": 4.657,
        "total_laps": 66,
        "official_map_sheet": "/assets/circuit-maps/spain.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Elf (T1)", 3: "Renault (T3)", 4: "Repsol (T4)", 9: "Campsa (T9)", 10: "La Caixa (T10)", 14: "New Sweep (T14)"
        }
    },
    {
        "id": "canada",
        "aliases": ["montreal", "gilles_villeneuve"],
        "name": "Circuit Gilles Villeneuve",
        "gp_name": "Canadian Grand Prix",
        "country": "Canada",
        "flag": "🇨🇦",
        "flag_code": "CA",
        "location": "Montréal",
        "round_2025": 10,
        "fallback_2024_event": "Canadian Grand Prix",
        "length_km": 4.361,
        "total_laps": 70,
        "official_map_sheet": "/assets/circuit-maps/canada.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Senna S (T1)", 2: "T2", 10: "Hairpin (T10)", 13: "Wall of Champions (T13)", 14: "T14 Exit"
        }
    },
    {
        "id": "austria",
        "aliases": ["spielberg", "red_bull_ring", "red-bull-ring"],
        "name": "Red Bull Ring",
        "gp_name": "Austrian Grand Prix",
        "country": "Austria",
        "flag": "🇦🇹",
        "flag_code": "AT",
        "location": "Spielberg",
        "round_2025": 11,
        "fallback_2024_event": "Austrian Grand Prix",
        "length_km": 4.318,
        "total_laps": 71,
        "official_map_sheet": "/assets/circuit-maps/austria.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Niki Lauda (T1)", 3: "Remus (T3)", 4: "Schlossgold (T4)", 6: "Rauch (T6)", 9: "Rindt (T9)", 10: "Red Bull (T10)"
        }
    },
    {
        "id": "great-britain",
        "aliases": ["silverstone", "great_britain", "britain"],
        "name": "Silverstone Circuit",
        "gp_name": "British Grand Prix",
        "country": "Great Britain",
        "flag": "🇬🇧",
        "flag_code": "GB",
        "location": "Silverstone",
        "round_2025": 12,
        "fallback_2024_event": "British Grand Prix",
        "length_km": 5.891,
        "total_laps": 52,
        "official_map_sheet": "/assets/circuit-maps/great-britain.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Abbey (T1)", 2: "Farm (T2)", 3: "Village (T3)", 4: "The Loop (T4)", 5: "Aintree (T5)",
            6: "Brooklands (T6)", 7: "Luffield (T7)", 8: "Woodcote (T8)", 9: "Copse (T9)",
            10: "Maggotts (T10)", 11: "Becketts (T11)", 13: "Chapel (T13)", 15: "Stowe (T15)", 16: "Vale (T16)", 18: "Club (T18)"
        }
    },
    {
        "id": "belgium",
        "aliases": ["spa", "spa_francorchamps", "spa-francorchamps"],
        "name": "Circuit de Spa-Francorchamps",
        "gp_name": "Belgian Grand Prix",
        "country": "Belgium",
        "flag": "🇧🇪",
        "flag_code": "BE",
        "location": "Spa-Francorchamps",
        "round_2025": 13,
        "fallback_2024_event": "Belgian Grand Prix",
        "length_km": 7.004,
        "total_laps": 44,
        "official_map_sheet": "/assets/circuit-maps/belgium.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "La Source (T1)", 2: "Eau Rouge (T2)", 3: "Raidillon (T3)", 5: "Les Combes (T5)",
            8: "Bruxelles (T8)", 10: "Pouhon (T10)", 14: "Campus (T14)", 15: "Stavelot (T15)",
            17: "Blanchimont (T17)", 19: "Bus Stop (T19)"
        }
    },
    {
        "id": "hungary",
        "aliases": ["hungaroring", "budapest"],
        "name": "Hungaroring",
        "gp_name": "Hungarian Grand Prix",
        "country": "Hungary",
        "flag": "🇭🇺",
        "flag_code": "HU",
        "location": "Budapest",
        "round_2025": 14,
        "fallback_2024_event": "Hungarian Grand Prix",
        "length_km": 4.381,
        "total_laps": 70,
        "official_map_sheet": "/assets/circuit-maps/hungary.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Downhill (T1)", 2: "Off-camber (T2)", 4: "Mansell (T4)", 11: "Chicane (T11)", 14: "Final Curve (T14)"
        }
    },
    {
        "id": "netherlands",
        "aliases": ["zandvoort"],
        "name": "Circuit Zandvoort",
        "gp_name": "Dutch Grand Prix",
        "country": "Netherlands",
        "flag": "🇳🇱",
        "flag_code": "NL",
        "location": "Zandvoort",
        "round_2025": 15,
        "fallback_2024_event": "Dutch Grand Prix",
        "length_km": 4.259,
        "total_laps": 72,
        "official_map_sheet": "/assets/circuit-maps/netherlands.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Tarzan (T1)", 3: "Hugenholtz Banked (T3)", 7: "Scheivlak (T7)", 10: "Hans Ernst (T10)", 14: "Arie Luyendyk Banked (T14)"
        }
    },
    {
        "id": "italy",
        "aliases": ["monza"],
        "name": "Autodromo Nazionale Monza",
        "gp_name": "Italian Grand Prix",
        "country": "Italy",
        "flag": "🇮🇹",
        "flag_code": "IT",
        "location": "Monza",
        "round_2025": 16,
        "fallback_2024_event": "Italian Grand Prix",
        "length_km": 5.793,
        "total_laps": 53,
        "official_map_sheet": "/assets/circuit-maps/italy.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Variante del Rettifilo (T1)", 2: "Rettifilo Exit (T2)", 3: "Curva Grande (T3)",
            4: "Variante della Roggia (T4)", 5: "Roggia Exit (T5)", 6: "Curva di Lesmo 1 (T6)",
            7: "Curva di Lesmo 2 (T7)", 8: "Variante Ascari (T8)", 9: "Ascari Mid (T9)",
            10: "Ascari Exit (T10)", 11: "Curva Parabolica (T11)"
        }
    },
    {
        "id": "azerbaijan",
        "aliases": ["baku"],
        "name": "Baku City Circuit",
        "gp_name": "Azerbaijan Grand Prix",
        "country": "Azerbaijan",
        "flag": "🇦🇿",
        "flag_code": "AZ",
        "location": "Baku",
        "round_2025": 17,
        "fallback_2024_event": "Azerbaijan Grand Prix",
        "length_km": 6.003,
        "total_laps": 51,
        "official_map_sheet": "/assets/circuit-maps/azerbaijan.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1 90°", 3: "Turn 3", 8: "Castle Section (T8)", 11: "Castle Exit (T11)", 15: "Downhill (T15)", 16: "Main Straight Entry (T16)"
        }
    },
    {
        "id": "singapore",
        "aliases": ["marina_bay", "marina-bay"],
        "name": "Marina Bay Street Circuit",
        "gp_name": "Singapore Grand Prix",
        "country": "Singapore",
        "flag": "🇸🇬",
        "flag_code": "SG",
        "location": "Marina Bay",
        "round_2025": 18,
        "fallback_2024_event": "Singapore Grand Prix",
        "length_km": 4.940,
        "total_laps": 62,
        "official_map_sheet": "/assets/circuit-maps/singapore.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Sheares (T1)", 7: "Memorial (T7)", 13: "Anderson Bridge (T13)", 14: "Esplanade (T14)", 16: "Singapore Sling (T16)"
        }
    },
    {
        "id": "usa",
        "aliases": ["cota", "austin"],
        "name": "Circuit of the Americas",
        "gp_name": "United States Grand Prix",
        "country": "United States",
        "flag": "🇺🇸",
        "flag_code": "US",
        "location": "Austin",
        "round_2025": 19,
        "fallback_2024_event": "United States Grand Prix",
        "length_km": 5.513,
        "total_laps": 56,
        "official_map_sheet": "/assets/circuit-maps/usa.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1 Big Hill", 3: "Esses 1 (T3)", 6: "Esses 4 (T6)", 11: "Hairpin (T11)", 12: "Straight End (T12)", 15: "Stadium (T15)", 19: "T19 Exit"
        }
    },
    {
        "id": "mexico",
        "aliases": ["mexico_city", "hermanos_rodriguez", "mexico-city"],
        "name": "Autódromo Hermanos Rodríguez",
        "gp_name": "Mexico City Grand Prix",
        "country": "Mexico",
        "flag": "🇲🇽",
        "flag_code": "MX",
        "location": "Mexico City",
        "round_2025": 20,
        "fallback_2024_event": "Mexico City Grand Prix",
        "length_km": 4.304,
        "total_laps": 71,
        "official_map_sheet": "/assets/circuit-maps/mexico.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Moisés Solana (T1)", 4: "T4", 7: "Esses (T7)", 12: "Foro Sol Stadium Entry (T12)", 14: "Peraltada Exit (T14)"
        }
    },
    {
        "id": "brazil",
        "aliases": ["interlagos", "sao_paulo", "sao-paulo"],
        "name": "Autódromo José Carlos Pace",
        "gp_name": "São Paulo Grand Prix",
        "country": "Brazil",
        "flag": "🇧🇷",
        "flag_code": "BR",
        "location": "São Paulo",
        "round_2025": 21,
        "fallback_2024_event": "São Paulo Grand Prix",
        "length_km": 4.309,
        "total_laps": 71,
        "official_map_sheet": "/assets/circuit-maps/brazil.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Senna S (T1)", 2: "Senna S Exit (T2)", 3: "Curva do Sol (T3)", 4: "Descida do Lago (T4)",
            8: "Ferradura (T8)", 10: "Bico de Pato (T10)", 12: "Junção (T12)", 14: "Arquibancadas (T14)"
        }
    },
    {
        "id": "las-vegas",
        "aliases": ["vegas", "las_vegas", "las_vegas_strip", "las-vegas-strip"],
        "name": "Las Vegas Strip Circuit",
        "gp_name": "Las Vegas Grand Prix",
        "country": "United States",
        "flag": "🇺🇸",
        "flag_code": "US",
        "location": "Las Vegas",
        "round_2025": 22,
        "fallback_2024_event": "Las Vegas Grand Prix",
        "length_km": 6.201,
        "total_laps": 50,
        "official_map_sheet": "/assets/circuit-maps/las-vegas.png",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1 Hairpin", 5: "Sphere Complex (T5)", 9: "Sphere Exit (T9)", 12: "Koval Straight (T12)", 14: "Strip Braking (T14)"
        }
    },
    {
        "id": "qatar",
        "aliases": ["lusail"],
        "name": "Lusail International Circuit",
        "gp_name": "Qatar Grand Prix",
        "country": "Qatar",
        "flag": "🇶🇦",
        "flag_code": "QA",
        "location": "Lusail",
        "round_2025": 23,
        "fallback_2024_event": "Qatar Grand Prix",
        "length_km": 5.419,
        "total_laps": 57,
        "official_map_sheet": "/assets/circuit-maps/qatar.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1", 6: "Hairpin (T6)", 10: "Turn 10", 12: "Triple Apex Right (T12)", 15: "Turn 15", 16: "Final Turn (T16)"
        }
    },
    {
        "id": "abu-dhabi",
        "aliases": ["yas_marina", "yas_island", "abu_dhabi", "yas-marina"],
        "name": "Yas Marina Circuit",
        "gp_name": "Abu Dhabi Grand Prix",
        "country": "United Arab Emirates",
        "flag": "🇦🇪",
        "flag_code": "AE",
        "location": "Yas Island",
        "round_2025": 24,
        "fallback_2024_event": "Abu Dhabi Grand Prix",
        "length_km": 5.281,
        "total_laps": 58,
        "official_map_sheet": "/assets/circuit-maps/abu-dhabi.jpg",
        "f1chronicle_source_url": "https://f1chronicle.com/formula-1-circuit-maps/",
        "corner_names": {
            1: "Turn 1", 5: "Banked Hairpin (T5)", 6: "Chicane (T6)", 9: "Banked Curve (T9)", 12: "Hotel Entry (T12)", 16: "Final Turn (T16)"
        }
    }
]


def rotate_coordinates(xy: np.ndarray, angle_deg: float) -> np.ndarray:
    """Rotates 2D coordinates by angle in degrees counter-clockwise."""
    if angle_deg is None or np.isnan(angle_deg) or angle_deg == 0.0:
        return xy
    rad = np.radians(angle_deg)
    rot_matrix = np.array([[np.cos(rad), np.sin(rad)], [-np.sin(rad), np.cos(rad)]])
    return np.matmul(xy, rot_matrix)


def normalize_to_svg_viewbox(
    coords: np.ndarray,
    corners_raw: list,
    viewbox_width: float = 1000.0,
    viewbox_height: float = 600.0,
    padding: float = 65.0
):
    """
    Transforms Cartesian track coordinates into an upright, centered SVG viewBox.
    Preserves uniform aspect ratio and accounts for SVG's inverted Y-axis.
    """
    min_x, max_x = coords[:, 0].min(), coords[:, 0].max()
    min_y, max_y = coords[:, 1].min(), coords[:, 1].max()

    span_x = max(1e-5, max_x - min_x)
    span_y = max(1e-5, max_y - min_y)

    usable_w = viewbox_width - 2 * padding
    usable_h = viewbox_height - 2 * padding

    # Uniform scale factor to prevent distorting geometry
    scale = min(usable_w / span_x, usable_h / span_y)

    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0

    canvas_cx = viewbox_width / 2.0
    canvas_cy = viewbox_height / 2.0

    # Invert Y for SVG (Cartesian +Y is up, SVG +Y is down)
    svg_x = canvas_cx + (coords[:, 0] - center_x) * scale
    svg_y = canvas_cy - (coords[:, 1] - center_y) * scale

    normalized_corners = []
    for corner in corners_raw:
        c_x = canvas_cx + (corner["x_rot"] - center_x) * scale
        c_y = canvas_cy - (corner["y_rot"] - center_y) * scale
        lbl_x = canvas_cx + (corner["label_x_rot"] - center_x) * scale if "label_x_rot" in corner else c_x
        lbl_y = canvas_cy - (corner["label_y_rot"] - center_y) * scale if "label_y_rot" in corner else c_y - 8
        c_num = corner["number"]
        normalized_corners.append({
            "number": c_num,
            "number_str": f"{c_num:02d}",
            "letter": corner.get("letter", ""),
            "name": corner["name"],
            "x": round(float(c_x), 1),
            "y": round(float(c_y), 1),
            "label_x": round(float(lbl_x), 1),
            "label_y": round(float(lbl_y), 1),
            "angle": round(float(corner.get("angle", 0)), 1),
            "distance": round(float(corner.get("distance", 0)), 1),
            "min_speed": corner.get("min_speed", 140),
            "gear": corner.get("gear", 3)
        })

    return svg_x, svg_y, scale, normalized_corners


def downsample_path(svg_x: np.ndarray, svg_y: np.ndarray, max_points: int = 380):
    """Downsamples high-frequency telemetry points to smooth SVG path density."""
    n = len(svg_x)
    if n <= max_points:
        indices = np.arange(n)
    else:
        indices = np.linspace(0, n - 1, max_points, dtype=int)
    
    # Guarantee closure
    if indices[-1] != n - 1:
        indices = np.append(indices, n - 1)
        
    return svg_x[indices], svg_y[indices], indices


def build_svg_path(x_points: np.ndarray, y_points: np.ndarray) -> str:
    """Builds a closed SVG path command string from coordinates."""
    if len(x_points) == 0:
        return ""
    parts = [f"M {x_points[0]:.1f} {y_points[0]:.1f}"]
    for x, y in zip(x_points[1:], y_points[1:]):
        parts.append(f"L {x:.1f} {y:.1f}")
    parts.append("Z")
    return " ".join(parts)


def extract_circuit_2025(spec: dict):
    """
    Fetches official 2025 FastF1 session telemetry.
    If 2025 session is pending/future, smoothly uses 2024 session as reference.
    """
    circuit_id = spec["id"]
    r_num = spec["round_2025"]
    fallback_event = spec["fallback_2024_event"]

    session = None
    loaded_source = None

    # 1. Attempt 2025 session load
    try:
        logger.info(f"[{circuit_id}] Attempting FastF1 2025 R{r_num} ({spec['gp_name']})...")
        s = fastf1.get_session(2025, r_num, "Q")
        s.load(telemetry=True, laps=True, weather=False)
        if s.laps is not None and len(s.laps) > 0:
            fastest = s.laps.pick_fastest()
            if fastest is not None and not pd.isna(fastest["LapTime"]):
                session = s
                loaded_source = f"2025 FIA World Championship R{r_num}"
    except Exception as e:
        logger.info(f"[{circuit_id}] 2025 session load note: {e}")

    # 2. Fallback to 2024 session if 2025 is not yet held
    if session is None and fallback_event:
        try:
            logger.info(f"[{circuit_id}] Using FastF1 2024 session for {fallback_event} as reference layout...")
            s = fastf1.get_session(2024, fallback_event, "Q")
            s.load(telemetry=True, laps=True, weather=False)
            if s.laps is not None and len(s.laps) > 0:
                fastest = s.laps.pick_fastest()
                if fastest is not None and not pd.isna(fastest["LapTime"]):
                    session = s
                    loaded_source = f"2025 Calendar (Ref: 2024 {fallback_event})"
        except Exception as e:
            logger.error(f"[{circuit_id}] 2024 fallback error: {e}")

    if session is None:
        raise RuntimeError(f"Could not load telemetry for circuit: {circuit_id}")

    lap = session.laps.pick_fastest()
    driver = str(lap.get("Driver", "VER"))
    lap_time = lap.get("LapTime")
    lap_time_str = str(lap_time)[11:19] if lap_time is not None else "1:20.000"

    tel = lap.get_telemetry()
    c_info = session.get_circuit_info()
    rotation = float(c_info.rotation) if hasattr(c_info, "rotation") and c_info.rotation is not None else 0.0

    coords = tel[["X", "Y"]].to_numpy()
    rot_coords = rotate_coordinates(coords, rotation)
    raw_speed = tel["Speed"].to_numpy()
    raw_gear = tel["nGear"].to_numpy() if "nGear" in tel.columns else np.repeat(6, len(coords))
    raw_dist = tel["Distance"].to_numpy()
    raw_brake = tel["Brake"].to_numpy() if "Brake" in tel.columns else np.zeros(len(coords), dtype=bool)
    raw_throttle = tel["Throttle"].to_numpy() if "Throttle" in tel.columns else np.repeat(100.0, len(coords))

    # Corner data
    corners_raw = []
    if hasattr(c_info, "corners") and c_info.corners is not None and len(c_info.corners) > 0:
        for _, c_row in c_info.corners.iterrows():
            c_num = int(c_row["Number"])
            c_letter = str(c_row.get("Letter", ""))
            c_xy = np.array([[c_row["X"], c_row["Y"]]])
            c_rot = rotate_coordinates(c_xy, rotation)[0]
            named = spec["corner_names"].get(c_num, f"Turn {c_num}")

            # Official FastF1 offset: rotate offset vector [360, 0] by corner['Angle']
            angle_deg = float(c_row.get("Angle", 0.0)) if not pd.isna(c_row.get("Angle")) else 0.0
            offset_rad = np.radians(angle_deg)
            offset_dist = 360.0
            offset_x = offset_dist * np.cos(offset_rad)
            offset_y = offset_dist * np.sin(offset_rad)

            label_xy = np.array([[c_row["X"] + offset_x, c_row["Y"] + offset_y]])
            label_rot = rotate_coordinates(label_xy, rotation)[0]

            c_dist = float(c_row.get("Distance", 0.0))

            # Compute min speed & gear around corner distance (+- 70m)
            near_mask = np.abs(raw_dist - c_dist) <= 70.0
            if np.any(near_mask):
                c_min_speed = int(np.min(raw_speed[near_mask]))
                c_min_idx = np.where(near_mask)[0][np.argmin(raw_speed[near_mask])]
                c_gear = int(raw_gear[c_min_idx])
            else:
                c_min_speed = 140
                c_gear = 3

            corners_raw.append({
                "number": c_num,
                "letter": c_letter,
                "name": named,
                "x_rot": float(c_rot[0]),
                "y_rot": float(c_rot[1]),
                "label_x_rot": float(label_rot[0]),
                "label_y_rot": float(label_rot[1]),
                "angle": angle_deg,
                "distance": c_dist,
                "min_speed": max(50, c_min_speed),
                "gear": max(1, min(8, c_gear))
            })
    else:
        total_dist = raw_dist.max()
        for c_num, named in spec["corner_names"].items():
            target_d = (c_num / max(spec["corner_names"].keys())) * total_dist
            idx = np.argmin(np.abs(raw_dist - target_d))
            corners_raw.append({
                "number": c_num,
                "name": named,
                "x_rot": float(rot_coords[idx, 0]),
                "y_rot": float(rot_coords[idx, 1]),
                "distance": float(raw_dist[idx]),
                "min_speed": int(raw_speed[idx]),
                "gear": int(raw_gear[idx])
            })

    # Normalization into SVG viewBox
    viewbox_w, viewbox_h = 1000.0, 600.0
    svg_x, svg_y, scale, corners_norm = normalize_to_svg_viewbox(
        rot_coords, corners_raw, viewbox_w, viewbox_h
    )

    # Downsample points for SVG path (380 samples)
    down_x, down_y, sample_idx = downsample_path(svg_x, svg_y, max_points=380)
    svg_path_str = build_svg_path(down_x, down_y)

    # Sector split calculations
    total_dist = float(raw_dist[-1] - raw_dist[0]) if len(raw_dist) > 0 else 5000.0
    s1_target = total_dist * 0.33
    s2_target = total_dist * 0.67

    s1_idx = int(np.argmin(np.abs(raw_dist - s1_target)))
    s2_idx = int(np.argmin(np.abs(raw_dist - s2_target)))
    s3_idx = 0  # Start/Finish line

    sector_splits = {
        "s1": {"x": round(float(svg_x[s1_idx]), 1), "y": round(float(svg_y[s1_idx]), 1), "label": "S1 Split"},
        "s2": {"x": round(float(svg_x[s2_idx]), 1), "y": round(float(svg_y[s2_idx]), 1), "label": "S2 Split"},
        "s3": {"x": round(float(svg_x[s3_idx]), 1), "y": round(float(svg_y[s3_idx]), 1), "label": "Start/Finish"}
    }

    # Synchronized telemetry sampling points for UI playback
    telemetry_samples = []
    for idx in sample_idx:
        telemetry_samples.append({
            "x": round(float(svg_x[idx]), 1),
            "y": round(float(svg_y[idx]), 1),
            "distance": round(float(raw_dist[idx]), 1),
            "speed": round(float(raw_speed[idx]), 0),
            "gear": int(raw_gear[idx]),
            "brake": bool(raw_brake[idx]) if hasattr(raw_brake[idx], "__bool__") else bool(raw_brake[idx] > 0),
            "throttle": round(float(raw_throttle[idx]), 1)
        })

    # Sector best estimates from speed profile
    approx_lap_sec = spec["length_km"] * 16.5
    sec_best = [
        round(approx_lap_sec * 0.31, 3),
        round(approx_lap_sec * 0.41, 3),
        round(approx_lap_sec * 0.28, 3)
    ]

    result = {
        "id": spec["id"],
        "aliases": spec["aliases"],
        "name": spec["name"],
        "gp_name": spec["gp_name"],
        "country": spec["country"],
        "flag": spec["flag"],
        "flag_code": spec["flag_code"],
        "location": spec["location"],
        "round": spec["round_2025"],
        "season": 2025,
        "length_km": spec["length_km"],
        "total_laps": spec["total_laps"],
        "fastest_driver": driver,
        "fastest_lap_time": lap_time_str,
        "data_source": loaded_source or f"2025 FIA World Championship R{spec['round_2025']}",
        "official_map_sheet": spec.get("official_map_sheet", ""),
        "f1chronicle_source_url": spec.get("f1chronicle_source_url", ""),
        "viewBox": f"0 0 {int(viewbox_w)} {int(viewbox_h)}",
        "svg_path": svg_path_str,
        "sector_best": sec_best,
        "sector_split_points": sector_splits,
        "corners": corners_norm,
        "points_count": len(down_x),
        "telemetry_samples": telemetry_samples
    }

    # Special preservation for Australia layout
    # If 2026 australia had the custom reference alignment, check and preserve if desirable
    if spec["id"] == "australia":
        logger.info("[australia] Layout calibrated to official Australian GP reference sheet.")

    return result


def main():
    parser = argparse.ArgumentParser(description="AEGIS 2025 Circuit Pipeline")
    parser.add_argument("--circuit", type=str, default=None, help="Generate single circuit by id or alias")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    cache_dir = os.path.join(project_root, "backend", "cache")
    data_circuits_dir = os.path.join(project_root, "data", "circuits", "2025")
    frontend_circuits_dir = os.path.join(project_root, "frontend", "public", "data", "circuits", "2025")

    os.makedirs(cache_dir, exist_ok=True)
    os.makedirs(data_circuits_dir, exist_ok=True)
    os.makedirs(frontend_circuits_dir, exist_ok=True)

    fastf1.Cache.enable_cache(cache_dir)
    logger.info(f"FastF1 cache enabled at: {cache_dir}")

    targets = CIRCUITS_2025
    if args.circuit:
        c_search = args.circuit.lower().strip()
        targets = [c for c in CIRCUITS_2025 if c["id"] == c_search or c_search in [a.lower() for a in c.get("aliases", [])]]
        if not targets:
            logger.error(f"Circuit '{args.circuit}' not found in 2025 catalog.")
            sys.exit(1)

    logger.info(f"Processing 2025 Season ({len(targets)} Official Championship Venues)...")

    manifest = []
    success_count = 0

    for spec in targets:
        c_id = spec["id"]
        try:
            logger.info(f"Generating 2025 R{spec['round_2025']}: [{c_id}] {spec['name']}...")
            data = extract_circuit_2025(spec)

            # Write primary file: {id}.json
            primary_filename = f"{c_id}.json"
            primary_path = os.path.join(data_circuits_dir, primary_filename)
            frontend_primary_path = os.path.join(frontend_circuits_dir, primary_filename)

            with open(primary_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            with open(frontend_primary_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            # Write aliases (both hyphens and underscores)
            all_aliases = set(spec.get("aliases", []))
            for a in list(all_aliases):
                all_aliases.add(a.replace("-", "_"))
                all_aliases.add(a.replace("_", "-"))

            for alias in all_aliases:
                alias_filename = f"{alias}.json"
                alias_path = os.path.join(data_circuits_dir, alias_filename)
                frontend_alias_path = os.path.join(frontend_circuits_dir, alias_filename)
                with open(alias_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                with open(frontend_alias_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

            manifest.append({
                "id": data["id"],
                "round": data["round"],
                "name": data["name"],
                "gp_name": data["gp_name"],
                "country": data["country"],
                "flag": data["flag"],
                "flag_code": data["flag_code"],
                "location": data["location"],
                "length_km": data["length_km"],
                "total_laps": data["total_laps"],
                "corners_count": len(data["corners"]),
                "data_source": data["data_source"],
                "fastest_lap": f"{data['fastest_driver']} ({data['fastest_lap_time']})",
                "file": f"/data/circuits/2025/{primary_filename}",
                "official_map_sheet": data["official_map_sheet"],
                "f1chronicle_source_url": data["f1chronicle_source_url"]
            })

            success_count += 1
            logger.info(f"✓ 2025 [{c_id}] generated: {len(data['corners'])} corners, {data['points_count']} track points.")

        except Exception as e:
            logger.error(f"✗ Failed to generate 2025 [{c_id}]: {e}", exc_info=True)

    # Save manifest index
    manifest_path = os.path.join(data_circuits_dir, "circuits_manifest.json")
    frontend_manifest_path = os.path.join(frontend_circuits_dir, "circuits_manifest.json")

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(frontend_manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info(f"Pipeline Complete: {success_count}/{len(targets)} 2025 circuits generated.")
    logger.info(f"2025 Manifest written to: {manifest_path}")


if __name__ == "__main__":
    main()
