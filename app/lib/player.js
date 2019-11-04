window.addEventListener(
    'DOMContentLoaded',
    init
);

function formatDuration(s) {
    const date = new Date(s * 1000);
    const time = [];

    time.push(date.getUTCHours());
    time.push(date.getUTCMinutes());
    time.push(date.getUTCSeconds());

    return time.map(t => t.toString().padStart(2, '0')).join(':');
}

const v = {
    Front: () => document.querySelector('#videoContainerFront'),
    Back: () => document.querySelector('#videoContainerBack'),
    Left: () => document.querySelector('#videoContainerLeft'),
    Right: () => document.querySelector('#videoContainerRight'),

    addCascadingEventListener: function (eventName, otherVideoAction) {
        return this.all().forEach((video, _, array) =>
                                      video.addEventListener(
                                          eventName,
                                          () => array.forEach(otherVideoAction)
                                      ));
    },

    addEventListener: function (eventName, action) {
        return this.all().forEach(video => video.addEventListener(eventName, action));
    },

    all: function () {
        return [this.Front(), this.Back(), this.Left(), this.Right()];
    },
};

function init() {
    document.querySelector('#prog').value = 0;
    document.querySelector('#volRange').value = v.Front().volume;
    bindEvents();
}

function bindEvents() {
    const dropArea = document.querySelector('#dropArea');

    v.addCascadingEventListener('play', otherVideo => otherVideo.play());
    v.addCascadingEventListener('pause', otherVideo => otherVideo.pause());
    v.addCascadingEventListener('ended', otherVideo => otherVideo.pause());
    v.addCascadingEventListener('error', otherVideo => otherVideo.pause());
    v.addCascadingEventListener('stalled', otherVideo => otherVideo.pause());

    v.addEventListener('timeupdate', showProgress);
    v.addEventListener('error', () => videoError('Video Error'));
    v.addEventListener('stalled', () => videoError('Video Stalled'));
    v.addEventListener('play', e => hideFileArea());
    v.addEventListener('ended', e => showFileArea(false));
    v.addEventListener('pause', e => showFileArea(true));

    dropArea.addEventListener('dragleave', makeUnDroppable);
    dropArea.addEventListener('dragenter', makeDroppable);
    dropArea.addEventListener('dragover', makeDroppable);
    dropArea.addEventListener('drop', loadVideo);

    document.querySelector('#playerContainer').addEventListener('click', playerClicked);
    document.querySelector('#chooseVideo').addEventListener('change', loadVideo);
    document.querySelector('#volRange').addEventListener('change',
                                                         e => v.Front.volume = e.target.value);

    window.addEventListener('keyup',
                            e => {
                                switch (e.keyCode) {
                                    case 13 : //enter
                                    case 32 : //space
                                        togglePlay();
                                        break;
                                }
                            });
}

function showProgress() {
    const progBar = document.querySelector('#prog');
    const count = document.querySelector('#count');

    const currentTime = Math.min(...v.all().map(x => x.currentTime));
    const duration = Math.min(...v.all().map(x => x.duration));

    progBar.value = (currentTime / duration);
    count.innerHTML = `${formatDuration(currentTime)}/${formatDuration(duration)}`;
}

function togglePlay() {
    document.querySelector('.play:not(.hide),.pause:not(.hide)').click();
}

function fullscreened(e) {
    const player = document.querySelector('#playerContainer');
    player.classList.add('fullscreened');
    player.webkitRequestFullscreen();
}

function smallscreened(e) {
    const player = document.querySelector('#playerContainer');
    player.classList.remove('fullscreened');
    document.webkitExitFullscreen();
}

function hideFileArea() {
    const player = document.querySelector('#playerContainer');

    document.querySelector('#play').classList.add('hide');
    document.querySelector('#pause').classList.remove('hide');
    player.classList.remove('paused');

    const dropArea = document.querySelector('#dropArea');
    dropArea.classList.add('hidden');

    setTimeout(
        () => {
            const dropArea = document.querySelector('#dropArea');
            dropArea.classList.add('hide');
        },
        500
    );
}

function showFileArea(showPlay) {

    if (showPlay) {
        document.querySelector('#pause').classList.add('hide');
        document.querySelector('#play').classList.remove('hide');
    } else {
        document.querySelector('#play').classList.remove('hide');
        document.querySelector('#pause').classList.add('hide');
    }

    const player = document.querySelector('#playerContainer');
    player.classList.add('paused');

    const dropArea = document.querySelector('#dropArea');
    dropArea.classList.remove('hide');

    setTimeout(
        () => {
            const dropArea = document.querySelector('#dropArea');
            dropArea.classList.remove('hidden');
        },
        10
    );
}

function makeDroppable(e) {
    e.preventDefault();
    e.target.classList.add('droppableArea');
}

function makeUnDroppable(e) {
    e.preventDefault();
    e.target.classList.remove('droppableArea');
}

function loadVideo(e) {
    e.preventDefault();
    let files = [];
    if (e.dataTransfer) {
        files = e.dataTransfer.files;
    } else if (e.target.files) {
        files = e.target.files;
    } else {
        files = [
            {
                type: 'video',
                path: e.target.value
            }
        ];
    }

    const dashCamFileNameRegex = /(\\\d\d\d\d-\d\d-\d\d_\d\d-\d\d-\d\d-)(front|back|left_repeater|right_repeater)(.mp4)/;

    const rootFile = files[0];
    console.log(rootFile);
    if (rootFile.type.indexOf('video') > -1 && rootFile.path.match(dashCamFileNameRegex)) {
        const frontVideoFile = rootFile.path.replace(dashCamFileNameRegex, "$1front$3");
        const backVideoFile = rootFile.path.replace(dashCamFileNameRegex, "$1back$3");
        const leftVideoFile = rootFile.path.replace(dashCamFileNameRegex, "$1left_repeater$3");
        const rightVideoFile = rootFile.path.replace(dashCamFileNameRegex, "$1right_repeater$3");

        v.Front().src = frontVideoFile;
        v.Back().src = backVideoFile;
        v.Left().src = leftVideoFile;
        v.Right().src = rightVideoFile;

        setTimeout(
            () => {
                document.querySelector('.dropArea').classList.remove('droppableArea');
                togglePlay();
            },
            250
        );
    }
}

function videoError(message) {
    const err = document.querySelector('#error');
    err.querySelector('h1').innerHTML = message;
    err.classList.remove('hide');

    setTimeout(
        () => document.querySelector('#error').classList.remove('hidden'),
        10
    );
}

function closeError() {
    document.querySelector('#error').classList.add('hidden');
    setTimeout(
        () => document.querySelector('#error').classList.add('hide'),
        300
    );
}

const playerControl = {
    video: () => togglePlay(),
    play: () => {
        if (!v.Front().videoWidth) {
            videoError('Error Playing Video');
            return;
        }
        v.Front().play();
    },
    pause: () => v.Front().pause(),
    volume: () => document.querySelector('#volRange').classList.toggle('hidden'),
    mute: () => {
        v.Front().muted = (!v.Front().muted);
        player.classList.toggle('muted');
    },
    volRange: () => {
        //do nothing for now
    },
    fullscreen: () => fullscreened(),
    smallscreen: () => smallscreened(),
    prog: (e) => {
        v.Front().currentTime = ((e.offsetX) / e.target.offsetWidth) * v.Front().duration;
        v.Back().currentTime =
            v.Left().currentTime = v.Right().currentTime = v.Front().currentTime;
    },
    close: () => window.close(),
    fileChooser: () => document.querySelector('#chooseVideo').click(),
    enterLink: () => {
        //do nothing for now
    },
    error: () => closeError(),
    errorMessage: () => closeError(),
};

function playerClicked(e) {
    if (!e.target.id || e.target.id === 'controlContainer' || e.target.id === 'dropArea' || e.target.id === 'count') {
        return;
    }

    const player = document.querySelector('#playerContainer');

    if(playerControl[e.target.id]) {
        playerControl[e.target.id](e);
    } else {
        console.log(`stop half assing shit. what the hell is ${e.target.id}`);
    }
    /*switch (e.target.id) {
        case 'video' :
            togglePlay();
            break;
        case 'play' :
            if (!v.Front().videoWidth) {
                videoError('Error Playing Video');
                return;
            }
            v.Front().play();
            break;
        case 'pause' :
            v.Front().pause();
            break;
        case 'volume' :
            document.querySelector('#volRange').classList.toggle('hidden');
            break;
        case 'mute' :
            v.Front().muted = (!v.Front().muted);
            player.classList.toggle('muted');
            break;
        case 'volRange' :
            //do nothing for now
            break;
        case 'fullscreen' :
            fullscreened();
            break;
        case 'smallscreen' :
            smallscreened();
            break;
        case 'prog' :
            v.Front().currentTime = ((e.offsetX) / e.target.offsetWidth) * v.Front().duration;
            v.Back().currentTime =
                v.Left().currentTime = v.Right().currentTime = v.Front().currentTime;
            break;
        case 'close' :
            window.close();
            break;
        case 'fileChooser' :
            document.querySelector('#chooseVideo').click();
            break;
        case 'enterLink' :
            //do nothing for now
            break;
        case 'error' :
        case 'errorMessage' :
            closeError();
            break;
        default :
            console.log('stop half assing shit.');
    }                                             */
}
