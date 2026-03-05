// /public/js/pages/about.page.js
// About page: agar markup bo'sh bo'lsa, namunaviy kontent qo'yadi.

import { $, el } from "../core/dom.js";

function buildAboutContent() {
  return el(
    "div",
    { class: "about", "data-reveal": "1" },

    el("h1", { class: "about__title" }, "KUKA HOME haqida"),
    el(
      "p",
      { class: "about__lead" },
      "KUKA HOME — premium mebel showroomi. Biz uy va ofis uchun zamonaviy, qulay va uzoq xizmat qiladigan kolleksiyalarni taklif qilamiz."
    ),

    el(
      "div",
      { class: "about__grid" },

      el(
        "section",
        { class: "about__card", "data-reveal": "1" },
        el("h3", { class: "about__h" }, "Premium yondashuv"),
        el(
          "p",
          { class: "about__p" },
          "Minimalist dizayn, sifatli materiallar va puxta yig‘ilish — har bir modelda ko‘rinadi. Bizda klassik va modern uslublar uyg‘unlashgan."
        )
      ),

      el(
        "section",
        { class: "about__card", "data-reveal": "1" },
        el("h3", { class: "about__h" }, "Sifat nazorati"),
        el(
          "p",
          { class: "about__p" },
          "Mebel tanlash — bu uzoq muddatli qaror. Shuning uchun biz assortimentda sifat, qulaylik va mustahkamlikka alohida e’tibor beramiz."
        )
      ),

      el(
        "section",
        { class: "about__card", "data-reveal": "1" },
        el("h3", { class: "about__h" }, "Servis va kafolat"),
        el(
          "p",
          { class: "about__p" },
          "Operatorlarimiz to‘g‘ri model tanlashda yordam beradi, yetkazib berish va o‘rnatish bo‘yicha maslahat beradi. Kafolat va servis xizmatlari mavjud."
        )
      )
    ),

    el(
      "section",
      { class: "about__note", "data-reveal": "1" },
      el("h3", { class: "about__h" }, "Bizning maqsad"),
      el(
        "p",
        { class: "about__p" },
        "Har bir mijoz uyida — qulaylik, estetika va ishonchli sifatni his qilsin. KUKA HOME’da sizning didingizga mos premium yechimlar topiladi."
      )
    )
  );
}

export function initAboutPage() {
  // Tavsiya etilgan root
  const root = $("#about-root");

  // Agar about.html ichida allaqachon kontent bo'lsa, tegmaymiz
  if (root) {
    const hasContent = root.textContent && root.textContent.trim().length > 20;
    if (hasContent) return;

    root.innerHTML = "";
    root.appendChild(buildAboutContent());
    return;
  }

  // Root bo'lmasa, body ichiga qo'shamiz (fallback)
  document.body.appendChild(buildAboutContent());
}