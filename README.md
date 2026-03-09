# KUKA HOME — Premium Furniture Website

A modern, luxury corporate website for the furniture brand **KUKA HOME**, built with HTML, CSS, and JavaScript.

## Structure

```
/
├── index.html          # Home
├── about.html          # About Us
├── showrooms.html      # Our Showrooms
├── furniture.html      # Our Furniture
├── videos.html         # Videos
├── contact.html        # Contact
├── assets/
│   ├── css/
│   │   └── main.css    # Global styles
│   ├── js/
│   │   └── main.js     # i18n, header, chat, slider, scroll-to-top
│   └── images/
│       ├── hero/       # Hero slider placeholders (replace with real images)
│       ├── products/   # Product placeholders
│       └── icons/      # Logo SVGs (replace with real KUKA logo)
└── pages/              # Optional future pages
```

## Features

- **6 pages**: Home, About Us, Showrooms, Furniture, Videos, Contact
- **Sticky header** with red KUKA logo, navigation, language switcher, social icons
- **4 languages**: Uzbek, Russian, English, Chinese (with flag switcher)
- **Scroll-to-top** button (appears on scroll)
- **Live chat widget**: send message → Google Sheets (tab `murojaatlar`). Reappears every 5 minutes after close
- **Footer**: black background, logo, hours, social, payment methods (Payme, Click, Uzum, Humo, Visa), nav, phone (click-to-call)
- **Home**: hero slider (4 slides), brand message + stats, new products (4), benefits (4)
- **Responsive**: 320px, 375px, 768px, 1024px, 1440px
- **Animations**: reveal on scroll, hover effects, smooth transitions

## Google Sheets (Chat)

Chat submissions are sent via **POST** to the configured Apps Script URL.  
Payload fields: `timestamp`, `phone`, `message`, `page`, `language`.  
Ensure your Apps Script Web App is deployed to accept POST and appends a row to the sheet tab **"murojaatlar"** with these columns.

## Logo

Replace the placeholder logos when ready:

- **Header**: `assets/images/icons/logo-red.svg` (red KUKA logo)
- **Footer**: `assets/images/icons/logo-white.svg` (white version for black background)

## Running locally

Open `index.html` in a browser, or use a local server:

```bash
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080` (or the port shown).

## Tech

- Vanilla HTML5, CSS3 (custom properties, Flexbox, Grid)
- Vanilla JavaScript (no frameworks)
- Google Fonts: Cormorant Garamond (headings), DM Sans (body)
- Inline SVG icons (Lucide-style)
