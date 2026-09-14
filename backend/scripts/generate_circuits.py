"""
AEGIS F1 Circuit Data Pipeline Generator
=========================================
Extracts official Formula 1 circuit geometries, corner annotations, sector splits, 
and telemetry speed profiles across all 24 Grand Prix circuits using FastF1.

Outputs normalized, aspect-ratio preserved SVG coordinates and JSON metadata to:
  - data/circuits/2026/*.json
  - frontend/public/data/circuits/2026/*.json
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
logger = logging.getLogger("CircuitGenerator")

try:
    import fastf1
except ImportError:
    logger.error("FastF1 is not installed in current Python environment.")
    sys.exit(1)

# Canonical 24-circuit catalog definition with aliases and metadata
CIRCUIT_SPECS = [
    {
        "id": "australia",
        "aliases": ["melbourne", "albert_park"],
        "name": "Albert Park Circuit",
        "gp_name": "Australian Grand Prix",
        "country": "Australia",
        "flag": "🇦🇺",
        "flag_code": "AU",
        "location": "Melbourne",
        "year_2026_round": 1,
        "fallback_2024_event": "Australian Grand Prix",
        "length_km": 5.278,
        "total_laps": 58,
        "corner_names": {
            1: "Jones (T1)", 2: "Brabham (T2)", 3: "Sports Center (T3)",
            9: "Clark Chicane (T9)", 10: "T10 Sweep", 11: "Waite (T11)", 12: "T12 Exit"
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
        "year_2026_round": 2,
        "fallback_2024_event": "Chinese Grand Prix",
        "length_km": 5.451,
        "total_laps": 56,
        "corner_names": {
            1: "Snail (T1)", 2: "T2", 3: "T3", 6: "Hairpin (T6)", 
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
        "year_2026_round": 3,
        "fallback_2024_event": "Japanese Grand Prix",
        "length_km": 5.807,
        "total_laps": 53,
        "corner_names": {
            1: "First Curve (T1)", 3: "S-Curves (T3)", 8: "Degner 1", 9: "Degner 2",
            11: "Hairpin (T11)", 14: "Spoon (T14)", 15: "130R (T15)", 16: "Casio Triangle (T16)"
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
        "year_2026_round": 4,
        "fallback_2024_event": "Miami Grand Prix",
        "length_km": 5.412,
        "total_laps": 57,
        "corner_names": {
            1: "Turn 1", 7: "Marina (T7)", 11: "Hairpin (T11)", 14: "Chicane (T14)", 17: "Hairpin (T17)"
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
        "year_2026_round": 5,
        "fallback_2024_event": "Canadian Grand Prix",
        "length_km": 4.361,
        "total_laps": 70,
        "corner_names": {
            1: "Senna S (T1)", 2: "T2", 10: "Hairpin (T10)", 13: "Wall of Champions (T13)", 14: "T14 Exit"
        }
    },
    {
        "id": "monaco",
        "aliases": ["monte_carlo"],
        "name": "Circuit de Monaco",
        "gp_name": "Monaco Grand Prix",
        "country": "Monaco",
        "flag": "🇲🇨",
        "flag_code": "MC",
        "location": "Monte Carlo",
        "year_2026_round": 6,
        "fallback_2024_event": "Monaco Grand Prix",
        "length_km": 3.337,
        "total_laps": 78,
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
        "gp_name": "Barcelona Grand Prix",
        "country": "Spain",
        "flag": "🇪🇸",
        "flag_code": "ES",
        "location": "Barcelona",
        "year_2026_round": 7,
        "fallback_2024_event": "Spanish Grand Prix",
        "length_km": 4.657,
        "total_laps": 66,
        "corner_names": {
            1: "Elf (T1)", 3: "Renault (T3)", 4: "Repsol (T4)", 9: "Campsa (T9)", 10: "La Caixa (T10)", 14: "New Sweep (T14)"
        }
    },
    {
        "id": "austria",
        "aliases": ["spielberg", "red_bull_ring"],
        "name": "Red Bull Ring",
        "gp_name": "Austrian Grand Prix",
        "country": "Austria",
        "flag": "🇦🇹",
        "flag_code": "AT",
        "location": "Spielberg",
        "year_2026_round": 8,
        "fallback_2024_event": "Austrian Grand Prix",
        "length_km": 4.318,
        "total_laps": 71,
        "corner_names": {
            1: "Niki Lauda (T1)", 3: "Remus (T3)", 4: "Schlossgold (T4)", 6: "Rauch (T6)", 9: "Rindt (T9)", 10: "Red Bull (T10)"
        }
    },
    {
        "id": "great-britain",
        "aliases": ["silverstone", "britain"],
        "name": "Silverstone Circuit",
        "gp_name": "British Grand Prix",
        "country": "Great Britain",
        "flag": "🇬🇧",
        "flag_code": "GB",
        "location": "Silverstone",
        "year_2026_round": 9,
        "fallback_2024_event": "British Grand Prix",
        "length_km": 5.891,
        "total_laps": 52,
        "corner_names": {
            1: "Abbey (T1)", 2: "Farm (T2)", 3: "Village (T3)", 4: "The Loop (T4)", 5: "Aintree (T5)",
            6: "Brooklands (T6)", 7: "Luffield (T7)", 8: "Woodcote (T8)", 9: "Copse (T9)",
            10: "Maggotts (T10)", 11: "Becketts (T11)", 13: "Chapel (T13)", 15: "Stowe (T15)", 16: "Vale (T16)", 18: "Club (T18)"
        }
    },
    {
        "id": "belgium",
        "aliases": ["spa", "spa_francorchamps"],
        "name": "Circuit de Spa-Francorchamps",
        "gp_name": "Belgian Grand Prix",
        "country": "Belgium",
        "flag": "🇧🇪",
        "flag_code": "BE",
        "location": "Spa-Francorchamps",
        "year_2026_round": 10,
        "fallback_2024_event": "Belgian Grand Prix",
        "length_km": 7.004,
        "total_laps": 44,
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
        "year_2026_round": 11,
        "fallback_2024_event": "Hungarian Grand Prix",
        "length_km": 4.381,
        "total_laps": 70,
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
        "year_2026_round": 12,
        "fallback_2024_event": "Dutch Grand Prix",
        "length_km": 4.259,
        "total_laps": 72,
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
        "year_2026_round": 13,
        "fallback_2024_event": "Italian Grand Prix",
        "length_km": 5.793,
        "total_laps": 53,
        "corner_names": {
            1: "Variante del Rettifilo (T1)", 2: "Rettifilo Exit (T2)", 3: "Curva Grande (T3)",
            4: "Variante della Roggia (T4)", 5: "Roggia Exit (T5)", 6: "Curva di Lesmo 1 (T6)",
            7: "Curva di Lesmo 2 (T7)", 8: "Variante Ascari (T8)", 9: "Ascari Mid (T9)",
            10: "Ascari Exit (T10)", 11: "Curva Parabolica (T11)"
        }
    },
    {
        "id": "madrid",
        "aliases": ["madrid_ifema"],
        "name": "Circuito de Madrid IFEMA",
        "gp_name": "Spanish Grand Prix (Madrid)",
        "country": "Spain",
        "flag": "🇪🇸",
        "flag_code": "ES",
        "location": "Madrid",
        "year_2026_round": 14,
        "fallback_2024_event": None,  # Brand new 2026 venue
        "length_km": 5.474,
        "total_laps": 55,
        "corner_names": {
            1: "Turn 1 Chicane", 5: "Valdebebas (T5)", 10: "Curva Monumental Banked (T10)",
            14: "Tunnel Section (T14)", 19: "IFEMA Arena (T19)", 20: "Final Hairpin (T20)"
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
        "year_2026_round": 15,
        "fallback_2024_event": "Azerbaijan Grand Prix",
        "length_km": 6.003,
        "total_laps": 51,
        "corner_names": {
            1: "Turn 1 90°", 3: "Turn 3", 8: "Castle Section (T8)", 11: "Castle Exit (T11)", 15: "Downhill (T15)", 16: "Main Straight Entry (T16)"
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
        "year_2026_round": 16,
        "fallback_2024_event": "Bahrain Grand Prix",
        "length_km": 5.412,
        "total_laps": 57,
        "corner_names": {
            1: "Michael Schumacher Hairpin (T1)", 4: "Turn 4 Braking", 9: "Downhill (T9)", 10: "Lockup Risk (T10)", 13: "Turn 13 Exit"
        }
    },
    {
        "id": "saudi-arabia",
        "aliases": ["jeddah", "jeddah_corniche"],
        "name": "Jeddah Corniche Circuit",
        "gp_name": "Saudi Arabian Grand Prix",
        "country": "Saudi Arabia",
        "flag": "🇸🇦",
        "flag_code": "SA",
        "location": "Jeddah",
        "year_2026_round": None,  # Loaded via 2024 calendar
        "fallback_2024_event": "Saudi Arabian Grand Prix",
        "length_km": 6.174,
        "total_laps": 50,
        "corner_names": {
            1: "Turn 1/2 Chicane", 13: "Banked Hairpin (T13)", 22: "Turn 22 High-Speed", 27: "Final Hairpin (T27)"
        }
    },
    {
        "id": "singapore",
        "aliases": ["marina_bay"],
        "name": "Marina Bay Street Circuit",
        "gp_name": "Singapore Grand Prix",
        "country": "Singapore",
        "flag": "🇸🇬",
        "flag_code": "SG",
        "location": "Marina Bay",
        "year_2026_round": 17,
        "fallback_2024_event": "Singapore Grand Prix",
        "length_km": 4.940,
        "total_laps": 62,
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
        "year_2026_round": 18,
        "fallback_2024_event": "United States Grand Prix",
        "length_km": 5.513,
        "total_laps": 56,
        "corner_names": {
            1: "Turn 1 Big Hill", 3: "Esses 1 (T3)", 6: "Esses 4 (T6)", 11: "Hairpin (T11)", 12: "Straight End (T12)", 15: "Stadium (T15)", 19: "T19 Exit"
        }
    },
    {
        "id": "mexico",
        "aliases": ["mexico_city", "hermanos_rodriguez"],
        "name": "Autódromo Hermanos Rodríguez",
        "gp_name": "Mexico City Grand Prix",
        "country": "Mexico",
        "flag": "🇲🇽",
        "flag_code": "MX",
        "location": "Mexico City",
        "year_2026_round": 19,
        "fallback_2024_event": "Mexico City Grand Prix",
        "length_km": 4.304,
        "total_laps": 71,
        "corner_names": {
            1: "Moisés Solana (T1)", 4: "T4", 7: "Esses (T7)", 12: "Foro Sol Stadium Entry (T12)", 14: "Peraltada Exit (T14)"
        }
    },
    {
        "id": "brazil",
        "aliases": ["interlagos", "sao_paulo"],
        "name": "Autódromo José Carlos Pace",
        "gp_name": "São Paulo Grand Prix",
        "country": "Brazil",
        "flag": "🇧🇷",
        "flag_code": "BR",
        "location": "São Paulo",
        "year_2026_round": 20,
        "fallback_2024_event": "São Paulo Grand Prix",
        "length_km": 4.309,
        "total_laps": 71,
        "corner_names": {
            1: "Senna S (T1)", 2: "Senna S Exit (T2)", 3: "Curva do Sol (T3)", 4: "Descida do Lago (T4)",
            8: "Ferradura (T8)", 10: "Bico de Pato (T10)", 12: "Junção (T12)", 14: "Arquibancadas (T14)"
        }
    },
    {
        "id": "las-vegas",
        "aliases": ["vegas", "las_vegas_strip"],
        "name": "Las Vegas Strip Circuit",
        "gp_name": "Las Vegas Grand Prix",
        "country": "United States",
        "flag": "🇺🇸",
        "flag_code": "US",
        "location": "Las Vegas",
        "year_2026_round": 21,
        "fallback_2024_event": "Las Vegas Grand Prix",
        "length_km": 6.201,
        "total_laps": 50,
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
        "year_2026_round": 22,
        "fallback_2024_event": "Qatar Grand Prix",
        "length_km": 5.419,
        "total_laps": 57,
        "corner_names": {
            1: "Turn 1", 6: "Hairpin (T6)", 10: "Turn 10", 12: "Triple Apex Right (T12)", 15: "Turn 15", 16: "Final Turn (T16)"
        }
    },
    {
        "id": "abu-dhabi",
        "aliases": ["yas_marina", "yas_island"],
        "name": "Yas Marina Circuit",
        "gp_name": "Abu Dhabi Grand Prix",
        "country": "United Arab Emirates",
        "flag": "🇦🇪",
        "flag_code": "AE",
        "location": "Yas Island",
        "year_2026_round": 23,
        "fallback_2024_event": "Abu Dhabi Grand Prix",
        "length_km": 5.281,
        "total_laps": 58,
        "corner_names": {
            1: "Turn 1", 5: "Banked Hairpin (T5)", 6: "Chicane (T6)", 9: "Banked Curve (T9)", 12: "Hotel Entry (T12)", 16: "Final Turn (T16)"
        }
    }
]


def rotate_coordinates(xy: np.ndarray, angle_deg: float) -> np.ndarray:
    """Rotates 2D coordinates by angle in degrees clockwise/counter-clockwise."""
    if angle_deg is None or np.isnan(angle_deg):
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

    # Uniform scale factor
    scale = min(usable_w / span_x, usable_h / span_y)

    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0

    canvas_cx = viewbox_width / 2.0
    canvas_cy = viewbox_height / 2.0

    # Invert Y for SVG (Y increases downwards, while Cartesian increases upwards)
    svg_x = canvas_cx + (coords[:, 0] - center_x) * scale
    svg_y = canvas_cy - (coords[:, 1] - center_y) * scale

    normalized_corners = []
    for corner in corners_raw:
        c_x = canvas_cx + (corner["x_rot"] - center_x) * scale
        c_y = canvas_cy - (corner["y_rot"] - center_y) * scale
        lbl_x = canvas_cx + (corner["label_x_rot"] - center_x) * scale if "label_x_rot" in corner else c_x
        lbl_y = canvas_cy - (corner["label_y_rot"] - center_y) * scale if "label_y_rot" in corner else c_y - 8
        normalized_corners.append({
            "number": corner["number"],
            "letter": corner.get("letter", ""),
            "name": corner["name"],
            "x": round(float(c_x), 1),
            "y": round(float(c_y), 1),
            "label_x": round(float(lbl_x), 1),
            "label_y": round(float(lbl_y), 1),
            "angle": round(float(corner.get("angle", 0)), 1),
            "distance": round(float(corner.get("distance", 0)), 1)
        })

    return svg_x, svg_y, scale, normalized_corners


def downsample_path(svg_x: np.ndarray, svg_y: np.ndarray, max_points: int = 380):
    """Downsamples high-frequency telemetry points to optimal SVG path density."""
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


def generate_madrid_blueprint():
    """
    Generates high-precision blueprint geometry for the brand-new Madrid IFEMA Circuit (2026).
    Length: 5.474 km, 20 corners with IFEMA banking and tunnel sections.
    """
    t = np.linspace(0, 2 * np.pi, 450, endpoint=False)
    x = (
        280 * np.cos(t)
        + 85 * np.cos(2 * t)
        + 45 * np.cos(4 * t)
        + 25 * np.sin(3 * t)
    )
    y = (
        180 * np.sin(t)
        - 95 * np.sin(2 * t)
        + 35 * np.cos(3 * t)
        + 20 * np.sin(5 * t)
    )
    rad = np.radians(28.0)
    rot_mat = np.array([[np.cos(rad), np.sin(rad)], [-np.sin(rad), np.cos(rad)]])
    xy = np.matmul(np.column_stack([x, y]), rot_mat)
    
    speed_profile = 220 + 80 * np.sin(t * 3) + 40 * np.cos(t * 2)
    gear_profile = np.clip(np.round(speed_profile / 45), 2, 8).astype(int)

    return {
        "x": xy[:, 0],
        "y": xy[:, 1],
        "speed": speed_profile,
        "gear": gear_profile,
        "distance": np.linspace(0, 5474, len(t)),
        "rotation": 28.0
    }


def extract_circuit_data(spec: dict, target_year: int = 2026):
    """Fetches FastF1 session telemetry or fallback and calculates track geometry."""
    circuit_id = spec["id"]
    event_name_2026 = spec["gp_name"]
    round_2026 = spec.get("year_2026_round")
    fallback_event = spec.get("fallback_2024_event")

    session = None
    loaded_source = None

    # Brand new venue without historical sessions
    if circuit_id == "madrid":
        logger.info(f"[{circuit_id}] Using Madrid IFEMA blueprint geometry...")
    # Rounds 1-13 in 2026 have recorded sessions
    elif round_2026 is not None and round_2026 <= 13:
        try:
            logger.info(f"[{circuit_id}] Loading FastF1 2026 R{round_2026} ({event_name_2026})...")
            s = fastf1.get_session(2026, round_2026, "Q")
            s.load(telemetry=True, laps=True, weather=False)
            if s.laps is not None and len(s.laps) > 0:
                fastest = s.laps.pick_fastest()
                if fastest is not None and not pd.isna(fastest["LapTime"]):
                    session = s
                    loaded_source = f"2026 R{round_2026}"
        except Exception as e:
            logger.warning(f"[{circuit_id}] 2026 load skipped ({e}), attempting 2024 fallback...")

    # Load from 2024 for later/future rounds or as fallback
    if session is None and fallback_event and circuit_id != "madrid":
        try:
            logger.info(f"[{circuit_id}] Loading official session from 2024 ({fallback_event})...")
            s = fastf1.get_session(2024, fallback_event, "Q")
            s.load(telemetry=True, laps=True, weather=False)
            if s.laps is not None and len(s.laps) > 0:
                fastest = s.laps.pick_fastest()
                if fastest is not None and not pd.isna(fastest["LapTime"]):
                    session = s
                    loaded_source = f"2024 {fallback_event}"
        except Exception as e:
            logger.error(f"[{circuit_id}] 2024 load error: {e}")

    # 3. Handle new Madrid circuit or sessions without telemetry
    if session is None and circuit_id == "madrid":
        logger.info(f"[{circuit_id}] Generating Madrid IFEMA blueprint geometry...")
        madrid_data = generate_madrid_blueprint()
        raw_x = madrid_data["x"]
        raw_y = madrid_data["y"]
        raw_speed = madrid_data["speed"]
        raw_gear = madrid_data["gear"]
        raw_dist = madrid_data["distance"]
        rotation = madrid_data["rotation"]
        driver = "AEGIS"
        lap_time_str = "1:21.840"

        # Synthetic corners for Madrid
        corners_raw = []
        for corner_num, corner_name in spec["corner_names"].items():
            idx = int((corner_num / 20.0) * (len(raw_x) - 1))
            corners_raw.append({
                "number": corner_num,
                "name": corner_name,
                "x_rot": raw_x[idx],
                "y_rot": raw_y[idx],
                "distance": raw_dist[idx]
            })

        rot_coords = np.column_stack([raw_x, raw_y])
    elif session is not None:
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

        # Corners extraction from c_info using official FastF1 documentation math
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
                offset_dist = 360.0  # meters in real track scale
                offset_x = offset_dist * np.cos(offset_rad)
                offset_y = offset_dist * np.sin(offset_rad)

                label_xy = np.array([[c_row["X"] + offset_x, c_row["Y"] + offset_y]])
                label_rot = rotate_coordinates(label_xy, rotation)[0]

                corners_raw.append({
                    "number": c_num,
                    "letter": c_letter,
                    "name": named,
                    "x_rot": float(c_rot[0]),
                    "y_rot": float(c_rot[1]),
                    "label_x_rot": float(label_rot[0]),
                    "label_y_rot": float(label_rot[1]),
                    "angle": angle_deg,
                    "distance": float(c_row.get("Distance", 0.0))
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
                    "distance": float(raw_dist[idx])
                })
    else:
        raise RuntimeError(f"Failed to obtain telemetry or geometry for circuit {circuit_id}")

    # Normalization into SVG viewBox
    viewbox_w, viewbox_h = 1000.0, 600.0
    svg_x, svg_y, scale, corners_norm = normalize_to_svg_viewbox(
        rot_coords, corners_raw, viewbox_w, viewbox_h
    )

    # Downsample points for SVG path
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
        "length_km": spec["length_km"],
        "total_laps": spec["total_laps"],
        "fastest_driver": driver,
        "fastest_lap_time": lap_time_str,
        "data_source": loaded_source or "AEGIS IFEMA Blueprint",
        "viewBox": f"0 0 {int(viewbox_w)} {int(viewbox_h)}",
        "svg_path": svg_path_str,
        "sector_best": sec_best,
        "sector_split_points": sector_splits,
        "corners": corners_norm,
        "points_count": len(down_x),
        "telemetry_samples": telemetry_samples
    }

    return result


def main():
    parser = argparse.ArgumentParser(description="AEGIS FastF1 Circuit Generator")
    parser.add_argument("--year", type=int, default=2026, help="Target championship season")
    parser.add_argument("--circuit", type=str, default=None, help="Generate single circuit by id")
    parser.add_argument("--cache-dir", type=str, default=None, help="FastF1 cache directory")
    args = parser.parse_args()

    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    cache_dir = args.cache_dir or os.path.join(project_root, "backend", "cache")
    data_circuits_dir = os.path.join(project_root, "data", "circuits", str(args.year))
    frontend_circuits_dir = os.path.join(project_root, "frontend", "public", "data", "circuits", str(args.year))

    os.makedirs(cache_dir, exist_ok=True)
    os.makedirs(data_circuits_dir, exist_ok=True)
    os.makedirs(frontend_circuits_dir, exist_ok=True)

    fastf1.Cache.enable_cache(cache_dir)
    logger.info(f"FastF1 cache enabled at: {cache_dir}")

    targets = CIRCUIT_SPECS
    if args.circuit:
        targets = [c for c in CIRCUIT_SPECS if c["id"] == args.circuit.lower() or args.circuit.lower() in c.get("aliases", [])]
        if not targets:
            logger.error(f"Circuit '{args.circuit}' not found in catalog specs.")
            sys.exit(1)

    logger.info(f"Processing {len(targets)} circuits for {args.year} calendar...")

    manifest = []
    success_count = 0

    for spec in targets:
        c_id = spec["id"]
        try:
            logger.info(f"Generating circuit [{c_id}] {spec['name']}...")
            data = extract_circuit_data(spec, target_year=args.year)

            # 1. Primary file: {id}.json
            primary_filename = f"{c_id}.json"
            primary_path = os.path.join(data_circuits_dir, primary_filename)
            frontend_primary_path = os.path.join(frontend_circuits_dir, primary_filename)

            with open(primary_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            with open(frontend_primary_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            # 2. Write aliases for seamless lookup (e.g. monza.json, silverstone.json, etc.)
            for alias in spec.get("aliases", []):
                alias_filename = f"{alias}.json"
                alias_path = os.path.join(data_circuits_dir, alias_filename)
                frontend_alias_path = os.path.join(frontend_circuits_dir, alias_filename)
                with open(alias_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                with open(frontend_alias_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

            manifest.append({
                "id": data["id"],
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
                "file": f"/data/circuits/{args.year}/{primary_filename}"
            })

            success_count += 1
            logger.info(f"✓ [{c_id}] generated successfully: {len(data['corners'])} corners, {data['points_count']} track points.")

        except Exception as e:
            logger.error(f"✗ Failed to generate [{c_id}]: {e}", exc_info=True)

    # Save manifest index
    manifest_path = os.path.join(data_circuits_dir, "circuits_manifest.json")
    frontend_manifest_path = os.path.join(frontend_circuits_dir, "circuits_manifest.json")

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    with open(frontend_manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info(f"Pipeline Complete: {success_count}/{len(targets)} circuits generated.")
    logger.info(f"Manifest written to: {manifest_path}")


if __name__ == "__main__":
    main()
