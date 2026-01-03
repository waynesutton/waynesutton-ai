---
title: "Image Gen prompt"
description: "Test"
date: "2026-01-01"
slug: "imagegen"
published: true
featured: false
featuredOrder: 4
unlisted: true
tags: ["images"]
readTime: "4 min read"
blogFeatured: false
authorName: "Wayne Sutton"

---

![nature](/images/codesauce.png)

# Disruption starts with sauce. or The defiantion of sauce.

### image gen promp 1
```
{
  "setup_instructions": "Select one value randomly from each variable array then insert into prompt_base where the braces appear.",
  "render": {
    "aspect_ratio": "16:9",
    "size": "1792x1024"
  },
  "prompt_base": "A surreal retro futuristic illustration with heavy film grain, noise texture, and an airbrush painting aesthetic, evoking 1970s sci fi art. A lone {subject} is situated within a vast {environment}. The lighting is dramatic and high contrast, dominated by a {color_theme} gradient. The atmosphere is dreamlike, solitary, and mysterious. Minimal composition. Large negative space. Subtle vignette. No text. No logos. No watermark.",
  "variables": {
    "subject": [
      "silhouetted figure staring at a vintage computer"
    ],
    "environment": [
      "mountain peak cafe above the cloud layer, seen through a huge window"
    ],
    "color_theme": [
      "fiery orange versus deep shadow black"
    ]
  },
  "example_filled_prompt": "A surreal retro futuristic illustration with heavy film grain, noise texture, and an airbrush painting aesthetic, evoking 1970s sci fi art. A lone silhouetted figure staring at a vintage computer is situated within a vast mountain peak cafe above the cloud layer, seen through a huge window. The lighting is dramatic and high contrast, dominated by a fiery orange versus deep shadow black gradient. The atmosphere is dreamlike, solitary, and mysterious. Minimal composition. Large negative space. Subtle vignette. No text. No logos. No watermark."
}
```

### image gen prompt 2

```
{
  "prompt_template": "Surreal retro sci fi poster art with a minimal composition and heavy negative space. A single focal subject: {subject}. Location: {setting}. Signature surreal element: {surreal_element}. Color palette: {palette}. Lighting: strong rim light and soft atmospheric haze, gentle bloom on highlights. Background: smooth gradient sky with fine film grain and a slight vignette. Mood: contemplative, lonely, mysterious. Perspective: {camera}. Texture: airbrushed illustration, analog print feel, subtle dust specks. No text, no logos, no watermark.",
  "variables": {
    "subject": [
      "a lone figure in an oversized jacket seen from behind",
      "a small sprout emerging from a glowing grid floor",
      "a person sitting at the tip of an airplane wing above pastel clouds",
      "a tiny silhouette floating between two tall black monoliths",
      "a solitary traveler standing in fog facing a distant light"
    ],
    "setting": [
      "a foggy red landscape with scattered rocks",
      "an endless cloud ocean at sunset",
      "a dark void with a neon grid horizon",
      "a quiet gradient sky with a flat, empty ground plane",
      "a high altitude scene above clouds with a soft dusk gradient"
    ],
    "surreal_element": [
      "a bright starburst casting a prism beam that fractures into rainbow shards",
      "a levitating monolith with razor sharp edges and faint edge glow",
      "an impossible floating doorway emitting soft white light",
      "a geometric pillar emerging from clouds with a second matching pillar above it",
      "a concentrated spotlight from the sky creating a glowing cone of dust"
    ],
    "palette": [
      "deep black, electric blue, neon green accents, prism rainbow highlights",
      "burnt orange, deep blue, smoky charcoal, subtle magenta haze",
      "hot red fog, black silhouettes, cool white rim light",
      "teal to cobalt sky gradient with warm orange horizon glow",
      "violet to cyan gradient with amber highlights"
    ],
    "camera": [
      "wide angle, centered framing, low horizon",
      "medium shot, subject centered, slightly low angle",
      "distant wide shot, tiny subject, extreme negative space",
      "symmetrical composition, straight on perspective",
      "cinematic wide shot with the subject placed low in frame"
    ]
  },
  "defaults": {
    "subject": "a lone figure in an oversized jacket seen from behind",
    "setting": "a foggy red landscape with scattered rocks",
    "surreal_element": "a bright starburst casting a prism beam that fractures into rainbow shards",
    "palette": "hot red fog, black silhouettes, cool white rim light",
    "camera": "distant wide shot, tiny subject, extreme negative space"
  },
  "avoid": "photoreal faces, busy scenes, extra characters, readable text, logos, watermarks, sharp modern digital look, clutter, comic outlines",
  "render_prefs": {
    "aspect_ratio_options": ["4:5", "3:4", "16:9"],
    "detail_level": "low to medium detail with clean shapes",
    "grain": "subtle film grain",
    "finish": "airbrushed retro poster print"
  }
}
```


