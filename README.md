# KUKA HOME MVP

Premium static storefront + CRM-ready admin/seller MVP built with vanilla HTML, CSS and JS.

## Structure

- `index.html`, `category.html`, `product.html`, `cart.html`, `about.html`, `showrooms.html`, `contact.html`, `order-success.html`
- `admin/` - login, dashboard, orders, leads, export, stock
- `seller/` - login, assigned orders
- `assets/css/styles.css` - shared premium design system
- `assets/js/config.js` - brand, endpoints, storage keys
- `assets/js/data.js` - demo fallback data and placeholder images
- `assets/js/store.js` - cart, lang, profile and timer state
- `assets/js/sheets.js` - Apps Script API client + export helper bridge
- `assets/js/ui.js` - shared shell, cards, toasts, modals, reveal and slider utilities
- `assets/js/app.js` - public page logic
- `assets/js/admin.js` - admin logic
- `assets/js/seller.js` - seller logic
- `Code.gs` - Google Apps Script backend

## Google Sheets Tabs

- `products`
- `murojaatlar`
- `sotuv markazi`
- `vouchers`
- `users`
- `stock`
- `shipments`

## Test Checklist

- Desktop: sticky header compacts on scroll, top bar hides, hero slider moves left/right
- Desktop: product cards swipe/click correctly, add-to-cart shows toast and fly-to-cart
- Mobile: header/search/cart stay usable, grids collapse to 1 column, modal spacing remains clean
- Voucher: appears for unregistered users every 5 minutes, disappears after registration
- Chat widget: bubble appears every 5 minutes, opens modal, close button hides it
- Cart: quantity controls update totals, voucher applies, order redirects to success page
- Admin: dashboard renders KPI cards, orders/leads tables load, export downloads Excel-like file
- Stock: showroom availability and China shipment status render in `admin/stock.html`

## Notes

- Frontend uses live Apps Script URL when actions are available; otherwise it falls back to demo data for local preview.
- Export downloads an `.xls` file generated in-browser from Apps Script JSON rows so it opens in Excel.
