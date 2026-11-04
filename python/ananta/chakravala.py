"""The chakravala ('wheel') method for x^2 - N y^2 = 1.  Jayadeva (11th c.), Bhaskara II (1150).

Keep a triple (a, b, k) with a^2 - N b^2 = k. Each turn of the wheel:
  choose m > 0 with  k | (a + b m)  and |m^2 - N| as small as possible, then
  a' = (a m + N b)/|k|,   b' = (a + b m)/|k|,   k' = (m^2 - N)/k.
Stop when k = 1. Selenius (1975) shows this is a minimal-length, best-approximation
continued-fraction process.
"""
from math import isqrt


def chakravala(N):
    if isqrt(N) ** 2 == N:
        raise ValueError("N must not be a perfect square")
    r = isqrt(N)
    a = r if (N - r * r) < ((r + 1) ** 2 - N) else r + 1        # start nearest sqrt(N)
    b, k = 1, a * a - N
    steps = [(a, b, k)]
    while k != 1:
        K = abs(k)
        # candidates m with k | (a + b m); they form one residue class mod |k|
        m0 = next(m for m in range(1, K + 1) if (a + b * m) % K == 0)
        cands = [m0 + K * t for t in range(max(0, (r - m0) // K - 1), (r - m0) // K + 3) if m0 + K * t > 0]
        m = min(cands, key=lambda m: abs(m * m - N))
        a, b, k = (a * m + N * b) // K, (a + b * m) // K, (m * m - N) // k
        steps.append((a, b, k))
        if len(steps) > 500:
            raise RuntimeError("did not converge")
    return steps
