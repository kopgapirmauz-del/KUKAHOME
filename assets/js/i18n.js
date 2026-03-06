import { store } from "./store.js";

const dictionary = {
  uz: {
    catalog: "Katalog",
    cart: "Savat",
    login: "Kirish",
    profile: "Profil",
    searchPlaceholder: "Model, kategoriya yoki showroom qidiring",
    heroTitle: "Interyeringiz uchun premium mebel ritmi",
    heroText: "Minimal ko'rinish, zamonaviy tekstura va KUKA HOME uchun ishlab chiqilgan yuqori konversiyali e-commerce tajribasi.",
    heroCta: "Kolleksiyani ko'rish",
    voucherTitle: "Sizga sovg'a - 750 000 ball",
    voucherText: "На первый заказ за регистрацию в программе лояльности KUKA HOME",
    register: "Ro'yxatdan o'tish",
    contactUs: "Bizga yozing, biz onlaynmiz!",
    addToCart: "Savatga qo'shish",
    checkout: "Buyurtma berish"
  },
  ru: {
    catalog: "Каталог",
    cart: "Корзина",
    login: "Войти",
    profile: "Профиль",
    searchPlaceholder: "Ищите модель, категорию или шоурум",
    heroTitle: "Премиальная мебель для выразительного интерьера",
    heroText: "Минимализм, тактильные материалы и современный e-commerce опыт для KUKA HOME.",
    heroCta: "Открыть коллекцию",
    voucherTitle: "Вам подарок - 750 000 баллов",
    voucherText: "На первый заказ за регистрацию в программе лояльности KUKA HOME",
    register: "Зарегистрироваться",
    contactUs: "Напишите нам, мы онлайн!",
    addToCart: "В корзину",
    checkout: "Оформить заказ"
  },
  en: {
    catalog: "Catalog",
    cart: "Cart",
    login: "Sign in",
    profile: "Profile",
    searchPlaceholder: "Search models, categories or showrooms",
    heroTitle: "Premium furniture for a sharper interior",
    heroText: "Minimal design, tactile materials and a conversion-ready storefront made for KUKA HOME.",
    heroCta: "Explore collection",
    voucherTitle: "A gift for you - 750,000 points",
    voucherText: "For the first order after joining the KUKA HOME loyalty program",
    register: "Register now",
    contactUs: "Write to us, we are online!",
    addToCart: "Add to cart",
    checkout: "Checkout"
  }
};

export const t = (key) => dictionary[store.getLang()]?.[key] || dictionary.uz[key] || key;

export const applyI18n = () => {
  document.documentElement.lang = store.getLang();
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
  });
};
