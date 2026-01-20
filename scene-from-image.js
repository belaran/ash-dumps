new Dialog({
  title: "Créer une scène (background, gridless, thumbnail)",
  content: `
    <form>
      <div class="form-group">
        <label>Nom de la scène :</label>
        <input type="text" name="sceneName" placeholder="Nom de la scène" style="width:100%"/>
      </div>
      <div class="form-group">
        <label>URL de l'image :</label>
        <input type="text" name="imgUrl" placeholder="https://..." style="width:100%"/>
      </div>
    </form>
  `,
  buttons: {
    create: {
      icon: '<i class="fas fa-image"></i>',
      label: "Télécharger & créer",
      callback: async (html) => {
        const imgUrl = html.find('input[name="imgUrl"]').val();
        let sceneName = html.find('input[name="sceneName"]').val();

        if (!imgUrl) {
          ui.notifications.error("Veuillez entrer une URL valide.");
          return;
        }

        try {
          /* ---------------- Téléchargement image ---------------- */
          const response = await fetch(imgUrl);
          if (!response.ok) throw new Error("Téléchargement impossible");

          const blob = await response.blob();
          const fileName = decodeURIComponent(
            imgUrl.split("/").pop().split("?")[0]
          );

          if (!sceneName) sceneName = fileName;

          const file = new File([blob], fileName, { type: blob.type });

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
            ui.notifications.error("Image téléchargée mais impossible de la charger.");
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
