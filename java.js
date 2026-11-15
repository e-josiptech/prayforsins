/* ==========================================================
   SEVENS — retro "7" / "seven" spawner
   - one big 7 at a time, alternating left / right side
   - every 7 seconds: 2–3 small "seven" words on each side
   - choppy, low-fps, old-cartoon "boiling" motion (see style.css)
   - clicking a 7 or "seven" opens Fridays For Future
   ========================================================== */
(function () {
    var LINK = "https://fridaysforfuture.org/";
    var COLORS = ["#ffffff", "#c40000"];
    var SEVEN_EVERY_MS = 7000;
    var BIG_LIFE_MS = 4200;   // how long a big 7 stays (incl. in/out)
    var BIG_GAP_MS = 700;     // pause before the next 7 on the other side
    var WORD_LIFE_MS = 3600;
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

    // Big 7: only one on screen, then it moves to the other side.
    var bigSide = Math.random() < 0.5 ? "left" : "right";
    function bigSeven() {
        if (!document.hidden) {
            spawn("7", "big", bigSide, BIG_LIFE_MS);
            bigSide = bigSide === "left" ? "right" : "left";
        }
        setTimeout(bigSeven, BIG_LIFE_MS + BIG_GAP_MS);
    }

    // Small "seven" words: 2–3 per side every 7 seconds.
    function sevenWords() {
        if (document.hidden) return;
        ["left", "right"].forEach(function (side) {
            var n = 2 + Math.floor(Math.random() * 2);
            for (var i = 0; i < n; i++) {
                setTimeout(function () {
                    spawn("seven", "word", side, WORD_LIFE_MS);
                }, rand(0, 1400));
            }
        });
    }

    function start() {
        setTimeout(bigSeven, 600);
        setTimeout(sevenWords, 1200);
        setInterval(sevenWords, SEVEN_EVERY_MS);
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
