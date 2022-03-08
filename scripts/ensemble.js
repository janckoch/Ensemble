// the path of the foundry data folder
const ORIGIN_FOLDER = 'data',
    MODULE_NAME = 'ensemble',
    // the path of the folder where all the uploaded images are saved
    UPLOAD_FOLDER_PATH = `uploaded-${MODULE_NAME}`,
    // determines if we should display debug
    DEBUGGING = true,
    // Determines if the debug should have a trace history
    TRACE = true,
    PLAYLIST_NAME = "Dropped Sounds",
    CONSOLE_MESSAGE_PRESET = [`%c${MODULE_NAME} %c|`, 'background: #222; color: #bada55', 'color: #fff'];

Hooks.once('init', () => {
    // create the folder for uploading images if it doesn't exist
    createUploadFolderIfMissing()
        .then(() => log(`Folder ${UPLOAD_FOLDER_PATH} is ready.`))
        .catch(() => log(`User doesn't have permission to create the upload folder ${UPLOAD_FOLDER_PATH}.`));
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
    const target = UPLOAD_FOLDER_PATH
    let sounds = [];
    for (const file of files) {
        let response = await FilePicker.upload('data', target, file);
        sounds.push({ name: file.name, path: response.path });
    }
    let playlist = game.playlists.contents.find((playlist) => playlist.name === PLAYLIST_NAME);
    if (playlist) {
        playlist.createEmbeddedDocuments("PlaylistSound", sounds);
    } else {
        await Playlist.create({
            name: PLAYLIST_NAME,
            description: "Generated playlist",
            flags: {},
            sounds: sounds,
            playing: false,
        });
    }
}

function createUploadFolderIfMissing() {
    return getFolder(ORIGIN_FOLDER, UPLOAD_FOLDER_PATH)
        .then(location => location.target === '.' && createFolder(ORIGIN_FOLDER, UPLOAD_FOLDER_PATH))
        .catch(() => createFolder(ORIGIN_FOLDER, UPLOAD_FOLDER_PATH));
}

function getFolder(source, target) {
    return FilePicker.browse(source, target)
}

function createFolder(source, target, options = {}) {
    return FilePicker.createDirectory(source, target, options);
}

function log(...output) {
    if (!DEBUGGING) return;
    return TRACE ? consoleTrace(...output) : consoleLog(...output);
}

function consoleTrace(...output) {
    console.groupCollapsed(...CONSOLE_MESSAGE_PRESET, ...output);
    console.trace();
    console.groupEnd();
}