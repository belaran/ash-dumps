/**
 * Script Foundry VTT - Import d'images et création d'acteurs
 *
 * Ce script permet de :
 * 1. Sélectionner un dossier local contenant des images
 * 2. Choisir le chemin de destination sur le serveur Foundry
 * 3. Uploader toutes les images dans Foundry
 * 4. Créer un répertoire d'acteurs avec le même nom que le dossier local
 * 5. Créer un acteur pour chaque image avec l'image comme portrait et token
 * 6. Nommer l'acteur selon le format du fichier : <titre>-<prénom>-<nom>.extension
 * 7. Afficher le nom sous le pion par défaut
 */

(async () => {
    // Fonction pour parser le nom du fichier et créer un nom d'acteur formaté
    function parseFileName(fileName) {
        // Retirer l'extension
        const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '');

        // Séparer par les tirets
        const parts = nameWithoutExt.split('-');

        // Capitaliser chaque partie
        const capitalizedParts = parts.map(part => {
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        });

        // Joindre avec des espaces
        return capitalizedParts.join(' ');
    }

    // Fonction pour choisir le chemin de destination via le File Picker de Foundry
    async function chooseDestinationPath() {
        return new Promise((resolve) => {
            new FilePicker({
                type: "folder",
                current: "",
                callback: (path) => {
                    resolve(path);
                }
            }).browse();
        });
    }

    // Fonction pour créer un dossier sur le serveur si nécessaire
    async function createServerFolder(source, folderPath) {
        try {
            await FilePicker.createDirectory(source, folderPath, {});
            console.log(`✓ Dossier créé sur le serveur: ${folderPath}`);
            return true;
        } catch (error) {
            // Le dossier existe peut-être déjà, ce n'est pas grave
            if (error.message && error.message.includes("EEXIST")) {
                console.log(`✓ Dossier existe déjà: ${folderPath}`);
                return true;
            }
            console.warn(`Avertissement lors de la création du dossier:`, error);
            return true; // On continue quand même
        }
    }

    // Fonction pour uploader un fichier via FilePicker.upload
    async function uploadFile(file, source, targetPath, fileName) {
        try {
            // Créer un nouveau File avec un nom sans espaces si nécessaire
            const sanitizedFileName = fileName.replace(/\s+/g, '-');
            const newFile = new File([file], sanitizedFileName, { type: file.type });

            const response = await FilePicker.upload(source, targetPath, newFile, {});
            console.log(`Upload réussi:`, response);
            return response.path;
        } catch (error) {
            console.error(`Erreur upload:`, error);
            throw error;
        }
    }

    // Fonction pour créer un acteur avec l'image dans un dossier spécifique
    async function createActorWithImage(actorName, imagePath, folderId) {
        console.log(`Création acteur avec image: ${imagePath}`);

        const actorData = {
            name: actorName,
            type: "character", // Modifier selon votre système (character, npc, etc.)
            img: imagePath,
            folder: folderId,
            prototypeToken: {
                texture: {
                    src: imagePath
                },
                name: actorName,
                displayName: 40, // 40 = ALWAYS (affiche toujours le nom)
                displayBars: 0   // 0 = NONE (pas de barres par défaut)
            }
        };

        const actor = await Actor.create(actorData);

        // Mettre à jour explicitement l'image après création
        await actor.update({
            img: imagePath,
            "prototypeToken.texture.src": imagePath
        });

        console.log(`Acteur créé:`, actor);
        return actor;
    }

    // Fonction pour créer un dossier d'acteurs
    async function createActorFolder(folderName) {
        const folder = await Folder.create({
            name: folderName,
            type: "Actor",
            parent: null
        });
        return folder;
    }

    // Fonction pour extraire le nom du dossier parent depuis le chemin du fichier
    function extractFolderName(files) {
        if (files.length === 0) return "Imported Actors";

        // Utiliser le webkitRelativePath du premier fichier
        const relativePath = files[0].webkitRelativePath;
        if (relativePath) {
            // Extraire le nom du dossier racine
            const parts = relativePath.split('/');
            return parts[0] || "Imported Actors";
        }

        return "Imported Actors";
    }

    // Utiliser le File Picker natif de Foundry si disponible, sinon HTML5
    let files = [];

    // Méthode alternative : utiliser showDirectoryPicker API (Chrome 86+)
    if (window.showDirectoryPicker) {
        try {
            ui.notifications.info("Sélectionnez un dossier contenant vos images...");

            const directoryHandle = await window.showDirectoryPicker();
            const folderName = directoryHandle.name;

            // Récupérer tous les fichiers du dossier
            const fileHandles = [];
            for await (const entry of directoryHandle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    // Ajouter le nom du dossier pour compatibilité
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: `${folderName}/${file.name}`,
                        writable: false
                    });
                    fileHandles.push(file);
                }
            }

            files = fileHandles;

        } catch (error) {
            if (error.name === 'AbortError') {
                ui.notifications.warn("Sélection annulée.");
                return;
            }
            throw error;
        }
    } else {
        // Fallback : méthode HTML5 classique
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.multiple = true;

        files = await new Promise((resolve) => {
            input.onchange = (e) => {
                resolve(Array.from(e.target.files));
            };
            input.click();
        });
    }

    if (!files || files.length === 0) {
        ui.notifications.warn("Aucun fichier sélectionné.");
        return;
    }

    // Filtrer uniquement les images
    const imageFiles = files.filter(file =>
        file.type.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
        ui.notifications.warn("Aucune image trouvée dans le dossier.");
        return;
    }

    // Extraire le nom du dossier local (brut, avec espaces)
    const localFolderName = extractFolderName(files);

    // Demander à l'utilisateur de choisir le chemin de destination
    ui.notifications.info("Choisissez maintenant le dossier de destination sur le serveur Foundry...");
    const basePath = await chooseDestinationPath();

    if (!basePath) {
        ui.notifications.warn("Aucun chemin de destination sélectionné.");
        return;
    }

    // Extraire la source depuis le chemin (ex: "data", "s3", etc.)
    let source = "data";
    if (basePath.includes("[") && basePath.includes("]")) {
        const match = basePath.match(/<span class="katex-error" title="ParseError: KaTeX parse error: Expected group after '^' at position 3: ([^̲" style="color:#cc0000">([^</span>]+)\]/);
        if (match) {
            source = match[1];
        }
    }

    ui.notifications.info(`${imageFiles.length} image(s) trouvée(s) dans "${localFolderName}". Import en cours...`);

    // Créer le dossier d'acteurs dans Foundry (avec le nom original incluant les espaces)
    const actorFolder = await createActorFolder(localFolderName);
    console.log(`✓ Dossier d'acteurs créé: ${localFolderName} (ID: ${actorFolder.id})`);

    // Nettoyer le chemin de base (retirer les marqueurs de source et espaces)
    let cleanBasePath = basePath.replace(/<span class="katex-error" title="ParseError: KaTeX parse error: Expected group after '^' at position 2: [^̲" style="color:#cc0000">[^</span>]+\]\s*/, '').trim();

    // Retirer les slashes finaux
    cleanBasePath = cleanBasePath.replace(/\/+$/, '');

    // Construire le chemin de destination complet
    // Remplacer les espaces par des tirets dans le nom du dossier pour le serveur
    const sanitizedFolderName = localFolderName.replace(/\s+/g, '-');
    const targetFolder = `${cleanBasePath}/${sanitizedFolderName}`.replace(/\/+/g, '/');

    console.log(`Source: ${source}`);
    console.log(`Chemin de base: ${cleanBasePath}`);
    console.log(`Nom du dossier local: ${localFolderName}`);
    console.log(`Nom du dossier sanitisé: ${sanitizedFolderName}`);
    console.log(`Chemin de destination complet: ${targetFolder}`);

    // Créer le dossier sur le serveur
    await createServerFolder(source, targetFolder);

    let successCount = 0;
    let errorCount = 0;

    // Traiter chaque image
    for (const file of imageFiles) {
        try {
            console.log(`Traitement de: ${file.name}`);

            // Upload de l'image
            const uploadedPath = await uploadFile(file, source, targetFolder, file.name);

            console.log(`✓ Image uploadée: ${uploadedPath}`);

            // Parser le nom du fichier
            const actorName = parseFileName(file.name);

            // Créer l'acteur dans le dossier avec le chemin complet de l'image
            await createActorWithImage(actorName, uploadedPath, actorFolder.id);

            successCount++;
            console.log(`✓ Acteur créé: ${actorName} avec image ${uploadedPath}`);

            // Petite pause pour éviter de surcharger le serveur
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            errorCount++;
            console.error(`✗ Erreur pour ${file.name}:`, error);
        }
    }

    // Notification finale
    if (successCount > 0) {
        ui.notifications.info(`Import terminé: ${successCount} acteur(s) créé(s) dans le dossier "${localFolderName}", ${errorCount} erreur(s).`);
    } else {
        ui.notifications.error(`Import échoué: ${errorCount} erreur(s).`);
    }

    console.log(`=== Import terminé ===`);
    console.log(`Dossier d'acteurs: ${localFolderName}`);
    console.log(`Chemin serveur: ${targetFolder}`);
    console.log(`Succès: ${successCount}`);
    console.log(`Erreurs: ${errorCount}`);
})();
