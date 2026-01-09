(async () => {
  if (!game.playlists.size) {
    ui.notifications.info("No playlists to delete.");
    return;
  }

  const confirmed = await Dialog.confirm({
    title: "Delete ALL Playlists",
    content: `
      <p><strong>This will permanently delete ALL playlists.</strong></p>
      <p>This action cannot be undone.</p>
      <p>Are you absolutely sure?</p>
    `
  });

  if (!confirmed) {
    ui.notifications.info("Playlist deletion cancelled.");
    return;
  }

  ui.notifications.warn("Deleting all playlists…");

  // Clone list to avoid mutation during deletion
  const playlists = [...game.playlists.contents];

  for (const playlist of playlists) {
    await playlist.delete();
  }

  ui.notifications.info("All playlists have been deleted.");
})();
