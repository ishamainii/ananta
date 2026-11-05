"""The how-to-play steps for every chamber. Short on purpose: one idea per step, plain words.
`at` is the part of the page the step points to (it gets a glowing ring), `do` is a guide
command the step runs so the scene shows what the step says. Merged by teach.py."""

TOURS = {
 "pingala": [
  {"t": "Two kinds of syllable", "do": "show 3 dimensions", "b": "Sanskrit verse uses light syllables (।) and heavy ones (ऽ). A meter is a pattern of them, like ।ऽ।."},
  {"t": "Every pattern is a corner", "b": "Three syllables give 8 patterns. Each one sits on a corner of this cube, labelled with its pattern."},
  {"t": "Edges change one syllable", "at": "#key", "b": "Two corners are joined when their patterns differ by one syllable. The edge colour tells you which syllable changed."},
  {"t": "Follow the spark", "at": "#cap2", "b": "The gold spark visits every pattern once. The large symbols here show the one it is on."},
  {"t": "Add a syllable", "do": "show 4 dimensions", "at": "#dims", "b": "Four syllables need a fourth direction. The cube becomes a tesseract, drawn as a cube inside a cube."},
  {"t": "Walk around it", "b": "Drag to circle the shape. Scroll or pinch to fly inside it. Double-click to come back."},
  {"t": "Listen", "at": "#soundBtn", "b": "Turn the sound on. Each step plays a note, and more heavy syllables mean a higher note."},
 ],
 "madhava": [
  {"t": "A sum for π", "do": "twist 180, 3 terms", "b": "Mādhava found that π/4 = 1 − 1/3 + 1/5 − 1/7 and so on forever. Each piece is one link in this chain."},
  {"t": "Closing in slowly", "do": "12 terms", "b": "Each link overshoots and then undershoots by a little less. The dashed line is π/4."},
  {"t": "His shortcut", "do": "correction 3", "at": "#orderSel", "b": "Mādhava added one small correction at the end of the sum. It makes the answer far more accurate."},
  {"t": "Count the correct digits", "do": "25 terms", "at": "#ro", "b": "This panel compares the plain sum with his three corrections. The bright digits are correct."},
  {"t": "The swing view", "do": "swing view, play", "at": "#viewSel", "b": "Red rays are the plain sums and they wobble. Gold rays use the correction and settle on π."},
  {"t": "Can a machine find it?", "do": "chain view", "at": "#labBtn", "b": "Press machine rediscovery. A computer search through 703,836 formulas picks out Mādhava's correction from the numbers alone."},
 ],
 "chakravala": [
  {"t": "The puzzle", "do": "solve N = 61", "b": "Find whole numbers with x² − 61y² = 1. The smallest answer has x = 1,766,319,049."},
  {"t": "Start with a near miss", "at": "#ro", "b": "The method keeps a² − 61b² = k, where k measures how far off it is. It starts at 8² − 61 = 3, so k = 3."},
  {"t": "One turn at a time", "b": "Each stop on the wheel is one turn of the method. Its label shows the new k."},
  {"t": "Checked every turn", "at": "#cap2", "b": "This line checks the equation with the real numbers after every turn. When k reaches 1 the puzzle is solved."},
  {"t": "Try a harder one", "do": "solve N = 991", "at": "#nSel", "b": "Pick another N here. For 991 the answer has 30 digits, and the wheel still finds it."},
 ],
 "ramanujan": [
  {"t": "Splitting a number", "do": "partitions of 4", "at": "#cap2", "b": "4 can be split 5 ways: 4, 3+1, 2+2, 2+1+1 and 1+1+1+1. So p(4) = 5."},
  {"t": "It grows fast", "do": "partitions of 200", "at": "#cap2", "b": "p(200) is almost four trillion."},
  {"t": "One picture for every p(n)", "do": "whole disk", "b": "This disk is one function that contains every p(n). Colour shows its angle and the bright rings show its size."},
  {"t": "The edge", "do": "dive toward 0/1", "at": "#viewSel", "b": "Near the rim the function blows up at infinitely many points. Hardy and Ramanujan used these blow-ups to estimate p(n)."},
  {"t": "A pattern in fives", "do": "play", "at": "#ro", "b": "p(4), p(9), p(14) and every fifth one after are divisible by 5. This panel turns green each time."},
 ],
 "sriyantra": [
  {"t": "Nine triangles", "do": "reset", "b": "Four triangles point up and five point down."},
  {"t": "The hard part", "at": "#key", "b": "In 11 places three lines must cross at exactly one point. Green dots mark them."},
  {"t": "Break it", "do": "scramble it", "at": "#scrambleBtn", "b": "Scramble moves every triangle. The dots turn red and grow to show how far off they are."},
  {"t": "Watch it repair itself", "b": "Newton's method fixes all 11 points together. The graph in the corner shows the error dropping fast."},
  {"t": "More than one answer", "do": "show another yantra", "at": "#nudgeBtn", "b": "This changes one free height and solves again. The new yantra is still exact."},
 ],
 "tatkalika": [
  {"t": "Two planets", "do": "epicycle 0.32", "b": "The gold dot moves at a steady speed. The white dot is where the planet really is."},
  {"t": "The gap between them", "b": "The purple curve shows how far the real planet is ahead or behind over one orbit."},
  {"t": "Speed at one instant", "at": "#ro", "b": "Bhāskara II measured a planet's speed at a single moment. Here that is the slope of the purple curve."},
  {"t": "The peak", "do": "go to 90 degrees", "at": "#cap2", "b": "At 90° the gap is largest and the slope is zero. The tangent line turns green."},
  {"t": "Change the orbit", "do": "epicycle 0.6", "at": "#kSel", "b": "Make the small circle bigger. The gap grows and the curve gets steeper."},
 ],
 "purna": [
  {"t": "The whole", "do": "show purna", "at": "#moves", "b": "An old verse says that taking the whole from the whole leaves the whole. This picture contains itself forever."},
  {"t": "Too many to count", "do": "jaina", "b": "Jaina thinkers sorted numbers into ones you can count, ones too large to count, and infinite ones. Each ring here holds ten times the last."},
  {"t": "Dividing by zero", "do": "show khahara", "b": "As x shrinks to 0, 1 ÷ x grows without limit. Bhāskara II called a number divided by zero khahara."},
  {"t": "Then and now", "b": "His rule was that adding to khahara does not change it. Modern set theory has a similar rule: adding a few items to an infinite set does not change its size."},
 ],
}
