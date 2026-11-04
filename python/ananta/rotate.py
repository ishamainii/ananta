"""Rotation in n dimensions.

In 3D we say "rotate around an axis", but that only works because 3D has
exactly one axis left over when you pick a plane. In n dimensions you
rotate *in a plane*: pick two axes i and j, turn them like a 2D rotation,
and leave every other axis alone. This is a Givens rotation.
An n-D space has C(n, 2) such planes: 6 in 4D, 10 in 5D, 15 in 6D.
"""
from itertools import combinations

import numpy as np


def plane_rotation(n, i, j, theta):
    """n x n matrix rotating by theta in the (i, j) plane, fixing all other axes."""
    if i == j:
        raise ValueError("a rotation plane needs two different axes")
    R = np.eye(n)
    c, s = np.cos(theta), np.sin(theta)
    R[i, i], R[j, j] = c, c
    R[i, j], R[j, i] = -s, s
    return R


def planes(n):
    """Every rotation plane (i, j) with i < j."""
    return list(combinations(range(n), 2))


def compose(n, angles):
    """Multiply plane rotations together. angles maps (i, j) -> theta."""
    R = np.eye(n)
    for (i, j), theta in angles.items():
        R = plane_rotation(n, i, j, theta) @ R
    return R


def is_rotation(R, tol=1e-9):
    """A rotation keeps lengths (R R^T = I) and keeps handedness (det R = +1)."""
    n = R.shape[0]
    return (np.allclose(R @ R.T, np.eye(n), atol=tol)
            and abs(np.linalg.det(R) - 1) < tol)
