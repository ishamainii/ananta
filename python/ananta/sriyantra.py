"""The Sri Yantra as a system of equations.

Nine triangles, symmetric about the vertical axis, inside the unit circle.
Triangle i has a horizontal side at height b[i], half-width w[i], and its apex
on the axis at height a[i]. Structure (read off the reference yantra):

  * the two outer triangles have their apexes on the circle and their base
    corners on the circle:   a = -1 (D1), a = +1 (U1),  w = sqrt(1 - b^2);
  * every other apex sits exactly on another triangle's base line
    (APEX_ON_BASE below);
  * eleven points must be exact triple concurrencies (TRIPLES below): three
    lines through one point.

Unknowns: 9 heights b + 7 half-widths w = 16.  Equations: 11.
So the yantra is a 5-parameter family; fix 5 and Newton's method solves the rest.
"""
import numpy as np

NAMES = ["D1", "U1", "U2", "U3", "U4", "D2", "D3", "D4", "D5"]
APEX_ON_BASE = {"U3": "D1", "U2": "D3", "D3": "U4", "D2": "U3", "U4": "D2", "D4": "U2", "D5": "U1"}
APEX_ON_CIRCLE = {"D1": -1.0, "U1": 1.0}
TRIPLES = [
    ("D1.R", "U1.base", "U2.R"), ("D1.R", "U2.base", "U3.R"), ("D1.base", "D2.R", "U1.R"),
    ("D1.base", "D3.R", "U2.R"), ("D2.R", "U1.base", "U3.R"), ("D2.R", "U4.R", "U4.base"),
    ("D2.base", "D3.R", "U1.R"), ("D3.R", "D4.base", "U4.R"), ("D3.R", "D5.base", "U3.R"),
    ("D4.R", "D4.base", "U2.R"), ("D5.R", "D5.base", "U4.R"),
]
FREE_W = [n for n in NAMES if n not in APEX_ON_CIRCLE]          # widths we solve for


def unpack(x):
    b = dict(zip(NAMES, x[:9]))
    w = {n: np.sqrt(max(1e-12, 1 - b[n] ** 2)) for n in APEX_ON_CIRCLE}
    w.update(zip(FREE_W, x[9:]))
    a = {n: APEX_ON_CIRCLE.get(n, b[APEX_ON_BASE.get(n, n)]) for n in NAMES}
    return b, w, a


def line(name, b, w, a):
    """Normalised (A, B, C) with A x + B y + C = 0."""
    tri, part = name.split(".")
    if part == "base":
        A, B, C = 0.0, 1.0, -b[tri]
    else:                      # right side: from (w, b) to (0, a)
        x1, y1, x2, y2 = w[tri], b[tri], 0.0, a[tri]
        A, B = y2 - y1, x1 - x2
        C = -(A * x1 + B * y1)
    s = np.hypot(A, B)
    return np.array([A, B, C]) / s


def residuals(x):
    b, w, a = unpack(x)
    return np.array([np.linalg.det(np.array([line(n, b, w, a) for n in t])) for t in TRIPLES])


def jacobian(x, h=1e-7):
    r0 = residuals(x)
    J = np.zeros((len(r0), len(x)))
    for j in range(len(x)):
        d = np.zeros_like(x); d[j] = h
        J[:, j] = (residuals(x + d) - r0) / h
    return J


def solve(x0, fixed, iters=50, tol=1e-13):
    """Newton on the unknowns not in `fixed` (indices into x). Returns x and residual history."""
    x = np.array(x0, float); free = [i for i in range(len(x)) if i not in fixed]
    hist = []
    for _ in range(iters):
        r = residuals(x); hist.append(float(np.linalg.norm(r)))
        if hist[-1] < tol: break
        J = jacobian(x)[:, free]
        dx, *_ = np.linalg.lstsq(J, -r, rcond=None)
        x[free] += dx
    return x, hist


def reference_x():
    from .sriyantra_ref import REF
    b = [-(REF[n][1] - 150) / 100 for n in NAMES]
    w = [(REF[n][3] - REF[n][0]) / 200 for n in FREE_W]
    return np.array(b + w)
