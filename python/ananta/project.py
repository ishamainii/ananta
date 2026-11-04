"""Perspective projection from n dimensions down to 2.

A camera sits at distance d along the last axis and looks back at the origin.
A point's last coordinate w is its depth: the closer it is to the camera
(w near d), the bigger it appears. Dividing the other coordinates by
(d - w) is the same similar-triangles rule a pinhole camera uses in 3D.
Repeat it, dropping one dimension each time, until two remain.
"""
import numpy as np


def perspective_step(points, d=3.0):
    """Project (m, k) points to (m, k-1) using the last coordinate as depth."""
    points = np.asarray(points, dtype=float)
    w = points[:, -1]
    if np.any(w >= d):
        raise ValueError("a point is at or behind the camera; increase d")
    return points[:, :-1] / (d - w)[:, None]


def project_to_2d(points, d=3.0):
    """Repeat perspective_step until each point has 2 coordinates.

    Returns the 2D points plus a depth per point (the product of the scale
    factors), used to fade far vertices and thin far edges.
    """
    points = np.asarray(points, dtype=float)
    depth = np.ones(len(points))
    while points.shape[1] > 2:
        w = points[:, -1]
        depth = depth / (d - w)
        points = perspective_step(points, d)
    return points, depth
