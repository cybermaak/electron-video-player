window.addEventListener(
    'DOMContentLoaded',
    init
);

const v = {
    Front: () => this.videoContainer('Front'),
    Back: () => this.videoContainer('Back'),
    Left: () => this.videoContainer('Left'),
    Right: () => this.videoContainer('Right'),

    videoContainer: pos => document.querySelector(`#videoContainer${pos}`),

    addCascadingEventListener: function (eventName, otherVideoAction) {
        return this.forEach((video, _, array) =>
                                video.addEventListener(
                                    eventName,
                                    () => array.forEach(otherVideoAction)
                                ));
    },

    addEventListener: function (eventName, action) {
        return this.forEach(
            video => video.addEventListener(eventName, action));
    },

    all: function () {
        return [this.Front(), this.Back(), this.Left(), this.Right()];
    },

    forEach: function (callback) {
        return [this.Front(), this.Back(), this.Left(), this.Right()].forEach(callback);
    },
};

function videoContainer(pos) {
    return document.querySelector(`#videoContainer${pos}`)
}

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
    v.addEventListener('play', playing);
    v.addEventListener('ended', ended);
    v.addEventListener('pause', paused);

    dropArea.addEventListener('dragleave', makeUnDroppable);
    dropArea.addEventListener('dragenter', makeDroppable);
    dropArea.addEventListener('dragover', makeDroppable);
    dropArea.addEventListener('drop', loadVideo);

    document.querySelector('#playerContainer').addEventListener('click', playerClicked);
    document.querySelector('#chooseVideo').addEventListener('change', loadVideo);
    document.querySelector('#volRange').addEventListener('change', adjustVolume);
    document.querySelector('#enterLink').addEventListener('change', loadVideo);

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

function getTime(ms) {
    const date = new Date(ms);
    const time = [];

    time.push(date.getUTCHours());
    time.push(date.getUTCMinutes());
    time.push(date.getUTCSeconds());

    return time.join(':');
}

function adjustVolume(e) {
    v.Front.volume = e.target.value;
}

function showProgress() {
    const progBar = document.querySelector('#prog');
    const count = document.querySelector('#count');

    const currentTime = Math.min(...v.all().map(x => x.currentTime));

    const duration = Math.min(...v.all().map(x => x.duration));

    progBar.value = (currentTime / duration);
    count.innerHTML = `${getTime(currentTime * 1000)}/${getTime(duration * 1000)}`;
}

function togglePlay() {
    document.querySelector('.play:not(.hide),.pause:not(.hide)').click();
}

function playing(e) {

    const player = document.querySelector('#playerContainer');

    document.querySelector('#play').classList.add('hide');
    document.querySelector('#pause').classList.remove('hide');
    player.classList.remove('paused');

    hideFileArea();
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

function showFileArea() {
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

function paused(e) {
    document.querySelector('#pause').classList.add('hide');
    document.querySelector('#play').classList.remove('hide');

    showFileArea();
}

function ended(e) {
    document.querySelector('#play').classList.remove('hide');
    document.querySelector('#pause').classList.add('hide');

    showFileArea();
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
                document.querySelector('.play:not(.hide),.pause:not(.hide)').click();
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

function playerClicked(e) {
    if (!e.target.id || e.target.id == 'controlContainer' || e.target.id == 'dropArea') {
        return;
    }

    const player = document.querySelector('#playerContainer');

    switch (e.target.id) {
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
            v.Front().muted = (v.Front().muted) ? false : true;
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
    }
}
