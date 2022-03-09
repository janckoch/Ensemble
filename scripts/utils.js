import * as settings from './settings.js'

export function createUploadFolderIfMissing() {
    return getFolder(settings.ORIGIN_FOLDER, settings.UPLOAD_FOLDER_PATH)
        .then(location => location.target === '.' && createFolder(settings.ORIGIN_FOLDER, settings.UPLOAD_FOLDER_PATH))
        .catch(() => createFolder(settings.ORIGIN_FOLDER, settings.UPLOAD_FOLDER_PATH));
}

export function getFolder(source, target) {
    return FilePicker.browse(source, target)
}

export function createFolder(source, target, options = {}) {
    return FilePicker.createDirectory(source, target, options);
}

export function log(...output) {
    if (!settings.DEBUGGING) return;
    return settings.TRACE ? consoleTrace(...output) : consoleLog(...output);
}

export function consoleTrace(...output) {
    console.groupCollapsed(...settings.CONSOLE_MESSAGE_PRESET, ...output);
    console.trace();
    console.groupEnd();
}