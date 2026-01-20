inew Dialog({
  title: "Lock Prototype Token Rotation",
  content: `
    <p>This will <strong>lock art rotation on prototype tokens</strong> for
    <strong>ALL actors</strong>.</p>
    <p>This affects <em>future tokens</em> created from actors.</p>
    <p><strong>Are you sure you want to continue?</strong></p>
  `,
  buttons: {
    yes: {
      icon: '<i class="fas fa-check"></i>',
      label: "Yes",
      callback: async () => {
        let totalActors = 0;

        for (const actor of game.actors) {
          // Some actors (like compendium-linked or invalid docs) may not be editable
          if (!actor.isOwner) continue;

          await actor.update({
            "prototypeToken.lockRotation": true
          });

          totalActors++;
        }

        ui.notifications.info(
          `Locked prototype token rotation for ${totalActors} actors.`
        );
      }
    },
    no: {
      icon: '<i class="fas fa-times"></i>',
      label: "No"
    }
  },
  default: "no"
}).render(true);
