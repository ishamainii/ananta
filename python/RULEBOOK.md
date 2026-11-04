# Ananta Rulebook

Every rule here is one I can explain without notes. Each one points to the code and the test that proves it.

## Math rules

**R1. A meter is a vertex.** Pingala wrote every n-syllable meter as light/heavy patterns. Light = 0 and heavy = 1, so each meter is an n-bit string, and the 2ⁿ strings are the 2ⁿ corners of an n-cube. Mapping 0 → −1 and 1 → +1 centers the cube at the origin.
*Code:* `cube.vertices` · *Test:* `test_vertex_count`, `test_vertices_are_distinct_corners`

**R2. One syllable apart = one edge.** Two corners are joined when their meters differ in exactly one position. XOR of the two indices marks the differing bits, so an edge exists when the XOR has exactly one 1-bit.
*Code:* `cube.edges` · *Test:* `test_edges_have_length_two`, `test_every_vertex_has_n_neighbours`

**R3. Edge count is n·2ⁿ⁻¹.** Each of the 2ⁿ vertices has n neighbours, and each edge gets counted twice (once from each end).
*Test:* `test_edge_count_matches_formula`

**R4. The Meru Prastara counts every face.** The number of k-dimensional faces is C(n, k) · 2ⁿ⁻ᵏ: choose which k coordinates vary, then fix each of the other n−k at −1 or +1. C(n, k) is row n of Halayudha's Meru Prastara (Pascal's triangle).
Tesseract: 16 vertices, 32 edges, 24 squares, 8 cubes, 1 tesseract.
*Code:* `cube.face_counts` · *Test:* `test_tesseract_face_counts`

**R5. Euler's check.** For the n-cube, f₀ − f₁ + f₂ − … ± fₙ = 1. If the counts fail this check, something is wrong.
*Test:* `test_euler_characteristic`

**R6. Rotate in a plane, not around an axis.** Pick axes i and j, turn them like a 2D rotation, leave every other axis alone (a Givens rotation).
*Code:* `rotate.plane_rotation` · *Test:* `test_rotation_fixes_axes_outside_its_plane`

**R7. There are C(n, 2) rotation planes.** 3 in 3D, 6 in 4D, 10 in 5D, 15 in 6D.
*Code:* `rotate.planes` · *Test:* `test_plane_count`

**R8. How to know it's a rotation.** R·Rᵀ = I keeps lengths; det R = +1 rules out a mirror flip.
*Code:* `rotate.is_rotation` · *Test:* `test_reflection_is_not_a_rotation`

**R9. Perspective divide.** Drop the last coordinate w and divide the rest by (d − w). Closer points look bigger. Repeat until 2D.
*Code:* `project.perspective_step` · *Test:* `test_closer_points_look_bigger`

**R10. Camera outside the cube.** Corners sit √n from the center, so d must be bigger than √n.
*Test:* `test_point_behind_camera_is_rejected`

**R11. Color = changed syllable.** Each edge is colored by the axis it runs along, which is the syllable that changes between its two meters.
*Code:* `animate.edge_axis`

## Code rules

**C1. Every claim gets a test.** If I say something in a write-up, a test in `tests/` proves it.

**C2. Test across dimensions, not one example.** Tests run for n = 1 to 7, because one case can pass by luck.

**C3. Docstrings carry the history.** Each function says which mathematician and text the idea comes from.
