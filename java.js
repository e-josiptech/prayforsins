/* ==========================================================
   SEVENS — retro "7" / "seven" spawner
   - one big 7 at a time, alternating left / right side
   - small "seven" words: 2–3 on each side, at random intervals
   - choppy, low-fps, old-cartoon "boiling" motion (see style.css)
   - timing is random every time, so it feels organic
   - clicking a 7 or "seven" opens adventisti.hr
   ========================================================== */
(function () {
    var LINK = "https://adventisti.hr/";
    var COLORS = ["#ffffff", "#c40000"];
    // all timings are [min, max] in ms — a new random value every time
    var BIG_LIFE = [6000, 9000];   // how long a big 7 stays (incl. in/out)
    var BIG_GAP = [2000, 8000];    // pause before the next 7 on the other side
    var WORD_LIFE = [4500, 7000];  // how long a "seven" stays
    var WORD_GAP = [3000, 10000];  // pause between batches of "seven"s
    var OUT_MS = 500;         // matches the CSS exit animation

    var layer = document.createElement("div");
    layer.className = "sevens-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.insertBefore(layer, document.body.firstChild);

    function rand(min, max) { return min + Math.random() * (max - min); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // Make a clickable glyph, measure it, then drop it on one side.
    function spawn(text, cls, side, lifeMs) {
        var el = document.createElement("a");
        el.href = LINK;
        el.target = "_blank";
        el.rel = "noopener";
        el.tabIndex = -1;
        el.className = "seven " + cls;
        el.textContent = text;
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
