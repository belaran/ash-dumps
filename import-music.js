// ===============================
// Foundry VTT Playlist Importer
// ===============================

// CONFIGURATION
const BASE_PATH = "music/worlds/alien"; // Relative to your Foundry data folder
const AUDIO_EXTENSIONS = [".mp3", ".ogg", ".wav", ".flac"];

// Utility: check audio file
function isAudioFile(name) {
  return AUDIO_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
}

// Get subdirectories (playlists)
async function getDirectories(path) {
  const result = await FilePicker.browse("data", path);
  return result.dirs;
}

// Get audio files inside a directory
async function getAudioFiles(path) {
  const result = await FilePicker.browse("data", path);
  return result.files.filter(isAudioFile);
}

(async () => {
  const confirmed = await Dialog.confirm({
    title: "Import Playlists",
    content: `
      <p><strong>Are you sure you want to perform the import?</strong></p>
      <p>This will create playlists based on the folder structure under:</p>
      <p><code>${BASE_PATH}</code></p>
    `,
    defaultYes: false
  });

  if (!confirmed) {
    ui.notifications.info("Playlist import cancelled.");
    return;
  }

  ui.notifications.info("Importing playlists…");

  const playlists = await getDirectories(BASE_PATH);

  for (const playlistPath of playlists) {
    const playlistName = decodeURIComponent(playlistPath.split("/").pop());
    const files = await getAudioFiles(playlistPath);

    if (files.length === 0) continue;

    await Playlist.create({
      name: playlistName,
      mode: CONST.PLAYLIST_MODES.SEQUENTIAL,
      playing: false,
      sounds: files.map(file => ({
        name: decodeURIComponent(file.split("/").pop()).replace(/\.[^/.]+$/, ""),
        path: file,
        volume: 0.7,
        repeat: true
      }))
    });
  }

  ui.notifications.info("Playlist import complete!");
})();
