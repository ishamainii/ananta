"""Chamber 06 draws a planet on an epicycle whose radius scales with its distance from earth, and
plots E(M) = -arcsin(k sin M). These check the picture and the formula are the same model, and the
claims in the notes about where each version of the correction peaks."""
import numpy as np

K = [0.15, 0.32, 0.6, 0.9]
M = np.linspace(0, 2 * np.pi, 3601)


def drawn_angle(k, m):
    h = (-k * np.cos(m) + np.sqrt(1 - (k * np.sin(m)) ** 2)) / (1 - k * k)
    px, py = 1 + k * h * np.cos(m + np.pi), k * h * np.sin(m + np.pi)
    return np.arctan2(py, px), np.hypot(px, py), h


def test_picture_matches_formula():
    for k in K:
        e, dist, h = drawn_angle(k, M)
        assert np.allclose(e, -np.arcsin(k * np.sin(M)), atol=1e-12)
        assert np.allclose(dist, h, atol=1e-12)


def test_sine_rule_peaks_at_90_degrees():
    for k in K:
        e = -np.arcsin(k * np.sin(M))
        assert abs(np.degrees(M[np.argmin(e)]) - 90) < 0.11
        de = -k * np.cos(M) / np.sqrt(1 - (k * np.sin(M)) ** 2)
        assert np.allclose(de, np.gradient(e, M), atol=2e-3)


def test_fixed_epicycle_peaks_where_cos_m_equals_k():
    for k in K:
        e = np.arctan2(-k * np.sin(M), 1 - k * np.cos(M))
        assert abs(np.cos(M[np.argmin(e)]) - k) < 2e-3
