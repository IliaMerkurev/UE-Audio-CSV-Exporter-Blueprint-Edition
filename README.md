# UE Audio CSV Exporter

**UE Audio CSV Exporter** is a toolset designed to automate the synchronization of audio events between **Unreal Engine** and **Adobe After Effects**. It eliminates manual syncing by logging runtime sound data into a CSV format and reconstructing the entire audio timeline in After Effects using a dedicated JSX script.

---

## Key Features
*   **Runtime Event Logging**: Capture sound names, timestamps, volume, panning, and duration during simulation or play-in-editor.
*   **Simple Setup**: Quick integration into your Unreal project via Blueprints—no complex C++ setup required for basic functionality.
*   **Automated AE Layout**: The JSX script automatically imports assets, creates pre-compositions, and maps audio effects (Volume/Pan).
*   **Frame-Accurate Precision**: Ensures your audio perfectly matches your high-quality renders every time.

---

## ⚠️ Prerequisites
To handle file system operations, this tool requires the following plugin:
*   **Blueprint File SDK** (Available on the Unreal Engine Marketplace).

---

## Installation

### Unreal Engine
1.  Copy the `AudioCSVExporter` folder into your project's `Content` directory.
2.  Enable the **Blueprint File SDK** plugin in your Project Settings.

### After Effects
1.  Run the `UE_AudioImporter_CSV.jsx` file in After Effects.

---

## Usage

### 1. Level Setup
*   Place the `BP_AudioExporter` actor anywhere in your level.
*   In the **Details** panel, configure the **Save Dir** (e.g., `AudioLogs/AudioLog.csv`).
*   Call the function from the `BFL_AudioCSVExporter` library in your Blueprints whenever a sound is triggered to register it for export.

### 2. Importing to After Effects
*   Run the script via **File** > **Scripts** > **Run Script File...** and select `UE_AudioImporter_CSV.jsx`.
*   Select your exported **CSV** file.
*   **(Optional)** Select a folder containing your source `.wav` or `.mp3` files for automatic asset linking.

---

## 🛠 Roadmap
- [ ] **Continuous Sound Support**: Implementation of distance-based attenuation and spatial data for looping sounds.
- [ ] **Procedural Audio Tracking**: Real-time logging for complex sound parameters (e.g., Engine RPM, Pitch modulation).
- [ ] **v2.0 Core Refactor**: High-performance C++ implementation for large-scale cinematic productions.
- [ ] **Universal NLE Support**: Expansion to DaVinci Resolve and Adobe Premiere Pro.

---

## Technical Details
The system exports 5 core parameters per event:
1.  **Time**: Exact trigger time in seconds.
2.  **SoundName**: The name of the sound asset.
3.  **Volume**: Normalized volume (0.0 to 1.0).
4.  **Pan**: Stereo panning (-1.0 to 1.0).
5.  **Duration**: Length of the audio clip in seconds.

---

## License
**MIT License**. Created by **Ilia Merkurev**.
