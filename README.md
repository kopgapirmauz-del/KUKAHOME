# KUKA HOME Website

KUKA HOME uchun tayyor premium ko'rinishdagi ko'p tilli static sayt.

## Hozirgi struktura

```text
/
├── index.html
├── pages/
│   ├── about.html
│   ├── contact.html
│   ├── furniture.html
│   ├── showrooms.html
│   └── videos.html
├── assets/
│   ├── css/
│   │   └── main.css
│   ├── data/
│   │   ├── products-manifest.js
│   │   └── products-manifest.json
│   ├── images/
│   │   ├── icons/
│   │   ├── products/
│   │   └── slideshow/
│   └── js/
│       └── main.js
├── scripts/
│   ├── build_products_manifest.py
│   └── watch_products_manifest.py
├── translations/
│   ├── en.json
│   ├── kz.json
│   ├── ru.json
│   ├── uz.json
│   └── zh.json
└── update-products.bat
```

## Asosiy imkoniyatlar

- `5 ta til`: Uzbek, Kazak, Russian, English, Chinese
- `Public pages`: bosh sahifa, biz haqimizda, manzil, mebellar, videolar, aloqa
- `Responsive`: desktop va mobil uchun moslangan header, mobile menu va bottom navigation
- `Hero slider`: premium banner, mobil uchun 16:9 balanslangan ko'rinish
- `Furniture catalog`: rasmlar slideshow, fullscreen preview, lightbox, auto-generated cards
- `Showrooms`: ko'p filialli karta, Yandex navigator link va embed preview
- `Videos`: modal ichida YouTube preview
- `Chat widget`: Google Apps Script endpoint bilan ishlaydi
- `Footer`: social links, payment icons, creator credit

## Mebel qo'shish tartibi

Yangi productlar shu papkaga qo'shiladi:

```text
assets/images/products/mebel/
```

Har model alohida papkada bo'ladi:

```text
1.BY.6033/
2.BY.736B/
3.BY.700/
```

Papka ichida:

- `3 ta rasm`
- `info.txt`

Misol:

```text
assets/images/products/mebel/1.BY.6033/
├── product-1.jpg
├── product-12.jpg
├── product-123.jpg
└── info.txt
```

## info.txt formati

```txt
Model: BY.6033
Info:

uz: Yangi modelimizni sizga tavsiya qilamiz!
kz: Сіздерге жаңа моделімізді ұсынамыз!
ru: Представляем вам нашу новую модель!
en: We are pleased to present our new model!
cn: 我们向您推荐我们的全新款式！
```

Eslatma:

- `Model:` hamma tilda bir xil ko'rinadi
- `Info:` esa foydalanuvchi tanlagan tilga qarab chiqadi
- `cn:` avtomatik `zh` sifatida ishlatiladi

## Product manifest qanday ishlaydi

Sayt productlarni to'g'ridan-to'g'ri papkadan emas, mana bu fayldan o'qiydi:

- `assets/data/products-manifest.js`
- `assets/data/products-manifest.json`

Ular mana bu script orqali generatsiya qilinadi:

- `scripts/build_products_manifest.py`

Qo'lda yangilash:

```bat
update-products.bat
```

yoki:

```bat
py scripts/build_products_manifest.py
```

Auto-watch local rejimda:

```bat
py scripts/watch_products_manifest.py
```

## GitHub Pages workflow tavsiyasi

Agar sayt GitHub Pages orqali host qilinsa, productlar avtomatik chiqishi uchun eng yaxshi usul:

1. `mebel` papkaga yangi model qo'shasiz
2. GitHub repo'ga `commit + push` qilasiz
3. GitHub Action `build_products_manifest.py` ni ishga tushiradi
4. Manifest yangilanadi
5. Saytda yangi mebel ko'rinadi

## Local preview

Eng to'g'ri preview local server bilan:

```bash
py -m http.server 5500
```

Keyin brauzerda:

```text
http://localhost:5500
```

## Muhim fayllar

- `index.html` - bosh sahifa
- `pages/about.html` - biz haqimizda
- `pages/showrooms.html` - showroomlar
- `pages/furniture.html` - mebellar katalogi
- `pages/videos.html` - videolar
- `pages/contact.html` - aloqa
- `assets/js/main.js` - barcha frontend logika
- `assets/css/main.css` - barcha stil
- `translations/*.json` - tarjimalar
- `scripts/build_products_manifest.py` - mebel manifest generator

## O'chirish mumkin bo'lgan narsalar

Hozirgi public sayt ishlashi uchun kerak emas bo'lishi mumkin:

- `CRM/` - agar siz bu papkani hozirgi public sayt uchun ishlatmayotgan bo'lsangiz

Public sayt uchun kerak fayllar:

- `index.html`
- `pages/`
- `assets/`
- `translations/`
- `scripts/`
- `update-products.bat`
- `README.md`

`scripts/` va `update-products.bat` ni o'chirmang, agar productlarni manifest orqali yangilamoqchi bo'lsangiz.
