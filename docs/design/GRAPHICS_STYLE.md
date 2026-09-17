# BrainWaves Illustration Style Spec

Use this as the written target for any
new asset — hand-drawn, vector, or AI-generated.

---

## 1. One-line description

> Loose hand-drawn marker illustrations: a single flat yellow shape with a wobbly
> black ink outline that deliberately doesn't line up with the fill. Transparent
> background, no shading, no gradients, no perspective.

---

## 2. Palette

Strictly two inks plus optional teal. Never introduce a third fill colour in a
single icon.

| Role | Hex | Notes |
|---|---|---|
| Primary fill (amber) | `#FFC107` | The only fill colour. Every spot icon uses it. |
| Fill tints (rare) | `#FFCD39`, `#FFDA6A` | Only to separate stacked identical shapes (see `Custom.png`). |
| Line ink | `#1A1A1A` (or `#000000`) | All outlines, squiggles, ticks. |
| Brand teal | `#007C70` | Logo / brand mark only — **not** used in spot illustrations. |
| Signal teal / yellow / red | `#7FC8B4`-ish, `#F5D76E`-ish, `#E06C75`-ish | EEG traces only. |
| Background | transparent (or `#F9F9F9` for plot canvases) | Never a coloured plate. |

Rule: **amber carries the mass, black carries the meaning.** If a shape needs to be
read as an object, it's amber. If it needs to be read as information (lines of text,
a squiggle, a tick), it's black.

---

## 3. Line

- **Weight:** ~4–5% of the icon's longest edge. At 100 px tall that's a 4–5 px
  stroke. Constant enough to read as one marker, but not perfectly uniform.
- **Quality:** hand-drawn wobble. Straight lines bow slightly; circles are not
  circular. Visible speed — ends taper or overshoot rather than stopping dead.
- **Caps/joins:** round. No mitred corners, no sharp vector points.
- **Closure:** outlines are frequently *open* — a bulb's contour breaks where the
  stroke lifted. Gaps are a feature; don't close them.
- **Never:** dashed lines, hairlines below 2 px, double outlines, stroke gradients.

---

## 4. The offset-fill signature

This is the most identifiable trait of the set and the thing most AI output gets
wrong.

- The amber shape and the black outline are **the same drawing done twice**,
  misregistered by roughly **3–6% of the icon width**, usually with the fill pushed
  down-right or up-left of the line.
- Amber therefore spills past the line on one side and leaves white paper on the
  other. It should look like a badly registered two-colour print, not like a fill
  inside a stroke.
- Do not anti-alias this away, do not "clean it up", do not clip the fill to the
  outline.

Two legitimate variants exist in the set:

1. **Outlined** (`hypothesis.png`, `research_question.png`, `methods.png`) — full
   black contour plus offset amber.
2. **Silhouette** (`Hypothesis2.png`, `Methods2.png`, `ResearchQuestion2.png`) — no
   contour at all; solid amber shape with only the *interior* black marks (the
   filament squiggle, the text lines, the question-mark dot). Use this at small
   sizes and where the icon sits on a busy surface.

Pick one variant per set of assets — don't mix within a single screen.

---

## 5. Form & composition

- **Flat.** No shading, highlights, gradients, textures, drop shadows, or
  ambient occlusion.
- **Frontal.** Everything is a head-on silhouette. No 3/4 views, no vanishing points,
  no isometric.
- **Single subject.** One object per icon, centred, no ground plane, no scene, no
  background props.
- **Chunky proportions.** Shapes are fatter and rounder than the real object.
  The lightbulb is nearly spherical; the page is a soft blob with wavy edges.
- **Aspect:** roughly square to 2:3 portrait. Subject fills 85–95% of the frame with
  no deliberate padding.
- **Detail budget:** 3–6 drawn marks total. If you're adding a seventh, cut something.
- **Typical resolution:** ~100–180 px on the long edge as delivered; author at 4× and
  downscale.

---

## 6. Content vocabulary

The set reads as "science notebook, drawn by a cheerful student":

lightbulb (hypothesis) · question mark (research question) · lined page (methods) ·
stacked sliders (custom settings) · fixation cross · EEG traces · wave motif (brand)

New assets should stay in that register: lab and study-process objects, drawn the way
a student would sketch them in a margin. Not: characters, faces, mascots, devices
rendered realistically, or anything that needs a scene.

---

## 7. What breaks the style

- Perfectly registered fill inside outline
- Uniform vector line with sharp joins
- Any gradient, shadow, or glossy highlight
- A second saturated fill colour
- Outlines in grey or coloured ink
- Background plates, circles-behind-icon, badges
- Isometric or 3/4 perspective
- More than one object in frame
- Smooth, symmetrical, "clean" curves

---

## 8. Reusable generation prompt

Paste this ahead of your subject. Works for Flux, Midjourney, Ideogram, DALL·E.

```
Flat hand-drawn spot illustration of {SUBJECT}, single centred object, front-on view,
transparent background.

Style: one solid amber fill (#FFC107) plus a loose black marker outline (#1A1A1A).
The amber shape is deliberately misregistered — offset about 4% down and to the right
of the black line — so the colour spills past the outline on one side and leaves a
white gap on the other, like a badly registered two-colour risograph print.

Line: wobbly hand-drawn marker, round caps, roughly 5% of the image height in
thickness, with small gaps where the pen lifted. Slightly imperfect curves.

Strictly flat: no shading, no gradient, no shadow, no texture, no highlight, no
background, no third colour, no text, no perspective, no scene.

Chunky, rounded, simplified proportions. Maximum six drawn marks. Square composition,
subject fills the frame.
```

**Silhouette variant** — replace the second paragraph with:

```
Style: one solid amber shape (#FFC107) with no outline, carrying only a few interior
black marker marks (#1A1A1A) for detail.
```

**Negative prompt** (where supported):

```
3d, shading, gradient, shadow, outline glow, photorealistic, perspective, isometric,
background, frame, border, text, watermark, multiple objects, clean vector, sharp
corners, thin lines, extra colors, blue, green, purple
```
