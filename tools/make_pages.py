"""Build chambers/<slug>/index.html from one template + each chamber's page.json and notes.html.

    python tools/make_pages.py

Keeping the shell in one place means every chamber gets the same veil, dock,
notebook drawer, fonts and import map, and fixing one fixes all.
"""
import json
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = Template((ROOT / "tools" / "chamber.html").read_text(encoding="utf-8"))

for page in sorted((ROOT / "chambers").glob("*/page.json")):
    d = page.parent
    spec = json.loads(page.read_text(encoding="utf-8"))
    spec["notes"] = (d / "notes.html").read_text(encoding="utf-8")
    spec.setdefault("dock", "")
    # tutorial, colour key, sound mapping and guide answers travel to the page as JSON
    data = {k: spec.get(k, []) for k in ("tutorial", "legend", "faq")}
    data.update(slug=d.name, num=spec["num"], sound=spec.get("sound", ""))
    spec["data"] = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    (d / "index.html").write_text(TEMPLATE.substitute(spec), encoding="utf-8")
    print("built", d.relative_to(ROOT) / "index.html")
