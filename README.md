# Duluth Auto Service &amp; Imports — website

A redesigned, single-page marketing site for **Duluth Auto Service &amp; Imports**, a European and
domestic auto repair shop at 4349 Abbotts Bridge Road, Duluth, GA 30097.

## Stack

Vanilla HTML, CSS and JavaScript — no build step, no dependencies, no environment variables and no
external APIs. Open `index.html` or serve the directory statically.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Entry point — the whole site |
| `styles.css` | Design system (tokens, layout, components, responsive rules) |
| `script.js` | Nav, scroll reveals, service search/filter, hours status, form handling |
| `favicon.svg` | Favicon mark |
| `robots.txt`, `sitemap.xml` | Basic SEO files |

## Sections

Hero · value strip · all 25 services (searchable + filterable) · about · "Why are Euro Cars So
Popular?" · shop gallery · customer reviews · special offers request · opening hours · contact.

There is no FAQ section because the source content contains no FAQs.

## Services covered

AC Services, Brakes, Drivetrain &amp; Suspension, Fleet Service, Pre Purchase Inspections, Air
Filtration, Check Engine Light, Electrical System, Fuel System, Scheduled Maintenance, Alignment,
Computer Diagnostic, Engine Services, Inspection &amp; Emissions, Tire Rotation, Auto Repair
Estimates, Cooling System, Exhaust System, Oil &amp; Filter Change, Transmission Services,
Batteries, Courtesy Inspections, Extended Warranty Service, Power Steering, Tune Ups.

## Forms

Both forms ("Special offers" and "Service request") POST to the LeadrVision endpoint:

```
https://vision.leadrai.com/api/forms/425c77749fe5fc020f03ada3ad5ccc97
```

* The `action` attribute is present on both forms, so they work with JavaScript disabled.
* `script.js` intercepts the submit and POSTs JSON to the **same** URL, then shows an inline
  "Thanks, your message was sent" confirmation when the response is `{"ok": true}`.
* After a plain HTML submission the visitor returns with `?submitted=1`; the same confirmation is
  shown on load.
* Each form carries `_form` (human name), `_page` (set to `window.location.href`) and a hidden
  `_gotcha` honeypot. No file upload fields, no third-party form services, no `mailto:` actions.

## Images

All photography is reused from the original site (the shop, its bays and the cars it services).
No stock-library images and no invented image URLs.

## Contact

* Phone: [(678) 329-2142](tel:+16783292142)
* Email: duluthautoserviceandimport@gmail.com
* Address: 4349 Abbotts Bridge Road, Duluth, GA 30097
* Hours: Monday closed · Tuesday–Saturday 8:00 am – 6:00 pm · Sunday closed
* Facebook: https://www.facebook.com/DuluthAuto
