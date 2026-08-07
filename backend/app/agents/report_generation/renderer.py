"""Enterprise Report HTML/PDF render. WeasyPrint - chosen because the report is
section-structured HTML, not a form layout (docs/OPEN_DECISIONS.md, gap 6)."""
from datetime import datetime
from html import escape

from weasyprint import HTML

from app.agents.report_generation.schema import REPORT_SECTIONS

_CSS = """
@page { size: A4; margin: 22mm 18mm; @bottom-right { content: counter(page); } }
body { font-family: Georgia, serif; font-size: 10.5pt; line-height: 1.55; color: #1a1a1a; }
h1 { font-size: 20pt; margin: 0 0 4pt; }
h2 { font-size: 12pt; margin: 20pt 0 6pt; border-bottom: 1px solid #ccc; padding-bottom: 3pt; }
.meta { color: #666; font-size: 9pt; margin-bottom: 18pt; }
"""


def render_html(case_id: str, sections: dict[str, str]) -> str:
    body = []
    for name in REPORT_SECTIONS:
        if name in sections:
            body.append(f"<h2>{escape(name)}</h2><div>{sections[name]}</div>")
    return (
        f"<html><head><meta charset='utf-8'><style>{_CSS}</style></head><body>"
        f"<h1>Enterprise Contract Review</h1>"
        f"<div class='meta'>Case {escape(case_id)} &middot; "
        f"generated {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')}</div>"
        f"{''.join(body)}</body></html>"
    )


def render_pdf(case_id: str, sections: dict[str, str]) -> bytes:
    return HTML(string=render_html(case_id, sections)).write_pdf()
