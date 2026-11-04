"""Animate the rotating n-cube.

Each edge is colored by the axis it runs along, i.e. which syllable of the
meter changes between its two corners. Far edges are thinner and dimmer,
so depth in the hidden dimensions stays readable on a flat screen.

Usage:  python -m ananta.animate 4      (writes out/cube_4d.gif)
"""
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.animation import FuncAnimation, PillowWriter
from matplotlib.collections import LineCollection

from .cube import edges, vertices
from .project import project_to_2d
from .rotate import compose, planes

BACKGROUND = "#0d0b1a"
# one color per axis: saffron, rose, violet, teal, gold, sky, coral
AXIS_COLORS = ["#f2a541", "#e0607e", "#9d7bf0", "#3cc6b4", "#e8d36a", "#6bb5f2", "#f27c5c"]


def edge_axis(i, j):
    """Which axis an edge runs along: the position of the one differing bit."""
    return (i ^ j).bit_length() - 1


def frame_geometry(n, t, d):
    """2D segments, colors and widths for the cube at time t (radians)."""
    # every plane spins at its own slow rate, so the motion never repeats exactly
    speeds = {p: 0.25 + 0.15 * k for k, p in enumerate(planes(n))}
    R = compose(n, {p: s * t for p, s in speeds.items()})
    pts, depth = project_to_2d(vertices(n) @ R.T, d=d)
    E = edges(n)
    segs = np.array([[pts[i], pts[j]] for i, j in E])
    near = np.array([(depth[i] + depth[j]) / 2 for i, j in E])
    near = (near - near.min()) / (np.ptp(near) + 1e-12)
    # vertex bit k is axis (n-1-k) in the meter string, so color by bit position
    colors = [matplotlib.colors.to_rgba(AXIS_COLORS[edge_axis(i, j) % len(AXIS_COLORS)],
                                        0.25 + 0.75 * w) for (i, j), w in zip(E, near)]
    widths = 0.4 + 2.2 * near
    return pts, segs, colors, widths, depth


def render(n, out, frames=180, fps=30, size=6):
    d = np.sqrt(n) + 1.2
    fig, ax = plt.subplots(figsize=(size, size), dpi=100)
    fig.patch.set_facecolor(BACKGROUND)
    ax.set_facecolor(BACKGROUND)
    ax.set_aspect("equal")
    ax.axis("off")
    pts, segs, colors, widths, depth = frame_geometry(n, 0, d)
    # frame the view on the widest pose across the whole loop, not just frame 0
    lim = 1.1 * max(np.abs(frame_geometry(n, t, d)[0]).max()
                    for t in np.linspace(0, 2 * np.pi, 60))
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    lines = LineCollection(segs, colors=colors, linewidths=widths, capstyle="round")
    ax.add_collection(lines)
    dots = ax.scatter(pts[:, 0], pts[:, 1], s=6, c="#fff4e0", zorder=3)
    ax.text(0.03, 0.03, f"{n}-cube · {2**n} meters · {len(segs)} edges",
            transform=ax.transAxes, color="#bdb3d9", fontsize=9, family="monospace")

    def update(k):
        t = 2 * np.pi * k / frames
        pts, segs, colors, widths, depth = frame_geometry(n, t, d)
        lines.set_segments(segs)
        lines.set_color(colors)
        lines.set_linewidths(widths)
        dots.set_offsets(pts)
        dots.set_sizes(4 + 14 * (depth - depth.min()) / (np.ptp(depth) + 1e-12))
        return lines, dots

    anim = FuncAnimation(fig, update, frames=frames, blit=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.suffix == ".gif":
        anim.save(out, writer=PillowWriter(fps=fps))
    else:
        update(frames // 7)
        fig.savefig(out, facecolor=BACKGROUND)
    plt.close(fig)
    return out


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    print(render(n, Path("out") / f"cube_{n}d.gif"))
