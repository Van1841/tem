# Doctor templates

Three independent, multipage, static (HTML/CSS/vanilla JS) website templates
for the **doctor** category (also matched by "Doctors"). Each template is
self-contained — copy its folder as-is to deploy it; no build step is required.

```
templates/categories/doctor/
  template-01/   "Clarity"  — calm clinical light theme (white + soft teal, serif headings)
  template-02/   "Meridian" — modern trust theme (navy + teal, dark hero, numbered services)
  template-03/   "Hearth"   — warm family-practice theme (cream + terracotta, arch photos)
```

Each template folder contains:

```
index.html      Home
services.html   Services (+ FAQ)
about.html      About the practice
gallery.html    Gallery (click-to-enlarge)
contact.html    Contact + appointment request form
css/style.css
js/script.js
```

The appointment form is a front-end only acknowledgement (no booking backend);
every "book" call-to-action links to `contact.html`. Copy is generic — no
named staff, no fabricated reviews, no guaranteed outcomes.

Images are Unsplash stock photos (`images.unsplash.com/...?auto=format&fit=crop&w=…&q=80`)
with descriptive `alt` text.

## Placeholder tokens

Every template uses the same set of `{{TOKEN}}` placeholders wherever lead
data should appear. A deploy step should find/replace these across every
`.html` file in the template folder before publishing:

| Token | Source (lead field) | Example |
| --- | --- | --- |
| `{{BUSINESS_NAME}}` | `name` | Sunrise Family Clinic |
| `{{BUSINESS_ADDRESS}}` | `address` | 12 MG Road, Pune |
| `{{BUSINESS_PHONE}}` | `phone` | +91 98765 43210 |
| `{{BUSINESS_RATING}}` | `rating` | 4.6 |
| `{{BUSINESS_REVIEW_COUNT}}` | `reviewCount` | 182 |
| `{{BUSINESS_CATEGORY}}` | `category` | Doctor |
| `{{BUSINESS_MAPS_URL}}` | `googleMapsUrl` | https://maps.google.com/... |
| `{{CURRENT_YEAR}}` | generated at deploy time | 2026 |

If a lead field is empty (e.g. no phone), replace the token with an empty
string — elements marked `data-require="{{TOKEN}}"` are hidden by
`js/script.js` when their value is blank.

## Naming convention

Add more templates for this category as `template-04`, `template-05`, etc.
