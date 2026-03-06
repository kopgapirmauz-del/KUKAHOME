const productImage = (title, palette) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 620">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="${palette[0]}" offset="0%" />
          <stop stop-color="${palette[1]}" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="800" height="620" rx="40" fill="url(#g)" />
      <circle cx="650" cy="130" r="110" fill="rgba(255,255,255,0.25)" />
      <rect x="120" y="310" width="560" height="120" rx="28" fill="rgba(255,255,255,0.9)" />
      <rect x="170" y="250" width="180" height="80" rx="24" fill="rgba(255,255,255,0.8)" />
      <rect x="370" y="230" width="220" height="100" rx="28" fill="rgba(255,255,255,0.75)" />
      <rect x="150" y="430" width="38" height="90" rx="18" fill="#3a312f" />
      <rect x="608" y="430" width="38" height="90" rx="18" fill="#3a312f" />
      <text x="120" y="120" fill="#fff" font-size="52" font-family="Georgia, serif">KUKA HOME</text>
      <text x="120" y="180" fill="#fff" font-size="34" font-family="Arial, sans-serif">${title}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const demoProducts = [
  {
    id: "soho-luxe",
    model: "Soho Luxe",
    category: "divan",
    tags: ["yangi", "tavsiya"],
    desc: "Keng modul divan, italyan mato, yumshoq geometriya va premium yig'ilish.",
    spec: "320x180 sm, buklet mexanizm, premium ko'pik, antifade mato",
    image1: productImage("Soho Luxe", ["#f7f1eb", "#c9a37c"]),
    image2: productImage("Soho Luxe Detail", ["#ebdfd2", "#b07a57"]),
    image3: productImage("Soho Luxe Interior", ["#e1d8cf", "#8f5d42"]),
    price_old: 28900000,
    price_new: 24900000,
    available: "Yes",
    featured: true
  },
  {
    id: "velar-seat",
    model: "Velar Seat",
    category: "kreslo",
    tags: ["tavsiya"],
    desc: "Dam olish zonasi uchun haykaltarosh ko'rinishdagi premium kreslo.",
    spec: "90x88 sm, boucl mato, yog'och oyoq, soft support",
    image1: productImage("Velar Seat", ["#efe8de", "#8a6d58"]),
    image2: productImage("Velar Seat Side", ["#f5eee4", "#9b7d68"]),
    image3: productImage("Velar Seat Soft", ["#ece2d6", "#6f5b4e"]),
    price_old: 9600000,
    price_new: 7900000,
    available: "Yes",
    featured: true
  },
  {
    id: "orbita-table",
    model: "Orbita Table",
    category: "stol",
    tags: ["yangi"],
    desc: "Travertin effektli ovqatlanish stoli, minimal chiziqlar va markaziy tayanch.",
    spec: "180x95 sm, keramik ustki qism, metal tayanch",
    image1: productImage("Orbita Table", ["#f5f0ea", "#9c8a7d"]),
    image2: productImage("Orbita Table Top", ["#f2ebe2", "#7d6a5d"]),
    image3: productImage("Orbita Table Dining", ["#e7ded5", "#a38d80"]),
    price_old: 15100000,
    price_new: 13200000,
    available: "Yes",
    featured: false
  },
  {
    id: "linen-bed",
    model: "Linen Bed",
    category: "yotoq",
    tags: ["tavsiya"],
    desc: "Premium yotoq ramkasi, baland bosh qismi va sokin hotel estetikasi.",
    spec: "200x220 sm, storage box, orthobase, easy-clean fabric",
    image1: productImage("Linen Bed", ["#f6f2ef", "#90796a"]),
    image2: productImage("Linen Bed Mood", ["#ece5df", "#7d6456"]),
    image3: productImage("Linen Bed Suite", ["#dfd5cd", "#b2a191"]),
    price_old: 22800000,
    price_new: 19600000,
    available: "No",
    featured: true
  },
  {
    id: "forma-mini",
    model: "Forma Mini",
    category: "divan",
    tags: ["yangi"],
    desc: "Kompakt studiyalar uchun yumshoq liniyali divan, premium siluet.",
    spec: "240x110 sm, anti-scratch mato, hidden legs",
    image1: productImage("Forma Mini", ["#f8f2ea", "#b77d53"]),
    image2: productImage("Forma Mini Side", ["#efe0d0", "#8a6548"]),
    image3: productImage("Forma Mini Interior", ["#ebdbca", "#ac835e"]),
    price_old: 19800000,
    price_new: 16900000,
    available: "Yes",
    featured: false
  },
  {
    id: "halo-console",
    model: "Halo Console",
    category: "stol",
    tags: [],
    desc: "Kiraverish yoki living zona uchun nozik konsol, tosh teksturali yuza.",
    spec: "140x40 sm, powder coat frame, ceramic top",
    image1: productImage("Halo Console", ["#f4efe9", "#8b7769"]),
    image2: productImage("Halo Console Hall", ["#eee8e0", "#6d584d"]),
    image3: productImage("Halo Console Stone", ["#ddd3ca", "#9a887a"]),
    price_old: 8600000,
    price_new: 7200000,
    available: "Yes",
    featured: false
  }
];

export const demoOrders = [
  {
    ts: "2026-03-01 10:10",
    order_id: "KH-240301-01",
    city: "Toshkent",
    phone: "+998901112233",
    name: "Aziza Mirzaeva",
    delivery_address: "Yakkasaroy, Shota Rustaveli 14",
    payment: "Click",
    total: 24900000,
    items_json: JSON.stringify([{ id: "soho-luxe", qty: 1 }]),
    page: "cart",
    status: "New",
    comment: "Kechki payt qo'ng'iroq qiling",
    assigned_to: "seller-1"
  },
  {
    ts: "2026-03-02 16:22",
    order_id: "KH-240302-02",
    city: "Samarqand",
    phone: "+998935552211",
    name: "Jahongir Eshonov",
    delivery_address: "Universitet xiyoboni 19",
    payment: "Payme",
    total: 7900000,
    items_json: JSON.stringify([{ id: "velar-seat", qty: 1 }]),
    page: "product",
    status: "Assigned",
    comment: "Showroom pickup",
    assigned_to: "seller-2"
  }
];

export const demoLeads = [
  {
    ts: "2026-03-01 09:45",
    phone: "+998971231212",
    message: "Yangi kolleksiya katalogini yuboring",
    page: "index",
    lang: "uz",
    status: "New",
    result: ""
  },
  {
    ts: "2026-03-03 13:10",
    phone: "+998901009988",
    message: "Toshkent showroom manzili qayerda?",
    page: "contact",
    lang: "ru",
    status: "Closed",
    result: "Location shared"
  }
];

export const demoStock = [
  {
    sku: "soho-luxe",
    model: "Soho Luxe",
    showroom: "Toshkent",
    quantity: 2,
    in_stock: true,
    china_order_status: "Yo'lda",
    eta: "2026-03-19",
    location: "Aktau porti"
  },
  {
    sku: "linen-bed",
    model: "Linen Bed",
    showroom: "Samarqand",
    quantity: 0,
    in_stock: false,
    china_order_status: "Ishlab chiqarishda",
    eta: "2026-04-02",
    location: "Foshan fabrikasi"
  },
  {
    sku: "velar-seat",
    model: "Velar Seat",
    showroom: "Namangan",
    quantity: 4,
    in_stock: true,
    china_order_status: "Mavjud emas",
    eta: "-",
    location: "Namangan showroom"
  }
];

export const dashboardStats = [
  { label: "Yillik loyihalar", value: 44 },
  { label: "Mamnun mijozlar", value: 3000 },
  { label: "Showroom", value: 3 },
  { label: "Yetkazilgan buyurtma", value: 20000 }
];
