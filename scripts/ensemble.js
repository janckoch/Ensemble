import * as settings from './settings.js'
import {createUploadFolderIfMissing, log} from './utils.js'

Hooks.once('init', () => {
    createUploadFolderIfMissing()
        .then(() => log(`Folder ${settings.UPLOAD_FOLDER_PATH} is ready.`))
        .catch(() => log(`User doesn't have permission to create the upload folder ${settings.UPLOAD_FOLDER_PATH}.`));
    let originalDropFunction = PlaylistDirectory.prototype._onDrop;
    PlaylistDirectory.prototype._onDrop = async function (event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        log(files);
        if (files && files.length > 0) {
            let filteredFiles = Array.from(files).filter(file => Object.keys(CONST.AUDIO_FILE_EXTENSIONS).includes(file.name.split('.').pop()));
            await handleAudioFiles(event, filteredFiles);
        } else {
            originalDropFunction(event);
        }
    }
});

async function handleAudioFiles(event, files) {
    const target = settings.UPLOAD_FOLDER_PATH
    let sounds = [];
    for (const file of files) {
        let notificationId = game.notifications.info(`Uploading ${file.name} to ${target}...`, {permanent: true});
        let response = await FilePicker.upload('data', target, file);
        await game.notifications.get(notificationId).close();
        game.notifications.info(`Uploaded ${file.name} to ${target}.`);
        sounds.push({ name: file.name, path: response.path });
    }
    let playlist = game.playlists.contents.find((playlist) => playlist.name === settings.PLAYLIST_NAME);
    if (playlist) {
        playlist.createEmbeddedDocuments("PlaylistSound", sounds);
    } else {
        await Playlist.create({
            name: settings.PLAYLIST_NAME,
            description: "Generated playlist",
            flags: {},
            sounds: sounds,
            playing: false,
        });
    }
    game.notifications.info(`All files have been uploaded.`);
}

