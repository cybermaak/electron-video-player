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

    hasEnded: false,

    sync: function sync() {
        if (this.Front().media.readyState === 4) {
            this.Back().currentTime =
                this.Left().currentTime =
                    this.Right().currentTime =
                        this.Front().currentTime;
        }
        requestAnimationFrame(sync);
    },

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

const controls = {
    prog: () => document.querySelector('#prog'),
    count: () => document.querySelector('#count'),
    volRange: () => document.querySelector('#volRange'),
    dropArea: () => document.querySelector('#dropArea'),
    player: () => document.querySelector('#playerContainer'),
    playButton: () => document.querySelector('#play'),
    pauseButton: () => document.querySelector('#pause'),
    errorPane: () => document.querySelector('#error'),
    videoChooser: () => document.querySelector('#chooseVideo')
};

function init() {
    controls.prog().value = 0;
    controls.volRange().value = v.Front().volume;
    bindEvents();
    v.sync();
}

function bindEvents() {
    v.addCascadingEventListener('play', otherVideo => {
        if (v.hasEnded) {
            otherVideo.currentTime = 0;
        }
        return otherVideo.play();
    });
    v.addCascadingEventListener('pause', otherVideo => otherVideo.pause());
    v.addCascadingEventListener('ended', otherVideo => {
        v.hasEnded = true;
        return otherVideo.pause();
    });
    v.addCascadingEventListener('error', otherVideo => otherVideo.pause());
    v.addCascadingEventListener('stalled', otherVideo => otherVideo.pause());

    v.addEventListener('timeupdate', showProgress);
    v.addEventListener('error', () => videoError('Video Error'));
    v.addEventListener('stalled', () => videoError('Video Stalled'));
    v.addEventListener('play', e => hideFileArea());
    v.addEventListener('ended', e => showFileArea(false));
    v.addEventListener('pause', e => showFileArea(true));

    controls.dropArea().addEventListener('dragleave', makeUnDroppable);
    controls.dropArea().addEventListener('dragenter', makeDroppable);
    controls.dropArea().addEventListener('dragover', makeDroppable);
    controls.dropArea().addEventListener('drop', loadVideo);

    controls.player().addEventListener('click', playerClicked);
    controls.videoChooser().addEventListener('change', loadVideo);
    controls.volRange().addEventListener('change',
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
    const currentTime = Math.min(...v.all().map(x => x.currentTime));
    const duration = Math.min(...v.all().map(x => x.duration));

    controls.prog().value = (currentTime / duration);
    controls.count().innerHTML = `${formatDuration(currentTime)}/${formatDuration(duration)}`;
}

function togglePlay() {
    document.querySelector('.play:not(.hide),.pause:not(.hide)').click();
}

function fullscreened(e) {
    controls.player().classList.add('fullscreened');
    controls.player().webkitRequestFullscreen();
}

function smallscreened(e) {
    controls.player().classList.remove('fullscreened');
    document.webkitExitFullscreen();
}

function hideFileArea() {
    controls.playButton().classList.add('hide');
    controls.pauseButton().classList.remove('hide');
    controls.player().classList.remove('paused');

    controls.dropArea().classList.add('hidden');

    setTimeout(() => controls.dropArea().classList.add('hide'), 500);
}

function showFileArea(showPlay) {
    if (showPlay) {
        controls.pauseButton().classList.add('hide');
        controls.playButton().classList.remove('hide');
    } else {
        controls.playButton().classList.remove('hide');
        controls.pauseButton().classList.add('hide');
    }

    controls.player().classList.add('paused');

    controls.dropArea().classList.remove('hide');

    setTimeout(() => controls.dropArea().classList.remove('hidden'), 10);
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

    const basePath = files[0].path;
    console.log(basePath);
    if (basePath.match(dashCamFileNameRegex)) {
        v.Front().src = basePath.replace(dashCamFileNameRegex, "$1front$3");
        v.Back().src = basePath.replace(dashCamFileNameRegex, "$1back$3");
        v.Left().src = basePath.replace(dashCamFileNameRegex, "$1left_repeater$3");
        v.Right().src = basePath.replace(dashCamFileNameRegex, "$1right_repeater$3");

        setTimeout(
            () => {
                controls.dropArea().classList.remove('droppableArea');
                togglePlay();
            },
            250
        );
    }
}

function videoError(message) {
    controls.errorPane().querySelector('h1').innerHTML = message;
    controls.errorPane().classList.remove('hide');

    setTimeout(() => controls.errorPane().classList.remove('hidden'), 10);
}

function closeError() {
    controls.errorPane().classList.add('hidden');
    setTimeout(() => controls.errorPane().classList.add('hide'), 300);
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
    volume: () => controls.volRange().classList.toggle('hidden'),
    mute: () => {
        v.Front().muted = (!v.Front().muted);
        controls.player().classList.toggle('muted');
    },
    volRange: () => {
        //do nothing for now
    },
    fullscreen: () => fullscreened(),
    smallscreen: () => smallscreened(),
    prog: (e) => {
        v.Front().currentTime = ((e.offsetX) / e.target.offsetWidth) * v.Front().duration;
        v.Back().currentTime = v.Left().currentTime = v.Right().currentTime = v.Front().currentTime;
    },
    close: () => window.close(),
    fileChooser: () => controls.videoChooser().click(),
    enterLink: () => {
        //do nothing for now
    },
    error: () => closeError(),
    errorMessage: () => closeError(),
};

function playerClicked(e) {
    if (!e.target.id || e.target.id === 'controlContainer' || e.target.id === 'dropArea'
        || e.target.id === 'count') {
        return;
    }

    if (playerControl[e.target.id]) {
        console.log(`player.${e.target.id}`);
        playerControl[e.target.id](e);
    } else {
        console.log(`stop half assing shit. what the hell is ${e.target.id}`);
    }
}
