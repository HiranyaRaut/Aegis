import random
from typing import Dict, Any

class WeatherEngine:
    def __init__(self):
        self.rain_intensity = 0.0  # 0.0 to 1.0
        self.track_water_depth = 0.0  # 0.0 to 6.0 mm
        self.grip_level = 1.0  # 1.0 (dry) to 0.4 (extreme wet)
        self.status = "dry"  # dry, cloudy, damp, wet, heavy_rain
        self.ambient_temp = 22.0  # °C
        self.track_temp = 35.0  # °C
        self.humidity = 40.0  # %
        
        # Autonomous dynamic front simulation
        self.front_countdown = random.randint(20, 35)  # sectors until rain front arrives
        self.front_target_intensity = 0.0
        self.front_duration_sectors = 0
        self.radar_alert_fired = False

    def get_incoming_forecast(self) -> str:
        # Radar detects rain front ~4 laps (12 sectors) in advance
        if self.front_target_intensity > 0.05 and self.front_countdown <= 14 and not self.radar_alert_fired:
            self.radar_alert_fired = True
            est_laps = max(1, round(self.front_countdown / 3))
            return f"RADAR WARNING: Autonomous rain cell incoming. Est. arrival in {est_laps} laps. Intensity expected at {round(self.front_target_intensity*100)}%."
        return None

    def update(self, lap: int, target_rain: float = None) -> Dict[str, Any]:
        """
        Updates weather variables. If target_rain is provided, transitions
        towards it (manual override). Otherwise, evolves naturally via front simulation.
        """
        # Natural evolution if target is not forced
        if target_rain is None:
            if self.front_countdown > 0:
                self.front_countdown -= 1
                # Prepare a front target when approaching
                if self.front_countdown <= 14 and self.front_target_intensity == 0.0:
                    self.front_target_intensity = round(random.uniform(0.35, 0.70), 2)
                    self.front_duration_sectors = random.randint(18, 30)
            else:
                # Active front or clearing
                if self.front_duration_sectors > 0:
                    self.front_duration_sectors -= 1
                    if self.rain_intensity < self.front_target_intensity:
                        self.rain_intensity = min(self.front_target_intensity, round(self.rain_intensity + 0.04, 2))
                else:
                    # Front cleared, clearing skies
                    if self.rain_intensity > 0.0:
                        self.rain_intensity = max(0.0, round(self.rain_intensity - 0.03, 2))
                    else:
                        # Reset for next natural cycle
                        self.front_countdown = random.randint(30, 50)
                        self.front_target_intensity = 0.0
                        self.radar_alert_fired = False
        else:
            # Transition towards user-targeted rain intensity (0.05 step per update)
            if self.rain_intensity < target_rain:
                self.rain_intensity = min(target_rain, round(self.rain_intensity + 0.05, 2))
            elif self.rain_intensity > target_rain:
                self.rain_intensity = max(target_rain, round(self.rain_intensity - 0.05, 2))

        # Track water depth evolution
        if self.rain_intensity > 0.0:
            # Water accumulates depending on rain intensity
            accumulation = self.rain_intensity * 0.4  # accumulation rate mm/step
            self.track_water_depth = min(6.0, self.track_water_depth + accumulation)
        else:
            # Track dries out
            dry_rate = 0.1 + (self.track_temp / 100.0) * 0.15  # temperature dependent
            self.track_water_depth = max(0.0, self.track_water_depth - dry_rate)

        # Classify weather status
        if self.track_water_depth < 0.1:
            if self.rain_intensity > 0.0:
                self.status = "cloudy"  # starting to spit
            else:
                self.status = "dry"
        elif self.track_water_depth < 1.0:
            self.status = "damp"
        elif self.track_water_depth < 3.0:
            self.status = "wet"
        else:
            self.status = "heavy_rain"

        # Calculate grip levels based on track water depth
        # Dry track grip is 1.0
        # Grip drops as water accumulates
        base_grip = 1.0
        if self.track_water_depth > 0.0:
            # Grip loss curve
            base_grip -= min(0.6, self.track_water_depth * 0.18)
        self.grip_level = round(max(0.4, base_grip), 3)

        # Temperature effects
        if self.status in ["wet", "heavy_rain"]:
            self.track_temp = max(16.0, self.track_temp - 0.5)
            self.humidity = min(98.0, self.humidity + 2.0)
        else:
            # Recover back to ambient+
            self.track_temp = min(38.0, self.track_temp + 0.1)
            self.humidity = max(35.0, self.humidity - 0.5)

        return self.get_state()

    def get_state(self) -> Dict[str, Any]:
        return {
            "rain_intensity": round(self.rain_intensity, 2),
            "track_water_depth": round(self.track_water_depth, 2),
            "grip_level": round(self.grip_level, 2),
            "status": self.status,
            "ambient_temp": round(self.ambient_temp, 1),
            "track_temp": round(self.track_temp, 1),
            "humidity": round(self.humidity, 1)
        }
