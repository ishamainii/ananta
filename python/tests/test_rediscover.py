"""The machine-rediscovery panel in chamber 02 claims that, among every rational function
(a n² + b n + c)/(d n³ + e n² + f n + g) with coefficients 0..6 (d ≥ 1), the best fit to the
tail of Mādhava's series on n = 5..40 is his own correction (n² + 1)/(n(4n² + 5)).
This checks that claim independently of the browser code, with exact tails from mpmath."""
import itertools

import mpmath as mp
import numpy as np

mp.mp.dps = 40
NS = np.arange(5, 41)


def tails(ns):
    return np.array([float((mp.pi / 4 - mp.fsum(mp.mpf((-1) ** k) / (2 * k + 1) for k in range(n))) * (-1) ** n) for n in ns])


def test_search_finds_madhava():
    R, N = tails(NS), NS.astype(float)
    dens = np.array(list(itertools.product(range(1, 7), range(7), range(7), range(7))), dtype=float)   # 2058 denominators
    D = dens @ np.vstack([N ** 3, N ** 2, N, np.ones_like(N)])                                         # 2058 × 36
    best, arg = -np.inf, None
    for num in itertools.product(range(7), repeat=3):
        if not any(num):
            continue
        P = num[0] * N ** 2 + num[1] * N + num[2]
        score = np.mean(-np.log10(np.abs(P / D - R) + 1e-300), axis=1)
        i = int(np.argmax(score))
        if score[i] > best:
            best, arg = score[i], (*num, *dens[i].astype(int))
    assert arg == (1, 0, 1, 4, 0, 5, 0)
    assert 9.5 < best < 10.5
