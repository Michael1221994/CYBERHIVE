/* ============================================================================
   CYBERHIVE // Web Audio API Bio-Electronic Sound Synthesizer
   Procedurally generates 250Hz bee flight acoustics & 60Hz datacenter grid hum
   ========================================================================== */

let audioCtx = null;
let masterGain = null;
let beeGain = null, emfGain = null;
let beeOsc1 = null, beeOsc2 = null;
let emfOsc1 = null, emfOsc2 = null, emfNoise = null;
let isPlaying = false;
let currentEmfFactor = 0.0;

export function initAudio() {
    const toggleBtn = document.getElementById('sound-toggle');
    if (!toggleBtn) return;

    // Check previous session state
    const savedState = sessionStorage.getItem('cyberhive_audio_playing') === '1';

    function unlockAudio() {
        if (!audioCtx) {
            setupAudioEngine();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    ['click', 'keydown', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, unlockAudio, { once: true, passive: true });
    });

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        unlockAudio();
        togglePlayState();
    });

    if (savedState) {
        // Auto-play on first user interaction
        window.addEventListener('click', () => {
            if (!isPlaying) togglePlayState(true);
        }, { once: true });
    }

    // Expose global frequency modulation hook
    window.setAudioEMFFactor = (factor) => {
        currentEmfFactor = Math.max(0, Math.min(1, factor));
        if (emfGain && isPlaying) {
            const targetEmfVol = 0.05 + currentEmfFactor * 0.45;
            emfGain.gain.setTargetAtTime(targetEmfVol, audioCtx.currentTime, 0.1);
        }
    };

    // Audition Triggers in Lab
    setupSoundLabTriggers();
}

function setupAudioEngine() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // 1. Bio-Harmonic Channel (250Hz Bee Flight Humming)
    beeGain = audioCtx.createGain();
    beeGain.gain.setValueAtTime(0.35, audioCtx.currentTime);

    // Fundamental flight frequency: 250Hz
    beeOsc1 = audioCtx.createOscillator();
    beeOsc1.type = 'sawtooth';
    beeOsc1.frequency.setValueAtTime(250, audioCtx.currentTime);

    // 1st Harmonic overtone: 500Hz
    beeOsc2 = audioCtx.createOscillator();
    beeOsc2.type = 'sine';
    beeOsc2.frequency.setValueAtTime(500, audioCtx.currentTime);

    // Warm Lowpass Filter for organic wing buzz
    const beeFilter = audioCtx.createBiquadFilter();
    beeFilter.type = 'lowpass';
    beeFilter.frequency.setValueAtTime(480, audioCtx.currentTime);
    beeFilter.Q.setValueAtTime(2.0, audioCtx.currentTime);

    beeOsc1.connect(beeFilter);
    beeOsc2.connect(beeFilter);
    beeFilter.connect(beeGain);
    beeGain.connect(masterGain);

    beeOsc1.start();
    beeOsc2.start();

    // 2. Datacenter EMF Grid Channel (60Hz Sub-bass & 120Hz Harmonics)
    emfGain = audioCtx.createGain();
    emfGain.gain.setValueAtTime(0.05, audioCtx.currentTime);

    emfOsc1 = audioCtx.createOscillator();
    emfOsc1.type = 'sawtooth';
    emfOsc1.frequency.setValueAtTime(60, audioCtx.currentTime); // 60Hz Power Transformer

    emfOsc2 = audioCtx.createOscillator();
    emfOsc2.type = 'square';
    emfOsc2.frequency.setValueAtTime(120, audioCtx.currentTime);

    const emfFilter = audioCtx.createBiquadFilter();
    emfFilter.type = 'lowpass';
    emfFilter.frequency.setValueAtTime(220, audioCtx.currentTime);

    emfOsc1.connect(emfFilter);
    emfOsc2.connect(emfFilter);
    emfFilter.connect(emfGain);
    emfGain.connect(masterGain);

    emfOsc1.start();
    emfOsc2.start();
}

export function togglePlayState(forcePlay) {
    if (!audioCtx) setupAudioEngine();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const toggleBtn = document.getElementById('sound-toggle');
    const newState = (typeof forcePlay === 'boolean') ? forcePlay : !isPlaying;

    if (newState) {
        masterGain.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.3);
        if (toggleBtn) toggleBtn.classList.remove('muted');
        isPlaying = true;
        sessionStorage.setItem('cyberhive_audio_playing', '1');
    } else {
        masterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.2);
        if (toggleBtn) toggleBtn.classList.add('muted');
        isPlaying = false;
        sessionStorage.setItem('cyberhive_audio_playing', '0');
    }
}

function setupSoundLabTriggers() {
    const btnBee = document.getElementById('audition-bee');
    const btnEmf = document.getElementById('audition-emf');
    const btnCollision = document.getElementById('audition-collision');

    if (!btnBee || !btnEmf || !btnCollision) return;

    function playTone(type) {
        if (!audioCtx) setupAudioEngine();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        g.connect(audioCtx.destination);
        osc.connect(g);

        const now = audioCtx.currentTime;
        g.gain.setValueAtTime(0.0, now);
        g.gain.linearRampToValueAtTime(0.4, now + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        if (type === 'bee') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, now);
        } else if (type === 'emf') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, now);
        } else {
            // Dissonance Collision
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.linearRampToValueAtTime(280, now + 0.9);
            osc.frequency.linearRampToValueAtTime(60, now + 1.8);
        }

        osc.start(now);
        osc.stop(now + 1.9);
    }

    btnBee.addEventListener('click', () => { playTone('bee'); btnBee.classList.add('active'); setTimeout(() => btnBee.classList.remove('active'), 1800); });
    btnEmf.addEventListener('click', () => { playTone('emf'); btnEmf.classList.add('active'); setTimeout(() => btnEmf.classList.remove('active'), 1800); });
    btnCollision.addEventListener('click', () => { playTone('collision'); btnCollision.classList.add('active'); setTimeout(() => btnCollision.classList.remove('active'), 1800); });
}
