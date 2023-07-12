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
        let id = ui.notifications.info(`Uploading ${file.name}...`, {permanent: true});
        let response = await FilePicker.upload('data', target, file);
        ui.notifications.remove(id);
        sounds.push({ name: file.name, path: response.path });
    }
    let droppedPlaylistId = getPlaylistIdFromElement(
    		event.srcElement.closest(".playlist")
    	);
    let droppedPlaylist  = game.playlists.contents.find((playlist) => playlist.id === droppedPlaylistId);
    let playlist = game.playlists.contents.find((playlist) => playlist.name === settings.PLAYLIST_NAME);
    if (droppedPlaylist) {
        droppedPlaylist.createEmbeddedDocuments("PlaylistSound", sounds);
    } else if (playlist) {
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
    ui.notifications.info(`All files have been uploaded.`);
}

function getPlaylistIdFromElement(el) {
	if (el == null) {
		return false;
	}
	if ((el.closest(".playlist") == undefined || el.closest(".playlist") == null) &&
		!el.classList.contains("playlist")) {
		ui.notifications.error( "Ensemble: Could not add sound files, target must be a playlist");
		return false;
	}
	return el.classList.contains("playlist")
		? el.getAttribute("data-entry-id")
		: el.closest(".playlist").getAttribute("data-entry-id");
}