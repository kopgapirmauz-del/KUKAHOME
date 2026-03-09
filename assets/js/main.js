(function () {
  'use strict';

  var INLINE_TRANSLATIONS = {
    en: {
      meta: { languageName: 'English', locale: 'en-GB' },
      nav: { home: 'Home', about: 'About Us', showrooms: 'Showrooms', furniture: 'Furniture', videos: 'Videos', contact: 'Contact' },
      header: { language: 'Language' },
      footer: { tagline: 'premium furniture', workingHoursLabel: 'Working hours', workingHoursValue: '09:00 – 18:00', pages: 'Pages', phoneLabel: 'Phone', payments: 'Payment methods' },
      home: { brandHeadline: 'China’s No.1 Premium Furniture', brandSub: 'Modern design, premium quality, comfort guarantee', newProducts: 'New Products', benefitsTitle: 'Benefits', benefit1Title: 'Premium quality', benefit1Desc: 'Exceptional materials and craftsmanship for lasting elegance.', benefit2Title: 'Fast delivery', benefit2Desc: 'Efficient logistics to bring your order to you on time.', benefit3Title: 'Luxury design', benefit3Desc: 'Curated pieces that elevate your living space.', benefit4Title: 'Comfort guarantee', benefit4Desc: 'We stand behind the comfort and quality of every piece.' },
      stats: { years: 'Years experience', models: 'Models', showrooms: 'Showrooms', clients: 'Clients' },
      products: { p1Title: 'Milano Sofa', p1Desc: 'A refined silhouette with premium upholstery.', p2Title: 'Roma Sectional', p2Desc: 'Spacious comfort built for modern living.', p3Title: 'Venezia Lounge', p3Desc: 'Soft, sculptural lounge chair with ottoman.', p4Title: 'Verona Table', p4Desc: 'Elegant dining table with a premium finish.' },
      furniture: { subtitle: 'Premium collections', collectionHeading: 'New collections' },
      about: { heroLabel: 'About', title: 'About KUKA HOME', subtitle: 'A global premium home furnishing brand shaped by design, intelligent manufacturing, and long-term innovation.', overviewKicker: 'Brand overview', overviewTitle: 'From a focused beginning to a global furniture ecosystem', introP1: 'Founded in 1982, KUKA HOME has grown into one of the world\'s leading home furnishing brands and is listed on the Shanghai Stock Exchange. The company\'s headquarters are located in Hangzhou, China.', introP2: 'From the very beginning, KUKA HOME has remained committed to craftsmanship and innovation. The company specializes in research, design, development, manufacturing, sales, and service across a full range of interior products.', introP3: 'Working together with global partners, we deliver advanced design, dependable comfort, and complete furnishing solutions for homes around the world.', storesStatLabel: 'retail stores across the world', countriesStatLabel: 'countries and regions of presence', missionHeading: 'Our mission', missionBody: 'To create inspiring spaces for a better life.', visionHeading: 'Our vision', visionBody: 'To become a world-leading brand for integrated home living solutions.', valuesHeading: 'Our values', valuesBody: 'Customer focus, results, and innovation guide every decision.', principlesHeading: 'Operating principles', principlesBody: 'Customers first, then business excellence and sustainable success.', legacyKicker: 'Global growth', legacyTitle: 'More than forty years of continuous innovation and expansion', legacyText: 'Based on over 40 years of continuous innovation and sustainable development, KUKA HOME has evolved from modest beginnings into a leading global home furnishing brand. By investing in original design, intelligent manufacturing, and strategic international partnerships, the company has consistently expanded across key world markets.', legacyQuote: 'We build a brand that balances scale with refinement, combining manufacturing strength, design leadership, and a premium customer experience.', designKicker: 'Design power', designTitle: 'World-class design capability backed by research, patents, and awards', designText1: 'KUKA HOME\'s original designs have earned more than 100 international awards, including 4 iF awards and 5 Red Dot Design Awards. With four global R&D centres, the brand keeps innovation at the core of every collection.', designText2: 'Our Milan design centre collaborates with leading European teams and works closely with Politecnico di Milano, helping define global trends while nurturing new talent in the furniture industry.', patentsLabel: 'owned patents', awardsLabel: 'design awards', goldAwardsLabel: 'gold-level design honours', recordsKicker: 'Recognition', recordTitle: 'Officially recognized by Guinness World Records', recordBody: 'KUKA HOME entered the Guinness World Records with the largest spring mattress measuring 22.04 by 20 metres, created in Hangzhou, Zhejiang, China on 6 May 2017.', awardTitle: 'Best Product Design Award at MIFF', awardBody: 'KUKA HOME received the \'Best Product Design\' award at the Malaysian International Furniture Fair (MIFF), highlighting the brand\'s excellence in bedroom furniture design.' },
      showrooms: { title: 'Our Showrooms', subtitle: 'Visit our premium exhibition spaces', city: 'City', address: 'Address', hours: 'Working hours', map: 'Map preview', cta: 'Book a visit', s1Name: 'Tashkent — Sergeli', s1Addr: 'Sergeli district, Qatorqol street, 1', s2Name: 'Tashkent — Chilonzor', s2Addr: 'Chilonzor district, Bunyodkor avenue, 25', s3Name: 'Samarkand', s3Addr: 'Registon street, 15' },
      videos: { title: 'Videos', subtitle: 'Collections, reviews, and craftsmanship', v1Title: 'KUKA Home brings you the comfort and style of your dreams!', v2Title: 'KUKA HOME 4.0 smart factory - about the technology behind custom furniture production for the entire home', v3Title: '0721 technology fabric upholstery - an explainer video about the material\'s qualities and advantages.', v4Title: '🛏 KUKA Home mattresses that passed quality testing!', v5Title: '🌕 KUKA HOME | Full moon, full hearts', v6Title: '✨ For your family\'s happiness and comfort!' },
      contact: { title: 'Contact', subtitle: 'We’ll help you choose the perfect piece', infoTitle: 'Contact details', addressLabel: 'Address', addressValue: 'Tashkent city, Chilonzor district, Gavhar street 124/1 (Olmazor metro)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Phone', hoursLabel: 'Working hours', formTitle: 'Send a message', name: 'Name', phone: 'Phone number', message: 'Message', send: 'Send' },
      chat: { title: 'Send a message', subtitle: 'KUKA HOME', phone: 'Phone', message: 'Message', send: 'Send', success: 'Your message has been sent.', error: 'Something went wrong. Please try again.' },
      common: { copyright: '© KUKA HOME. All rights reserved.' }
    },
    uz: {
      meta: { languageName: 'Uzbek', locale: 'uz-UZ' },
      nav: { home: 'Bosh sahifa', about: 'Biz haqimizda', showrooms: 'Manzil', furniture: 'Mebellar', videos: 'Videolar', contact: 'Aloqa' },
      header: { language: 'Til' },
      footer: { tagline: 'premium mebellar', workingHoursLabel: 'Ish vaqti', workingHoursValue: '09:00 – 18:00', pages: 'Sahifalar', phoneLabel: 'Telefon', payments: 'To‘lov usullari' },
      home: { brandHeadline: 'Xitoyning №1 Premium Mebeli', brandSub: 'Zamonaviy dizayn, yuqori sifat, qulaylik kafolati', newProducts: 'Yangi mahsulotlar', benefitsTitle: 'Afzalliklar', benefit1Title: 'Premium sifat', benefit1Desc: 'Yuqori sifatli materiallar va puxta ishlov berish.', benefit2Title: 'Tez yetkazib berish', benefit2Desc: 'Buyurtmangizni o‘z vaqtida yetkazib beramiz.', benefit3Title: 'Lyuks dizayn', benefit3Desc: 'Interyeringizni yuksaltiradigan tanlangan kolleksiyalar.', benefit4Title: 'Qulaylik kafolati', benefit4Desc: 'Har bir mahsulot qulayligi va sifati uchun kafolat.' },
      stats: { years: 'yillik tajriba', models: 'dan ortiq modellar', showrooms: 'ta salon', clients: 'dan ortiq mijozlar' },
      products: { p1Title: 'Milano Divan', p1Desc: 'Premium mato va nafis siluet.', p2Title: 'Roma Burchakli', p2Desc: 'Keng va qulay zamonaviy yechim.', p3Title: 'Venezia Kursi', p3Desc: 'Yumshoq lounge kursi va puf.', p4Title: 'Verona Stol', p4Desc: 'Premium ishlovli elegant stol.' },
      furniture: { subtitle: 'Premium kolleksiyalar', collectionHeading: 'Yangi kolleksiyalar' },
      about: { heroLabel: 'About', title: 'KUKA HOME haqida', subtitle: 'Dizayn, intellektual ishlab chiqarish va uzluksiz innovatsiyalar asosida qurilgan global premium home furnishing brendi.', overviewKicker: 'Brend haqida', overviewTitle: 'Ishonchli boshlanishdan global uy jihozlari ekotizimigacha', introP1: '1982 yilda asos solingan KUKA HOME bugun uy jihozlari sohasidagi dunyo yetakchi brendlaridan biriga aylandi va Shanxay fond birjasida ro\'yxatga olingan. Kompaniyaning bosh qarorgohi Xanchjou, Xitoyda joylashgan.', introP2: 'KUKA HOME ilk kunlardan buyon o\'z missiyasiga sodiq: mahorat va innovatsiya. Kompaniya tadqiqot, dizayn, ishlab chiqish, ishlab chiqarish, savdo va xizmat ko\'rsatish bo\'yicha to\'liq interyer assortimentida faoliyat yuritadi.', introP3: 'Global hamkorlar bilan birgalikda biz mijozlarga yuqori sifat, ilg\'or dizayn, maksimal qulaylik va butun uy uchun kompleks yechimlarni taqdim etamiz.', storesStatLabel: 'butun dunyo bo\'ylab retail do\'konlar', countriesStatLabel: 'mamlakat va mintaqalardagi ishtirok', missionHeading: 'Bizning missiyamiz', missionBody: 'Yaxshiroq hayot uchun ilhomlantiruvchi makonlar yaratish.', visionHeading: 'Bizning qarashimiz', visionBody: 'Uy uchun kompleks yechimlar bo\'yicha dunyoning yetakchi brendiga aylanish.', valuesHeading: 'Qadriyatlarimiz', valuesBody: 'Mijozga yo\'naltirilganlik, natija va innovatsiya.', principlesHeading: 'Faoliyat tamoyillari', principlesBody: 'Eng avvalo: mijozlar, biznes va muvaffaqiyat.', legacyKicker: 'Global o\'sish', legacyTitle: '40 yildan ortiq uzluksiz innovatsiya va barqaror rivojlanish', legacyText: '40 yildan ortiq uzluksiz innovatsiya va barqaror rivojlanishga tayangan holda, KUKA HOME kamtarona boshlanishdan dunyoning yetakchi uy jihozlari brendlaridan biriga aylandi. Original dizayn, intellektual ishlab chiqarish va strategik global hamkorlikka sarmoya kiritib, kompaniya xalqaro asosiy bozorlardagi ishtirokini izchil kengaytirdi.', legacyQuote: 'Biz masshtab, premium tajriba va dizayn yetakchiligini birlashtirgan brendni quramiz.', designKicker: 'Dizayn qudrati', designTitle: 'Tadqiqot, patent va mukofotlar bilan mustahkamlangan jahon darajasidagi dizayn salohiyati', designText1: 'KUKA HOME original dizaynlari 100 dan ortiq xalqaro mukofotlarga sazovor bo\'lgan, jumladan 4 ta iF va 5 ta Red Dot Design Award. 4 ta global R&D markazida ishlaydigan brend har bir kolleksiyada innovatsiyani markazga qo\'yadi.', designText2: 'Milan dizayn markazimiz Yevropaning yetakchi jamoalari bilan hamkorlik qiladi va Milan Politecnico universiteti bilan yaqindan ishlaydi, shu orqali global trendlarni belgilash hamda mebel sanoatida yangi iste\'dodlarni rivojlantirishga hissa qo\'shadi.', patentsLabel: 'o\'z patentlarimiz', awardsLabel: 'dizayn mukofotlari', goldAwardsLabel: 'yuqori darajadagi dizayn yutuqlari', recordsKicker: 'E\'tirof', recordTitle: 'Guinness World Records ro\'yxatiga kiritilgan', recordBody: 'KUKA HOME 2017 yil 6 may kuni Xitoyning Chjetszyan viloyati, Xanchjou shahrida yaratilgan 22,04 x 20 metr o\'lchamdagi eng yirik prujinali matras bilan Guinness World Records ro\'yxatiga rasman kiritilgan.', awardTitle: 'MIFF ko\'rgazmasida Best Product Design mukofoti', awardBody: 'KUKA HOME Malayziya xalqaro mebel ko\'rgazmasi (MIFF) da \'Best Product Design\' mukofotiga sazovor bo\'lgan. Bu brendning yotoqxona mebellari dizaynidagi yuqori darajasini ko\'rsatadi.' },
      showrooms: { title: 'Manzil', subtitle: 'Premium ko‘rgazma zallarimizga tashrif buyuring', city: 'Shahar', address: 'Manzil', hours: 'Ish vaqti', map: 'Xaritada', cta: 'Tashrif buyuring', s1Name: 'Chilonzor fillial', s1Addr: 'Toshkent shahri, Chilonzor tumani, Gavhar ko\'chasi 124/1 (Olmazor metro)', s2Name: 'Yashnabod fillial', s2Addr: 'Toshkent shahri, Yashnabod tumani, Maxtimquli ko\'chasi, 75 (Arca)', s3Name: 'Mirzo Ulug\'bek fillial', s3Addr: 'Toshkent shahri, Mirzo Ulug\'bek tumani, Amir Temur ko\'chasi 3a (Chimgan Atlas)' },
      videos: { title: 'Videolar', subtitle: 'Kolleksiyalar, sharhlar va hunarmandchilik', v1Title: 'KUKA home sizga orzuingizdagi qulaylik va uslubni taqdim etadi!', v2Title: 'KUKA HOME 4.0 aqlli zavodi — butun uy uchun individual mebel ishlab chiqarish texnologiyasi haqida', v3Title: '0721 texnologik mato qoplamasi — materialning sifatlari va afzalliklari haqida tushuntiruvchi video.', v4Title: '🛏 Sifat sinovidan o‘tgan KUKA Home matraslari!', v5Title: '🌕 KUKA HOME | To‘lin oy, to‘la yuraklar', v6Title: '✨ Oilangiz baxti va qulayligi uchun!' },
      contact: { title: 'Aloqa', subtitle: 'Siz uchun eng mos mebelni tanlashga yordam beramiz', infoTitle: 'Bog‘lanish', addressLabel: 'Manzil', addressValue: 'Toshkent shahri, Chilonzor tumani, Gavhar ko\'chasi 124/1 (Olmazor metro)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Telefon', hoursLabel: 'Ish vaqti', formTitle: 'Xabar yuboring', name: 'Ismingiz', phone: 'Telefon raqamingiz', message: 'Xabaringiz', send: 'Yuborish' },
      chat: { title: 'Xabar yuboring', subtitle: 'KUKA HOME', phone: 'Telefoningizni kiriting', message: 'Xabaringizni yozing...', send: 'Yuborish', success: 'Xabaringiz yuborildi.', error: 'Xatolik. Qayta urinib ko‘ring.' },
      common: { copyright: '© KUKA HOME. Barcha huquqlar himoyalangan.' }
    },
    ru: {
      meta: { languageName: 'Russian', locale: 'ru-RU' },
      nav: { home: 'Главная', about: 'О нас', showrooms: 'Шоу-румы', furniture: 'Мебель', videos: 'Видео', contact: 'Контакты' },
      header: { language: 'Язык' },
      footer: { tagline: 'премиальная мебель', workingHoursLabel: 'Время работы', workingHoursValue: '09:00 – 18:00', pages: 'Страницы', phoneLabel: 'Телефон', payments: 'Способы оплаты' },
      home: { brandHeadline: 'Премиальная мебель №1 из Китая', brandSub: 'Современный дизайн, высокое качество, гарантия комфорта', newProducts: 'Новые продукты', benefitsTitle: 'Преимущества', benefit1Title: 'Премиум качество', benefit1Desc: 'Лучшие материалы и безупречное исполнение.', benefit2Title: 'Быстрая доставка', benefit2Desc: 'Надёжная логистика и доставка в срок.', benefit3Title: 'Роскошный дизайн', benefit3Desc: 'Коллекции, которые подчёркивают статус интерьера.', benefit4Title: 'Гарантия комфорта', benefit4Desc: 'Мы отвечаем за комфорт и качество каждой модели.' },
      stats: { years: 'лет опыта', models: 'моделей', showrooms: 'шоу-рума', clients: 'клиентов' },
      products: { p1Title: 'Диван Milano', p1Desc: 'Изысканный силуэт и премиальная обивка.', p2Title: 'Угловой Roma', p2Desc: 'Просторный комфорт для современной гостиной.', p3Title: 'Кресло Venezia', p3Desc: 'Лаунж-кресло с мягкими формами и пуфом.', p4Title: 'Стол Verona', p4Desc: 'Элегантный стол с премиальной отделкой.' },
      furniture: { subtitle: 'Премиальные коллекции', collectionHeading: 'Новые коллекции' },
      about: { heroLabel: 'About', title: 'О KUKA HOME', subtitle: 'Глобальный премиальный бренд домашней обстановки, построенный на дизайне, интеллектуальном производстве и непрерывных инновациях.', overviewKicker: 'Обзор бренда', overviewTitle: 'От уверенного старта к мировой экосистеме домашнего комфорта', introP1: 'Основанная в 1982 году, KUKA HOME стала одним из мировых лидеров среди брендов домашней обстановки и представлена на Шанхайской фондовой бирже. Штаб-квартира компании находится в Ханчжоу, Китай.', introP2: 'С самого начала KUKA HOME верна своей миссии: мастерство и инновации. Компания специализируется на исследованиях, дизайне, разработке, производстве, продаже и обслуживании полного ассортимента предметов интерьера.', introP3: 'Вместе с партнерами мы обеспечиваем глобальных потребителей высоким качеством исполнения, передовым дизайном, максимальным комфортом и разнообразными комплексными решениями для обустройства всего дома.', storesStatLabel: 'розничных магазинов по всему миру', countriesStatLabel: 'стран и регионов присутствия', missionHeading: 'Наша миссия', missionBody: 'Создавать вдохновляющие пространства для лучшей жизни.', visionHeading: 'Наше видение', visionBody: 'Стать мировым лидирующим брендом комплексных решений для дома.', valuesHeading: 'Наши ценности', valuesBody: 'Ориентация на клиента, результат и инновации.', principlesHeading: 'Принципы деятельности', principlesBody: 'Превыше всего: клиенты, бизнес и успех.', legacyKicker: 'Глобальный рост', legacyTitle: 'Более 40 лет непрерывных инноваций и устойчивого развития', legacyText: 'Основываясь на более чем 40 годах непрерывных инноваций и устойчивого развития, KUKA HOME прошла путь от скромных начинаний до статуса ведущего мирового бренда домашней обстановки. Инвестируя в оригинальный дизайн, интеллектуальное производство и стратегическое глобальное партнерство, компания неуклонно расширяла свое присутствие на ключевых международных рынках.', legacyQuote: 'Мы строим бренд, который сочетает масштаб, дизайн мирового уровня и выверенный клиентский опыт.', designKicker: 'Дизайнерская мощь', designTitle: 'Дизайн мирового уровня, подкрепленный исследованиями, патентами и наградами', designText1: 'Оригинальные дизайны KUKA HOME завоевали более 100 международных наград, включая 4 премии iF и 5 премий Red Dot Design Award. Работая в 4 глобальных центрах НИОКР, бренд неизменно делает ставку на инновации.', designText2: 'Наш Миланский дизайн-центр сотрудничает с ведущими европейскими командами и тесно взаимодействует с Миланским политехническим университетом, формируя глобальные тренды и поддерживая развитие молодых талантов в мебельной индустрии.', patentsLabel: 'собственных патентов', awardsLabel: 'дизайнерских наград', goldAwardsLabel: 'знаковых наград в дизайне', recordsKicker: 'Признание', recordTitle: 'Внесены в Книгу рекордов Гиннесса', recordBody: 'KUKA HOME официально вошла в Книгу рекордов Гиннесса благодаря крупнейшему пружинному матрасу размером 22,04 на 20 метров, созданному в Ханчжоу, провинция Чжэцзян, Китай, 6 мая 2017 года.', awardTitle: 'Награда Best Product Design на MIFF', awardBody: 'KUKA HOME удостоена награды «Лучший дизайн продукта» на Международной мебельной выставке в Малайзии (MIFF), что подтверждает высокий уровень бренда в разработке мебели для спальни.' },
      showrooms: { title: 'Наши шоу-румы', subtitle: 'Посетите наши выставочные залы', city: 'Город', address: 'Адрес', hours: 'Время работы', map: 'Карта', cta: 'Записаться на визит', s1Name: 'Ташкент — Сергели', s1Addr: 'Сергели, ул. Каторкул, 1', s2Name: 'Ташкент — Чиланзар', s2Addr: 'Чиланзар, проспект Бунёдкор, 25', s3Name: 'Самарканд', s3Addr: 'ул. Регистан, 15' },
      videos: { title: 'Видео', subtitle: 'Коллекции, обзоры и мастерство', v1Title: 'KUKA Home дарит вам комфорт и стиль вашей мечты!', v2Title: 'Умная фабрика KUKA HOME 4.0 - о технологии индивидуального производства мебели для всего дома', v3Title: 'Технологичная тканевая обивка 0721 - видео о свойствах материала и его преимуществах.', v4Title: '🛏 Матрасы KUKA Home, прошедшие проверку качества!', v5Title: '🌕 KUKA HOME | Полная луна, полные сердца', v6Title: '✨ Для счастья и уюта вашей семьи!' },
      contact: { title: 'Контакты', subtitle: 'Поможем выбрать идеальную мебель', infoTitle: 'Связаться с нами', addressLabel: 'Адрес', addressValue: 'г. Ташкент, Чиланзарский район, улица Гавхар, 124/1 (метро Олмазор)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Телефон', hoursLabel: 'Время работы', formTitle: 'Отправить сообщение', name: 'Имя', phone: 'Телефон', message: 'Сообщение', send: 'Отправить' },
      chat: { title: 'Написать сообщение', subtitle: 'KUKA HOME', phone: 'Телефон', message: 'Сообщение', send: 'Отправить', success: 'Сообщение отправлено.', error: 'Ошибка. Попробуйте снова.' },
      common: { copyright: '© KUKA HOME. Все права защищены.' }
    },
    zh: {
      meta: { languageName: 'Chinese', locale: 'zh-CN' },
      nav: { home: '首页', about: '关于我们', showrooms: '展厅', furniture: '家具', videos: '视频', contact: '联系我们' },
      header: { language: '语言' },
      footer: { tagline: '高端家具', workingHoursLabel: '营业时间', workingHoursValue: '09:00 – 18:00', pages: '页面', phoneLabel: '电话', payments: '支付方式' },
      home: { brandHeadline: '中国高端家具第一品牌', brandSub: '现代设计，高端品质，舒适保障', newProducts: '新品推荐', benefitsTitle: '优势', benefit1Title: '高端品质', benefit1Desc: '精选材料与精湛工艺，持久优雅。', benefit2Title: '快速配送', benefit2Desc: '高效物流，准时送达。', benefit3Title: '奢华设计', benefit3Desc: '提升空间格调的精选系列。', benefit4Title: '舒适保障', benefit4Desc: '每一件产品都兼顾舒适与品质。' },
      stats: { years: '年经验', models: '款式', showrooms: '个展厅', clients: '位客户' },
      products: { p1Title: 'Milano 沙发', p1Desc: '精致轮廓与高端面料。', p2Title: 'Roma 转角沙发', p2Desc: '宽敞舒适，适合现代生活。', p3Title: 'Venezia 休闲椅', p3Desc: '柔和线条，配脚凳更舒适。', p4Title: 'Verona 餐桌', p4Desc: '优雅细节与高端工艺。' },
      furniture: { subtitle: '高端系列', collectionHeading: '新品系列' },
      about: { heroLabel: 'About', title: '关于 KUKA HOME', subtitle: '以设计、智能制造与持续创新为核心的全球高端家居品牌。', overviewKicker: '品牌概览', overviewTitle: '从稳健起步发展为全球家居生态品牌', introP1: 'KUKA HOME 创立于 1982 年，现已成为全球领先的家居品牌之一，并在上海证券交易所上市。公司总部位于中国杭州。', introP2: '自创立以来，KUKA HOME 始终坚持工艺与创新，专注于家居产品的研发、设计、制造、销售与服务，形成完整的家居产品体系。', introP3: '通过与全球伙伴合作，我们为消费者提供高品质、先进设计、舒适体验以及覆盖整个家庭空间的综合解决方案。', storesStatLabel: '全球零售门店', countriesStatLabel: '覆盖国家和地区', missionHeading: '我们的使命', missionBody: '为更美好的生活创造富有灵感的空间。', visionHeading: '我们的愿景', visionBody: '成为全球领先的一体化家居解决方案品牌。', valuesHeading: '我们的价值观', valuesBody: '以客户为中心，以结果和创新为导向。', principlesHeading: '经营原则', principlesBody: '客户优先，其次是卓越经营与长期成功。', legacyKicker: '全球成长', legacyTitle: '四十余年持续创新与稳健发展', legacyText: '基于四十多年的持续创新与可持续发展，KUKA HOME 从最初的起步成长为全球领先的家居品牌。通过持续投入原创设计、智能制造与战略性国际合作，品牌不断扩大在全球重点市场的影响力。', legacyQuote: '我们打造的是一个兼具规模、设计领导力与高端客户体验的全球品牌。', designKicker: '设计实力', designTitle: '以研发、专利与国际奖项支撑的世界级设计能力', designText1: 'KUKA HOME 的原创设计已获得 100 多项国际奖项，其中包括 4 项 iF 奖和 5 项红点设计奖。依托 4 个全球研发中心，品牌始终将创新放在核心位置。', designText2: '我们的米兰设计中心与欧洲领先团队密切合作，并与米兰理工大学开展协同研究，共同推动全球家具设计趋势与人才培养。', patentsLabel: '项自有专利', awardsLabel: '项设计奖项', goldAwardsLabel: '项高含金量设计荣誉', recordsKicker: '荣誉认可', recordTitle: '入选吉尼斯世界纪录', recordBody: 'KUKA HOME 凭借 2017 年 5 月 6 日在中国浙江杭州制造的 22.04 米 x 20 米超大型弹簧床垫，正式进入吉尼斯世界纪录。', awardTitle: '荣获 MIFF 最佳产品设计奖', awardBody: 'KUKA HOME 在马来西亚国际家具展（MIFF）上荣获“最佳产品设计奖”，体现了品牌在卧室家具设计领域的卓越实力。' },
      showrooms: { title: '我们的展厅', subtitle: '欢迎到访高端展示空间', city: '城市', address: '地址', hours: '营业时间', map: '地图', cta: '预约到访', s1Name: '塔什干 — Sergeli', s1Addr: 'Sergeli 区，Qatorqol 街 1 号', s2Name: '塔什干 — Chilonzor', s2Addr: 'Chilonzor 区，Bunyodkor 大道 25 号', s3Name: '撒马尔罕', s3Addr: 'Registon 街 15 号' },
      videos: { title: '视频', subtitle: '系列、测评与匠心工艺', v1Title: 'KUKA Home 为您带来梦想中的舒适与风格！', v2Title: 'KUKA HOME 4.0 智能工厂 - 关于全屋定制家具生产技术', v3Title: '0721 科技布面料 - 介绍材料特性与优势的说明视频。', v4Title: '🛏 通过品质测试的 KUKA Home 床垫！', v5Title: '🌕 KUKA HOME | 满月，满心温暖', v6Title: '✨ 为家人的幸福与舒适而生！' },
      contact: { title: '联系我们', subtitle: '我们将帮助您选择最合适的家具', infoTitle: '联系信息', addressLabel: '地址', addressValue: '塔什干市 Chilonzor 区 Gavhar 街 124/1（Olmazor 地铁）', emailLabel: '邮箱', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: '电话', hoursLabel: '营业时间', formTitle: '发送消息', name: '姓名', phone: '电话', message: '消息', send: '发送' },
      chat: { title: '发送消息', subtitle: 'KUKA HOME', phone: '电话', message: '消息', send: '发送', success: '消息已发送。', error: '出错了，请重试。' },
      common: { copyright: '© KUKA HOME. 版权所有。' }
    }
  };

  var TRANSLATIONS_CACHE = {};
  var activeDict = null;
  var fallbackDict = null;

  function getStoredLang() {
    try {
      return localStorage.getItem('kuka_lang') || 'en';
    } catch (e) {
      return 'en';
    }
  }

  function setStoredLang(code) {
    try {
      localStorage.setItem('kuka_lang', code);
    } catch (e) {}
  }

  function deepGet(obj, key) {
    var parts = key.split('.');
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current == null) break;
      current = current[parts[i]];
    }
    return current;
  }

  function t(key) {
    var primary = deepGet(activeDict, key);
    if (primary != null) return String(primary);
    var fb = deepGet(fallbackDict, key);
    if (fb != null) return String(fb);
    return key;
  }

  function getTranslationsUrl(lang) {
    var base = window.location.pathname.replace(/\/[^/]*$/, '/') || '/';
    return base + 'translations/' + lang + '.json';
  }

  function loadTranslations(lang) {
    if (TRANSLATIONS_CACHE[lang]) return Promise.resolve(TRANSLATIONS_CACHE[lang]);
    if (INLINE_TRANSLATIONS[lang]) {
      TRANSLATIONS_CACHE[lang] = INLINE_TRANSLATIONS[lang];
      return Promise.resolve(TRANSLATIONS_CACHE[lang]);
    }
    return fetch(getTranslationsUrl(lang), { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load: ' + lang);
        return res.json();
      })
      .then(function (json) {
        TRANSLATIONS_CACHE[lang] = json;
        return json;
      })
      .catch(function () {
        if (INLINE_TRANSLATIONS[lang]) {
          TRANSLATIONS_CACHE[lang] = INLINE_TRANSLATIONS[lang];
          return TRANSLATIONS_CACHE[lang];
        }
        throw new Error('No translations available for ' + lang);
      });
  }

  function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var val = t(key);
      if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      var val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });
    document.documentElement.setAttribute('lang', getStoredLang());
  }

  function initLangSwitcher() {
    var root = document.getElementById('lang-switcher');
    var btn = document.getElementById('lang-switcher-btn');
    var dropdown = document.getElementById('lang-switcher-dropdown');
    if (!root || !btn || !dropdown) return;

    var LANGUAGES = {
      uz: { short: 'UZ', name: 'Uzbek', icon: 'assets/images/icons/flaguz.svg' },
      ru: { short: 'RU', name: 'Russian', icon: 'assets/images/icons/flagrus.svg' },
      en: { short: 'EN', name: 'English', icon: 'assets/images/icons/flageng.svg' },
      zh: { short: 'CN', name: 'Chinese', icon: 'assets/images/icons/flagchina.svg' }
    };

    function renderCurrent() {
      var lang = getStoredLang();
      var current = LANGUAGES[lang] || LANGUAGES.en;
      btn.innerHTML = '<img class="lang-flag lang-flag-current" src="' + current.icon + '" alt="' + current.short + '">';
    }
    renderCurrent();

    dropdown.querySelectorAll('button[data-lang]').forEach(function (button) {
      var code = button.getAttribute('data-lang');
      var meta = LANGUAGES[code];
      if (!meta) return;
      button.innerHTML = '<img class="lang-flag lang-flag-option" src="' + meta.icon + '" alt="' + meta.short + '"><span class="lang-code">' + meta.short + '</span><span class="lang-name">' + meta.name + '</span>';
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('kuka:close-mobile-menu'));
      root.classList.toggle('open');
    });
    document.addEventListener('click', function () { root.classList.remove('open'); });
    document.addEventListener('kuka:close-lang-switcher', function () {
      root.classList.remove('open');
    });

    dropdown.querySelectorAll('button[data-lang]').forEach(function (button) {
      button.addEventListener('click', function (e) {
        e.stopPropagation();
        var code = button.getAttribute('data-lang');
        if (!code) return;
        setStoredLang(code);
        renderCurrent();
        loadTranslations(code).then(function (dict) {
          activeDict = dict;
          updatePageText();
        }).catch(function () {
          activeDict = fallbackDict;
          updatePageText();
        });
        root.classList.remove('open');
      });
    });
  }

  function getCurrentPage() {
    var path = window.location.pathname || '';
    var parts = path.split('/').filter(Boolean);
    var file = parts.length ? parts[parts.length - 1] : 'index.html';
    path = file.replace(/\.html$/, '') || 'index';
    var map = { '': 'home', index: 'home', about: 'about', showrooms: 'showrooms', furniture: 'furniture', videos: 'videos', contact: 'contact' };
    return map[path] || 'home';
  }

  function initStickyHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollToTop() {
    var btn = document.querySelector('.scroll-to-top');
    if (!btn) return;
    function onScroll() {
      btn.classList.toggle('visible', window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function setActiveNav() {
    var page = getCurrentPage();
    document.querySelectorAll('.header-nav a, .mobile-nav .header-nav a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').replace(/^\//, '').replace(/\.html$/, '') || 'index';
      var linkPage = (href === '' || href === 'index') ? 'home' : href;
      link.classList.toggle('active', linkPage === page);
    });
  }

  function initMobileMenu() {
    var toggle = document.querySelector('.menu-toggle');
    var mobileNav = document.querySelector('.mobile-nav');
    if (!toggle || !mobileNav) return;
    function closeMenu() {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
    toggle.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('kuka:close-lang-switcher'));
      mobileNav.classList.toggle('open');
      document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
    });
    document.addEventListener('kuka:close-mobile-menu', closeMenu);
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });
    document.querySelectorAll('.header-right a, .lang-switcher-btn').forEach(function (el) {
      el.addEventListener('click', function () {
        if (mobileNav.classList.contains('open')) closeMenu();
      });
    });
  }

  function initNavigation() {
    setActiveNav();
    initMobileMenu();
  }

  function initHeroSlider() {
    var slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    var dots = document.querySelectorAll('.hero-dot');
    var prev = document.querySelector('.hero-arrow-prev');
    var next = document.querySelector('.hero-arrow-next');
    var hero = document.querySelector('.hero');
    var index = 0;
    var intervalId = null;
    var animationTimeout = null;

    function goTo(i) {
      var total = slides.length;
      if (!total) return;
      var nextIndex = ((i % total) + total) % total;
      var previousIndex = index;
      index = nextIndex;

      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }

      slides.forEach(function (slide, idx) {
        slide.classList.remove('active');
        if (idx !== previousIndex) slide.classList.remove('prev');
      });

      if (slides[previousIndex] && previousIndex !== nextIndex) {
        slides[previousIndex].classList.add('prev');
      }

      if (slides[nextIndex]) {
        slides[nextIndex].classList.add('active');
      }

      animationTimeout = setTimeout(function () {
        slides.forEach(function (slide, idx) {
          if (idx !== index) slide.classList.remove('prev');
        });
      }, 900);

      dots.forEach(function (dot, idx) { dot.classList.toggle('active', idx === index); });
    }
    function nextSlide() { goTo(index + 1); }
    function startAuto() {
      if (intervalId != null) return;
      intervalId = setInterval(nextSlide, 5000);
    }
    function stopAuto() {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    if (prev) prev.addEventListener('click', function () { stopAuto(); goTo(index - 1); startAuto(); });
    if (next) next.addEventListener('click', function () { stopAuto(); nextSlide(); startAuto(); });
    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () { stopAuto(); goTo(idx); startAuto(); });
    });

    goTo(0);
    startAuto();
    if (hero) {
      hero.addEventListener('mouseenter', stopAuto);
      hero.addEventListener('mouseleave', startAuto);
    }
  }

  function localeForLang(lang) {
    var map = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-UZ', zh: 'zh-CN' };
    return map[lang] || 'en-GB';
  }

  function initCounters() {
    var items = document.querySelectorAll('[data-count-to]');
    if (!items.length) return;
    var lang = getStoredLang();
    var nf = new Intl.NumberFormat(localeForLang(lang));
    function animate(el) {
      var to = Number(el.getAttribute('data-count-to') || '0');
      var suffix = el.getAttribute('data-count-suffix') || '';
      var duration = Number(el.getAttribute('data-count-duration') || '1200');
      var start = performance.now();
      function frame(now) {
        var p = Math.min(1, (now - start) / duration);
        var v = Math.round(to * (1 - Math.pow(1 - p, 3)));
        el.textContent = nf.format(v) + suffix;
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    var seen = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (seen.has(el)) return;
        seen.add(el);
        animate(el);
      });
    }, { threshold: 0.35 });
    items.forEach(function (el) { observer.observe(el); });
  }

  function initVideoModal() {
    var modal = document.getElementById('video-modal');
    if (!modal) return;
    var overlay = modal.querySelector('[data-modal-overlay]');
    var close = modal.querySelector('[data-modal-close]');
    var frame = modal.querySelector('iframe');
    var fallback = document.getElementById('video-fallback');
    var fallbackLink = document.getElementById('video-fallback-link');
    var fallbackTimer = null;
    var hasHttpOrigin = /^https?:/i.test(window.location.origin || '');
    function withOrigin(url) {
      if (!url) return url;
      if (!hasHttpOrigin) return url;
      if (url.indexOf('origin=') !== -1) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'origin=' + encodeURIComponent(window.location.origin);
    }
    function open(url, pageUrl) {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (fallback) fallback.classList.add('hidden');
      if (fallbackLink) fallbackLink.href = pageUrl || '#';
      if (frame) frame.src = withOrigin(url);
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      fallbackTimer = setTimeout(function () {
        if (modal.classList.contains('open') && fallback && fallbackLink && pageUrl) {
          fallback.classList.remove('hidden');
        }
      }, 2500);
    }
    function shut() {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (frame) frame.src = '';
      if (fallback) fallback.classList.add('hidden');
    }
    document.querySelectorAll('[data-video-url]').forEach(function (card) {
      card.addEventListener('click', function () {
        var url = card.getAttribute('data-video-url');
        var pageUrl = card.getAttribute('data-video-page');
        if (url) open(url, pageUrl);
      });
    });
    if (overlay) overlay.addEventListener('click', shut);
    if (close) close.addEventListener('click', shut);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
  }

  function initRipple() {
    function addRipple(e) {
      var btn = e.currentTarget;
      var rect = btn.getBoundingClientRect();
      var ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = (e.clientX - rect.left) + 'px';
      ripple.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 650);
    }
    document.querySelectorAll('.btn, .chat-submit').forEach(function (el) {
      el.classList.add('btn-ripple');
      el.addEventListener('click', addRipple);
    });
  }

  function initReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(function (el) { observer.observe(el); });
  }

  function initAboutImageZoom() {
    var images = document.querySelectorAll('[data-about-zoom]');
    if (!images.length) return;
    var lightbox = document.getElementById('about-lightbox');
    var lightboxImage = document.getElementById('about-lightbox-image');
    var lightboxClose = document.getElementById('about-lightbox-close');
    if (!lightbox || !lightboxImage) return;

    function closeLightbox() {
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('about-lightbox-open');
      setTimeout(function () {
        lightboxImage.src = '';
        lightboxImage.alt = '';
      }, 220);
    }

    images.forEach(function (img) {
      img.addEventListener('click', function () {
        var sameImageOpen = lightbox.classList.contains('open') && lightboxImage.src === img.src;
        if (sameImageOpen) {
          closeLightbox();
          return;
        }
        lightboxImage.src = img.src;
        lightboxImage.alt = img.alt || 'About image';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('about-lightbox-open');
      });
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target === lightboxImage) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
      }
    });
  }

  function initFurnitureGallery() {
    var grid = document.getElementById('products-grid');
    var titleMap = {
      1: { title: t('products.p1Title'), desc: t('products.p1Desc') },
      2: { title: t('products.p2Title'), desc: t('products.p2Desc') },
      3: { title: t('products.p3Title'), desc: t('products.p3Desc') },
      4: { title: t('products.p4Title'), desc: t('products.p4Desc') }
    };
    var maxProducts = 24;

    function probeImage(path) {
      return new Promise(function (resolve) {
        var image = new Image();
        image.onload = function () { resolve(path); };
        image.onerror = function () { resolve(null); };
        image.src = path;
      });
    }

    function getVariantCandidates(index) {
      return [
        'assets/images/products/product-' + index + '.jpg',
        'assets/images/products/product-' + index + '1.jpg',
        'assets/images/products/product-' + index + '2.jpg',
        'assets/images/products/product-' + index + '12.jpg',
        'assets/images/products/product-' + index + '21.jpg',
        'assets/images/products/product-' + index + '23.jpg',
        'assets/images/products/product-' + index + '123.jpg',
        'assets/images/products/product-' + index + '212.jpg'
      ];
    }

    function renderFurnitureCard(index, images) {
      var meta = titleMap[index] || {
        title: 'KUKA HOME Product ' + index,
        desc: 'Premium collection'
      };
      return '<article class="product-card reveal">'
        + '<div class="product-gallery" data-product-gallery data-images="' + images.join('|') + '">'
        + '<img src="' + images[0] + '" alt="' + meta.title + '" loading="lazy" data-product-image>'
        + '<div class="product-gallery-dots"><span class="active"></span><span></span><span></span></div>'
        + '</div>'
        + '<div class="product-info">'
        + '<h3>' + meta.title + '</h3>'
        + '<p>' + meta.desc + '</p>'
        + '</div>'
        + '</article>';
    }

    if (grid) {
      Promise.all(Array.from({ length: maxProducts }, function (_, idx) {
        var productIndex = idx + 1;
        var candidates = getVariantCandidates(productIndex);
        return Promise.all(candidates.map(probeImage)).then(function (items) {
          var unique = [];
          items.filter(Boolean).forEach(function (path) {
            if (unique.indexOf(path) === -1) unique.push(path);
          });
          if (!unique.length) return '';
          return renderFurnitureCard(productIndex, unique.slice(0, 3));
        });
      })).then(function (cards) {
        grid.innerHTML = cards.filter(Boolean).join('');
        initReveal();
        bindFurnitureGalleries();
      });
    } else {
      bindFurnitureGalleries();
    }

    function bindFurnitureGalleries() {
    var galleries = document.querySelectorAll('[data-product-gallery]');
    if (!galleries.length) return;

    var lightbox = document.getElementById('product-lightbox');
    var lightboxImage = document.getElementById('product-lightbox-image');
    var lightboxClose = document.getElementById('product-lightbox-close');
    var lightboxPrev = document.getElementById('product-lightbox-prev');
    var lightboxNext = document.getElementById('product-lightbox-next');
    var lightboxOverlay = lightbox ? lightbox.querySelector('[data-product-overlay]') : null;
    var activeImages = [];
    var activeIndex = 0;

    function preloadImages(paths) {
      return Promise.all(paths.map(function (path) {
        return new Promise(function (resolve) {
          var image = new Image();
          image.onload = function () { resolve(path); };
          image.onerror = function () { resolve(null); };
          image.src = path;
        });
      })).then(function (items) {
        var filtered = items.filter(Boolean);
        return filtered.length ? filtered : [paths[0]];
      });
    }

    function showLightboxImage() {
      if (!lightboxImage || !activeImages.length) return;
      lightboxImage.src = activeImages[activeIndex];
    }

    function openLightbox(images, startIndex) {
      if (!lightbox || !lightboxImage) return;
      activeImages = images;
      activeIndex = startIndex || 0;
      showLightboxImage();
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lightboxImage) lightboxImage.src = '';
    }

    function moveLightbox(step) {
      if (!activeImages.length) return;
      activeIndex = (activeIndex + step + activeImages.length) % activeImages.length;
      showLightboxImage();
    }

    galleries.forEach(function (gallery) {
      var image = gallery.querySelector('[data-product-image]');
      var dots = gallery.querySelectorAll('.product-gallery-dots span');
      var paths = (gallery.getAttribute('data-images') || '').split('|').filter(Boolean);
      if (!image || !paths.length) return;

      preloadImages(paths).then(function (images) {
        gallery._images = images;
        gallery._index = 0;

        function render(index) {
          gallery._index = index;
          image.src = images[index];
          dots.forEach(function (dot, dotIndex) { dot.classList.toggle('active', dotIndex === index); });
        }

        render(0);
        if (images.length > 1) {
          setInterval(function () {
            render((gallery._index + 1) % images.length);
          }, 3000);
        }

        gallery.addEventListener('click', function () {
          openLightbox(images, gallery._index);
        });
      });
    });

      if (bindFurnitureGalleries._wired) return;
      bindFurnitureGalleries._wired = true;
      if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
      if (lightboxOverlay) lightboxOverlay.addEventListener('click', closeLightbox);
      if (lightboxPrev) lightboxPrev.addEventListener('click', function () { moveLightbox(-1); });
      if (lightboxNext) lightboxNext.addEventListener('click', function () { moveLightbox(1); });
      document.addEventListener('keydown', function (e) {
        if (!lightbox || !lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') moveLightbox(-1);
        if (e.key === 'ArrowRight') moveLightbox(1);
      });
    }
  }

  var CHAT_CONFIG = {
    chatReappearMinutes: 5,
    googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbzG_pKrseNbad3oAxSTIySyj1cuuxPTs1NbRH9RvoZXkt81Ayvpt-i-q8iJVehj7aKcLA/exec'
  };

  function initChatWidget() {
    var widget = document.getElementById('chat-widget');
    var trigger = document.getElementById('chat-trigger');
    var closeBtn = document.getElementById('chat-close');
    var form = document.getElementById('chat-form');
    if (!widget || !trigger) return;
    var STORAGE_KEY = 'kuka_chat_closed_at';
    var REAPPEAR_MS = CHAT_CONFIG.chatReappearMinutes * 60 * 1000;

    function showWidget() {
      widget.classList.remove('hidden');
      widget.classList.add('open');
      trigger.classList.add('hidden');
    }
    function hideCompletely() {
      widget.classList.remove('open');
      widget.classList.add('hidden');
      trigger.classList.add('hidden');
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (e) {}
    }
    function showTriggerAgain() {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      trigger.classList.remove('hidden');
      trigger.classList.add('attention');
      widget.classList.add('hidden');
    }
    function initialVisibility() {
      try {
        var closed = localStorage.getItem(STORAGE_KEY);
        if (!closed) {
          trigger.classList.remove('hidden');
          widget.classList.add('hidden');
          return;
        }
        var elapsed = Date.now() - parseInt(closed, 10);
        if (elapsed >= REAPPEAR_MS) showTriggerAgain();
        else { trigger.classList.add('hidden'); widget.classList.add('hidden'); }
      } catch (e) {
        trigger.classList.remove('hidden');
        widget.classList.add('hidden');
      }
    }

    trigger.addEventListener('click', function () {
      trigger.classList.remove('attention');
      showWidget();
    });
    if (closeBtn) closeBtn.addEventListener('click', hideCompletely);
    initialVisibility();
    setInterval(function () {
      try {
        var closed = localStorage.getItem(STORAGE_KEY);
        if (!closed) return;
        if (Date.now() - parseInt(closed, 10) >= REAPPEAR_MS) showTriggerAgain();
      } catch (e) {}
    }, 60000);

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var phoneEl = form.querySelector('input[name="phone"]');
        var messageEl = form.querySelector('textarea[name="message"]');
        var phone = (phoneEl && phoneEl.value) ? phoneEl.value.trim() : '';
        var message = (messageEl && messageEl.value) ? messageEl.value.trim() : '';
        if (!phone || !message) return;
        var submitBtn = form.querySelector('button[type="submit"]');
        var successEl = form.querySelector('.chat-success');
        var errorEl = form.querySelector('.chat-error');
        if (submitBtn) submitBtn.disabled = true;
        if (successEl) successEl.textContent = '';
        if (errorEl) errorEl.textContent = '';
        var fd = new FormData();
        fd.append('timestamp', new Date().toISOString());
        fd.append('phone', phone);
        fd.append('message', message);
        fd.append('page', getCurrentPage());
        fd.append('language', getStoredLang());
        fetch(CHAT_CONFIG.googleSheetsUrl, { method: 'POST', mode: 'no-cors', body: fd })
          .then(function () {
            if (successEl) successEl.textContent = t('chat.success');
            form.reset();
          })
          .catch(function () {
            if (errorEl) errorEl.textContent = t('chat.error');
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('input[name="name"]') && form.querySelector('input[name="name"]').value) ? form.querySelector('input[name="name"]').value.trim() : '';
      var phone = (form.querySelector('input[name="phone"]') && form.querySelector('input[name="phone"]').value) ? form.querySelector('input[name="phone"]').value.trim() : '';
      var message = (form.querySelector('textarea[name="message"]') && form.querySelector('textarea[name="message"]').value) ? form.querySelector('textarea[name="message"]').value.trim() : '';
      if (!phone || !message) return;
      var submitBtn = form.querySelector('button[type="submit"]');
      var successEl = form.querySelector('.chat-success');
      var errorEl = form.querySelector('.chat-error');
      if (submitBtn) submitBtn.disabled = true;
      if (successEl) successEl.textContent = '';
      if (errorEl) errorEl.textContent = '';
      var fd = new FormData();
      fd.append('timestamp', new Date().toISOString());
      fd.append('phone', phone);
      fd.append('message', name ? 'Name: ' + name + '\n\n' + message : message);
      fd.append('page', getCurrentPage());
      fd.append('language', getStoredLang());
      fetch(CHAT_CONFIG.googleSheetsUrl, { method: 'POST', mode: 'no-cors', body: fd })
        .then(function () {
          if (successEl) successEl.textContent = t('chat.success');
          form.reset();
        })
        .catch(function () {
          if (errorEl) errorEl.textContent = t('chat.error');
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  function initYandexLinks() {
    var links = document.querySelectorAll('[data-yandex-app]');
    if (!links.length) return;
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var webUrl = link.getAttribute('href');
        var appUrl = link.getAttribute('data-yandex-app');
        if (!webUrl || !appUrl) return;
        if (!isMobile) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener');
          return;
        }
        e.preventDefault();
        var startedAt = Date.now();
        window.location.href = appUrl;
        setTimeout(function () {
          if (Date.now() - startedAt < 1800) window.location.href = webUrl;
        }, 900);
      });
    });
  }

  function init() {
    var lang = getStoredLang();
    Promise.allSettled([loadTranslations('en'), loadTranslations(lang)])
      .then(function (results) {
        fallbackDict = results[0].status === 'fulfilled' ? results[0].value : null;
        activeDict = results[1].status === 'fulfilled' ? results[1].value : fallbackDict;
        initLangSwitcher();
        updatePageText();
      })
      .catch(function () {
        fallbackDict = null;
        activeDict = null;
        initLangSwitcher();
        updatePageText();
      });

    initStickyHeader();
    initScrollToTop();
    initNavigation();
    initChatWidget();
    initContactForm();
    initYandexLinks();
    initHeroSlider();
    initReveal();
    initVideoModal();
    initCounters();
    initRipple();
    initAboutImageZoom();
    initFurnitureGallery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
