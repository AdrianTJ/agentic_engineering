---
name: build-deck
description: >
  Assemble a slide deck from a narrative and a set of figures. Use whenever the task
  is to create or update a presentation, slides, or a "deck" for an audience.
---

# Build deck

Turn an agreed narrative and chart set into a clean presentation.

## Workflow

1. Start from the narrative (see `stakeholder-narrative`), not from the slides. One
   key message per slide, in the order the narrative dictates.
2. One idea per slide; the slide title states that idea as a sentence.
3. Place at most one chart (from `chart-viz`) per slide, sized to be readable from the
   back of a room.
4. Open with the decision/ask, close with the next step. Detail goes in an appendix.
5. Keep styling consistent and minimal — the data carries the slide, not the template.
6. **Hand off file production.** This skill owns the narrative/slide-structure
   discipline above, not file mechanics. When the deliverable is literally a `.pptx`,
   use the `pptx` skill (Anthropic's, from anthropics/skills — native on Claude,
   installable elsewhere) to actually produce it (templates, master layouts, speaker
   notes) rather than reimplementing OOXML handling here.

## Output

A presentation file, with an appendix holding supporting detail and data sources.
