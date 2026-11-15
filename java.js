/* ==========================================================
   SEVENS — retro "7" / "seven" spawner
   - one big 7 at a time, alternating left / right side
   - small "seven" words: 2–3 on each side, at random intervals
   - choppy, low-fps, old-cartoon "boiling" motion (see style.css)
   - timing is random every time, so it feels organic
   - clicking a big 7 (not the words) opens adventisti.hr
   - big 7 is lightly warped + blurred for a low-quality look (#seven-warp)
   ========================================================== */
(function () {
    var LINK = "https://adventisti.hr/";
    var COLORS = ["#ffffff", "#c40000"];
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

    // Make a glyph (big 7 = link, words = plain text), measure, place on a side.
    function spawn(text, cls, side, lifeMs) {
        var el;
        if (cls === "big") {
            el = document.createElement("a");
            el.href = LINK;
            el.target = "_blank";
            el.rel = "noopener";
            el.tabIndex = -1;
            var warp = document.createElement("span");
            warp.className = "warp";
            warp.textContent = text;
            el.appendChild(warp);
        } else {
            el = document.createElement("span");
            el.textContent = text;
        }
        el.className = "seven " + cls;
        el.style.color = pick(COLORS);
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
    function bigSeven() {
        var life = randMs(BIG_LIFE);
        if (!document.hidden) {
            spawn("7", "big", bigSide, life);
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
   BOTTOM PICTURES — cycle through them one after another.
   The CSS animation fades each one in and out; when a cycle
   ends (picture is invisible) we swap to the next picture.
   ========================================================== */
(function () {
    var img = document.querySelector(".bottom-pic");
    if (!img) return;
    var pics = [
        "images/bottom.jpg",
        "images/bottom2.jpg",
        "images/bottom3.jpg",
        "images/bottom4.jpg"
    ];
    pics.forEach(function (src) { new Image().src = src; });   // preload
    var i = 0;
    img.addEventListener("animationiteration", function () {
        i = (i + 1) % pics.length;
        img.src = pics[i];
    });
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

    function render() {
        playBtn.textContent = video.paused ? "▶ PLAY" : "❚❚ PAUSE";
        soundBtn.textContent = video.muted ? "SOUND ON" : "SOUND OFF";
    }

    function toggle() {
        if (video.paused) {
            if (video.ended) { lastTime = 0; video.currentTime = 0; }  // replay from start
            video.muted = false;
            video.volume = VOLUME;
            video.play().catch(function () {});
        } else {
            video.pause();
        }
    }

    // try to autoplay with sound; browsers often block that,
    // so fall back to muted autoplay (SOUND ON button turns it on)
    video.play().catch(function () {
        video.muted = true;
        video.play().catch(function () {}).then(render);
    });

    playBtn.addEventListener("click", toggle);
    video.addEventListener("click", toggle);
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
   LIVE SHOW POPUP — shows 2s after the home page loads,
   once per visit/refresh. Click = jump to the live section.
   ========================================================== */
(function () {
    var live = document.getElementById("live");
    if (!live) return;

    setTimeout(function () {
        var pop = document.createElement("div");
        pop.className = "live-pop";
        pop.setAttribute("role", "link");
        pop.tabIndex = 0;
        pop.innerHTML =
            '<span class="live-pop-cross" aria-hidden="true">☦</span>' +
            '<span class="live-pop-text">you want to change your life? check where jo777 is performing.</span>' +
            '<button type="button" class="live-pop-close" aria-label="Close">×</button>';
        document.body.appendChild(pop);

        function close() {
            pop.classList.add("out");
            setTimeout(function () { pop.remove(); }, 500);
        }

        function go() {
            close();
            live.scrollIntoView({ behavior: "smooth", block: "center" });
            live.classList.remove("flash");
            void live.offsetWidth;          // restart the blink
            live.classList.add("flash");
        }

        pop.addEventListener("click", function (e) {
            if (e.target.closest(".live-pop-close")) { close(); return; }
            go();
        });
        pop.addEventListener("keydown", function (e) {
            if (e.key === "Enter") go();
            if (e.key === "Escape") close();
        });
    }, 2000);
})();
