let offlineContent;
let browserStorageAvailable = false;
const imageFiles = ['jpg','jpeg','jfif','png','webp','gif'];
const videoFiles = ['mp4','mov','m4v', 'webm'];
const audioFiles = ['mp3','m4a','wav', 'ogg', 'flac'];

const offlineContentDB = self.indexedDB.open("offlineContent", 6);
offlineContentDB.onerror = event => {
    console.error(event.errorCode);
    console.error(`IndexedDB Is Not Available: Offline Content will not be available!`)
};
offlineContentDB.onsuccess = event => {
    offlineContent = event.target.result;
    console.log('Offline Database is available');
    browserStorageAvailable = true;
};
offlineContentDB.onupgradeneeded = event => {
    // Save the IDBDatabase interface
    const db = event.target.result;
    // Create an objectStore for this database
    if (event.oldVersion < 1) {
        const spannedFilesStore = db.createObjectStore("spanned_files", {keyPath: "id"});
        spannedFilesStore.createIndex("id", "id", {unique: true});
        spannedFilesStore.createIndex("name", "name", {unique: false});
        spannedFilesStore.createIndex("size", "size", {unique: false});
        spannedFilesStore.createIndex("channel", "channel", {unique: false});
        spannedFilesStore.transaction.oncomplete = event => {
        }
        const offlinePageStore = db.createObjectStore("offline_pages", {keyPath: "url"});
        offlinePageStore.createIndex("url", "url", {unique: true});
        offlinePageStore.createIndex("title", "title", {unique: false});
        offlinePageStore.createIndex("files", "files", {unique: false});
        offlinePageStore.createIndex("previews", "previews", {unique: false});
        offlinePageStore.transaction.oncomplete = event => {
        }
        const offlineItemsStore = db.createObjectStore("offline_items", {keyPath: "eid"});
        offlineItemsStore.createIndex("eid", "eid", {unique: true});
        offlineItemsStore.createIndex("data_type", "data_type", {unique: false});
        offlineItemsStore.createIndex("full_url", "full_url", {unique: true});
        offlineItemsStore.createIndex("preview_url", "preview_url", {unique: false});
        offlineItemsStore.transaction.oncomplete = event => {
        }
    }
    if (event.oldVersion < 2) {
        const offlineKongouShows = db.createObjectStore("offline_kongou_shows", {keyPath: "showId"});
        offlineKongouShows.createIndex("showId", "showId", {unique: true});
        offlineKongouShows.transaction.oncomplete = event => {
        }
        const offlineKongouEpisode = db.createObjectStore("offline_kongou_episodes", {keyPath: "eid"});
        offlineKongouEpisode.createIndex("eid", "eid", {unique: true});
        offlineKongouEpisode.createIndex("showId", "showId", {unique: false});
        offlineKongouEpisode.transaction.oncomplete = event => {
        }
    }
    if (event.oldVersion < 3) {
        const offlineStorageData = db.createObjectStore("offline_filedata", {keyPath: "url"});
        offlineStorageData.createIndex("url", "url", {unique: true});
        offlineStorageData.transaction.oncomplete = event => {
        }
    }
    if (event.oldVersion < 5 || !db.objectStoreNames.contains('offline_actions')) {
        const offlineStorageData = db.createObjectStore("offline_actions", {keyPath: "id"});
        offlineStorageData.createIndex("id", "id", {unique: true});
        offlineStorageData.createIndex("action", "action", {unique: false});
        offlineStorageData.transaction.oncomplete = event => {
        }
    }
};

let downloadSpannedController = new Map();
let activeSpannedJobs = {};
async function openUnpackingFiles(object) {
    /*{
        id: ,
        name: ,
        size: ,
        channel: ,
        preemptive: ,
        offline: ,
        play:
    }*/
    if (object.id && object.id.length > 0) {
        if (downloadSpannedController.size === 0) {
            downloadSpannedController.set(object.id, {
                ...object,
                pending: true,
                ready: true
            })
            postMessage({type: 'STATUS_UNPACK_STARTED', fileid: object.id});
            while (downloadSpannedController.size !== 0) {
                const itemToGet = Array.from(downloadSpannedController.keys())[0]
                const job = downloadSpannedController.get(itemToGet)
                if (job.ready && job.pending) {
                    const download = await unpackFile(job);
                    if (download) {
                        postMessage({type: 'STATUS_UNPACK_COMPLETED', fileid: job.id})
                    } else {
                        postMessage({type: 'STATUS_UNPACK_FAILED', fileid: job.id})
                    }
                }
                downloadSpannedController.delete(itemToGet);
                console.log(`Job Complete: ${downloadSpannedController.size} Jobs Left`)
                postMessage({type: 'STATUS_UNPACKER_UPDATE'});
            }
        } else if (!downloadSpannedController.has(object.id)) {
            downloadSpannedController.set(object.id, {
                ...object,
                pending: true,
                ready: true
            })
            postMessage({type: 'STATUS_UNPACK_QUEUED', fileid: object.id})
        } else {
            postMessage({type: 'STATUS_UNPACK_DUPLICATE', fileid: object.id})
        }
    } else  {
        postMessage({type: 'STATUS_UNPACK_FAILED', fileid: object.id})
    }
}
async function unpackFile(_requestedJob) {
    if (_requestedJob && _requestedJob.id && _requestedJob.pending && _requestedJob.ready) {
        console.log(`Downloading File ${_requestedJob.id}...`)
        const activeID = _requestedJob.id + '';
        activeSpannedJobs[activeID] = {
            ..._requestedJob,
            pending: false
        };
        let blobs = [];
        postMessage({type: 'STATUS_UNPACKER_ACTIVE', action: 'GET_METADATA', fileid: activeID});

        return await new Promise(async (job) => {
            try {
                const response = await fetch( new Request(`/parity/${activeID}`, {
                    type: 'GET',
                    redirect: "follow",
                    headers: {
                        'X-Requested-With': 'SequenziaXHR',
                        'x-Requested-Page': 'SeqClientUnpacker'
                    }
                }))
                if (response.status < 300) {
                    try {
                        const object = JSON.parse((await response.text()).toString());
                        activeSpannedJobs[activeID] = {
                            ...object,
                            ...activeSpannedJobs[activeID],
                            progress: '0%',
                            abort: new AbortController()
                        };

                        if (activeSpannedJobs[activeID].parts && activeSpannedJobs[activeID].parts.length > 0 && activeSpannedJobs[activeID].expected_parts) {
                            if (activeSpannedJobs[activeID].parts.length === activeSpannedJobs[activeID].expected_parts) {
                                postMessage({type: 'STATUS_UNPACKER_ACTIVE', action: 'EXPECTED_PARTS', expected_parts: activeSpannedJobs[activeID].expected_parts, fileid: activeID});
                                let pendingBlobs = {}
                                let retryBlobs = {}
                                activeSpannedJobs[activeID].parts.map((e,i) => { pendingBlobs[i] = e; retryBlobs[i] = 0; })
                                function calculatePercent() {
                                    const percentage = (Math.abs((Object.keys(pendingBlobs).length - activeSpannedJobs[activeID].parts.length) / activeSpannedJobs[activeID].parts.length)) * 100
                                    activeSpannedJobs[activeID].progress = percentage.toFixed(0);
                                    postMessage({
                                        type: 'STATUS_UNPACKER_ACTIVE',
                                        action: 'FETCH_PARTS_PROGRESS',
                                        percentage: activeSpannedJobs[activeID].progress,
                                        fetchedBlocks: blobs.length,
                                        pendingBlocks: activeSpannedJobs[activeID].parts.length - blobs.length,
                                        totalBlocks: activeSpannedJobs[activeID].parts.length,
                                        fileid: activeID});
                                }

                                while (Object.keys(pendingBlobs).length !== 0) {
                                    if (!(activeSpannedJobs[activeID] && activeSpannedJobs[activeID].ready))
                                        break;
                                    let downloadKeys = Object.keys(pendingBlobs).slice(0,8)
                                    const results = await Promise.all(downloadKeys.map(async item => {
                                        return new Promise(async ok => {
                                            try {
                                                const block = await fetch(new Request(pendingBlobs[item], {
                                                    method: 'GET',
                                                    signal: activeSpannedJobs[activeID].abort.signal
                                                }))
                                                if (block && (block.status < 300)) {
                                                    if (activeSpannedJobs[activeID] && activeSpannedJobs[activeID].ready)
                                                        console.log(`Downloaded Parity Block #${item} for ${activeID}`);
                                                    const blob = await block.blob()
                                                    if (blob.size > 5) {
                                                        blobs[item] = blob;
                                                        calculatePercent();
                                                        delete pendingBlobs[item];
                                                        ok(true);
                                                    } else {
                                                        if (activeSpannedJobs[activeID])
                                                            activeSpannedJobs[activeID].ready = false;
                                                        ok(false);
                                                    }
                                                } else if (block) {
                                                    if (activeSpannedJobs[activeID] && activeSpannedJobs[activeID].ready)
                                                        console.error(`Failed Parity Block #${item} (Retry attempt #${retryBlobs[item]}) - ${block.status}`)
                                                    retryBlobs[item] = retryBlobs[item] + 1
                                                    if (retryBlobs[item] > 3) {
                                                        if (activeSpannedJobs[activeID] && activeSpannedJobs[activeID].ready)
                                                            activeSpannedJobs[activeID].ready = false;
                                                        ok(false);
                                                    } else {
                                                        ok(null);
                                                    }
                                                } else {
                                                    ok(false);
                                                }
                                            } catch (err) {
                                                if (activeSpannedJobs[activeID] && activeSpannedJobs[activeID].ready)
                                                    console.error(`Failed Parity ${item} (Retry attempt #${retryBlobs[item]})`)
                                                retryBlobs[item] = retryBlobs[item] + 1
                                                if (retryBlobs[item] > 3) {
                                                    if (activeSpannedJobs[activeID])
                                                        activeSpannedJobs[activeID].ready = false;
                                                    ok(false);
                                                } else {
                                                    ok(null);
                                                }
                                            }
                                        })
                                    }))
                                    if (results.filter(e => e === false).length > 0)
                                        break;
                                }

                                if (activeSpannedJobs[activeID] && blobs.length === activeSpannedJobs[activeID].expected_parts) {
                                    activeSpannedJobs[activeID].progress = `100%`;
                                    let blobType = {}
                                    if (activeSpannedJobs[activeID].play === 'video' || activeSpannedJobs[activeID].play === 'kms-video' || videoFiles.indexOf(activeSpannedJobs[activeID].filename.split('.').pop().toLowerCase().trim()) > -1)
                                        blobType.type = 'video/' + activeSpannedJobs[activeID].filename.split('.').pop().toLowerCase().trim();
                                    if (activeSpannedJobs[activeID].play === 'audio' || audioFiles.indexOf(activeSpannedJobs[activeID].filename.split('.').pop().toLowerCase().trim()) > -1)
                                        blobType.type = 'audio/' + activeSpannedJobs[activeID].filename.split('.').pop().toLowerCase().trim();

                                    const finalBlock = new Blob(blobs, blobType);
                                    blobs = null;
                                    if (browserStorageAvailable) {
                                        try {
                                            offlineContent.transaction([`spanned_files`], "readwrite").objectStore('spanned_files').put({
                                                ...activeSpannedJobs[activeID],
                                                block: finalBlock,
                                                parts: undefined,
                                                expected_parts: undefined,
                                                pending: undefined,
                                                ready: undefined,
                                                blobs: undefined,
                                                abort: undefined,
                                                progress: undefined,
                                                offline: undefined,
                                            }).onsuccess = event => {
                                                console.log(`File Saved Offline!`);
                                            };
                                        } catch (e) {
                                            console.error(`Failed to save block ${activeID}`);
                                            console.error(e);
                                        }
                                    }


                                    postMessage({type: 'STATUS_UNPACKER_ACTIVE', action: 'BLOCKS_ACQUIRED', fileid: activeID});
                                    job(true);
                                } else {
                                    postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'EXPECTED_FETCH_PARTS', fileid: activeID});
                                    job(false);
                                }
                            } else {
                                postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'EXPECTED_PARTS', fileid: activeID});
                                job(false);
                            }
                        } else {
                            postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'READ_METADATA', fileid: activeID});
                            job(false);
                        }
                    } catch (e) {
                        console.error(e);
                        postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'UNCAUGHT_ERROR', message: e.message, fileid: activeID});
                        job(false);
                    }
                } else {
                    console.error(`Failed to get parity information to compile file ${activeID}`);
                    postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'GET_METADATA', message: (await response.text()), fileid: activeID})
                    job(false);
                }
                if (activeSpannedJobs[activeID]) {
                    blobs = null;
                    activeSpannedJobs[activeID].parts = null;
                    delete activeSpannedJobs[activeID].parts;
                }
            } catch (err) {
                postMessage({type: 'STATUS_UNPACKER_FAILED', action: 'GET_METADATA', fileid: activeID})
                blobs = null;
                activeSpannedJobs[activeID].parts = null;
                delete activeSpannedJobs[activeID].parts;
                console.error('Unexpected unpacker error: ', err);
                job(false);
            }
        })
    } else {
        console.error('Missing Required Parameters to create a new unpacker job!');
        console.error(_requestedJob);
        return false
    }
}
async function stopUnpackingFiles(fileid) {
    if (downloadSpannedController.has(fileid) && activeSpannedJobs[fileid]) {
        const _controller = downloadSpannedController.get(fileid)
        if (_controller.pending === true) {
            downloadSpannedController.delete(fileid)
        } else {
            activeSpannedJobs[fileid].abort.abort();
            activeSpannedJobs[fileid].ready = false;
        }
    }
}

onmessage = function(event) {
    switch (event.data.type) {
        case 'UNPACK_FILE':
            openUnpackingFiles(event.data.object);
            break;
        case 'CANCEL_UNPACK_FILE':
            stopUnpackingFiles(event.data.fileid);
            break;
        case 'PING':
            postMessage({type: 'PONG'});
            break;
        case 'HEARTBEAT':
            postMessage(event.data);
            break;
        default:
            console.error('Unknown Message', event);
            break;
    }
}
