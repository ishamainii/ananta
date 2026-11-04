"""Madhava's series for pi/4 and the Kerala correction terms (antya-samskara).

Partial sum with n terms:  S_n = 1 - 1/3 + 1/5 - ... + (-1)^(n-1)/(2n-1).
The Yuktibhasa adds an end-correction F(n) to the last term:
    pi/4 ~ S_n + (-1)^n * F(n)
with three successively better choices
    F1 = 1/(4n),   F2 = n/(4n^2 + 1),   F3 = (n^2 + 1)/(n(4n^2 + 5)).
(see Rajagopal & Rangachari 1978; Roy 1990; Sarma et al. 2008)
"""
from fractions import Fraction


def partial(n):
    return sum((-1) ** k / (2 * k + 1) for k in range(n))


CORRECTIONS = {
    0: lambda n: 0.0,
    1: lambda n: 1 / (4 * n),
    2: lambda n: n / (4 * n * n + 1),
    3: lambda n: (n * n + 1) / (n * (4 * n * n + 5)),
}


def madhava_pi(n, order=3):
    return 4 * (partial(n) + (-1) ** n * CORRECTIONS[order](n))
