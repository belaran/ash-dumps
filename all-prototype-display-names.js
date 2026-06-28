let updatedCount = 0;
let errorCount = 0;

// Iterate through all actors
for (let actor of game.actors) {
    try {
        // Update the prototype token to display the actor's name
        await actor.update({
            "prototypeToken.displayName": CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            "prototypeToken.name": actor.name
        });

        updatedCount++;
        console.log(`Updated: ${actor.name}`);
    } catch (error) {
        errorCount++;
        console.error(`Error updating ${actor.name}:`, error);
    }
}

// Report results
const message = `Prototype token update complete!\nUpdated: ${updatedCount}\nErrors: ${errorCount}`;
console.log(message);
ui.notifications.info(message);
