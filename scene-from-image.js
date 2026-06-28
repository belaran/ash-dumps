new Dialog({
  title: "Créer une scène (background, gridless, thumbnail)",
  content: `
    <form>
      <div class="form-group">
        <label>Nom de la scène :</label>
        <input type="text" name="sceneName" placeholder="Nom de la scène" style="width:100%"/>
      </div>
      <div class="form-group">
        <label>Image :</label>
        <input type="file" name="imgFile" accept="image/*" style="width:100%"/>
      </div>
    </form>
  `,
  buttons: {
    create: {
      icon: '<i class="fas fa-image"></i>',
      label: "Uploader & créer",
      callback: async (html) => {
        const fileInput = html.find('input[name="imgFile"]')[0];
        let sceneName = html.find('input[name="sceneName"]').val();

        if (!fileInput.files || fileInput.files.length === 0) {
          ui.notifications.error("Veuillez sélectionner une image.");
          return;
        }

        try {
          const file = fileInput.files[0];

          if (!sceneName) sceneName = file.name;

          /* ---------------- Upload image ---------------- */
          const upload = await FilePicker.upload(
            "data",
            "img/cthulhu-hack/le-buste-du-pseudo-seneque",
            file,
            {}
          );

          const localPath = upload.path;

          /* ---------------- Dimensions image ---------------- */
          const img = new Image();
          img.src = localPath;

          img.onload = async () => {

            /* ---------------- Création scène ---------------- */
            const scene = await Scene.create({
              name: sceneName,
              background: { src: localPath },
              width: img.width,
              height: img.height,

              // GRIDLESS (v11)
              grid: { type: 0 },

              padding: 0,
              backgroundColor: "#000000"
            });

            /* ---------------- Thumbnail auto ---------------- */
            // v11 : met à jour automatiquement
            // v10 : nécessite un update manuel
            const thumb = await scene.createThumbnail();
            if (thumb?.thumb) {
              await scene.update({ thumb: thumb.thumb });
            }

            ui.notifications.info(
              `Scène "${sceneName}" créée avec thumbnail.`
            );
          };

          img.onerror = () => {
            ui.notifications.error("Image uploadée mais impossible de la charger.");
          };

        } catch (err) {
          console.error(err);
          ui.notifications.error("Erreur lors de la création de la scène.");
        }
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Annuler"
    }
  },
  default: "create"
}).render(true);
