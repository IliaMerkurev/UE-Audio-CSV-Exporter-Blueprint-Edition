//Created by Ilia Merkurev - https://github.com/IliaMerkurev/UE-Audio-CSV-Exporter-Blueprint-Edition

(function () {

    // =========================
    // 1. FILE & FOLDER SELECTION
    // =========================
    var csvFile = File.openDialog("Select UE Audio CSV");
    if (!csvFile) return;

    // Ask user for the folder containing the actual audio files (optional)
    var audioFolder = Folder.selectDialog("Select folder containing Audio files (Optional. Cancel to skip)");

    csvFile.open("r");
    var content = csvFile.read();
    csvFile.close();

    // Support both \n and \r\n to prevent parsing errors
    var lines = content.split(/\r?\n/);

    if (lines.length < 2) {
        alert("Invalid CSV");
        return;
    }

    app.beginUndoGroup("UE Audio Precomp Pipeline (Auto-Import)");

    // =========================
    // 2. PROJECT SETUP
    // =========================
    var mainComp = app.project.items.addComp(
        "UE_AUDIO_PRECOMP_TIMELINE",
        1920,
        1080,
        1,
        600, // 10 minutes default duration
        30
    );

    var phantomLayers = [];
    var importedAudioCache = {}; // Prevents importing the same file twice
    var mappedFiles = {};        // Stores filename (without extension) -> File object

    // Create a folder in the Project panel to keep things clean
    var projectAssetsFolder = app.project.items.addFolder("UE_IMPORTED_AUDIO");

    // =========================
    // 3. MAP AUDIO FILES
    // =========================
    // If user selected a folder, map all files ignoring extensions (.wav, .mp3)
    if (audioFolder) {
        var filesInFolder = audioFolder.getFiles();
        for (var f = 0; f < filesInFolder.length; f++) {
            if (filesInFolder[f] instanceof File) {
                var fileName = filesInFolder[f].name;
                var baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
                mappedFiles[baseName] = filesInFolder[f];
            }
        }
    }

    // =========================
    // 4. HELPERS
    // =========================
    function trim(s) {
        return s.replace(/^\s+|\s+$/g, "");
    }

    function getOrImportAudioItem(soundName) {
        // If no folder selected, or file doesn't exist in folder
        if (!audioFolder || !mappedFiles[soundName]) return null;

        // If already imported, return the cached ProjectItem
        if (importedAudioCache[soundName]) return importedAudioCache[soundName];

        // Import the file into AE
        try {
            var importedItem = app.project.importFile(new ImportOptions(mappedFiles[soundName]));
            importedItem.parentFolder = projectAssetsFolder;
            importedAudioCache[soundName] = importedItem;
            return importedItem;
        } catch (e) {
            return null;
        }
    }

    function getOrCreateComp(name, duration) {
        var comp = null;
        
        // Check if comp already exists
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === name) {
                comp = item;
                // Expand duration if the new CSV entry is longer
                if (comp.duration < duration) {
                    comp.duration = duration;
                }
                return comp;
            }
        }

        // Create new comp with duration from CSV
        comp = app.project.items.addComp(name, 500, 500, 1, duration, 30);

        // AUTO-IMPORT: Place the actual audio file in the comp if found
        var actualAudioItem = getOrImportAudioItem(name);
        if (actualAudioItem) {
            comp.layers.add(actualAudioItem);
        }

        // HACK: Create a phantom audio layer to guarantee Audio FX processing
        var phantom = comp.layers.addSolid([0, 0, 0], "PHANTOM_AUDIO", 10, 10, 1, Math.max(duration, 600));
        try {
            var tone = phantom.property("ADBE Effect Parade").addProperty("ADBE Aud Tone");
            tone.property(3).setValue(0); // Mute it
        } catch (e) {}

        phantomLayers.push(phantom);

        return comp;
    }

    function addAudioFX(layer, volume, pan) {
        var fxParade = layer.property("ADBE Effect Parade");

        try {
            var stereo = fxParade.addProperty("ADBE Stereo Mixer");
        } catch (e) {
            try {
                stereo = fxParade.addProperty("Stereo Mixer");
            } catch (e2) {
                return;
            }
        }

        if (stereo) {
            var volVal = Math.max(0, volume * 100); 

            // SOFT PANNING LOGIC
            var bleedFactor = 0.20; 

            var leftFactor = 1.0 - Math.max(0, pan) * (1.0 - bleedFactor);
            var rightFactor = 1.0 - Math.max(0, -pan) * (1.0 - bleedFactor);

            stereo.property(1).setValue(volVal * leftFactor);  // Left Level
            stereo.property(2).setValue(volVal * rightFactor); // Right Level
            
            stereo.property(3).setValue(-100); // Left Pan
            stereo.property(4).setValue(100);  // Right Pan
        }
    }

    // =========================
    // 5. PARSE CSV & BUILD
    // =========================
    for (var i = 1; i < lines.length; i++) {

        var line = trim(lines[i]);
        if (!line) continue;

        var cols = line.split(",");
        if (cols.length < 5) continue;

        var time = parseFloat(cols[0]);
        var sound = trim(cols[1]);
        var volume = parseFloat(cols[2]);
        var pan = parseFloat(cols[3]);
        var duration = parseFloat(cols[4]);

        if (isNaN(time) || isNaN(duration)) continue;

        // Ensure duration is at least one frame
        if (duration <= 0) duration = 0.033;

        // PRECOMP PER SOUND
        var soundComp = getOrCreateComp(sound, duration);

        // ADD TO MAIN COMP
        var layer = mainComp.layers.add(soundComp);

        layer.startTime = time;
        // Trim the layer according to duration
        layer.outPoint = time + duration;

        // APPLY AUDIO FX (Volume & Pan)
        addAudioFX(layer,
            isNaN(volume) ? 1 : volume,
            isNaN(pan) ? 0 : pan
        );
    }

    // =========================
    // 6. CLEANUP
    // =========================
    // Remove phantom layers now that the timeline is built
    for (var j = 0; j < phantomLayers.length; j++) {
        try {
            phantomLayers[j].remove();
        } catch (err) {}
    }

    app.endUndoGroup();
    alert("UE AUDIO IMPORT COMPLETE\nCompositions built, layers trimmed, and audio imported.");

})();