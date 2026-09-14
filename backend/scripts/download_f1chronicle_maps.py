"""
F1 Chronicle Map Sheet Downloader & Integrator
==============================================
Downloads official high-resolution circuit map sheets directly from:
https://f1chronicle.com/formula-1-circuit-maps/

Stores them in frontend/public/assets/circuit-maps/ and updates circuit JSONs.
"""

import os
import json
import urllib.request
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("F1ChronicleDownloader")

F1_CHRONICLE_MAP_URLS = {
    "australia": "https://f1chronicle.com/wp-content/uploads/2023/11/M360335.jpg",
    "china": "https://f1chronicle.com/wp-content/uploads/2020/09/China-4K.png",
    "japan": "https://f1chronicle.com/wp-content/uploads/2023/11/M339144.jpg",
    "miami": "https://f1chronicle.com/wp-content/uploads/2023/11/M366219.jpg",
    "canada": "https://f1chronicle.com/wp-content/uploads/2023/11/M375764.jpg",
    "monaco": "https://f1chronicle.com/wp-content/uploads/2020/09/Monaco-4K.png",
    "spain": "https://f1chronicle.com/wp-content/uploads/2020/09/Spain-1-scaled.jpg",
    "austria": "https://f1chronicle.com/wp-content/uploads/2020/09/Austria-1-scaled.jpg",
    "great-britain": "https://f1chronicle.com/wp-content/uploads/2020/09/Britain-New.jpg",
    "belgium": "https://f1chronicle.com/wp-content/uploads/2020/09/Belgium-1-scaled.jpg",
    "hungary": "https://f1chronicle.com/wp-content/uploads/2020/09/Hungary-2-scaled.jpg",
    "netherlands": "https://f1chronicle.com/wp-content/uploads/2023/11/M389393.jpg",
    "italy": "https://f1chronicle.com/wp-content/uploads/2020/09/Italy-1-scaled.jpg",
    "azerbaijan": "https://f1chronicle.com/wp-content/uploads/2023/11/M363105.jpg",
    "bahrain": "https://f1chronicle.com/wp-content/uploads/2020/11/Bahrain_Track_Map_ENG-1920x1280.jpg",
    "saudi-arabia": "https://f1chronicle.com/wp-content/uploads/2023/03/230118_TrackMaps_EN.jpg",
    "singapore": "https://f1chronicle.com/wp-content/uploads/2023/11/M392829.jpg",
    "usa": "https://f1chronicle.com/wp-content/uploads/2023/10/M399100-1.jpg",
    "mexico": "https://f1chronicle.com/wp-content/uploads/2023/11/M401315.jpg",
    "brazil": "https://f1chronicle.com/wp-content/uploads/2023/11/M403616.jpg",
    "las-vegas": "https://f1chronicle.com/wp-content/uploads/2023/11/Las-Vegas-Strip-Circuit.png",
    "qatar": "https://f1chronicle.com/wp-content/uploads/2023/11/M396229.jpg",
    "abu-dhabi": "https://f1chronicle.com/wp-content/uploads/2020/12/Yas-Marina-Circuit-1280x720.jpg",
    "madrid": "https://f1chronicle.com/wp-content/uploads/2020/09/Spain-1-scaled.jpg"  # Madrid fallback official Spanish layout
}

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TARGET_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "assets", "circuit-maps")
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "circuits", "2026")
FRONTEND_DATA_DIR = os.path.join(PROJECT_ROOT, "frontend", "public", "data", "circuits", "2026")

os.makedirs(TARGET_DIR, exist_ok=True)


def download_maps():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    downloaded_map = {}

    for circuit_id, url in F1_CHRONICLE_MAP_URLS.items():
        ext = ".png" if url.endswith(".png") else ".jpg"
        filename = f"{circuit_id}{ext}"
        filepath = os.path.join(TARGET_DIR, filename)

        try:
            logger.info(f"Downloading [{circuit_id}] from {url}...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read()
                with open(filepath, "wb") as f:
                    f.write(content)
            downloaded_map[circuit_id] = f"/assets/circuit-maps/{filename}"
            logger.info(f"✓ Saved {filename} ({len(content)} bytes)")
        except Exception as e:
            logger.warning(f"Failed to download {circuit_id}: {e}")

    # Now update JSON circuit files to link this official graphic sheet
    logger.info("Updating circuit JSON files with official map sheet links...")
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".json") or filename == "circuits_manifest.json":
            continue
        c_id = filename.replace(".json", "")
        # Find matching key
        matched_id = c_id
        if matched_id not in downloaded_map:
            # check aliases
            for main_id, sub_url in F1_CHRONICLE_MAP_URLS.items():
                if main_id in c_id or c_id in main_id:
                    matched_id = main_id
                    break

        image_path = downloaded_map.get(matched_id, downloaded_map.get("italy"))

        # Update in data/circuits/2026
        data_path = os.path.join(DATA_DIR, filename)
        with open(data_path, "r", encoding="utf-8") as f:
            c_data = json.load(f)

        c_data["official_map_sheet"] = image_path
        c_data["f1chronicle_source_url"] = "https://f1chronicle.com/formula-1-circuit-maps/"

        with open(data_path, "w", encoding="utf-8") as f:
            json.dump(c_data, f, indent=2, ensure_ascii=False)

        # Mirror to frontend
        fe_path = os.path.join(FRONTEND_DATA_DIR, filename)
        with open(fe_path, "w", encoding="utf-8") as f:
            json.dump(c_data, f, indent=2, ensure_ascii=False)

    # Update manifest
    manifest_path = os.path.join(DATA_DIR, "circuits_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        for item in manifest:
            mid = item["id"]
            matched = mid if mid in downloaded_map else "italy"
            item["official_map_sheet"] = downloaded_map.get(matched, "")
            item["f1chronicle_source_url"] = "https://f1chronicle.com/formula-1-circuit-maps/"
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        with open(os.path.join(FRONTEND_DATA_DIR, "circuits_manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    logger.info("F1 Chronicle official map sheets integration completed!")


if __name__ == "__main__":
    download_maps()
