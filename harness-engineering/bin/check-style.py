#!/usr/bin/env python3
"""Scan curriculum prose for machine-writing tells.

The pattern list is ported from Simon Willison's LLM cliche highlighter
(github.com/simonw/tools, llm-cliche-highlighter.html), which highlights the
symptoms without claiming they prove authorship. Same spirit here: a hit is a
prompt to reread the sentence, and the checker only fails on patterns that are
never fine in this curriculum's register.

Usage: bin/check-style.py [files...]   (defaults to chapters + top-level docs)
"""
import re, sys, pathlib

# (id, severity, regex, note) — severity 'fail' blocks, 'warn' informs.
RULES = [
    ("not-just",   "fail", r"\bnot\s+just\s+\w+[^.;:]{0,40},\s*(?:but|it)\b", "negative parallelism"),
    ("not-only",   "fail", r"\bnot\s+only\b[^.;:]{0,60}\bbut\b", "negative parallelism"),
    ("its-not-x-its-y", "fail", r"\b(?:it|this|that)\s+is\s+not\s+(?:a\s+|an\s+)?\w+[^.;:]{0,30}[,;]\s*(?:it|this|that)\s+is\b", "it's not X, it's Y"),
    ("note-that",  "fail", r"\b(?:it\s+is|it['’]s)\s+(?:important|worth)\s+(?:to\s+note|noting)\b|\bit\s+should\s+be\s+noted\b", "didactic hedge"),
    ("testament",  "fail", r"\b(?:stands?|serves?)\s+as\s+a\s+testament\b|\bis\s+a\s+testament\s+to\b", "inflated significance"),
    ("crucial-role","fail", r"\bplay(?:s|ed|ing)?\s+(?:a|an)\s+(?:\w+\s+)?(?:crucial|pivotal|vital|key|significant)\s+role\b", "boilerplate"),
    ("landscape",  "fail", r"\bever[-\s](?:evolving|changing|shifting)\s+landscape\b|\bin\s+today['’]s\s+\w+\s+(?:landscape|world|era)\b", "scene-setting boilerplate"),
    ("delve",      "fail", r"\bdelve(?:s|d)?\b|\btapestry\b|\bmeticulous(?:ly)?\b", "AI vocabulary"),
    ("turns-out",  "fail", r"(?:^|[.!?]\s+)Turns\s+out\b|\bit\s+turns\s+out\s+that\b", "casual-revelation opener"),
    ("punchline",  "fail", r"\bthe\s+punchline(?:\s+(?:is|was)\b|\s*[:?])", "stage-managed reveal"),
    ("heres-the",  "fail", r"\bhere['’]s\s+the\s+(?:twist|thing|kicker)\b", "stage-managed reveal"),
    ("whole-point","fail", r"\b(?:that|this)(?:['’]s|\s+(?:is|was))\s+the\s+whole\s+\w+\b|\bis\s+the\s+entire\s+\w+\b", "epigram"),
    ("not-nothing","fail", r"\b(?:that|this|it|which)(?:['’]s|\s+is)\s+not\s+nothing\b", "epigram"),
    ("sit-with",   "fail", r"\bsit(?:s|ting)?\s+with\s+(?:that|this|it)\b", "therapist voice"),
    ("participle-tail","fail", r",\s+(?:highlighting|underscoring|showcasing|demonstrating|emphasizing|reflecting)\s+\b", "participle tail"),
    ("performative-honesty","warn", r"\b(?:honest(?:ly)?|candidly|frankly)\b", "sincerity announced; show it instead"),
    ("stranded-aux","warn", r"[a-z]+(?:;\s*|[.!?]\s+[A-Z])[^.;!?]{0,40}\b(?:doesn['’]t|didn['’]t|isn['’]t|wasn['’]t|can['’]t|won['’]t)\s*[.;!?]", "stranded auxiliary contrast"),
    ("colon-triple","warn", r":\s+[^.\n]{3,40},\s+[^.\n]{3,40},\s+and\s+[^.\n]{3,60}\.", "colon into a triple"),
    ("emdash",     "warn", r"—", "em dash in prose"),
]

DEFAULT = sorted(pathlib.Path(__file__).parent.parent.glob("chapters/*.md")) + [
    pathlib.Path(__file__).parent.parent / n for n in
    ("README.md", "GLOSSARY.md", "ASSESSMENT.md")]

def strip_noise(text):
    """Remove code blocks, tables, link URLs and heading/citation lines; keep prose."""
    text = re.sub(r"```[\s\S]*?```", "", text)
    out = []
    for line in text.split("\n"):
        s = line.strip()
        if s.startswith("|") or s.startswith("#"): continue
        if re.match(r"\*\*\d+\.\s+\[", s):  # citation header lines keep their em dash format
            line = re.sub(r"—[^·]*·.*$", "", line)
        line = re.sub(r"\]\([^)]+\)", "]", line)
        out.append(line)
    return "\n".join(out)

def main(paths):
    fails = warns = 0
    for p in paths:
        prose = strip_noise(pathlib.Path(p).read_text())
        for rid, sev, rx, note in RULES:
            for m in re.finditer(rx, prose, re.I):
                snippet = re.sub(r"\s+", " ", m.group(0))[:70]
                line = prose[:m.start()].count("\n") + 1
                print(f"{'FAIL' if sev=='fail' else 'warn'}  {pathlib.Path(p).name}:{line}  [{rid}] {snippet}")
                if sev == "fail": fails += 1
                else: warns += 1
    print(f"\nfails={fails} warns={warns}")
    return 1 if fails else 0

if __name__ == "__main__":
    args = [pathlib.Path(a) for a in sys.argv[1:]] or DEFAULT
    sys.exit(main(args))
