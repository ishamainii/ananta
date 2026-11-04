"""The n-dimensional cube, built from Pingala's binary meters.

Pingala (Chandahshastra, c. 3rd-2nd century BCE) listed every poetic meter
of n syllables as a pattern of light (laghu) and heavy (guru) syllables.
Write light = 0 and heavy = 1, and each meter is an n-bit binary string.
Those 2**n strings are exactly the corners of an n-dimensional cube.
"""
from itertools import product
from math import comb

import numpy as np


def meters(n):
    """All 2**n meters of length n, as rows of 0s and 1s (Pingala's prastara)."""
    return np.array(list(product([0, 1], repeat=n)), dtype=int)


def vertices(n):
    """Cube corners: map bit 0 -> -1 and bit 1 -> +1, so the cube is centered at the origin."""
    return 2 * meters(n) - 1


def edges(n):
    """Pairs of vertex indices joined by an edge.

    Two corners share an edge when their meters differ in exactly one syllable.
    Vertex i's meter is the binary form of i, so i ^ j (XOR) marks the
    differing bits; one differing bit means i ^ j is a power of two.
    """
    count = 2 ** n
    return [(i, j) for i in range(count) for j in range(i + 1, count)
            if bin(i ^ j).count("1") == 1]


def face_counts(n):
    """How many k-dimensional faces the n-cube has, for k = 0..n.

    A k-face fixes n-k coordinates at -1 or +1 and lets k vary:
    choose which k vary (C(n, k)), then fix the others (2**(n-k)).
    C(n, k) is row n of the Meru Prastara, Halayudha's triangle.
    """
    return [comb(n, k) * 2 ** (n - k) for k in range(n + 1)]
