import numpy as np
import pytest
from math import comb

from ananta.cube import edges, vertices
from ananta.project import perspective_step, project_to_2d
from ananta.rotate import compose, is_rotation, plane_rotation, planes

rng = np.random.default_rng(0)


# ---------- rotation ----------

@pytest.mark.parametrize("n", range(2, 8))
def test_plane_count(n):
    assert len(planes(n)) == comb(n, 2)


@pytest.mark.parametrize("n", range(2, 8))
def test_every_plane_rotation_is_a_rotation(n):
    for i, j in planes(n):
        assert is_rotation(plane_rotation(n, i, j, rng.uniform(0, 2 * np.pi)))


@pytest.mark.parametrize("n", range(2, 8))
def test_composed_rotation_is_a_rotation(n):
    angles = {p: rng.uniform(0, 2 * np.pi) for p in planes(n)}
    assert is_rotation(compose(n, angles))


def test_rotation_fixes_axes_outside_its_plane():
    R = plane_rotation(5, 0, 3, 0.7)
    for k in (1, 2, 4):
        e = np.eye(5)[k]
        assert np.allclose(R @ e, e)


def test_quarter_turn_moves_axis_i_to_axis_j():
    R = plane_rotation(4, 1, 3, np.pi / 2)
    assert np.allclose(R @ np.eye(4)[1], np.eye(4)[3])


def test_reflection_is_not_a_rotation():
    F = np.eye(4)
    F[0, 0] = -1
    assert not is_rotation(F)


@pytest.mark.parametrize("n", range(2, 8))
def test_rotation_keeps_cube_edges_length_two(n):
    R = compose(n, {p: rng.uniform(0, 2 * np.pi) for p in planes(n)})
    v = vertices(n) @ R.T
    for i, j in edges(n):
        assert np.linalg.norm(v[i] - v[j]) == pytest.approx(2.0)


def test_same_plane_angles_add():
    a, b = 0.4, 1.1
    assert np.allclose(plane_rotation(4, 0, 2, a) @ plane_rotation(4, 0, 2, b),
                       plane_rotation(4, 0, 2, a + b))


# ---------- projection ----------

def test_projection_drops_one_dimension():
    assert perspective_step(np.ones((5, 4)) * 0.1).shape == (5, 3)


def test_point_on_camera_axis_projects_to_origin():
    assert np.allclose(perspective_step([[0, 0, 0, 1.5]]), 0)


def test_closer_points_look_bigger():
    near, far = perspective_step([[1, 1, 1, 1.0], [1, 1, 1, -1.0]], d=3)
    assert np.linalg.norm(near) > np.linalg.norm(far)


def test_point_behind_camera_is_rejected():
    with pytest.raises(ValueError):
        perspective_step([[0, 0, 3.0]], d=3)


@pytest.mark.parametrize("n", range(3, 8))
def test_cube_projects_to_2d(n):
    # corners have length sqrt(n), so the camera must sit farther out than that
    p, depth = project_to_2d(vertices(n), d=np.sqrt(n) + 1)
    assert p.shape == (2 ** n, 2)
    assert np.all(np.isfinite(p)) and np.all(depth > 0)


def test_projection_of_cube_is_symmetric():
    # the cube is symmetric under flipping the first axis, and so is its picture
    p, _ = project_to_2d(vertices(4), d=3)
    assert np.allclose(sorted(p[:, 0]), sorted(-p[:, 0]))
