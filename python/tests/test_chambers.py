import math
import numpy as np
import pytest

from ananta.chakravala import chakravala
from ananta.madhava import madhava_pi, partial
from ananta.sriyantra import NAMES, reference_x, residuals, solve


# ---------- Madhava ----------
def test_plain_series_converges_slowly():
    assert abs(4 * partial(1000) - math.pi) > 1e-4


@pytest.mark.parametrize("order,tol", [(1, 1e-5), (2, 1e-8), (3, 1e-11)])
def test_corrections_get_better(order, tol):
    assert abs(madhava_pi(50, order) - math.pi) < tol


def test_each_correction_beats_the_last():
    errs = [abs(madhava_pi(20, o) - math.pi) for o in range(4)]
    assert errs[0] > errs[1] > errs[2] > errs[3]


# ---------- Chakravala ----------
def test_bhaskara_61():
    a, b, k = chakravala(61)[-1]
    assert (a, b, k) == (1766319049, 226153980, 1)


@pytest.mark.parametrize("N", [2, 3, 7, 13, 61, 67, 94, 109, 181, 991])
def test_every_step_keeps_the_invariant(N):
    for a, b, k in chakravala(N):
        assert a * a - N * b * b == k
    a, b, k = chakravala(N)[-1]
    assert k == 1 and a * a - N * b * b == 1


def test_perfect_square_rejected():
    with pytest.raises(ValueError):
        chakravala(49)


# ---------- Sri Yantra ----------
FIXED = [NAMES.index(n) for n in ["D1", "U1", "U3", "U4", "D3"]]


def test_reference_yantra_is_exact():
    assert np.linalg.norm(residuals(reference_x())) < 1e-12


def test_newton_recovers_reference_from_a_perturbed_start():
    x0 = reference_x(); rng = np.random.default_rng(1)
    free = [i for i in range(len(x0)) if i not in FIXED]
    x0[free] += rng.normal(0, 0.01, len(free))
    x, hist = solve(x0, FIXED)
    assert hist[-1] < 1e-12
    assert np.allclose(x, reference_x(), atol=1e-8)


def test_moving_a_free_parameter_gives_another_exact_yantra():
    x0 = reference_x(); x0[NAMES.index("U4")] += 0.01
    x, hist = solve(x0, FIXED)
    assert hist[-1] < 1e-12
    assert not np.allclose(x, reference_x(), atol=1e-4)
