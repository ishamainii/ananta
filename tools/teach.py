"""The teaching layer for every chamber: how-to-play steps, colour key, why the sound is
what it is, and the guide's question bank. Merged into each chamber's page.json.

    python tools/teach.py && python tools/make_pages.py

Tour steps: t = title, b = body (html), see = what to look at, do = a guide command the
step runs so the scene shows what the step is talking about.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from tours import TOURS            # the short how-to-play steps

RAAG = ("<p>Every chamber plays in <b>Raag Bhupali</b>: five notes, Sa Re Ga Pa Dha, tuned as whole-number "
        "ratios of the home note Sa (138.6 Hz here): <b>1, 9/8, 5/4, 3/2, 5/3</b>. Simple ratios mean the sound "
        "waves line up every few cycles, so they never clash. That lets the math pick any note it likes and it "
        "still sounds like music. Underneath, a tanpura drone holds Sa and Pa, and a bansuri improvises in the "
        "same raag. The santoor and the singing bowl are the ones the math plays.</p>")

COMMON_FAQ = [
    {"k": ["bhupali", "raag", "raga", "scale"], "q": "why raag bhupali?",
     "a": "Bhupali uses five notes, Sa Re Ga Pa Dha, tuned as the ratios 1, 9/8, 5/4, 3/2 and 5/3. It has no half-steps, so any note the math picks sounds consonant against the drone."},
    {"k": ["frequency", "frequencies", "hz", "hertz", "ratio", "tuning"], "q": "how are the frequencies chosen?",
     "a": "Sa is 138.6 Hz. Every other note is Sa times a whole-number ratio (9/8, 5/4, 3/2, 5/3) or that times a power of 2 for higher octaves. Which note plays is chosen by a number in the scene. Open 'why this sound' to watch it live."},
    {"k": ["glow", "trip", "background", "psychedelic", "light", "kaleidoscope"], "q": "what is the background?",
     "a": "The haze behind the math is a kaleidoscope shader. Its symmetry follows the chamber's math, but it's decoration. Say 'glow 0' to switch it off and see only the math."},
    {"k": ["who made", "who built", "isha", "author"], "q": "who made this?",
     "a": "Isha Maini, a data science student at Emory. Each chamber's math is written and tested in Python and JavaScript before it's drawn."},
]


def notes_link(text):
    return text


CH = {}

CH["pingala"] = dict(
    glow="45",
    legend=[["#fff0d6", "corner = one meter, labelled । light ऽ heavy"], ["#ffcf6b", "edge that flips syllable 1"],
            ["#ff8a3d", "flips syllable 2"], ["#ff5c8a", "flips syllable 3"], ["#b08cff", "flips syllable 4"],
            ["#5fd4ff", "flips syllable 5"], ["#5fe3b2", "flips syllable 6"], ["#ffd27a", "gold spark: walks through every meter"]],
    tutorial=[
        {"t": "A meter is a pattern of light and heavy", "do": "show 3 dimensions",
         "b": "Sanskrit verse is built from syllables that are either <b>laghu</b>, light (।), or <b>guru</b>, heavy (ऽ). Over 2,000 years ago Pingala listed every possible pattern. With 3 syllables there are 8: ।।।, ।।ऽ, ।ऽ।, and so on.",
         "see": "the 8 labels on the cube's corners. That's every 3-syllable meter, once each."},
        {"t": "Light = 0, heavy = 1", "do": "show 3 dimensions",
         "b": "Write ऽ as 0 and । as 1, read the digits right to left, and a meter becomes a binary number. Pingala's rules for listing all the meters (prastāra) and for finding a meter's place in that list (uddiṣṭa) then work exactly like counting in binary. Give each syllable its own direction in space and each meter becomes a corner: 3 syllables, 3 directions, a cube.",
         "see": "the first symbol of each label changes when you cross the cube one way, the second when you cross it another."},
        {"t": "An edge changes one syllable", "do": "show 3 dimensions",
         "b": "Two corners are joined only if their meters differ in exactly one syllable. The edge's colour says which syllable. Gold edges flip the first syllable, orange the second, rose the third. The key at the bottom left lists them.",
         "see": "pick a gold edge and compare the labels at its two ends. Only the first symbol differs."},
        {"t": "Follow the spark", "do": "show 3 dimensions",
         "b": "The gold spark visits every meter exactly once, changing one syllable per step (a Gray code). The big symbols at the bottom show the meter it's on, and the syllable that just changed glows. Each step plays a note: more heavy syllables means a higher note.",
         "see": "the bottom caption, and listen: the pitch climbs as heavy syllables appear."},
        {"t": "One more syllable, one more dimension", "do": "show 4 dimensions",
         "b": "With 4 syllables there are 16 meters, and you need a 4th direction: a <b>tesseract</b>. A screen can only show 3, so it's drawn the way a photo shows a 3D box, with the far side smaller. That's why you see a cube inside a cube.",
         "see": "the violet edges joining the inner cube to the outer one. They flip syllable 4: the inner cube is every meter ending in one way, the outer cube the other."},
        {"t": "Turning through the 4th dimension", "do": "turn syllables 1 and 4",
         "b": "In 4D you don't rotate around an axis, you rotate in a <b>plane</b>, two directions at once. This turns the plane of syllables 1 and 4: the inner and outer cubes swap places. The faint panes show the squares lying in that plane. Drag the scene to turn the ordinary 3 directions yourself.",
         "see": "the inner cube grow outward while the outer one shrinks in. No edge ever breaks."},
        {"t": "Count everything with Meru", "do": "show 5 dimensions",
         "b": "How many squares, cubes, edges? A k-dimensional face frees k syllables and fixes the rest: C(n,k)·2ⁿ⁻ᵏ. The C(n,k) come from the <b>meru-prastāra</b>, the stepped 'mountain' Halāyudha read out of Pingala's rules, centuries before Pascal. The tesseract has 16 corners, 32 edges, 24 squares and 8 cubes.",
         "see": "now 5 syllables, 32 meters. Ask the guide 'show me 7 dimensions', or press n for the full working."},
    ],
    sound="<p><b>The spark sings the meter.</b> At each step a santoor note plays, pitched by <b>how many heavy syllables</b> the meter has: ।।।। sits at the bottom, every extra ऽ is one step up the scale, ऽऽऽऽ at the top. Because the walk changes one syllable at a time, the melody only ever moves one step up or down. You're hearing the Gray code.</p><p>A singing bowl rings each time a new plane starts turning.</p>" + RAAG,
    faq=[
        {"k": ["guru", "laghu", "heavy", "light", "syllable"], "q": "what is a guru syllable?",
         "a": "Laghu (।) is a light, short syllable; guru (ऽ) is heavy, either a long vowel or a short one followed by two consonants. Sanskrit meters are patterns of the two."},
        {"k": ["binary", "0", "1", "zero"], "q": "how is this binary?",
         "a": "Any two-symbol code works: with 2 choices per syllable there are 2ⁿ meters of n syllables. Pingala's prastāra lists them in an order that matches binary counting if guru = 0, laghu = 1 and the digits are read right to left; his uddiṣṭa rule recovers a meter's position the same way."},
        {"k": ["dimension", "4d", "fourth", "tesseract", "hypercube"], "q": "what is the 4th dimension here?",
         "a": "Each syllable is one direction. 4 syllables need 4 directions, so the meters sit on the corners of a 4D cube. The screen shows a perspective shadow of it, the way a drawing shows a 3D box."},
        {"k": ["cube inside", "inner", "outer", "projection", "smaller"], "q": "why is there a cube inside a cube?",
         "a": "That's perspective in the 4th direction: the half of the tesseract that's further away in 4D is drawn smaller. Inner cube: syllable 4 one way. Outer cube: the other."},
        {"k": ["spark", "walk", "gray", "path", "gold"], "q": "what is the gold spark doing?",
         "a": "Walking a reflected Gray code: every meter once, one syllable changed per step, g(i) = i XOR (i >> 1). It's a Hamiltonian cycle on the hypercube."},
        {"k": ["colour", "color", "edge", "joined"], "q": "what do the edge colours mean?",
         "a": "An edge joins two meters that differ in one syllable, and its colour says which: gold 1st, orange 2nd, rose 3rd, violet 4th, blue 5th, green 6th, cream 7th."},
        {"k": ["meru", "pascal", "triangle", "faces", "count"], "q": "what is the meru prastara?",
         "a": "A stepped triangle of numbers, the binomial coefficients, that Halāyudha read out of Pingala's sutras in the 10th century. It counts meters with k heavy syllables, and also the faces of the n-cube: C(n,k)·2ⁿ⁻ᵏ."},
        {"k": ["pingala", "who", "when", "chandas"], "q": "who was pingala?",
         "a": "The author of the Chandaḥśāstra, a treatise on Sanskrit prosody from around the 3rd to 2nd century BCE. Halāyudha's 10th-century commentary spells out the combinatorics."},
    ],
)

CH["madhava"] = dict(
    glow="45",
    legend=[["#ffcf6b", "chain: each link is one term, length 1/(2k+1)"], ["--#ffd27a", "π/4, where the series is heading"],
            ["#ffd27a", "gold dot: estimate with Mādhava's correction"], ["#fff0d6", "white dot: the plain sum so far"],
            ["#ff5c8a", "swing view, rose: plain sums"], ["#ffd27a", "swing view, gold: corrected sums"]],
    tutorial=[
        {"t": "π as a sum that never ends", "do": "twist 180, 3 terms",
         "b": "Mādhava, in 14th-century Kerala: π/4 = 1 − 1/3 + 1/5 − 1/7 + … forever. Here each term is a <b>link</b> in a chain: forward 1, back 1/3, forward 1/5.",
         "see": "three links folded along a line. Forward, back, forward."},
        {"t": "Closing in, slowly", "do": "12 terms",
         "b": "Each new link overshoots the target, then undershoots, by less each time. The dashed line marks π/4, where it's heading. It converges slowly. 1,000 terms give only 3 correct digits of π.",
         "see": "the white tip of the chain bouncing either side of the dashed line."},
        {"t": "Mādhava's trick: guess the leftover", "do": "correction 3",
         "b": "When you stop after n terms, you throw away an infinite tail. Mādhava found its size is predictable, so you add a <b>correction</b> to the last term. His sharpest one is (n²+1) / (n(4n²+5)).",
         "see": "the gold dot: the corrected estimate, sitting almost exactly on π/4."},
        {"t": "Count the digits", "do": "25 terms",
         "b": "Top left, the four rows show the same 25 terms with no correction and with each of Mādhava's three corrections. Without: off by 0.04. With the sharpest: off by about 10⁻¹⁰. Bright digits are correct.",
         "see": "the digit counts on the right of each row."},
        {"t": "A microscope on π", "do": "swing view, play",
         "b": "In the swing view each estimate is a ray, magnified so the error is visible. Rose rays are the plain sums: they swing wide. Gold rays have the correction: they land on π and stay. The magnification keeps growing, like zooming in forever.",
         "see": "the rose fan wobbling while the gold ray sits still on the white π dot."},
        {"t": "Unfold the chain", "do": "chain view, twist 120",
         "b": "Turn each link 120° from the last, not 180°, and the same series curls into a spiral. It's Mādhava's arctangent series evaluated around the unit circle. 180° is the one special angle where it folds flat into π.",
         "see": "the spiral. Say 'twist 150' or 'twist 90' to try others, or 'play' to let it breathe."},
    ],
    sound="<p><b>Each term is a note.</b> Every new term plucks a santoor string. The series alternates plus and minus, and so does the music: <b>minus terms play three notes higher in the raag</b> (from Sa that's Pa, × 3/2). That's why you hear a back-and-forth. Every 8 terms the base note climbs one step.</p><p>A singing bowl rings <b>every time π gains a correct digit</b>. With the correction on, the bowl rings often at first, then the digits run out of room on screen.</p>" + RAAG,
    faq=[
        {"k": ["madhava", "who", "kerala", "when"], "q": "who was madhava?",
         "a": "Mādhava of Saṅgamagrāma (c. 1340–1425), founder of the Kerala school of astronomy and mathematics. His results survive through Nīlakaṇṭha's Tantrasaṅgraha and Jyeṣṭhadeva's Yuktibhāṣā."},
        {"k": ["leibniz", "gregory", "europe"], "q": "isn't this the leibniz series?",
         "a": "Europe calls it the Gregory–Leibniz series, from the 1670s, roughly 250 years after Mādhava."},
        {"k": ["correction", "antya", "leftover", "tail"], "q": "what is the correction?",
         "a": "Stop after n terms and add (−1)ⁿ·F(n) to the sum. The Yuktibhāṣā gives F = 1/(4n), then n/(4n²+1), then (n²+1)/(n(4n²+5)). Each one is far sharper than the last."},
        {"k": ["slow", "converge", "digits", "how many"], "q": "how fast does it converge?",
         "a": "Plain series: 1,000 terms for 3 digits. With the sharpest correction, 25 terms give about 10 digits."},
        {"k": ["twist", "spiral", "angle", "circle"], "q": "why does the chain twist?",
         "a": "Each link turns by an angle θ from the last. The chain's end is Σ zᵏ/(2k+1) with z = e^{iθ}. At 180°, z = −1 and it folds onto Mādhava's series for π/4."},
        {"k": ["swing", "rays", "magnif"], "q": "what is the swing view?",
         "a": "Each estimate of π is a ray, its error magnified until the plain sums swing about ±60°. Rose: plain sums. Gold: with the correction, landing on π."},
    ],
)

CH["chakravala"] = dict(
    glow="40",
    legend=[["#ffd27a", "the path of the wheel, one turn per stop"], ["#ff5c8a", "a stop: label shows k, petal size is |k|"],
            ["#fff0d6", "white: k = 1, solved"], ["rgba(255,210,122,.5)", "rings: further out = more digits in a"]],
    tutorial=[
        {"t": "The puzzle", "do": "solve N = 61",
         "b": "Find whole numbers x and y with <b>x² − 61·y² = 1</b>. Try y = 1, 2, 3… nothing works for a very long time. The smallest answer is x = 1,766,319,049. Fermat posed this as a challenge in 1657. Bhāskara II had solved it around 1150.",
         "see": "the wheel starting to turn for N = 61."},
        {"t": "Start with a near miss",
         "b": "The wheel (chakravāla) keeps three numbers a, b, k with <b>a² − N·b² = k</b>. k is how far you are from solved. Start with a near √61: 8² − 61·1² = 3, so k = 3.",
         "see": "the first line of the readout, top left: start a=8 b=1 k=3."},
        {"t": "One turn of the wheel",
         "b": "Each turn picks a helper number m: k must divide a + b·m, and m² should be as close to N as possible. Then a, b and k are replaced by (am + Nb)/|k|, (a + bm)/|k| and (m² − N)/k. Each stop on the wheel is one turn, labelled with its new k.",
         "see": "the k labels. They stay small, never growing out of control."},
        {"t": "Why it never breaks",
         "b": "After every turn a² − N·b² still equals k exactly. That's Brahmagupta's composition rule (bhāvanā, 628 CE), divided through by k². The big line at the bottom checks it live with the real numbers.",
         "see": "the bottom equation: a² − 61·b² = k, true at every turn."},
        {"t": "Closing the wheel",
         "b": "When k reaches 1, a² − N·b² = 1: solved. A bowl rings and the wheel blooms. Along the way a/b is a fraction closing in on √N. The readout shows its digits locking in. Stops further from the centre have more digits.",
         "see": "the last stop turning white, and a/b next to √61 in the readout."},
        {"t": "Try a monster", "do": "solve N = 991",
         "b": "For N = 991 the smallest x has 30 digits. The wheel still finds it in a few dozen turns. Pick any N from the menu, or ask the guide 'solve N = 433'.",
         "see": "how far out the stops go: those are 30-digit numbers."},
    ],
    sound="<p><b>You hear k.</b> Each turn plucks a note whose pitch is set by <b>how big k is</b>: about log₂|k| steps up the scale. Big near-misses sound high and small ones low, so as the wheel homes in, the melody settles down.</p><p>When <b>k = 1</b> two bowls ring together, on Sa and an octave and a fifth above (× 3): the equation is solved.</p>" + RAAG,
    faq=[
        {"k": ["pell", "equation", "vargaprakrti", "x²", "puzzle"], "q": "what is pell's equation?",
         "a": "x² − N·y² = 1 in whole numbers, for N not a perfect square. Indian mathematicians called it vargaprakṛti. Europe named it after Pell by mistake."},
        {"k": ["what is k", "k mean", "near miss", "why k"], "q": "what is k?",
         "a": "k = a² − N·b², how far the current pair (a, b) is from solving the equation. The wheel ends when k = 1."},
        {"k": ["helper", "choose m", "pick m", "what is m", "m chosen"], "q": "how is m chosen?",
         "a": "m must make k divide a + b·m, and among those, m² should be as close to N as possible. That keeps the next k small."},
        {"k": ["bhavana", "brahmagupta", "composition", "invariant"], "q": "what is the bhavana?",
         "a": "Brahmagupta's composition rule (628 CE): combine two solutions of x² − Ny² = k into a solution for the product of their k's. Each turn uses it, then divides by k²."},
        {"k": ["fermat", "1657", "challenge"], "q": "what about fermat?",
         "a": "In 1657 Fermat challenged European mathematicians with N = 61. Bhāskara II's Bījagaṇita had the answer around 1150."},
        {"k": ["fast", "steps", "how many turns", "selenius"], "q": "how fast is it?",
         "a": "For N = 61 this plain version takes 13 turns. Selenius (1975) showed the chakravāla is a shortest-possible continued-fraction method."},
    ],
)

CH["ramanujan"] = dict(
    glow="60",
    legend=[["linear-gradient(90deg,#ff5c8a,#ffcf6b,#5fe3b2,#5fd4ff,#b08cff)", "colour: the angle (phase) of P(q)"],
            ["#efe6d6", "bright bands: where |P(q)| is constant"], ["#ffd27a", "rim: |q| = 1, a wall of infinities"]],
    tutorial=[
        {"t": "Partitions", "do": "partitions of 4",
         "b": "A <b>partition</b> of n is a way to split n into whole numbers, ignoring order. 4 = 3+1 = 2+2 = 2+1+1 = 1+1+1+1, plus 4 itself, so p(4) = 5.",
         "see": "the big number at the bottom: p(4) = 5."},
        {"t": "They explode", "do": "partitions of 200",
         "b": "p(10) = 42. p(100) = 190,569,292. p(200) is almost four trillion. Here they're counted exactly with Euler's pentagonal-number recurrence, using arbitrary-size integers.",
         "see": "p(200) = 3,972,999,029,388."},
        {"t": "Fold every p(n) into one function", "do": "whole disk",
         "b": "Hardy and Ramanujan packed all the p(n) into P(q) = Σ p(n)qⁿ = ∏ 1/(1 − qᵏ). The disk is every complex number q with |q| &lt; 1. Each pixel is one q, coloured by the <b>angle</b> of P(q). The bright bands join points where |P| is the same size.",
         "see": "calm colour near the centre, frantic colour near the rim."},
        {"t": "The wall", "do": "dive toward 0/1",
         "b": "Each factor 1/(1 − qᵏ) blows up at the k-th roots of unity, points evenly spaced on the rim. With infinitely many factors the whole rim is a wall of blow-ups. The biggest is at q → 1, on the right.",
         "see": "colour and bands piling up infinitely fast as you near the edge."},
        {"t": "Reading p(n) off the explosions", "do": "dive toward 1/2",
         "b": "The <b>circle method</b>: the size of each blow-up tells you about p(n). The one at q → 1 alone gives p(n) ≈ e^{π√(2n/3)} / (4n√3). The readout divides the exact p(n) by that estimate, and it creeps toward 1. Smaller blow-ups like this one at −1 (a/b = 1/2) supply the corrections.",
         "see": "'ratio exact / estimate' in the top-left readout."},
        {"t": "The mod 5 miracle", "do": "play",
         "b": "Ramanujan noticed p(4), p(9), p(14)… every p(5k + 4) is divisible by 5. Also p(7k + 5) by 7 and p(11k + 6) by 11. As n counts up, the readout turns green and a bowl rings on each 5k + 4.",
         "see": "the green flash and the bowl every fifth number."},
    ],
    sound="<p><b>Five notes, mod 5.</b> As n counts up, the note is chosen by <b>n mod 5</b>. Bhupali has exactly five notes, so the melody walks Sa Re Ga Pa Dha and repeats every 5 numbers, an octave higher for the second half of each ten. So n = 5k + 4 always lands on Dha.</p><p>That's the point: the bowl rings on every <b>n = 5k + 4</b>, exactly the numbers whose p(n) Ramanujan proved divisible by 5. You can hear the congruence.</p>" + RAAG,
    faq=[
        {"k": ["partition", "p(n)", "split"], "q": "what is a partition?",
         "a": "A way of writing n as a sum of positive whole numbers, order ignored. p(4) = 5: 4, 3+1, 2+2, 2+1+1, 1+1+1+1."},
        {"k": ["colour", "color", "domain", "phase", "pixel"], "q": "what do the colours mean?",
         "a": "Each pixel is a complex number q. Its colour is the angle of P(q) and the bright bands are curves where |P(q)| is constant. That's called domain colouring."},
        {"k": ["root of unity", "roots", "edge", "rim", "wall", "boundary"], "q": "why is the edge so wild?",
         "a": "1/(1 − qᵏ) is infinite at every k-th root of unity, and P multiplies infinitely many of these, so every rational point of the rim is a singularity. That's a natural boundary."},
        {"k": ["circle method", "hardy", "estimate", "formula", "asymptotic"], "q": "what is the circle method?",
         "a": "Hardy and Ramanujan (1918) recover p(n) from an integral of P(q) around a circle just inside the rim. Near each root of unity P behaves predictably, and the biggest piece, at q → 1, gives p(n) ≈ e^{π√(2n/3)}/(4n√3)."},
        {"k": ["mod 5", "divisible", "congruence", "5k"], "q": "what is the mod 5 miracle?",
         "a": "p(5k+4) is always divisible by 5, p(7k+5) by 7 and p(11k+6) by 11. Ramanujan found these; the bowl rings on every 5k+4."},
        {"k": ["ramanujan", "who", "when"], "q": "who was ramanujan?",
         "a": "Srinivasa Ramanujan (1887–1920), largely self-taught, who worked with G. H. Hardy at Cambridge. The partition formula is from their 1918 paper."},
    ],
)

CH["sriyantra"] = dict(
    glow="40",
    legend=[["#ffcf6b", "Śiva triangles, pointing up (4)"], ["#ff5c8a", "Śakti triangles, pointing down (5)"],
            ["#5fe3b2", "green: three lines meet exactly"], ["#ff5c8a", "swelling rose dot: they miss (size = error)"],
            ["#fff0d6", "the bindu, centre point"]],
    tutorial=[
        {"t": "Nine triangles", "do": "reset",
         "b": "The Śrī Yantra interlocks nine triangles: four point up (Śiva, gold) and five point down (Śakti, rose). It's famous for being very hard to draw correctly by hand.",
         "see": "the gold and rose triangles, mirrored left and right."},
        {"t": "What 'correct' means",
         "b": "In a correct yantra, again and again, <b>three lines pass through a single point</b>. There are 11 of these triple points on each half. Miss one by a hair and the drawing is off. Each green dot is one of them, exact.",
         "see": "the 11 green dots (22 counting the mirror side)."},
        {"t": "Make it an equation",
         "b": "Each triangle is set by its height, base width and apex: 16 unknowns. Three lines meet at one point exactly when a 3×3 determinant is zero, so that's 11 equations. 16 − 11 leaves 5 free choices: there isn't one yantra, there's a 5-parameter family.",
         "see": "the readout, top left: unknowns 16, equations 11, free choices 5."},
        {"t": "Break it", "do": "scramble it",
         "b": "This knocks every triangle out of place. The triple points stop meeting: their dots turn rose and swell. The size of each dot is how badly its three lines miss.",
         "see": "the swollen rose dots."},
        {"t": "Newton's method fixes it",
         "b": "Each step linearises all 11 equations and solves them together, then checks it hasn't made things worse. The graph at the bottom left is the error per step on a log scale. It falls off a cliff, because Newton's method roughly doubles the correct digits each step.",
         "see": "the dots shrink and turn green one by one, and the curve drops to 10⁻¹⁶."},
        {"t": "A family, not one drawing", "do": "show another yantra",
         "b": "This changes one of the 5 free heights and solves again. The result is a different yantra that is still exact. Traditional yantras vary, and this is why: the conditions leave room.",
         "see": "the triangles shift, and every point is still green."},
    ],
    sound="<p><b>The pitch is the precision.</b> Each Newton step plucks a note that rises with <b>how many digits of the solution are exact</b> (−log₁₀ of the error). While solving, the notes climb fast, which is the quadratic convergence you can see in the graph.</p><p>The bowl rings when <b>all eleven triple points are exact</b> to 10⁻¹².</p>" + RAAG,
    faq=[
        {"k": ["concurren", "triple", "three lines", "meet"], "q": "what is a triple point?",
         "a": "A point where three lines of the yantra pass through exactly one spot. There are 11 per half, and they're what makes it hard to draw."},
        {"k": ["determinant", "equation", "det"], "q": "how is it an equation?",
         "a": "Write each line as Ax + By + C = 0. Three lines meet at one point exactly when the 3×3 determinant of their (A, B, C) rows is zero."},
        {"k": ["newton", "solve", "converge", "jacobian"], "q": "how does newton's method work here?",
         "a": "Hold the 5 free heights fixed, linearise the 11 equations with a finite-difference Jacobian, solve for a step, and halve it if the error would grow. A few steps reach 10⁻¹⁶."},
        {"k": ["free", "family", "five", "parameters", "unknowns"], "q": "why 5 free choices?",
         "a": "16 unknowns (9 heights, 7 widths) minus 11 equations leaves 5. Fix any 5 heights and the rest of the yantra is determined."},
        {"k": ["shiva", "shakti", "up", "down"], "q": "why up and down triangles?",
         "a": "Traditionally, the four upward triangles are Śiva and the five downward ones are Śakti. Their interlocking is the yantra's meaning."},
        {"k": ["correct", "real", "true", "tahta", "kulaichev"], "q": "is this the real yantra?",
         "a": "It's one well-defined mathematical idealisation, following Kulaichev (1984). Traditional yantras vary, and Tahta (1992) questions some claims about the geometry."},
    ],
)

CH["tatkalika"] = dict(
    glow="40",
    legend=[["#5fd4ff", "earth, at the centre"], ["#ffd27a", "mean planet: moves at constant speed"],
            ["#ff8a3d", "epicycle arm"], ["#fff0d6", "true planet, and its trail"],
            ["#b08cff", "E(M): the correction over one lap"], ["#5fe3b2", "tangent turns green where the rate is zero"]],
    tutorial=[
        {"t": "Planets don't move evenly",
         "b": "In the Indian model, an imaginary <b>mean planet</b> goes round the earth at a steady speed (gold, on the big circle). The <b>true planet</b> rides a small circle, an epicycle, around it (white). So sometimes the real planet runs ahead and sometimes it lags.",
         "see": "the labels: earth, mean planet, true planet."},
        {"t": "The correction", "do": "epicycle 0.32",
         "b": "True place = mean place + a correction E, the <b>equation of centre</b>. E depends on M, how far round the epicycle the planet is. The purple curve on the right is E over one full lap.",
         "see": "the dot on the purple curve moving as the planet goes round."},
        {"t": "Speed at one instant",
         "b": "Bhāskara II (1150) separated average daily motion from the speed <b>at an instant</b>: tātkālika gati. It's the slope of E right now, the tangent line on the curve. True speed = mean speed × (1 + dE/dM).",
         "see": "the tangent line, and 'true speed / mean speed' in the readout."},
        {"t": "Where the correction peaks", "do": "go to 90 degrees",
         "b": "At M = 90° the correction is at its largest and the tangent is flat: the rate of change is zero. Bhāskara notes the mean speed is exact there. Today we write it as f′(x) = 0 at a maximum.",
         "see": "the tangent turning green and flat, and dE/dM = 0."},
        {"t": "Climbing with only the slope",
         "b": "The green bead knows nothing but the slope where it stands. It steps uphill, a little at a time, and always stops where the slope is zero. That's <b>gradient ascent</b>, the same idea used to train every neural network.",
         "see": "the green bead settling at the top of the curve."},
        {"t": "A bigger epicycle", "do": "epicycle 0.6",
         "b": "A bigger epicycle means a bigger correction, a steeper curve and a wilder rosette. The rosette is the orbit drawn from a slowly turning viewpoint; the physics doesn't change.",
         "see": "the taller purple curve. Try 'epicycle 0.15' for a nearly circular orbit."},
    ],
    sound="<p><b>The pitch is the planet's speed.</b> Every 0.7 seconds a note plays whose height is <b>4 × (true speed ÷ mean speed)</b>. When the planet runs fast the note is high; when it lags, low. Over one lap you hear the speed rise and fall like the purple curve's slope.</p><p>The bowl rings at the instant <b>dE/dM = 0</b>, the extreme, where true speed equals mean speed.</p>" + RAAG,
    faq=[
        {"k": ["tatkalika", "instant", "gati", "instantaneous"], "q": "what is tatkalika gati?",
         "a": "Bhāskara II's term for a planet's speed at a single instant, as opposed to its average daily motion. In modern terms it's a derivative."},
        {"k": ["epicycle", "deferent", "small circle"], "q": "what is an epicycle?",
         "a": "A small circle (radius r) whose centre moves round a big circle (radius R). The planet rides the small one. Here r/R sets how lopsided the motion is."},
        {"k": ["equation of centre", "correction", "e(m)"], "q": "what is the equation of centre?",
         "a": "The correction added to the mean position to get the true one: E(M) = −arcsin((r/R)·sin M)."},
        {"k": ["derivative", "calculus", "newton", "leibniz"], "q": "is this calculus?",
         "a": "It's an early form of the derivative and of the rule that it vanishes at an extremum, about 500 years before Newton and Leibniz, but without their general theory."},
        {"k": ["bead", "gradient", "neural", "optimi"], "q": "what is the green bead?",
         "a": "A gradient-ascent climber: it only knows the instantaneous slope dE/dM and keeps stepping uphill with a bit of momentum. It always stops where the slope is zero."},
        {"k": ["rosette", "flower", "trail"], "q": "why is the orbit a flower?",
         "a": "It's drawn from a frame that turns a little slower than the mean planet, so each lap lands slightly rotated. Only the viewpoint turns; the motion is the same."},
    ],
)

CH["purna"] = dict(
    glow="60",
    legend=[["linear-gradient(90deg,#ffcf6b,#ff5c8a,#b08cff)", "I: the mandala, containing itself at every scale"],
            ["#5fd4ff", "II: rings of seeds, ×10 each ring"], ["#ff5c8a", "III: 1 ÷ x as x slides to 0"],
            ["#ffd27a", "III: khahara, the quantity divided by zero"]],
    tutorial=[
        {"t": "Three ways to hold the infinite", "do": "show purna",
         "b": "Long before set theory, Indian thinkers argued about the infinite. This chamber has three movements; the buttons at the bottom switch between them. First, <b>pūrṇa</b>, the whole: 'from the whole the whole arises; taking the whole from the whole, the whole remains.'",
         "see": "the verse along the bottom, and the zoom that never reaches a floor."},
        {"t": "A whole inside the whole",
         "b": "The mandala contains a copy of itself, which contains a copy… forever (a Droste spiral). Take the outer ring away and what's left looks exactly the same. Infinite sets do this too: remove all the even numbers from the whole numbers and you still have as many as you started with.",
         "see": "the rings flowing inward and never running out."},
        {"t": "Too many to count", "do": "jaina",
         "b": "Jaina mathematics sorted numbers into <b>enumerable</b>, <b>innumerable</b> and <b>infinite</b>, and recognised several different kinds of infinity. Here each ring holds ten times the seeds of the one inside it: 10, 100, 1,000…",
         "see": "the labels beside each ring, until the seeds can't be drawn one by one."},
        {"t": "Dividing by zero", "do": "show khahara",
         "b": "Bhāskara II named a quantity divided by zero <b>khahara</b>. The curve is 1 ÷ x as x slides toward 0: it shoots up without limit. His rule: add to khahara or take away from it and it doesn't change.",
         "see": "the gold beam, and the line: khahara + 1000 = khahara."},
        {"t": "The honest footnote",
         "b": "This isn't modern analysis: today 1/0 is left undefined, and we'd say 1/x grows without bound as x → 0⁺. But Bhāskara's rule says exactly how infinity swallows finite additions, an idea Cantor's arithmetic made precise 700 years later.",
         "see": "the notebook (press n) for the sources."},
    ],
    sound="<p><b>Each movement has its own rule.</b> I, pūrṇa: every note is <b>Sa</b> in a different octave, the same whole at a different scale. II, Jaina: the notes <b>count up the scale</b>, ten to a ring, then start again an octave… the counting never ends. III, khahara: <b>one note that never changes</b>, whatever is added around it.</p><p>Switching movement rings a bowl on harmonic 2, 3 or 4 of Sa (× 2, × 3, × 4), the first rungs of the infinite overtone ladder inside every note.</p>" + RAAG,
    faq=[
        {"k": ["purna", "whole", "verse", "upanishad", "brihad"], "q": "what does the verse mean?",
         "a": "From the Bṛhadāraṇyaka Upaniṣad 5.1.1: that is whole, this is whole; from the whole the whole arises; taking the whole from the whole, the whole remains. It's a spiritual statement, but it describes infinite sets well."},
        {"k": ["droste", "spiral", "mandala", "zoom", "self-similar"], "q": "how is the mandala made?",
         "a": "In log coordinates the pattern repeats every time the radius grows by 3.2, with a twist of one full turn per repeat, so the rings fuse into one endless spiral."},
        {"k": ["jaina", "innumerable", "enumerable", "sankhyata", "infinities"], "q": "what is jaina infinity?",
         "a": "Jaina texts class numbers as saṅkhyāta (enumerable), asaṅkhyāta (innumerable) and ananta (infinite), with several kinds of infinity: in one direction, two, an area, everywhere, perpetually."},
        {"k": ["khahara", "zero", "divide", "division"], "q": "what is khahara?",
         "a": "Bhāskara II's name, in the Bījagaṇita (1150), for a quantity with zero as its divisor. Adding or subtracting doesn't change it."},
        {"k": ["cantor", "set theory", "modern"], "q": "how does this relate to modern math?",
         "a": "Cantor (1870s–90s) showed infinite sets can have equal size to their parts and come in different sizes. Today 1/0 is left undefined; what Bhāskara's rule anticipates is cardinal arithmetic, where ℵ₀ + n = ℵ₀."},
    ],
)


for slug, spec in CH.items():
    p = ROOT / "chambers" / slug / "page.json"
    page = json.loads(p.read_text(encoding="utf-8"))
    page.update(glow=spec["glow"], legend=spec["legend"], tutorial=TOURS[slug], sound=spec["sound"],
                faq=spec["faq"] + COMMON_FAQ)
    p.write_text(json.dumps(page, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("taught", slug, len(spec["tutorial"]), "steps")
