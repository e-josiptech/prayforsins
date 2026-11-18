/* ==========================================================
   SEVENS — retro "7" / "seven" spawner
   - one big 7 at a time, alternating left / right side
   - small "seven" words: 2–3 on each side, at random intervals
   - choppy, low-fps, old-cartoon "boiling" motion (see style.css)
   - timing is random every time, so it feels organic
   - every 2nd big 7 on EACH side is clickable (opens adventisti.hr); words never
   - left side: 3 normal 7s, then the 4th is mirrored (faces the middle)
   - big 7 is lightly warped + blurred for a low-quality look (#seven-warp)
   ========================================================== */
(function () {
    var LINK = "https://adventisti.hr/";
    // all timings are [min, max] in ms — a new random value every time
    var BIG_LIFE = [3000, 5600];   // how long a big 7 stays (incl. in/out)
    var BIG_GAP = [1000, 3000];    // pause before the next 7 on the other side
    var WORD_LIFE = [3000, 5600];  // how long a "seven" stays
    var WORD_GAP = [3000, 10000];  // pause between batches of "seven"s
    var OUT_MS = 500;         // matches the CSS exit animation

    var layer = document.createElement("div");
    layer.className = "sevens-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.insertBefore(layer, document.body.firstChild);

    // SVG filter: wobbly warp + smear, used by .seven.big .warp in style.css
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML =
        '<filter id="seven-warp" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>';
    layer.appendChild(svg);

    function rand(min, max) { return min + Math.random() * (max - min); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // Make a glyph, measure it, place it on a side.
    // opts.link: big 7 opens LINK; opts.mirror: big 7 flipped horizontally
    function spawn(text, cls, side, lifeMs, opts) {
        opts = opts || {};
        var el;
        if (cls === "big") {
            if (opts.link) {
                el = document.createElement("a");
                el.href = LINK;
                el.target = "_blank";
                el.rel = "noopener";
                el.tabIndex = -1;
            } else {
                el = document.createElement("span");
            }
            var warp = document.createElement("span");
            warp.className = opts.mirror ? "warp mirror" : "warp";
            warp.textContent = text;
            el.appendChild(warp);
        } else {
            el = document.createElement("span");
            el.textContent = text;
        }
        el.className = "seven " + cls + (cls === "big" && !opts.link ? " no-link" : "");
        // white or red, picked at random every time (colors in style.css)
        el.classList.add(Math.random() < 0.5 ? "c-white" : "c-red");
        el.style.visibility = "hidden";
        layer.appendChild(el);

        var vw = window.innerWidth, vh = window.innerHeight;
        var r = el.getBoundingClientRect();
        // each side = outer 26% of the screen
        var band = Math.max(vw * 0.26, r.width);
        var x = side === "left"
            ? rand(0, Math.max(0, band - r.width))
            : rand(vw - band, Math.max(vw - band, vw - r.width));
        var y = rand(0, Math.max(0, vh - r.height));

        el.style.left = Math.round(x) + "px";
        el.style.top = Math.round(y) + "px";
        el.style.setProperty("--tilt", rand(-8, 8).toFixed(1) + "deg");
        el.style.visibility = "";

        setTimeout(function () { el.classList.add("out"); }, lifeMs - OUT_MS);
        setTimeout(function () { el.remove(); }, lifeMs);
    }

    function randMs(range) { return Math.round(rand(range[0], range[1])); }

    // Big 7: only one on screen; after it's gone, wait a random pause,
    // then the next one appears on the other side.
    var bigSide = Math.random() < 0.5 ? "left" : "right";
    // counted per side (sides alternate, so a single counter would
    // always put the link on the same side)
    var count = { left: 0, right: 0 };   // every 2nd on each side -> link
                                         // left: 1,2,3 normal, 4th mirrored
    function bigSeven() {
        var life = randMs(BIG_LIFE);
        if (!document.hidden) {
            var n = ++count[bigSide];
            spawn("7", "big", bigSide, life, {
                link: n % 2 === 0,
                mirror: bigSide === "left" && n % 4 === 0
            });
            bigSide = bigSide === "left" ? "right" : "left";
        }
        setTimeout(bigSeven, life + randMs(BIG_GAP));
    }

    // Small "seven" words: 2–3 per side, each batch after a random pause.
    function sevenWords() {
        var longest = 0;
        if (!document.hidden) {
            ["left", "right"].forEach(function (side) {
                var n = 2 + Math.floor(Math.random() * 2);
                for (var i = 0; i < n; i++) {
                    var delay = rand(0, 2500);
                    var life = randMs(WORD_LIFE);
                    longest = Math.max(longest, delay + life);
                    (function (d, l) {
                        setTimeout(function () { spawn("seven", "word", side, l); }, d);
                    })(delay, life);
                }
            });
        }
        setTimeout(sevenWords, longest + randMs(WORD_GAP));
    }

    function start() {
        setTimeout(bigSeven, 600);
        setTimeout(sevenWords, 1200);
    }

    // wait for the gothic font so measurements are right
    if (document.fonts && document.fonts.load) {
        Promise.all([
            document.fonts.load('100px "UnifrakturCook"', "7seven")
        ]).then(start, start);
    } else {
        start();
    }
})();


/* ==========================================================
   MAIN VIDEO — play/pause + sound only.
   No seek bar, no speed menu, quieter volume.
   ========================================================== */
(function () {
    var video = document.querySelector(".main-video");
    if (!video) return;
    var VOLUME = 0.35;          // 35% — quieter than default
    var playBtn = document.querySelector('.player-btn[data-act="play"]');
    var soundBtn = document.querySelector('.player-btn[data-act="sound"]');

    video.volume = VOLUME;
    video.muted = true;         // always start muted — SOUND ON turns it on

    function render() {
        playBtn.textContent = video.paused ? "▶ PLAY" : "❚❚ PAUSE";
        // shows the current state (Russian): muted = "no sound", on = "sound on"
        soundBtn.textContent = video.muted ? "нет звука" : "звук включён";
    }

    function toggle() {
        if (video.paused) {
            if (video.ended) { lastTime = 0; video.currentTime = 0; }  // replay from start
            video.play().catch(function () {});   // keeps the current mute state
        } else {
            video.pause();
        }
    }

    // autoplay muted
    video.play().catch(function () {}).then(render);

    playBtn.addEventListener("click", toggle);   // only the PLAY button plays/pauses
    soundBtn.addEventListener("click", function () {
        video.muted = !video.muted;
        video.volume = VOLUME;
        if (!video.muted && video.paused) video.play().catch(function () {});
        render();
    });

    // keep it at normal speed and stop any seeking
    var lastTime = 0;
    video.addEventListener("timeupdate", function () {
        if (!video.seeking) lastTime = video.currentTime;
    });
    video.addEventListener("seeking", function () {
        if (Math.abs(video.currentTime - lastTime) > 0.5 && !video.ended) {
            video.currentTime = lastTime;
        }
    });
    video.addEventListener("ratechange", function () {
        if (video.playbackRate !== 1) video.playbackRate = 1;
    });
    video.addEventListener("volumechange", function () {
        if (video.volume > VOLUME) video.volume = VOLUME;
        render();
    });
    ["play", "pause", "ended"].forEach(function (e) {
        video.addEventListener(e, render);
    });
    render();
})();


/* ==========================================================
   LIVE SHOW POPUP — shows 1s after the home page loads, next to
   the main video (or at the bottom on narrow screens). Stays until
   clicked; click = jump to the live section. Back on every visit.
   ========================================================== */
(function () {
    var live = document.getElementById("live");
    var player = document.querySelector(".video-wrapper");
    if (!live || !player) return;

    var GAP = 40;          // space between video and bar
    var MIN_W = 300;       // narrower than this -> bottom-of-screen bar
    var MAX_W = 520;
    var V_POS = 0.3;       // bar sits at 30% of the video's height (0.5 = middle)

    setTimeout(function () {
        var pop = document.createElement("div");
        pop.className = "live-pop";
        pop.setAttribute("role", "link");
        pop.tabIndex = 0;
        pop.innerHTML =
            '<span class="live-pop-cross" aria-hidden="true">☦</span>' +
            '<span class="live-pop-text">want to change your life? find out where jo777 is performing!</span>';
        document.body.appendChild(pop);

        // sit in the empty space right of the video when there's room
        function place() {
            var r = player.getBoundingClientRect();
            var left = r.right + GAP;
            var width = Math.min(MAX_W, window.innerWidth - left - 24);
            if (width >= MIN_W) {
                pop.classList.add("docked");
                pop.style.width = width + "px";
                pop.style.left = (left + window.scrollX) + "px";
                pop.style.top = (r.top + window.scrollY + r.height * V_POS - pop.offsetHeight / 2) + "px";
            } else {
                pop.classList.remove("docked");
                pop.style.width = pop.style.left = pop.style.top = "";
            }
        }
        place();
        window.addEventListener("resize", place);
        player.querySelector("video").addEventListener("loadedmetadata", place);

        function go() {
            window.removeEventListener("resize", place);
            pop.classList.add("out");
            setTimeout(function () { pop.remove(); }, 500);
            live.scrollIntoView({ behavior: "smooth", block: "center" });
            live.classList.remove("flash");
            void live.offsetWidth;          // restart the blink
            live.classList.add("flash");
        }

        pop.addEventListener("click", go);
        pop.addEventListener("keydown", function (e) {
            if (e.key === "Enter") go();
        });
    }, 1000);
})();


/* ==========================================================
   SOUNDS
   - "click" (GTA menu): switched OFF for now (set CLICK_SOUND_ON = true)
   - "menu"  (mouse click sound): every click on anything clickable,
             incl. PLAY/PAUSE, but not the other video controls
             (sound button, sliders) so it never mixes into a song
   - "hover" (Windows 7 menu tick): mouse moving onto photos, header,
             links, icons, buttons — like browsing a game menu
   Links that open in the same tab wait a moment so the sound
   is heard before the page changes.
   ========================================================== */
(function () {
    var CLICK_SOUND_ON = false;    // GTA click — off for now (file kept in sounds/)
    var FILES = {
        menu: "sounds/mouseclick.m4a",   // mouse click (was menu-button press)
        hover: "sounds/hover.m4a"
    };
    if (CLICK_SOUND_ON) FILES.click = "sounds/click.m4a";
    var HOVER_VOLUME = 1.09;       // menu "tick" — slightly boosted above the file's own level
    var HOVERABLE = 'a[href], button, [role="link"], .main-video, h1, ' +
        'h3.live, .photo-frame, .small-pic, .bottom-pic';
    var VOLUME = 0.7;              // click sound
    var NAV_DELAY = { click: 220, menu: 220 };
    var CLICKABLE = 'a[href], button, [role="link"]';

    var AC = window.AudioContext || window.webkitAudioContext;
    var ctx = AC ? new AC() : null;
    var buffers = {}, fallbacks = {};

    // load + decode everything up front so clicks play instantly
    Object.keys(FILES).forEach(function (name) {
        if (ctx) {
            fetch(FILES[name])
                .then(function (r) { return r.arrayBuffer(); })
                .then(function (data) {
                    ctx.decodeAudioData(data, function (b) {
                        buffers[name] = b;
                    }, function () {});
                })
                .catch(function () {});
        } else {
            fallbacks[name] = new Audio(FILES[name]);
            fallbacks[name].volume = VOLUME;
        }
    });

    function play(name, volume) {
        var vol = volume || VOLUME;
        if (ctx && buffers[name]) {
            if (ctx.state === "suspended") ctx.resume();
            var src = ctx.createBufferSource();
            var gain = ctx.createGain();
            gain.gain.value = vol;
            src.buffer = buffers[name];
            src.connect(gain).connect(ctx.destination);
            src.start(0);
        } else if (ctx) {
            ctx.resume();
        } else if (fallbacks[name]) {
            fallbacks[name].volume = Math.min(vol, 1);   // old browsers: max 100%
            fallbacks[name].currentTime = 0;
            fallbacks[name].play().catch(function () {});
        }
    }

    // ---- hover: tick once when the mouse moves onto something new ----
    // (mouse only; browsers allow sound only after the first click/tap/key)
    var hovered = null, lastHoverAt = 0;
    document.addEventListener("pointerover", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        var el = e.target.closest && e.target.closest(HOVERABLE);
        if (el === hovered) return;
        hovered = el;
        if (el && Date.now() - lastHoverAt > 60) {
            lastHoverAt = Date.now();
            play("hover", HOVER_VOLUME);
        }
    });

    // ---- clicks ----
    document.addEventListener("click", function (e) {
        var el = e.target.closest && e.target.closest(CLICKABLE);
        if (!el) return;

        var sound = "menu";            // always the mouse click sound
        // video controls stay silent, except PLAY / PAUSE and the sound on/off button
        var isVideoControl = !!el.closest(".player") && !el.matches('[data-act="play"], [data-act="sound"]');

        if (!isVideoControl && (sound !== "click" || CLICK_SOUND_ON)) play(sound);

        // same-tab link: hold the navigation for a moment
        if (el.tagName === "A" && !e.defaultPrevented &&
            el.target !== "_blank" && !el.hasAttribute("download") &&
            !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) && e.button === 0) {
            var href = el.getAttribute("href");
            if (href && href.charAt(0) !== "#") {
                e.preventDefault();
                setTimeout(function () { window.location.href = el.href; }, NAV_DELAY[sound]);
            }
        }
    });
})();


/* ==========================================================
   VIDEO PAGE PLAYERS (music.html) — local mp4s + YouTube.
   Nothing autoplays; sound is ON by default (press PLAY to start).
   PLAY/PAUSE button (YouTube videos: tapping the
   middle works too), seek slider, volume knob, no speed menu.
   Sound on/off + volume are shared by all videos on the page, and
   only one video plays at a time (starting one pauses the others).
   ========================================================== */
(function () {
    var roots = document.querySelectorAll(".mplayer");
    if (!roots.length) return;
    var DEFAULT_VOL = 35;
    var ytRoots = [];

    // phones: tapping anywhere outside the videos hides open controls
    // right away (no waiting for the 3s auto-hide)
    if (window.matchMedia("(hover: none)").matches) {
        document.addEventListener("pointerdown", function (e) {
            if (e.target.closest && e.target.closest(".mplayer")) return;
            document.querySelectorAll(".mplayer.show-ctrl").forEach(function (r) {
                r.classList.add("instant");
                r.classList.remove("show-ctrl");
                setTimeout(function () { r.classList.remove("instant"); }, 250);
            });
        }, { passive: true });
    }
    var all = [];                         // every wired player on the page
    var shared = { muted: false, volume: DEFAULT_VOL };   // sound on by default

    // apply the shared sound settings to every player
    function applySound() {
        all.forEach(function (p) {
            p.api.setVolume(shared.volume);
            p.api.setMuted(shared.muted);
            p.knob.value = shared.volume;
            p.render();
        });
    }

    // wire buttons + knob to a small player "api"
    function wire(root, api) {
        var playBtn = root.querySelector('[data-act="play"]');
        var soundBtn = root.querySelector('[data-act="sound"]');
        var knob = root.querySelector(".vol-knob:not(.seek-knob)");
        var seek = root.querySelector(".seek-knob");
        var timeEl = root.querySelector(".seek-time");
        var dragging = false;

        function fmt(t) {
            t = Math.max(0, Math.floor(t || 0));
            return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2);
        }
        function updateSeek() {
            var d = api.duration(), t = api.currentTime();
            if (!dragging && d > 0) seek.value = Math.round(t / d * 1000);
            timeEl.textContent = fmt(t) + " / " + fmt(d);
        }
        setInterval(updateSeek, 250);
        seek.addEventListener("input", function () {
            dragging = true;
            var d = api.duration();
            if (d > 0) {
                api.seek(seek.value / 1000 * d);
                timeEl.textContent = fmt(seek.value / 1000 * d) + " / " + fmt(d);
            }
        });
        seek.addEventListener("change", function () { dragging = false; });

        // YouTube only: tap the middle of the video to play / pause
        var shield = root.querySelector(".yt-shield");

        // ---- show/hide the controls ----
        // Desktop: CSS shows them while the mouse is over the video.
        // Phones: tap the video to show them; they hide again 3s after
        // the last touch (dragging a slider keeps them up).
        var touch = window.matchMedia("(hover: none)").matches;
        var hideTimer = null;
        function showControls() {
            root.classList.add("show-ctrl");
            clearTimeout(hideTimer);
            hideTimer = setTimeout(function () { root.classList.remove("show-ctrl"); }, 3000);
        }
        var controlsEl = root.querySelector(".player-controls");
        if (touch) {
            controlsEl.addEventListener("pointerdown", showControls);
            controlsEl.addEventListener("input", showControls);
            var videoEl = root.querySelector("video");
            if (videoEl) videoEl.addEventListener("click", showControls);
        }

        // YouTube: tap the middle to play / pause.
        // On phones the first tap only shows the controls.
        if (shield) shield.addEventListener("click", function () {
            if (touch && !root.classList.contains("show-ctrl")) { showControls(); return; }
            if (touch) showControls();
            playBtn.click();
        });

        function render() {
            playBtn.textContent = api.isPaused() ? "▶ PLAY" : "❚❚ PAUSE";
            soundBtn.textContent = api.isMuted() ? "нет звука" : "звук включён";
        }
        api.onChange(render);

        // one song at a time: when this one starts, pause the others
        api.onChange(function () {
            if (api.isPaused()) return;
            all.forEach(function (p) {
                if (p.api !== api && !p.api.isPaused()) p.api.pause();
            });
        });

        playBtn.addEventListener("click", function () {
            if (api.isPaused()) api.play(); else api.pause();
            setTimeout(render, 50);
        });
        soundBtn.addEventListener("click", function () {
            shared.muted = !shared.muted;
            if (!shared.muted && shared.volume === 0) shared.volume = DEFAULT_VOL;
            applySound();
        });
        knob.addEventListener("input", function () {
            shared.volume = +knob.value;
            shared.muted = shared.volume === 0;   // moving the knob up turns sound on
            applySound();
        });

        // join the shared settings (YouTube players may join later)
        all.push({ api: api, knob: knob, render: render });
        api.setVolume(shared.volume);
        api.setMuted(shared.muted);
        knob.value = shared.volume;
        render();
    }

    // ---- local mp4 videos ----
    function localApi(video) {
        video.muted = false;
        video.volume = DEFAULT_VOL / 100;
        video.addEventListener("ratechange", function () {   // no speed change
            if (video.playbackRate !== 1) video.playbackRate = 1;
        });
        return {
            play: function () {
                if (video.ended) video.currentTime = 0;
                video.play().catch(function () {});
            },
            duration: function () { return isFinite(video.duration) ? video.duration : 0; },
            currentTime: function () { return video.currentTime; },
            seek: function (t) { video.currentTime = t; },
            pause: function () { video.pause(); },
            isPaused: function () { return video.paused; },
            isMuted: function () { return video.muted; },
            setMuted: function (m) { video.muted = m; },
            setVolume: function (v) { video.volume = v / 100; },
            onChange: function (fn) {
                ["play", "pause", "ended", "volumechange"].forEach(function (e) {
                    video.addEventListener(e, fn);
                });
            }
        };
    }

    roots.forEach(function (root) {
        if (root.getAttribute("data-kind") === "youtube") { ytRoots.push(root); return; }
        var video = root.querySelector("video");
        wire(root, localApi(video));        // no autoplay — visitor presses PLAY
    });

    // ---- YouTube videos (official IFrame API, no YouTube controls) ----
    if (!ytRoots.length) return;

    function ytApi(root) {
        var player = null, state = -1, muted = false, volume = DEFAULT_VOL;
        var listeners = [];
        function emit() { listeners.forEach(function (fn) { fn(); }); }
        player = new YT.Player(root.querySelector(".yt-frame"), {
            host: "https://www.youtube-nocookie.com",
            videoId: root.getAttribute("data-yt"),
            playerVars: {
                controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3,
                modestbranding: 1, playsinline: 1, rel: 0
            },
            events: {
                onReady: function () {
                    if (muted) player.mute(); else player.unMute();
                    player.setVolume(volume);
                    emit();
                },
                onStateChange: function (e) { state = e.data; emit(); }
            }
        });
        return {
            play: function () { if (player.playVideo) player.playVideo(); },
            duration: function () { return player.getDuration ? player.getDuration() : 0; },
            currentTime: function () { return player.getCurrentTime ? player.getCurrentTime() : 0; },
            seek: function (t) { if (player.seekTo) player.seekTo(t, true); },
            pause: function () { if (player.pauseVideo) player.pauseVideo(); },
            // 1 = playing, 3 = buffering
            isPaused: function () { return state !== 1 && state !== 3; },
            isMuted: function () { return muted; },
            setMuted: function (m) {
                muted = m;
                if (!player.mute) return;
                if (m) player.mute(); else player.unMute();
            },
            setVolume: function (v) {
                volume = v;
                if (player.setVolume) player.setVolume(v);
            },
            onChange: function (fn) { listeners.push(fn); }
        };
    }

    var prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
        if (prevReady) prevReady();
        ytRoots.forEach(function (root) { wire(root, ytApi(root)); });
    };
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
})();


/* ==========================================================
   PLATE SPOTLIGHT — the background plate shows around the
   mouse (eased, so it trails a little) and scrolls slower
   than the page. Phones: follows the finger.
   ========================================================== */
(function () {
    var layer = document.createElement("div");
    layer.className = "plate-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.insertBefore(layer, document.body.firstChild);

    var PARALLAX = 0.35;               // plate moves at 35% of scroll speed
    var EASE = 0.12;                   // how quickly the light catches up
    var tx = window.innerWidth / 2, ty = window.innerHeight * 0.4;
    var x = tx, y = ty, running = false;

    // Mary logo: mostly hidden in the dark, the same light reveals her
    var mary = document.querySelector(".mary-link img");
    function lightMary() {
        if (!mary) return;
        var r = mary.getBoundingClientRect();
        var radius = window.innerWidth <= 600 ? 220 : 340;   // same as the plate light
        var g = "radial-gradient(circle " + radius + "px at " +
                (x - r.left).toFixed(1) + "px " + (y - r.top).toFixed(1) + "px, " +
                "#000 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.06) 100%)";
        mary.style.webkitMaskImage = g;
        mary.style.maskImage = g;
    }

    function frame() {
        x += (tx - x) * EASE;
        y += (ty - y) * EASE;
        layer.style.setProperty("--mx", x.toFixed(1) + "px");
        layer.style.setProperty("--my", y.toFixed(1) + "px");
        lightMary();
        if (Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) {
            requestAnimationFrame(frame);
        } else {
            running = false;
        }
    }
    function moveTo(nx, ny) {
        tx = nx; ty = ny;
        if (!running) { running = true; requestAnimationFrame(frame); }
    }

    window.addEventListener("pointermove", function (e) { moveTo(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("pointerdown", function (e) { moveTo(e.clientX, e.clientY); }, { passive: true });
    window.addEventListener("touchmove", function (e) {
        var t = e.touches[0];
        if (t) moveTo(t.clientX, t.clientY);
    }, { passive: true });

    function onScroll() {
        layer.style.setProperty("--py", (-window.scrollY * PARALLAX).toFixed(1) + "px");
        lightMary();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    frame();
})();
