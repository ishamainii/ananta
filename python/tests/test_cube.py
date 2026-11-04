import numpy as np
import pytest

from ananta.cube import edges, face_counts, meters, vertices


@pytest.mark.parametrize("n", range(1, 8))
def test_vertex_count(n):
    assert len(vertices(n)) == 2 ** n


@pytest.mark.parametrize("n", range(1, 8))
def test_vertices_are_distinct_corners(n):
    v = vertices(n)
    assert set(np.unique(v)) == {-1, 1}
    assert len({tuple(row) for row in v}) == 2 ** n


@pytest.mark.parametrize("n", range(1, 8))
def test_edge_count_matches_formula(n):
    assert len(edges(n)) == n * 2 ** (n - 1)


@pytest.mark.parametrize("n", range(1, 8))
def test_edges_have_length_two(n):
    v = vertices(n)
    for i, j in edges(n):
        assert np.linalg.norm(v[i] - v[j]) == pytest.approx(2.0)


@pytest.mark.parametrize("n", range(1, 8))
def test_every_vertex_has_n_neighbours(n):
    degree = np.zeros(2 ** n, dtype=int)
    for i, j in edges(n):
        degree[i] += 1
        degree[j] += 1
    assert (degree == n).all()


@pytest.mark.parametrize("n", range(1, 8))
def test_euler_characteristic(n):
    f = face_counts(n)
    assert sum((-1) ** k * f[k] for k in range(n + 1)) == 1


def test_tesseract_face_counts():
    # 16 corners, 32 edges, 24 squares, 8 cubes, 1 tesseract
    assert face_counts(4) == [16, 32, 24, 8, 1]


def test_meters_are_pingala_order():
    assert meters(2).tolist() == [[0, 0], [0, 1], [1, 0], [1, 1]]
