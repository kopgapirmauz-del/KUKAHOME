(function () {
  'use strict';

  var INLINE_TRANSLATIONS = {
    en: {
      meta: { languageName: 'English', locale: 'en-GB' },
      nav: { home: 'Home', about: 'About Us', showrooms: 'Showrooms', furniture: 'Furniture', videos: 'Videos', vacancy: 'Vacancies', contact: 'Contact' },
      header: { language: 'Language' },
      footer: { tagline: 'premium furniture', workingHoursLabel: 'Working hours', workingHoursValue: '09:00 – 18:00', pages: 'Pages', phoneLabel: 'Phone', payments: 'Payment methods' },
      home: { brandHeadline: 'China’s No.1 Premium Furniture', brandSub: 'Modern design, premium quality, comfort guarantee', newProducts: 'New Products', benefitsTitle: 'Benefits', benefit1Title: 'Premium quality', benefit1Desc: 'Exceptional materials and craftsmanship for lasting elegance.', benefit2Title: 'Fast delivery', benefit2Desc: 'Efficient logistics to bring your order to you on time.', benefit3Title: 'Luxury design', benefit3Desc: 'Curated pieces that elevate your living space.', benefit4Title: 'Comfort guarantee', benefit4Desc: 'We stand behind the comfort and quality of every piece.' },
      stats: { years: 'Years experience', models: 'Models', showrooms: 'Showrooms', clients: 'Clients' },
      products: { p1Title: 'Milano Sofa', p1Desc: 'A refined silhouette with premium upholstery.', p2Title: 'Roma Sectional', p2Desc: 'Spacious comfort built for modern living.', p3Title: 'Venezia Lounge', p3Desc: 'Soft, sculptural lounge chair with ottoman.', p4Title: 'Verona Table', p4Desc: 'Elegant dining table with a premium finish.' },
      furniture: { subtitle: 'Premium collections', collectionHeading: 'New collections' },
      about: { heroLabel: 'About', title: 'About KUKA HOME', subtitle: 'A global premium home furnishing brand shaped by design, intelligent manufacturing, and long-term innovation.', overviewKicker: 'Brand overview', overviewTitle: 'From a focused beginning to a global furniture ecosystem', introP1: 'Founded in 1982, KUKA HOME has grown into one of the world\'s leading home furnishing brands and is listed on the Shanghai Stock Exchange. The company\'s headquarters are located in Hangzhou, China.', introP2: 'Our company is the official authorized dealer of the KUKA HOME brand in Uzbekistan and Kazakhstan. We provide original, high-quality home furniture and complete whole-home solutions to customers in Tashkent and across the Central Asian region.', introP3: 'Our company operates with official brand authorization, a professional showroom, and an experienced team. We offer full-service support - from furniture selection and design to delivery, installation, and after-sales service. By consistently following the principles of originality and high quality, we bring our customers an international-standard home interior experience.', storesStatLabel: 'retail stores across the world', countriesStatLabel: 'countries and regions of presence', missionHeading: 'Our mission', missionBody: 'To create inspiring spaces for a better life.', visionHeading: 'Our vision', visionBody: 'To become a world-leading brand for integrated home living solutions.', valuesHeading: 'Our values', valuesBody: 'Customer focus, results, and innovation guide every decision.', principlesHeading: 'Operating principles', principlesBody: 'Customers first, then business excellence and sustainable success.', legacyKicker: 'Global growth', legacyTitle: 'More than forty years of continuous innovation and expansion', legacyText: 'Based on over 40 years of continuous innovation and sustainable development, KUKA HOME has evolved from modest beginnings into a leading global home furnishing brand. By investing in original design, intelligent manufacturing, and strategic international partnerships, the company has consistently expanded across key world markets.', legacyQuote: 'We build a brand that balances scale with refinement, combining manufacturing strength, design leadership, and a premium customer experience.', designKicker: 'Design power', designTitle: 'World-class design capability backed by research, patents, and awards', designText1: 'KUKA HOME\'s original designs have earned more than 100 international awards, including 4 iF awards and 5 Red Dot Design Awards. With four global R&D centres, the brand keeps innovation at the core of every collection.', designText2: 'Our Milan design centre collaborates with leading European teams and works closely with Politecnico di Milano, helping define global trends while nurturing new talent in the furniture industry.', patentsLabel: 'owned patents', awardsLabel: 'design awards', goldAwardsLabel: 'gold-level design honours', recordsKicker: 'Recognition', recordTitle: 'Officially recognized by Guinness World Records', recordBody: 'KUKA HOME entered the Guinness World Records with the largest spring mattress measuring 22.04 by 20 metres, created in Hangzhou, Zhejiang, China on 6 May 2017.', awardTitle: 'Best Product Design Award at MIFF', awardBody: 'KUKA HOME received the \'Best Product Design\' award at the Malaysian International Furniture Fair (MIFF), highlighting the brand\'s excellence in bedroom furniture design.' },
      showrooms: { title: 'Our Showrooms', subtitle: 'Visit our premium exhibition spaces', city: 'City', address: 'Address', hours: 'Working hours', map: 'Map preview', cta: 'Book a visit', s1Name: 'Chilonzor branch', s1Addr: 'Tashkent city, Chilonzor district, Gavhar street 124/1 (Olmazor metro)', s2Name: 'Yashnabod branch', s2Addr: 'Tashkent city, Yashnabod district, Maxtimquli street, 75 (Arca)', s3Name: 'Mirzo Ulugbek branch', s3Addr: 'Tashkent city, Mirzo Ulugbek district, Amir Temur street 3a (Chimgan Atlas)', s4Name: 'Almaty Jibek Joli branch', s4Addr: 'Republic of Kazakhstan, Almaty city, Jibek Joli shopping and entertainment center (TRC), 2nd floor.', s5Name: 'Shymkent OTAU MART branch', s5Addr: 'Republic of Kazakhstan, Shymkent city, OTAU MART shopping and entertainment center, 2nd floor.', s6Name: 'Almaty ARMADA branch', s6Addr: 'Republic of Kazakhstan, Almaty city, ARMADA shopping complex, Kabdolov street, 1/8.' },
      videos: { title: 'Videos', subtitle: 'Collections, reviews, and craftsmanship', v1Title: 'KUKA Home brings you the comfort and style of your dreams!', v2Title: 'KUKA HOME 4.0 smart factory - about the technology behind custom furniture production for the entire home', v3Title: '0721 technology fabric upholstery - an explainer video about the material\'s qualities and advantages.', v4Title: '🛏 KUKA Home mattresses that passed quality testing!', v5Title: '🌕 KUKA HOME | Full moon, full hearts', v6Title: '✨ For your family\'s happiness and comfort!' },
      contact: { title: 'Contact', subtitle: 'We’ll help you choose the perfect piece', infoTitle: 'Contact details', addressLabel: 'Address', addressValue: 'Tashkent city, Chilonzor district, Gavhar street 124/1 (Olmazor metro)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Phone', hoursLabel: 'Working hours', formTitle: 'Send a message', name: 'Name', phone: 'Phone number', message: 'Message', send: 'Send' },
      chat: { title: 'Send a message', subtitle: 'KUKA HOME', phone: 'Phone', message: 'Message', send: 'Send', success: 'Your message has been sent.', error: 'Something went wrong. Please try again.' },
      vacancy: { heroTitle: 'Vacancies', heroSubtitle: 'Open positions at KUKA HOME Uzbekistan', empty: 'There are no active vacancies right now.', applyNow: 'Apply now', modalDetailTitle: 'Vacancy details', postedDate: 'Posted:', modalApplyTitle: 'Vacancy application', selected: 'Selected vacancy:', firstName: 'First name', lastName: 'Last name', birthDate: 'Date of birth', positionLabel: 'Position', positionChoose: 'Choose a position', photo: 'Photo', phone: 'Phone number', phonePlaceholder: '+998 (00) 000 00 00', languagesLegend: 'Languages', experienceLegend: 'Work experience', addRow: '+ Add', expectedSalary: 'Expected salary', currency: 'Currency', currencyUzs: 'UZS', currencyUsd: '$', additionalInfo: 'Additional information', salaryPlaceholder: '0', submit: 'Submit', detailsFallback: 'You can get full vacancy details from the HR team.', success: 'Your application has been sent. HR will contact you soon.', error: 'Something went wrong. Please try again.', requiredFields: 'Please fill in full name, date of birth, position, and phone number.', otherLanguagePlaceholder: 'Example: Turkish', jobCompanyPlaceholder: 'Company', jobRolePlaceholder: 'Role', jobYearsPlaceholder: 'Years', removeRowAria: 'Remove row', closeAria: 'Close', language: { uzbek: 'Uzbek', russian: 'Russian', kazakh: 'Kazakh', chinese: 'Chinese', english: 'English', other: 'Other:' }, position: { salesManager: 'Sales manager', cashier: 'Cashier', warehouse: 'Warehouse specialist', marketing: 'Marketing specialist', smm: 'SMM manager', hr: 'HR', target: 'Target specialist', callCenter: 'Call center', loader: 'Loader', other: 'Other' } },
      common: { copyright: '© KUKA HOME. All rights reserved.' }
    },
    uz: {
      meta: { languageName: 'Uzbek', locale: 'uz-UZ' },
      nav: { home: 'Bosh sahifa', about: 'Biz haqimizda', showrooms: 'Manzil', furniture: 'Mebellar', videos: 'Videolar', vacancy: 'Vakansiya', contact: 'Aloqa' },
      header: { language: 'Til' },
      footer: { tagline: 'premium mebellar', workingHoursLabel: 'Ish vaqti', workingHoursValue: '09:00 – 18:00', pages: 'Sahifalar', phoneLabel: 'Telefon', payments: 'To‘lov usullari' },
      home: { brandHeadline: 'Xitoyning №1 Premium Mebeli', brandSub: 'Zamonaviy dizayn, yuqori sifat, qulaylik kafolati', newProducts: 'Yangi mahsulotlar', benefitsTitle: 'Afzalliklar', benefit1Title: 'Premium sifat', benefit1Desc: 'Yuqori sifatli materiallar va puxta ishlov berish.', benefit2Title: 'Tez yetkazib berish', benefit2Desc: 'Buyurtmangizni o‘z vaqtida yetkazib beramiz.', benefit3Title: 'Lyuks dizayn', benefit3Desc: 'Interyeringizni yuksaltiradigan tanlangan kolleksiyalar.', benefit4Title: 'Qulaylik kafolati', benefit4Desc: 'Har bir mahsulot qulayligi va sifati uchun kafolat.' },
      stats: { years: 'yillik tajriba', models: 'dan ortiq modellar', showrooms: 'ta salon', clients: 'dan ortiq mijozlar' },
      products: { p1Title: 'Milano Divan', p1Desc: 'Premium mato va nafis siluet.', p2Title: 'Roma Burchakli', p2Desc: 'Keng va qulay zamonaviy yechim.', p3Title: 'Venezia Kursi', p3Desc: 'Yumshoq lounge kursi va puf.', p4Title: 'Verona Stol', p4Desc: 'Premium ishlovli elegant stol.' },
      furniture: { subtitle: 'Premium kolleksiyalar', collectionHeading: 'Yangi kolleksiyalar' },
      about: { heroLabel: 'About', title: 'KUKA HOME haqida', subtitle: 'Dizayn, intellektual ishlab chiqarish va uzluksiz innovatsiyalar asosida qurilgan global premium home furnishing brendi.', overviewKicker: 'Brend haqida', overviewTitle: 'Ishonchli boshlanishdan global uy jihozlari ekotizimigacha', introP1: '1982 yilda asos solingan KUKA HOME bugun uy jihozlari sohasidagi dunyo yetakchi brendlaridan biriga aylandi va Shanxay fond birjasida ro\'yxatga olingan. Kompaniyaning bosh qarorgohi Xanchjou, Xitoyda joylashgan.', introP2: 'Bizning kompaniyamiz KUKA HOME brendining O‘zbekistondagi hamda Qozog‘istondagi rasmiy vakolatli dileridir. Toshkent va Markaziy Osiyo mintaqasidagi mijozlarga original va sifatli uy mebellari hamda butun uy uchun kompleks yechimlarni taqdim etamiz.', introP3: 'Kompaniyamiz rasmiy brend vakolati, professional showroom va tajribali jamoaga ega. Mijozlarga mebel tanlashdan boshlab dizayn, yetkazib berish, o‘rnatish va sotuvdan keyingi servisgacha bo‘lgan to‘liq xizmatlarni taqdim etamiz. Biz doimo original mahsulot kafolati va yuqori sifat tamoyiliga amal qilgan holda mijozlarimizga xalqaro darajadagi uy interyeri tajribasini taqdim etamiz.', storesStatLabel: 'butun dunyo bo\'ylab retail do\'konlar', countriesStatLabel: 'mamlakat va mintaqalardagi ishtirok', missionHeading: 'Bizning missiyamiz', missionBody: 'Yaxshiroq hayot uchun ilhomlantiruvchi makonlar yaratish.', visionHeading: 'Bizning qarashimiz', visionBody: 'Uy uchun kompleks yechimlar bo\'yicha dunyoning yetakchi brendiga aylanish.', valuesHeading: 'Qadriyatlarimiz', valuesBody: 'Mijozga yo\'naltirilganlik, natija va innovatsiya.', principlesHeading: 'Faoliyat tamoyillari', principlesBody: 'Eng avvalo: mijozlar, biznes va muvaffaqiyat.', legacyKicker: 'Global o\'sish', legacyTitle: '40 yildan ortiq uzluksiz innovatsiya va barqaror rivojlanish', legacyText: '40 yildan ortiq uzluksiz innovatsiya va barqaror rivojlanishga tayangan holda, KUKA HOME kamtarona boshlanishdan dunyoning yetakchi uy jihozlari brendlaridan biriga aylandi. Original dizayn, intellektual ishlab chiqarish va strategik global hamkorlikka sarmoya kiritib, kompaniya xalqaro asosiy bozorlardagi ishtirokini izchil kengaytirdi.', legacyQuote: 'Biz masshtab, premium tajriba va dizayn yetakchiligini birlashtirgan brendni quramiz.', designKicker: 'Dizayn qudrati', designTitle: 'Tadqiqot, patent va mukofotlar bilan mustahkamlangan jahon darajasidagi dizayn salohiyati', designText1: 'KUKA HOME original dizaynlari 100 dan ortiq xalqaro mukofotlarga sazovor bo\'lgan, jumladan 4 ta iF va 5 ta Red Dot Design Award. 4 ta global R&D markazida ishlaydigan brend har bir kolleksiyada innovatsiyani markazga qo\'yadi.', designText2: 'Milan dizayn markazimiz Yevropaning yetakchi jamoalari bilan hamkorlik qiladi va Milan Politecnico universiteti bilan yaqindan ishlaydi, shu orqali global trendlarni belgilash hamda mebel sanoatida yangi iste\'dodlarni rivojlantirishga hissa qo\'shadi.', patentsLabel: 'o\'z patentlarimiz', awardsLabel: 'dizayn mukofotlari', goldAwardsLabel: 'yuqori darajadagi dizayn yutuqlari', recordsKicker: 'E\'tirof', recordTitle: 'Guinness World Records ro\'yxatiga kiritilgan', recordBody: 'KUKA HOME 2017 yil 6 may kuni Xitoyning Chjetszyan viloyati, Xanchjou shahrida yaratilgan 22,04 x 20 metr o\'lchamdagi eng yirik prujinali matras bilan Guinness World Records ro\'yxatiga rasman kiritilgan.', awardTitle: 'MIFF ko\'rgazmasida Best Product Design mukofoti', awardBody: 'KUKA HOME Malayziya xalqaro mebel ko\'rgazmasi (MIFF) da \'Best Product Design\' mukofotiga sazovor bo\'lgan. Bu brendning yotoqxona mebellari dizaynidagi yuqori darajasini ko\'rsatadi.' },
      showrooms: { title: 'Manzil', subtitle: 'Premium ko‘rgazma zallarimizga tashrif buyuring', city: 'Shahar', address: 'Manzil', hours: 'Ish vaqti', map: 'Xaritada', cta: 'Tashrif buyuring', s1Name: 'Chilonzor fillial', s1Addr: 'Toshkent shahri, Chilonzor tumani, Gavhar ko\'chasi 124/1 (Olmazor metro)', s2Name: 'Yashnabod fillial', s2Addr: 'Toshkent shahri, Yashnabod tumani, Maxtimquli ko\'chasi, 75 (Arca)', s3Name: 'Mirzo Ulug\'bek fillial', s3Addr: 'Toshkent shahri, Mirzo Ulug\'bek tumani, Amir Temur ko\'chasi 3a (Chimgan Atlas)', s4Name: 'Almati Jibek Joli fillial', s4Addr: 'Qozog‘iston Res., Almati shahri, “Jibek Joli” savdo-ko‘ngilochar markazi (TRC), 2-qavat.', s5Name: 'Shimkent OTAU MART fillial', s5Addr: 'Qozog‘iston Res., Shimkent shahri, “OTAU MART” savdo-ko‘ngilochar markazi, 2-qavat.', s6Name: 'Almaty ARMADA fillial', s6Addr: 'Qozog‘iston Res., Almaty shahri, “ARMADA” savdo majmuasi, Kabdolov ko‘chasi, 1/8.' },
      videos: { title: 'Videolar', subtitle: 'Kolleksiyalar, sharhlar va hunarmandchilik', v1Title: 'KUKA home sizga orzuingizdagi qulaylik va uslubni taqdim etadi!', v2Title: 'KUKA HOME 4.0 aqlli zavodi — butun uy uchun individual mebel ishlab chiqarish texnologiyasi haqida', v3Title: '0721 texnologik mato qoplamasi — materialning sifatlari va afzalliklari haqida tushuntiruvchi video.', v4Title: '🛏 Sifat sinovidan o‘tgan KUKA Home matraslari!', v5Title: '🌕 KUKA HOME | To‘lin oy, to‘la yuraklar', v6Title: '✨ Oilangiz baxti va qulayligi uchun!' },
      contact: { title: 'Aloqa', subtitle: 'Siz uchun eng mos mebelni tanlashga yordam beramiz', infoTitle: 'Bog‘lanish', addressLabel: 'Manzil', addressValue: 'Toshkent shahri, Chilonzor tumani, Gavhar ko\'chasi 124/1 (Olmazor metro)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Telefon', hoursLabel: 'Ish vaqti', formTitle: 'Xabar yuboring', name: 'Ismingiz', phone: 'Telefon raqamingiz', message: 'Xabaringiz', send: 'Yuborish' },
      chat: { title: 'Xabar yuboring', subtitle: 'KUKA HOME', phone: 'Telefoningizni kiriting', message: 'Xabaringizni yozing...', send: 'Yuborish', success: 'Xabaringiz yuborildi.', error: 'Xatolik. Qayta urinib ko‘ring.' },
      vacancy: { heroTitle: 'Vakansiya', heroSubtitle: 'KUKA HOME O\'zbekiston fillialidagi ochiq bo\'sh ish o\'rinlar', empty: 'Hozircha faol vakansiyalar mavjud emas.', applyNow: 'Ariza topshirish', modalDetailTitle: 'Vakansiya tafsilotlari', postedDate: 'E\'lon joylangan sana:', modalApplyTitle: 'Vakansiyaga ariza', selected: 'Tanlangan vakansiya:', firstName: 'Ism', lastName: 'Familiya', birthDate: 'Tug\'ilgan sana', positionLabel: 'Lavozim', positionChoose: 'Lavozimni tanlang', photo: 'Rasmi', phone: 'Telefon raqam', phonePlaceholder: '+998 (00) 000 00 00', languagesLegend: 'Qaysi tillarni biladi', experienceLegend: 'Ish tajribasi', addRow: '+ Qo\'shish', expectedSalary: 'Kutilayotgan oylik', currency: 'Valyuta', currencyUzs: 'So\'m', currencyUsd: '$', additionalInfo: 'Qo\'shimcha ma\'lumot', salaryPlaceholder: '0', submit: 'Yuborish', detailsFallback: 'Vakansiya bo\'yicha batafsil ma\'lumotni HR bo\'limidan olishingiz mumkin.', success: 'Arizangiz yuborildi. HR bo\'limi siz bilan bog\'lanadi.', error: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.', requiredFields: 'Ism-familiya, tug\'ilgan sana, lavozim va telefon raqamni to\'liq kiriting.', otherLanguagePlaceholder: 'Masalan: Turk tili', jobCompanyPlaceholder: 'Qayerda ishlagan', jobRolePlaceholder: 'Lavozimi', jobYearsPlaceholder: 'Nechi yil ishlagan', removeRowAria: 'Qatorni o\'chirish', closeAria: 'Yopish', language: { uzbek: 'O\'zbek tili', russian: 'Rus tili', kazakh: 'Qozoq tili', chinese: 'Xitoy tili', english: 'Ingliz tili', other: 'Boshqa:' }, position: { salesManager: 'Sotuv menedjeri', cashier: 'Kassir', warehouse: 'Omborchi', marketing: 'Marketing mutaxassisi', smm: 'SMM menedjer', hr: 'HR', target: 'Targetolog', callCenter: 'Call markazi', loader: 'Yuk tashuvchi', other: 'Boshqa' } },
      common: { copyright: '© KUKA HOME. Barcha huquqlar himoyalangan.' }
    },
    ru: {
      meta: { languageName: 'Russian', locale: 'ru-RU' },
      nav: { home: 'Главная', about: 'О нас', showrooms: 'Шоу-румы', furniture: 'Мебель', videos: 'Видео', vacancy: 'Вакансии', contact: 'Контакты' },
      header: { language: 'Язык' },
      footer: { tagline: 'премиальная мебель', workingHoursLabel: 'Время работы', workingHoursValue: '09:00 – 18:00', pages: 'Страницы', phoneLabel: 'Телефон', payments: 'Способы оплаты' },
      home: { brandHeadline: 'Премиальная мебель №1 из Китая', brandSub: 'Современный дизайн, высокое качество, гарантия комфорта', newProducts: 'Новые продукты', benefitsTitle: 'Преимущества', benefit1Title: 'Премиум качество', benefit1Desc: 'Лучшие материалы и безупречное исполнение.', benefit2Title: 'Быстрая доставка', benefit2Desc: 'Надёжная логистика и доставка в срок.', benefit3Title: 'Роскошный дизайн', benefit3Desc: 'Коллекции, которые подчёркивают статус интерьера.', benefit4Title: 'Гарантия комфорта', benefit4Desc: 'Мы отвечаем за комфорт и качество каждой модели.' },
      stats: { years: 'лет опыта', models: 'моделей', showrooms: 'шоу-рума', clients: 'клиентов' },
      products: { p1Title: 'Диван Milano', p1Desc: 'Изысканный силуэт и премиальная обивка.', p2Title: 'Угловой Roma', p2Desc: 'Просторный комфорт для современной гостиной.', p3Title: 'Кресло Venezia', p3Desc: 'Лаунж-кресло с мягкими формами и пуфом.', p4Title: 'Стол Verona', p4Desc: 'Элегантный стол с премиальной отделкой.' },
      furniture: { subtitle: 'Премиальные коллекции', collectionHeading: 'Новые коллекции' },
      about: { heroLabel: 'About', title: 'О KUKA HOME', subtitle: 'Глобальный премиальный бренд домашней обстановки, построенный на дизайне, интеллектуальном производстве и непрерывных инновациях.', overviewKicker: 'Обзор бренда', overviewTitle: 'От уверенного старта к мировой экосистеме домашнего комфорта', introP1: 'Основанная в 1982 году, KUKA HOME стала одним из мировых лидеров среди брендов домашней обстановки и представлена на Шанхайской фондовой бирже. Штаб-квартира компании находится в Ханчжоу, Китай.', introP2: 'Наша компания является официальным авторизованным дилером бренда KUKA HOME в Узбекистане и Казахстане. Мы предлагаем оригинальную и качественную мебель для дома, а также комплексные решения для всего интерьера клиентам в Ташкенте и по всей Центральной Азии.', introP3: 'Наша компания обладает официальными полномочиями бренда, профессиональным шоурумом и опытной командой. Мы предоставляем полный спектр услуг - от выбора мебели и дизайна до доставки, установки и послепродажного сервиса. Следуя принципам оригинальности продукции и высокого качества, мы дарим клиентам интерьерный опыт международного уровня.', storesStatLabel: 'розничных магазинов по всему миру', countriesStatLabel: 'стран и регионов присутствия', missionHeading: 'Наша миссия', missionBody: 'Создавать вдохновляющие пространства для лучшей жизни.', visionHeading: 'Наше видение', visionBody: 'Стать мировым лидирующим брендом комплексных решений для дома.', valuesHeading: 'Наши ценности', valuesBody: 'Ориентация на клиента, результат и инновации.', principlesHeading: 'Принципы деятельности', principlesBody: 'Превыше всего: клиенты, бизнес и успех.', legacyKicker: 'Глобальный рост', legacyTitle: 'Более 40 лет непрерывных инноваций и устойчивого развития', legacyText: 'Основываясь на более чем 40 годах непрерывных инноваций и устойчивого развития, KUKA HOME прошла путь от скромных начинаний до статуса ведущего мирового бренда домашней обстановки. Инвестируя в оригинальный дизайн, интеллектуальное производство и стратегическое глобальное партнерство, компания неуклонно расширяла свое присутствие на ключевых международных рынках.', legacyQuote: 'Мы строим бренд, который сочетает масштаб, дизайн мирового уровня и выверенный клиентский опыт.', designKicker: 'Дизайнерская мощь', designTitle: 'Дизайн мирового уровня, подкрепленный исследованиями, патентами и наградами', designText1: 'Оригинальные дизайны KUKA HOME завоевали более 100 международных наград, включая 4 премии iF и 5 премий Red Dot Design Award. Работая в 4 глобальных центрах НИОКР, бренд неизменно делает ставку на инновации.', designText2: 'Наш Миланский дизайн-центр сотрудничает с ведущими европейскими командами и тесно взаимодействует с Миланским политехническим университетом, формируя глобальные тренды и поддерживая развитие молодых талантов в мебельной индустрии.', patentsLabel: 'собственных патентов', awardsLabel: 'дизайнерских наград', goldAwardsLabel: 'знаковых наград в дизайне', recordsKicker: 'Признание', recordTitle: 'Внесены в Книгу рекордов Гиннесса', recordBody: 'KUKA HOME официально вошла в Книгу рекордов Гиннесса благодаря крупнейшему пружинному матрасу размером 22,04 на 20 метров, созданному в Ханчжоу, провинция Чжэцзян, Китай, 6 мая 2017 года.', awardTitle: 'Награда Best Product Design на MIFF', awardBody: 'KUKA HOME удостоена награды «Лучший дизайн продукта» на Международной мебельной выставке в Малайзии (MIFF), что подтверждает высокий уровень бренда в разработке мебели для спальни.' },
      showrooms: { title: 'Наши шоу-румы', subtitle: 'Посетите наши выставочные залы', city: 'Город', address: 'Адрес', hours: 'Время работы', map: 'Карта', cta: 'Записаться на визит', s1Name: 'Филиал Чиланзар', s1Addr: 'г. Ташкент, Чиланзарский район, улица Гавхар, 124/1 (метро Олмазор)', s2Name: 'Филиал Яшнабад', s2Addr: 'г. Ташкент, Яшнабадский район, улица Махтумкули, 75 (Arca)', s3Name: 'Филиал Мирзо Улугбека', s3Addr: 'г. Ташкент, Мирзо-Улугбекский район, улица Амир Темур, 3a (Chimgan Atlas)', s4Name: 'Филиал Алматы Jibek Joli', s4Addr: 'Республика Казахстан, г. Алматы, торгово-развлекательный центр «Jibek Joli» (TRC), 2 этаж.', s5Name: 'Филиал Шымкент OTAU MART', s5Addr: 'Республика Казахстан, г. Шымкент, торгово-развлекательный центр «OTAU MART», 2 этаж.', s6Name: 'Филиал Алматы ARMADA', s6Addr: 'Республика Казахстан, г. Алматы, торговый комплекс «ARMADA», улица Кабдолова, 1/8.' },
      videos: { title: 'Видео', subtitle: 'Коллекции, обзоры и мастерство', v1Title: 'KUKA Home дарит вам комфорт и стиль вашей мечты!', v2Title: 'Умная фабрика KUKA HOME 4.0 - о технологии индивидуального производства мебели для всего дома', v3Title: 'Технологичная тканевая обивка 0721 - видео о свойствах материала и его преимуществах.', v4Title: '🛏 Матрасы KUKA Home, прошедшие проверку качества!', v5Title: '🌕 KUKA HOME | Полная луна, полные сердца', v6Title: '✨ Для счастья и уюта вашей семьи!' },
      contact: { title: 'Контакты', subtitle: 'Поможем выбрать идеальную мебель', infoTitle: 'Связаться с нами', addressLabel: 'Адрес', addressValue: 'г. Ташкент, Чиланзарский район, улица Гавхар, 124/1 (метро Олмазор)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Телефон', hoursLabel: 'Время работы', formTitle: 'Отправить сообщение', name: 'Имя', phone: 'Телефон', message: 'Сообщение', send: 'Отправить' },
      chat: { title: 'Написать сообщение', subtitle: 'KUKA HOME', phone: 'Телефон', message: 'Сообщение', send: 'Отправить', success: 'Сообщение отправлено.', error: 'Ошибка. Попробуйте снова.' },
      vacancy: { heroTitle: 'Вакансии', heroSubtitle: 'Открытые вакансии в филиале KUKA HOME в Узбекистане', empty: 'Сейчас нет активных вакансий.', applyNow: 'Подать заявку', modalDetailTitle: 'Детали вакансии', postedDate: 'Дата публикации:', modalApplyTitle: 'Заявка на вакансию', selected: 'Выбранная вакансия:', firstName: 'Имя', lastName: 'Фамилия', birthDate: 'Дата рождения', positionLabel: 'Должность', positionChoose: 'Выберите должность', photo: 'Фото', phone: 'Номер телефона', phonePlaceholder: '+998 (00) 000 00 00', languagesLegend: 'Какими языками владеете', experienceLegend: 'Опыт работы', addRow: '+ Добавить', expectedSalary: 'Ожидаемая зарплата', currency: 'Валюта', currencyUzs: 'Сум', currencyUsd: '$', additionalInfo: 'Дополнительная информация', salaryPlaceholder: '0', submit: 'Отправить', detailsFallback: 'Подробности по вакансии можно уточнить в HR-отделе.', success: 'Ваша заявка отправлена. HR-отдел свяжется с вами.', error: 'Произошла ошибка. Пожалуйста, попробуйте снова.', requiredFields: 'Заполните имя, фамилию, дату рождения, должность и номер телефона.', otherLanguagePlaceholder: 'Например: турецкий', jobCompanyPlaceholder: 'Где работали', jobRolePlaceholder: 'Должность', jobYearsPlaceholder: 'Стаж (лет)', removeRowAria: 'Удалить строку', closeAria: 'Закрыть', language: { uzbek: 'Узбекский', russian: 'Русский', kazakh: 'Казахский', chinese: 'Китайский', english: 'Английский', other: 'Другое:' }, position: { salesManager: 'Менеджер по продажам', cashier: 'Кассир', warehouse: 'Кладовщик', marketing: 'Маркетолог', smm: 'SMM-менеджер', hr: 'HR', target: 'Таргетолог', callCenter: 'Колл-центр', loader: 'Грузчик', other: 'Другое' } },
      common: { copyright: '© KUKA HOME. Все права защищены.' }
    },
    zh: {
      meta: { languageName: 'Chinese', locale: 'zh-CN' },
      nav: { home: '首页', about: '关于我们', showrooms: '展厅', furniture: '家具', videos: '视频', vacancy: '职位', contact: '联系我们' },
      header: { language: '语言' },
      footer: { tagline: '高端家具', workingHoursLabel: '营业时间', workingHoursValue: '09:00 – 18:00', pages: '页面', phoneLabel: '电话', payments: '支付方式' },
      home: { brandHeadline: '中国高端家具第一品牌', brandSub: '现代设计，高端品质，舒适保障', newProducts: '新品推荐', benefitsTitle: '优势', benefit1Title: '高端品质', benefit1Desc: '精选材料与精湛工艺，持久优雅。', benefit2Title: '快速配送', benefit2Desc: '高效物流，准时送达。', benefit3Title: '奢华设计', benefit3Desc: '提升空间格调的精选系列。', benefit4Title: '舒适保障', benefit4Desc: '每一件产品都兼顾舒适与品质。' },
      stats: { years: '年经验', models: '款式', showrooms: '个展厅', clients: '位客户' },
      products: { p1Title: 'Milano 沙发', p1Desc: '精致轮廓与高端面料。', p2Title: 'Roma 转角沙发', p2Desc: '宽敞舒适，适合现代生活。', p3Title: 'Venezia 休闲椅', p3Desc: '柔和线条，配脚凳更舒适。', p4Title: 'Verona 餐桌', p4Desc: '优雅细节与高端工艺。' },
      furniture: { subtitle: '高端系列', collectionHeading: '新品系列' },
      about: { heroLabel: 'About', title: '关于 KUKA HOME', subtitle: '以设计、智能制造与持续创新为核心的全球高端家居品牌。', overviewKicker: '品牌概览', overviewTitle: '从稳健起步发展为全球家居生态品牌', introP1: 'KUKA HOME 创立于 1982 年，现已成为全球领先的家居品牌之一，并在上海证券交易所上市。公司总部位于中国杭州。', introP2: '我们公司是 KUKA HOME 品牌在乌兹别克斯坦和哈萨克斯坦的官方授权经销商。我们为塔什干及整个中亚地区的客户提供原装高品质家居家具以及全屋整体解决方案。', introP3: '公司拥有品牌官方授权、专业 showroom 以及经验丰富的团队。我们为客户提供从家具选择、设计到配送、安装以及售后服务的完整支持。我们始终坚持原装正品与高品质原则，为客户带来国际水准的家居空间体验。', storesStatLabel: '全球零售门店', countriesStatLabel: '覆盖国家和地区', missionHeading: '我们的使命', missionBody: '为更美好的生活创造富有灵感的空间。', visionHeading: '我们的愿景', visionBody: '成为全球领先的一体化家居解决方案品牌。', valuesHeading: '我们的价值观', valuesBody: '以客户为中心，以结果和创新为导向。', principlesHeading: '经营原则', principlesBody: '客户优先，其次是卓越经营与长期成功。', legacyKicker: '全球成长', legacyTitle: '四十余年持续创新与稳健发展', legacyText: '基于四十多年的持续创新与可持续发展，KUKA HOME 从最初的起步成长为全球领先的家居品牌。通过持续投入原创设计、智能制造与战略性国际合作，品牌不断扩大在全球重点市场的影响力。', legacyQuote: '我们打造的是一个兼具规模、设计领导力与高端客户体验的全球品牌。', designKicker: '设计实力', designTitle: '以研发、专利与国际奖项支撑的世界级设计能力', designText1: 'KUKA HOME 的原创设计已获得 100 多项国际奖项，其中包括 4 项 iF 奖和 5 项红点设计奖。依托 4 个全球研发中心，品牌始终将创新放在核心位置。', designText2: '我们的米兰设计中心与欧洲领先团队密切合作，并与米兰理工大学开展协同研究，共同推动全球家具设计趋势与人才培养。', patentsLabel: '项自有专利', awardsLabel: '项设计奖项', goldAwardsLabel: '项高含金量设计荣誉', recordsKicker: '荣誉认可', recordTitle: '入选吉尼斯世界纪录', recordBody: 'KUKA HOME 凭借 2017 年 5 月 6 日在中国浙江杭州制造的 22.04 米 x 20 米超大型弹簧床垫，正式进入吉尼斯世界纪录。', awardTitle: '荣获 MIFF 最佳产品设计奖', awardBody: 'KUKA HOME 在马来西亚国际家具展（MIFF）上荣获“最佳产品设计奖”，体现了品牌在卧室家具设计领域的卓越实力。' },
      showrooms: { title: '我们的展厅', subtitle: '欢迎到访高端展示空间', city: '城市', address: '地址', hours: '营业时间', map: '地图', cta: '预约到访', s1Name: 'Chilonzor 分店', s1Addr: '塔什干市 Chilonzor 区 Gavhar 街 124/1（Olmazor 地铁）', s2Name: 'Yashnabod 分店', s2Addr: '塔什干市 Yashnabod 区 Maxtimquli 街 75（Arca）', s3Name: 'Mirzo Ulugbek 分店', s3Addr: '塔什干市 Mirzo Ulugbek 区 Amir Temur 街 3a（Chimgan Atlas）', s4Name: '阿拉木图 Jibek Joli 分店', s4Addr: '哈萨克斯坦共和国，阿拉木图市，Jibek Joli 购物娱乐中心（TRC）二楼。', s5Name: '奇姆肯特 OTAU MART 分店', s5Addr: '哈萨克斯坦共和国，奇姆肯特市，OTAU MART 购物娱乐中心二楼。', s6Name: '阿拉木图 ARMADA 分店', s6Addr: '哈萨克斯坦共和国，阿拉木图市，ARMADA 商业综合体，Kabdolov 街 1/8。' },
      videos: { title: '视频', subtitle: '系列、测评与匠心工艺', v1Title: 'KUKA Home 为您带来梦想中的舒适与风格！', v2Title: 'KUKA HOME 4.0 智能工厂 - 关于全屋定制家具生产技术', v3Title: '0721 科技布面料 - 介绍材料特性与优势的说明视频。', v4Title: '🛏 通过品质测试的 KUKA Home 床垫！', v5Title: '🌕 KUKA HOME | 满月，满心温暖', v6Title: '✨ 为家人的幸福与舒适而生！' },
      contact: { title: '联系我们', subtitle: '我们将帮助您选择最合适的家具', infoTitle: '联系信息', addressLabel: '地址', addressValue: '塔什干市 Chilonzor 区 Gavhar 街 124/1（Olmazor 地铁）', emailLabel: '邮箱', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: '电话', hoursLabel: '营业时间', formTitle: '发送消息', name: '姓名', phone: '电话', message: '消息', send: '发送' },
      chat: { title: '发送消息', subtitle: 'KUKA HOME', phone: '电话', message: '消息', send: '发送', success: '消息已发送。', error: '出错了，请重试。' },
      vacancy: { heroTitle: '职位', heroSubtitle: 'KUKA HOME 乌兹别克斯坦分公司开放职位', empty: '目前暂无在招职位。', applyNow: '提交申请', modalDetailTitle: '职位详情', postedDate: '发布日期：', modalApplyTitle: '职位申请', selected: '已选职位：', firstName: '名字', lastName: '姓氏', birthDate: '出生日期', positionLabel: '职位', positionChoose: '请选择职位', photo: '照片', phone: '电话号码', phonePlaceholder: '+998 (00) 000 00 00', languagesLegend: '掌握语言', experienceLegend: '工作经验', addRow: '+ 添加', expectedSalary: '期望薪资', currency: '货币', currencyUzs: '苏姆', currencyUsd: '$', additionalInfo: '补充信息', salaryPlaceholder: '0', submit: '提交', detailsFallback: '职位详细信息可向 HR 部门咨询。', success: '您的申请已发送，HR 将尽快联系您。', error: '发生错误，请重试。', requiredFields: '请填写姓名、出生日期、职位和电话号码。', otherLanguagePlaceholder: '例如：土耳其语', jobCompanyPlaceholder: '任职公司', jobRolePlaceholder: '岗位', jobYearsPlaceholder: '工作年限', removeRowAria: '删除该行', closeAria: '关闭', language: { uzbek: '乌兹别克语', russian: '俄语', kazakh: '哈萨克语', chinese: '中文', english: '英语', other: '其他：' }, position: { salesManager: '销售经理', cashier: '收银员', warehouse: '仓库专员', marketing: '市场专员', smm: 'SMM 经理', hr: '人力资源', target: '投放专员', callCenter: '呼叫中心', loader: '装卸工', other: '其他' } },
      common: { copyright: '© KUKA HOME. 版权所有。' }
    },
    kz: {
      meta: { languageName: 'Kazakh', locale: 'kk-KZ' },
      nav: { home: 'Басты бет', about: 'Біз туралы', showrooms: 'Мекенжай', furniture: 'Жиһаздар', videos: 'Бейнелер', vacancy: 'Бос орындар', contact: 'Байланыс' },
      header: { language: 'Тіл' },
      footer: { tagline: 'премиум жиһаз', workingHoursLabel: 'Жұмыс уақыты', workingHoursValue: '09:00 – 18:00', pages: 'Беттер', phoneLabel: 'Телефон', payments: 'Төлем тәсілдері' },
      home: { brandHeadline: 'Қытайдың №1 Premium Жиһазы', brandSub: 'Заманауи дизайн, жоғары сапа, жайлылық кепілдігі', newProducts: 'Жаңа өнімдер', benefitsTitle: 'Артықшылықтар', benefit1Title: 'Премиум сапа', benefit1Desc: 'Жоғары сапалы материалдар және мұқият өңдеу.', benefit2Title: 'Жылдам жеткізу', benefit2Desc: 'Тапсырысыңызды уақытында жеткіземіз.', benefit3Title: 'Люкс дизайн', benefit3Desc: 'Интерьеріңізді айшықтайтын таңдаулы коллекциялар.', benefit4Title: 'Жайлылық кепілдігі', benefit4Desc: 'Әр өнімнің жайлылығы мен сапасына кепілдік береміз.' },
      stats: { years: 'жылдық тәжірибе', models: 'астам модель', showrooms: 'салон', clients: 'астам клиент' },
      products: { p1Title: 'Milano Диваны', p1Desc: 'Премиум мата және талғампаз силуэт.', p2Title: 'Roma Бұрыштық', p2Desc: 'Кең әрі ыңғайлы заманауи шешім.', p3Title: 'Venezia Орындық', p3Desc: 'Жұмсақ lounge орындық және пуф.', p4Title: 'Verona Үстелі', p4Desc: 'Премиум өңделген талғампаз үстел.' },
      furniture: { subtitle: 'Премиум коллекциялар', collectionHeading: 'Жаңа коллекциялар' },
      about: { heroLabel: 'About', title: 'KUKA HOME туралы', subtitle: 'Дизайн, интеллектуалды өндіріс және үздіксіз инновациялар негізінде құрылған жаһандық premium home furnishing бренді.', overviewKicker: 'Бренд туралы', overviewTitle: 'Сенімді бастамадан жаһандық үй жиһазы экожүйесіне дейін', introP1: '1982 жылы негізі қаланған KUKA HOME бүгінде үй жиһазы саласындағы әлемдік жетекші брендтердің біріне айналды және Шанхай қор биржасында тіркелген. Компанияның бас кеңсесі Қытайдың Ханчжоу қаласында орналасқан.', introP2: 'Біздің компаниямыз KUKA HOME брендінің Өзбекстан мен Қазақстандағы ресми уәкілетті дилері болып табылады. Біз Ташкент пен Орталық Азия аймағындағы клиенттерге түпнұсқа әрі сапалы үй жиһаздарын және бүкіл үйге арналған кешенді шешімдерді ұсынамыз.', introP3: 'Компаниямыздың ресми бренд өкілеттігі, кәсіби showroom-ы және тәжірибелі командасы бар. Біз жиһаз таңдаудан бастап дизайн, жеткізу, орнату және сатудан кейінгі сервиске дейін толық қызмет көрсетеміз. Біз әрдайым түпнұсқа өнім кепілдігі мен жоғары сапа қағидаларын ұстана отырып, клиенттерімізге халықаралық деңгейдегі үй интерьері тәжірибесін сыйлаймыз.', storesStatLabel: 'дүние жүзі бойынша retail дүкен', countriesStatLabel: 'қатысатын елдер мен аймақтар', missionHeading: 'Біздің миссиямыз', missionBody: 'Жақсы өмір үшін шабыттандыратын кеңістіктер құру.', visionHeading: 'Біздің көзқарасымыз', visionBody: 'Үйге арналған кешенді шешімдер бойынша әлемдік жетекші брендке айналу.', valuesHeading: 'Құндылықтарымыз', valuesBody: 'Клиентке бағдарлану, нәтиже және инновация.', principlesHeading: 'Қызмет қағидалары', principlesBody: 'Ең алдымен: клиенттер, бизнес және табыс.', legacyKicker: 'Жаһандық өсу', legacyTitle: '40 жылдан астам үздіксіз инновация мен тұрақты даму', legacyText: '40 жылдан астам үздіксіз инновация мен тұрақты дамуға сүйене отырып, KUKA HOME қарапайым бастамадан әлемдік жетекші үй жиһазы брендтерінің біріне айналды. Түпнұсқа дизайнға, интеллектуалды өндіріске және стратегиялық жаһандық серіктестікке инвестиция сала отырып, компания халықаралық негізгі нарықтардағы қатысуын тұрақты түрде кеңейтті.', legacyQuote: 'Біз ауқым, premium тәжірибе және дизайн көшбасшылығын біріктіретін бренд құрамыз.', designKicker: 'Дизайн қуаты', designTitle: 'Зерттеу, патент және марапаттармен бекітілген әлемдік деңгейдегі дизайн әлеуеті', designText1: 'KUKA HOME түпнұсқа дизайндары 100-ден астам халықаралық марапаттарға ие болды, оның ішінде 4 iF және 5 Red Dot Design Award бар. 4 жаһандық R&D орталығының арқасында бренд әр коллекцияда инновацияны басты орынға қояды.', designText2: 'Біздің Милан дизайн орталығымыз Еуропаның жетекші командаларымен және Милан политехникалық университетімен тығыз жұмыс істейді, сол арқылы жаһандық трендтерді қалыптастырып, жиһаз саласындағы жаңа таланттарды дамытады.', patentsLabel: 'өз патенттеріміз', awardsLabel: 'дизайн марапаттары', goldAwardsLabel: 'жоғары деңгейлі дизайн жетістіктері', recordsKicker: 'Мойындау', recordTitle: 'Guinness World Records тізіміне енген', recordBody: 'KUKA HOME 2017 жылғы 6 мамырда Қытайдың Чжэцзян провинциясы, Ханчжоу қаласында жасалған 22,04 x 20 метрлік ең үлкен серіппелі матрасымен Guinness World Records тізіміне ресми енгізілді.', awardTitle: 'MIFF көрмесіндегі Best Product Design марапаты', awardBody: 'KUKA HOME Малайзия халықаралық жиһаз көрмесінде (MIFF) Best Product Design марапатына ие болды. Бұл брендтің жатын бөлме жиһаздары дизайнындағы жоғары деңгейін көрсетеді.' },
      showrooms: { title: 'Мекенжай', subtitle: 'Премиум көрме залдарымызға келіңіз', city: 'Қала', address: 'Мекенжай', hours: 'Жұмыс уақыты', map: 'Картада', cta: 'Келіп көріңіз', s1Name: 'Chilonzor филиалы', s1Addr: 'Ташкент қаласы, Chilonzor ауданы, Gavhar көшесі 124/1 (Olmazor метро)', s2Name: 'Yashnabod филиалы', s2Addr: 'Ташкент қаласы, Yashnabod ауданы, Maxtimquli көшесі, 75 (Arca)', s3Name: 'Mirzo Ulug\'bek филиалы', s3Addr: 'Ташкент қаласы, Mirzo Ulug\'bek ауданы, Amir Temur көшесі 3a (Chimgan Atlas)', s4Name: 'Алматы Jibek Joli филиалы', s4Addr: 'Қазақстан Республикасы, Алматы қаласы, “Jibek Joli” сауда-ойын-сауық орталығы (TRC), 2-қабат.', s5Name: 'Шымкент OTAU MART филиалы', s5Addr: 'Қазақстан Республикасы, Шымкент қаласы, “OTAU MART” сауда-ойын-сауық орталығы, 2-қабат.', s6Name: 'Алматы ARMADA филиалы', s6Addr: 'Қазақстан Республикасы, Алматы қаласы, “ARMADA” сауда кешені, Қабдолов көшесі, 1/8.' },
      videos: { title: 'Бейнелер', subtitle: 'Коллекциялар, шолулар және шеберлік', v1Title: 'KUKA home сізге армандаған жайлылық пен стильді ұсынады!', v2Title: 'KUKA HOME 4.0 ақылды зауыты — бүкіл үйге арналған жеке жиһаз өндіру технологиясы туралы', v3Title: '0721 технологиялық мата қаптамасы — материал қасиеттері мен артықшылықтары туралы түсіндірме бейне.', v4Title: '🛏 Сапа сынағынан өткен KUKA Home матрастары!', v5Title: '🌕 KUKA HOME | Толған ай, толы жүректер', v6Title: '✨ Отбасыңыздың бақыты мен жайлылығы үшін!' },
      contact: { title: 'Байланыс', subtitle: 'Сізге ең қолайлы жиһазды таңдауға көмектесеміз', infoTitle: 'Байланыс', addressLabel: 'Мекенжай', addressValue: 'Ташкент қаласы, Chilonzor ауданы, Gavhar көшесі 124/1 (Olmazor метро)', emailLabel: 'Email', emailValue: 'kukahomeuzbkistan@gmail.com', phoneLabel: 'Телефон', hoursLabel: 'Жұмыс уақыты', formTitle: 'Хабар жіберу', name: 'Атыңыз', phone: 'Телефон нөміріңіз', message: 'Хабарыңыз', send: 'Жіберу' },
      chat: { title: 'Хабар жіберу', subtitle: 'KUKA HOME', phone: 'Телефоныңызды енгізіңіз', message: 'Хабарыңызды жазыңыз...', send: 'Жіберу', success: 'Хабарыңыз жіберілді.', error: 'Қате. Қайта көріңіз.' },
      vacancy: { heroTitle: 'Бос орындар', heroSubtitle: 'KUKA HOME Өзбекстан филиалындағы ашық бос орындар', empty: 'Қазір белсенді бос орындар жоқ.', applyNow: 'Өтініш беру', modalDetailTitle: 'Бос орын туралы', postedDate: 'Жарияланған күні:', modalApplyTitle: 'Бос орынға өтініш', selected: 'Таңдалған бос орын:', firstName: 'Аты', lastName: 'Тегі', birthDate: 'Туған күні', positionLabel: 'Лауазым', positionChoose: 'Лауазымды таңдаңыз', photo: 'Суреті', phone: 'Телефон нөмірі', phonePlaceholder: '+998 (00) 000 00 00', languagesLegend: 'Қандай тілдерді біледі', experienceLegend: 'Жұмыс тәжірибесі', addRow: '+ Қосу', expectedSalary: 'Күтілетін айлық', currency: 'Валюта', currencyUzs: 'Сум', currencyUsd: '$', additionalInfo: 'Қосымша ақпарат', salaryPlaceholder: '0', submit: 'Жіберу', detailsFallback: 'Бос орын туралы толық мәліметті HR бөлімінен ала аласыз.', success: 'Өтінішіңіз жіберілді. HR бөлімі сізбен байланысады.', error: 'Қате орын алды. Қайтадан көріңіз.', requiredFields: 'Аты-жөні, туған күні, лауазымы және телефон нөмірін толтырыңыз.', otherLanguagePlaceholder: 'Мысалы: Түрік тілі', jobCompanyPlaceholder: 'Қай жерде жұмыс істеген', jobRolePlaceholder: 'Лауазымы', jobYearsPlaceholder: 'Неше жыл жұмыс істеген', removeRowAria: 'Жолды өшіру', closeAria: 'Жабу', language: { uzbek: 'Өзбек тілі', russian: 'Орыс тілі', kazakh: 'Қазақ тілі', chinese: 'Қытай тілі', english: 'Ағылшын тілі', other: 'Басқа:' }, position: { salesManager: 'Сату менеджері', cashier: 'Кассир', warehouse: 'Қоймашы', marketing: 'Маркетинг маманы', smm: 'SMM менеджер', hr: 'HR', target: 'Таргетолог', callCenter: 'Колл орталығы', loader: 'Жүк тасушы', other: 'Басқа' } },
      common: { copyright: '© KUKA HOME. Барлық құқықтар қорғалған.' }
    }
  };

  var TRANSLATIONS_CACHE = {};
  var activeDict = null;
  var fallbackDict = null;
  var SUPPORTED_LANGS = { uz: true, ru: true, en: true, zh: true, kz: true };

  function normalizeLang(code) {
    var lang = String(code || '').trim().toLowerCase();
    return SUPPORTED_LANGS[lang] ? lang : 'uz';
  }

  function getStoredLang() {
    try {
      return normalizeLang(localStorage.getItem('kuka_lang') || 'uz');
    } catch (e) {
      return 'uz';
    }
  }

  function setStoredLang(code) {
    try {
      localStorage.setItem('kuka_lang', normalizeLang(code));
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

  function getRootPrefix() {
    var path = window.location.pathname || '';
    return /(^|\/)pages\//.test(path) ? '../' : '';
  }

  function getPagesPrefix() {
    var path = window.location.pathname || '';
    return /(^|\/)pages\//.test(path) ? '' : 'pages/';
  }

  function absolutizeAssetPath(path) {
    if (!path) return path;
    if (/^(https?:)?\/\//.test(path) || path.indexOf('data:') === 0) return path;
    return getRootPrefix() + path.replace(/^\.\//, '').replace(/^\//, '');
  }

  function getPreloaderLogoPath() {
    var path = window.location.pathname || '';
    return /(^|\/)pages\//.test(path) ? '../assets/images/icons/logo-red.svg' : 'assets/images/icons/logo-red.svg';
  }

  function initPagePreloader() {
    if (window.__kukaPagePreloaderInit) return;
    window.__kukaPagePreloaderInit = true;
    var removed = false;

    function mount() {
      if (!document.body) return null;
      var exists = document.getElementById('site-preloader');
      if (exists) return exists;
      var root = document.createElement('div');
      root.id = 'site-preloader';
      root.className = 'site-preloader';
      root.setAttribute('aria-hidden', 'true');
      root.innerHTML = ''
        + '<div class="site-preloader-core">'
        + '<span class="site-preloader-ring"></span>'
        + '<img class="site-preloader-logo" src="' + getPreloaderLogoPath() + '" alt="KUKA HOME" loading="eager" decoding="sync">'
        + '</div>';
      document.body.appendChild(root);
      requestAnimationFrame(function () {
        root.classList.add('is-visible');
      });
      return root;
    }

    function hide() {
      if (removed) return;
      var root = document.getElementById('site-preloader');
      if (!root) return;
      removed = true;
      root.classList.remove('is-visible');
      root.classList.add('is-hidden');
      setTimeout(function () {
        if (root && root.parentNode) root.parentNode.removeChild(root);
      }, 340);
    }

    if (document.body) {
      mount();
    } else {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    }

    if (document.readyState === 'complete') {
      setTimeout(hide, 120);
    } else {
      window.addEventListener('load', function () {
        setTimeout(hide, 180);
      }, { once: true });
    }

    setTimeout(hide, 15000);
  }

  function getTranslationsUrl(lang) {
    return getRootPrefix() + 'translations/' + lang + '.json';
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
      if (val && val !== key) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      var val = t(key);
      if (val && val !== key) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      if (!key) return;
      var val = t(key);
      if (val && val !== key) el.setAttribute('aria-label', val);
    });
    document.documentElement.setAttribute('lang', getStoredLang());
    initMobileBottomNav();
    initFurnitureGallery();
  }

  function initLangSwitcher() {
    var root = document.getElementById('lang-switcher');
    var btn = document.getElementById('lang-switcher-btn');
    var dropdown = document.getElementById('lang-switcher-dropdown');
    if (!root || !btn || !dropdown) return;

    var LANGUAGES = {
      uz: { short: 'UZ', name: 'Uzbek', icon: getRootPrefix() + 'assets/images/icons/flaguz.svg' },
      kz: { short: 'KZ', name: 'Kazak', icon: getRootPrefix() + 'assets/images/icons/flagkz.svg' },
      ru: { short: 'RU', name: 'Russian', icon: getRootPrefix() + 'assets/images/icons/flagrus.svg' },
      en: { short: 'EN', name: 'English', icon: getRootPrefix() + 'assets/images/icons/flageng.svg' },
      zh: { short: 'CN', name: 'Chinese', icon: getRootPrefix() + 'assets/images/icons/flagchina.svg' }
    };

    function renderCurrent() {
      var lang = getStoredLang();
      var current = LANGUAGES[lang] || LANGUAGES.uz;
      btn.innerHTML = '<img class="lang-flag lang-flag-current" src="' + current.icon + '" alt="' + current.short + '">';
    }
    renderCurrent();

    dropdown.querySelectorAll('button[data-lang]').forEach(function (button) {
      var code = button.getAttribute('data-lang');
      var meta = LANGUAGES[code];
      if (!meta) return;
      button.innerHTML = '<img class="lang-flag lang-flag-option" src="' + meta.icon + '" alt="' + meta.short + '"><span class="lang-name">' + meta.name + '</span>';
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
          document.dispatchEvent(new CustomEvent('kuka:lang-changed', { detail: { lang: normalizeLang(code) } }));
        }).catch(function () {
          activeDict = fallbackDict;
          updatePageText();
          document.dispatchEvent(new CustomEvent('kuka:lang-changed', { detail: { lang: getStoredLang() } }));
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
    var map = { '': 'home', index: 'home', about: 'about', showrooms: 'showrooms', furniture: 'furniture', videos: 'videos', vacancy: 'vacancy', contact: 'contact' };
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
    var isAnimating = false;
    var unlockTimeout = null;

    slides.forEach(function (slide) {
      var img = slide.querySelector('img');
      if (!img) return;
      if (img.loading === 'lazy') img.loading = 'eager';
      if (!img.complete) {
        var preloader = new Image();
        preloader.src = img.currentSrc || img.src;
      }
    });

    function goTo(i, directionHint) {
      if (isAnimating) return;
      var total = slides.length;
      if (!total) return;
      var nextIndex = ((i % total) + total) % total;
      var previousIndex = index;
      if (nextIndex === previousIndex) return;
      var direction = directionHint || (nextIndex > previousIndex ? 1 : -1);
      var outgoing = slides[previousIndex];
      var incoming = slides[nextIndex];
      if (!outgoing || !incoming) return;
      index = nextIndex;
      isAnimating = true;

      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }
      if (unlockTimeout) {
        clearTimeout(unlockTimeout);
        unlockTimeout = null;
      }

      var enterFrom = direction < 0 ? '-100%' : '100%';
      var exitTo = direction < 0 ? '100%' : '-100%';
      var transition = 'transform 0.78s cubic-bezier(0.22, 0.61, 0.36, 1)';

      slides.forEach(function (slide, idx) {
        if (idx !== previousIndex && idx !== nextIndex) {
          slide.classList.remove('active');
          slide.style.transition = 'none';
          slide.style.transform = 'translate3d(100%, 0, 0)';
          slide.style.zIndex = '0';
        }
      });

      outgoing.style.transition = 'none';
      outgoing.style.transform = 'translate3d(0, 0, 0)';
      outgoing.style.zIndex = '1';

      incoming.classList.add('active');
      incoming.style.transition = 'none';
      incoming.style.transform = 'translate3d(' + enterFrom + ', 0, 0)';
      incoming.style.zIndex = '2';

      void incoming.offsetWidth;

      outgoing.style.transition = transition;
      incoming.style.transition = transition;
      outgoing.style.transform = 'translate3d(' + exitTo + ', 0, 0)';
      incoming.style.transform = 'translate3d(0, 0, 0)';

      function finalize() {
        if (!isAnimating) return;
        if (animationTimeout) {
          clearTimeout(animationTimeout);
          animationTimeout = null;
        }
        if (unlockTimeout) {
          clearTimeout(unlockTimeout);
          unlockTimeout = null;
        }
        slides.forEach(function (slide, idx) {
          if (idx !== index) {
            slide.classList.remove('active');
            slide.style.transition = 'none';
            slide.style.transform = 'translate3d(100%, 0, 0)';
            slide.style.zIndex = '0';
          } else {
            slide.classList.add('active');
            slide.style.transition = '';
            slide.style.transform = '';
            slide.style.zIndex = '';
          }
        });
        isAnimating = false;
      }

      animationTimeout = setTimeout(finalize, 820);
      unlockTimeout = setTimeout(finalize, 980);

      dots.forEach(function (dot, idx) { dot.classList.toggle('active', idx === index); });
    }
    function nextSlide() { goTo(index + 1, 1); }
    function startAuto() {
      if (intervalId != null) return;
      intervalId = setInterval(nextSlide, 5000);
    }
    function stopAuto() {
      if (intervalId == null) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    if (prev) prev.addEventListener('click', function () { stopAuto(); goTo(index - 1, -1); startAuto(); });
    if (next) next.addEventListener('click', function () { stopAuto(); nextSlide(); startAuto(); });
    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () {
        stopAuto();
        if (idx === index) {
          startAuto();
          return;
        }
        goTo(idx, idx > index ? 1 : -1);
        startAuto();
      });
    });

    slides[0].classList.add('active');
    dots.forEach(function (dot, idx) { dot.classList.toggle('active', idx === 0); });
    startAuto();
    if (hero) {
      hero.addEventListener('mouseenter', stopAuto);
      hero.addEventListener('mouseleave', startAuto);
    }
  }

  function localeForLang(lang) {
    var map = { en: 'en-GB', ru: 'ru-RU', uz: 'uz-UZ', zh: 'zh-CN' };
    return map[lang] || 'uz-UZ';
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
    var hasHttpOrigin = /^https?:/i.test(window.location.origin || '');
    function withOrigin(url) {
      if (!url) return url;
      if (!hasHttpOrigin) return url;
      if (url.indexOf('origin=') !== -1) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'origin=' + encodeURIComponent(window.location.origin);
    }
    function open(url) {
      if (frame) frame.src = withOrigin(url);
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function shut() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      if (frame) frame.src = '';
    }
    document.querySelectorAll('[data-video-url]').forEach(function (card) {
      card.addEventListener('click', function () {
        var url = card.getAttribute('data-video-url');
        if (url) open(url);
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

  function getCatalogProducts() {
    return Array.isArray(window.KUKA_PRODUCTS_MANIFEST) ? window.KUKA_PRODUCTS_MANIFEST : [];
  }

  function createCatalogCard(meta, images) {
      return '<article class="product-card reveal">'
      + '<div class="product-gallery" data-product-gallery data-images="' + images.map(absolutizeAssetPath).join('|') + '">'
      + '<img src="' + absolutizeAssetPath(images[0]) + '" alt="' + meta.title + '" loading="lazy" data-product-image>'
      + '<div class="product-gallery-dots"><span class="active"></span><span></span><span></span></div>'
      + '</div>'
      + '<div class="product-info">'
      + '<h3>' + meta.title + '</h3>'
      + '<p>' + meta.desc + '</p>'
      + '</div>'
      + '</article>';
  }

  function initFurnitureGallery() {
    var grid = document.getElementById('products-grid');
    var homeGrid = document.getElementById('home-products-grid');
    var titleMap = {
      1: { title: t('products.p1Title'), desc: t('products.p1Desc') },
      2: { title: t('products.p2Title'), desc: t('products.p2Desc') },
      3: { title: t('products.p3Title'), desc: t('products.p3Desc') },
      4: { title: t('products.p4Title'), desc: t('products.p4Desc') }
    };

    function probeImage(path) {
      return new Promise(function (resolve) {
        var image = new Image();
        image.onload = function () { resolve(path); };
        image.onerror = function () { resolve(null); };
        image.src = path;
      });
    }

    function getLocalizedInfo(item) {
      if (!item) return 'Premium collection';
      if (item.info && typeof item.info === 'object') {
        var lang = getStoredLang();
        return item.info[lang] || item.info.uz || item.info.en || item.info.ru || item.info.kz || item.info.zh || 'Premium collection';
      }
      return item.info || 'Premium collection';
    }

    function buildFallbackCards() {
      return Object.keys(titleMap).map(function (key) {
        var index = Number(key);
        var images = [
          absolutizeAssetPath('assets/images/products/product-' + index + '.jpg'),
          absolutizeAssetPath('assets/images/products/product-' + index + '1.jpg'),
          absolutizeAssetPath('assets/images/products/product-' + index + '2.jpg')
        ];
        return Promise.all(images.map(probeImage)).then(function (items) {
          var filtered = items.filter(Boolean);
          if (!filtered.length) return '';
          return createCatalogCard(titleMap[index], filtered);
        });
      });
    }

    function renderManifestItems(items) {
      return items.map(function (item, idx) {
        return createCatalogCard({
          title: item.model || ('Model ' + (idx + 1)),
          desc: getLocalizedInfo(item)
        }, item.images || []);
      }).join('');
    }

    function finalizeProducts() {
      initReveal();
      bindFurnitureGalleries();
    }

    if (grid || homeGrid) {
      Promise.resolve(getCatalogProducts())
        .then(function (items) {
          if (!Array.isArray(items) || !items.length) throw new Error('Empty manifest');
          if (grid) grid.innerHTML = renderManifestItems(items);
          if (homeGrid) homeGrid.innerHTML = renderManifestItems(items.slice(0, 8));
        })
        .catch(function () {
          return Promise.all(buildFallbackCards()).then(function (cards) {
            var html = cards.filter(Boolean).join('');
            if (grid) grid.innerHTML = html;
            if (homeGrid) homeGrid.innerHTML = html;
          });
        })
        .finally(finalizeProducts);
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
          gallery.classList.add('is-switching');
          image.src = images[index];
          dots.forEach(function (dot, dotIndex) { dot.classList.toggle('active', dotIndex === index); });
          setTimeout(function () {
            gallery.classList.remove('is-switching');
          }, 280);
        }

        render(0);
        if (images.length > 1 && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          gallery.addEventListener('mousemove', function (e) {
            var rect = gallery.getBoundingClientRect();
            if (!rect.width) return;
            var pos = (e.clientX - rect.left) / rect.width;
            var safePos = Math.min(0.9999, Math.max(0, pos));
            var nextIndex = Math.floor(safePos * images.length);
            if (nextIndex !== gallery._index) render(nextIndex);
          });
        }

        if (images.length > 1 && window.matchMedia('(hover: none), (pointer: coarse)').matches) {
          var touchStartX = 0;
          var touchStartY = 0;
          var swipeLocked = false;

          gallery.addEventListener('touchstart', function (e) {
            var touch = e.touches && e.touches[0];
            if (!touch) return;
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            swipeLocked = false;
            gallery._swiped = false;
          }, { passive: true });

          gallery.addEventListener('touchmove', function (e) {
            if (swipeLocked) return;
            var touch = e.touches && e.touches[0];
            if (!touch) return;
            var dx = touch.clientX - touchStartX;
            var dy = touch.clientY - touchStartY;
            if (Math.abs(dx) < 18 || Math.abs(dx) <= Math.abs(dy)) return;
            swipeLocked = true;
            gallery._swiped = true;
            render((gallery._index + (dx < 0 ? 1 : -1) + images.length) % images.length);
          }, { passive: true });

          gallery.addEventListener('touchend', function () {
            swipeLocked = false;
          }, { passive: true });
        }

        gallery.addEventListener('click', function () {
          if (gallery._swiped) {
            gallery._swiped = false;
            return;
          }
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

  function initMobileBottomNav() {
    var current = getCurrentPage();
    var isPages = /(^|\/)pages\//.test(window.location.pathname || '');
    var homeHref = isPages ? '../index.html' : 'index.html';
    var aboutHref = isPages ? 'about.html' : 'pages/about.html';
    var showroomsHref = isPages ? 'showrooms.html' : 'pages/showrooms.html';
    var furnitureHref = isPages ? 'furniture.html' : 'pages/furniture.html';
    var vacancyHref = isPages ? 'vacancy.html' : 'pages/vacancy.html';
    var contactHref = isPages ? 'contact.html' : 'pages/contact.html';
    var items = [
      { key: 'home', href: homeHref, i18n: 'nav.home', fallback: 'Asosiy', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>' },
      { key: 'about', href: aboutHref, i18n: 'nav.about', fallback: 'Biz haqimizda', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></svg>' },
      { key: 'showrooms', href: showroomsHref, i18n: 'nav.showrooms', fallback: 'Manzil', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>' },
      { key: 'furniture', href: furnitureHref, i18n: 'nav.furniture', fallback: 'Mebellar', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="8" height="6" rx="2"/><rect x="13" y="14" width="8" height="6" rx="2"/></svg>' },
      { key: 'vacancy', href: vacancyHref, i18n: 'nav.vacancy', fallback: 'Vakansiya', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 9h8"/><path d="M8 13h8"/></svg>' },
      { key: 'contact', href: contactHref, i18n: 'nav.contact', fallback: 'Aloqa', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' }
    ];
    var nav = document.querySelector('.mobile-bottom-nav') || document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');
    nav.innerHTML = items.map(function (item) {
      return '<a href="' + item.href + '" class="' + (current === item.key ? 'active' : '') + '">' + item.icon + '<span data-i18n="' + item.i18n + '">' + t(item.i18n) + '</span></a>';
    }).join('');
    if (!nav.parentNode) document.body.appendChild(nav);
  }

  var CHAT_CONFIG = {
    chatReappearMinutes: 5,
    crmClientsUrl: '/api/clients',
    crmClientsAltUrl: '/functions/api/clients',
    crmVacanciesUrl: '/api/vacancies',
    crmVacanciesAltUrl: '/functions/api/vacancies',
    crmTimeoutMs: 2200
  };

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatDateLabel(value) {
    var d = new Date(value || '');
    if (Number.isNaN(d.getTime())) return '-';
    try {
      var locale = t('meta.locale') || 'uz-UZ';
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Tashkent'
      }).format(d);
    } catch (e) {
      var day = String(d.getDate()).padStart(2, '0');
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var year = String(d.getFullYear());
      return day + '.' + month + '.' + year;
    }
  }

  function fetchVacancies() {
    var endpoints = [CHAT_CONFIG.crmVacanciesUrl, CHAT_CONFIG.crmVacanciesAltUrl]
      .filter(Boolean)
      .filter(function (value, idx, arr) { return arr.indexOf(value) === idx; });
    var attempts = endpoints.map(function (endpoint) {
      var target = endpoint + (endpoint.indexOf('?') === -1 ? '?type=openings' : '&type=openings');
      return fetchWithTimeout(target, { method: 'GET', cache: 'no-store' }, CHAT_CONFIG.crmTimeoutMs)
        .then(function (res) {
          if (!res.ok) throw new Error('Vacancy feed failed: ' + target);
          return res.json();
        })
        .then(function (payload) {
          var rows = Array.isArray(payload) ? payload : (Array.isArray(payload && payload.items) ? payload.items : []);
          return rows.map(function (row, idx) {
            var title = String(row.title || row.position || row.vacancy || row.role || '').trim();
            var details = String(row.description || row.details || row.requirements || row.note || '').trim();
            return {
              id: String(row.id || ('vac_' + idx)),
              title: title,
              details: details,
              publishedAt: String(row.published_at || row.created_at || row.createdAt || ''),
              orderNo: Number(row.order_no || row.order || row.sort_order || (idx + 1))
            };
          }).filter(function (item) { return item.title; });
        });
    });

    if (Promise.any) return Promise.any(attempts);
    return attempts[0].catch(function () {
      if (attempts[1]) return attempts[1];
      return [];
    });
  }

  function submitVacancyApplication(payload) {
    var endpoints = [CHAT_CONFIG.crmVacanciesUrl, CHAT_CONFIG.crmVacanciesAltUrl]
      .filter(Boolean)
      .filter(function (value, idx, arr) { return arr.indexOf(value) === idx; });
    var attempts = endpoints.map(function (endpoint) {
      return fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, CHAT_CONFIG.crmTimeoutMs + 3000)
        .then(function (res) {
          if (!res.ok) throw new Error('Vacancy submit failed: ' + endpoint);
          return res.json().catch(function () { return { success: true }; });
        })
        .then(function (body) {
          if (body && body.success === false) throw new Error('Vacancy rejected: ' + endpoint);
          return true;
        });
    });
    if (Promise.any) return Promise.any(attempts);
    return attempts[0].catch(function () {
      if (attempts[1]) return attempts[1];
      throw new Error('Vacancy submit unavailable');
    });
  }

  function initVacancyPage() {
    var listRoot = document.getElementById('vacancy-list');
    if (!listRoot) return;

    var emptyEl = document.getElementById('vacancy-empty');
    var detailModal = document.getElementById('vacancy-detail-modal');
    var detailTitle = document.getElementById('vacancy-detail-title');
    var detailDate = document.getElementById('vacancy-detail-date');
    var detailSections = document.getElementById('vacancy-detail-sections');
    var applyModal = document.getElementById('vacancy-apply-modal');
    var applyBtn = document.getElementById('vacancy-apply-open');
    var applyForm = document.getElementById('vacancy-apply-form');
    var selectedVacancy = document.getElementById('vacancy-selected-title');
    var selectedVacancyInput = document.getElementById('vacancy-selected-input');
    var desiredPositionInput = document.getElementById('vacancy-desired-position');
    var birthDateInput = document.getElementById('vacancy-birth-date');
    var birthDayInput = document.getElementById('vacancy-birth-day');
    var birthMonthInput = document.getElementById('vacancy-birth-month');
    var birthYearInput = document.getElementById('vacancy-birth-year');
    var phoneInput = document.getElementById('vacancy-phone');
    var salaryInput = document.getElementById('vacancy-salary');
    var photoInput = document.getElementById('vacancy-photo');
    var jobRowsRoot = document.getElementById('vacancy-job-rows');
    var addJobRowBtn = document.getElementById('vacancy-add-job-row');
    var successEl = document.getElementById('vacancy-form-success');
    var errorEl = document.getElementById('vacancy-form-error');
    var activeTitle = '';

    function buildLocalizedDemoVacancies() {
      var lang = getStoredLang();
      var copy = {
        uz: {
          title: "Yuk tashuvchi - o'rnatuvchi",
          details: "Ishga taklif qilinadi\n\nYuk tashuvchi - o'rnatuvchi\n(Gruzchik-ustanovshik)\n\nTalablar:\n- Erkak kishi\n- Jismonan baquvvat\n- Mebel sohasida tajriba\n\nIsh vaqti:\n- 09:00 dan 18:00 gacha\n\nOylik maosh:\n- 4 000 000 - 5 000 000 so'm\n\nTaklif qilamiz:\n- Qulay ish joyi va barqaror ish\n- Doimiy ish va rivojlanish imkoniyati\n\nBatafsil ma'lumot uchun:\n📞 95 885 22 33"
        },
        ru: {
          title: 'Грузчик - установщик',
          details: "Приглашаем на работу\n\nГрузчик - установщик\n\nТребования:\n- Мужчина\n- Хорошая физическая форма\n- Опыт в мебельной сфере\n\nГрафик:\n- С 09:00 до 18:00\n\nЗарплата:\n- 4 000 000 - 5 000 000 сум\n\nМы предлагаем:\n- Удобное рабочее место и стабильную работу\n- Постоянную работу и возможность развития\n\nПодробная информация:\n📞 95 885 22 33"
        },
        en: {
          title: 'Loader - installer',
          details: "We are hiring\n\nLoader - installer\n\nRequirements:\n- Male candidate\n- Physically fit\n- Experience in furniture field\n\nWork hours:\n- 09:00 to 18:00\n\nSalary:\n- 4,000,000 - 5,000,000 UZS\n\nWe offer:\n- Comfortable workplace and stable job\n- Full-time position with growth opportunities\n\nContact:\n📞 95 885 22 33"
        },
        zh: {
          title: '装卸工 - 安装工',
          details: "招聘中\n\n装卸工 - 安装工\n\n要求：\n- 男性\n- 身体素质好\n- 有家具行业经验\n\n工作时间：\n- 09:00 到 18:00\n\n薪资：\n- 4,000,000 - 5,000,000 苏姆\n\n我们提供：\n- 舒适稳定的工作环境\n- 长期岗位与成长机会\n\n联系方式：\n📞 95 885 22 33"
        },
        kz: {
          title: 'Жүк тасушы - орнатушы',
          details: "Жұмысқа шақырамыз\n\nЖүк тасушы - орнатушы\n\nТалаптар:\n- Ер адам\n- Физикалық тұрғыдан мықты\n- Жиһаз саласында тәжірибе\n\nЖұмыс уақыты:\n- 09:00-ден 18:00-ге дейін\n\nАйлық:\n- 4 000 000 - 5 000 000 сум\n\nБіз ұсынамыз:\n- Қолайлы жұмыс орны және тұрақты жұмыс\n- Тұрақты қызмет және даму мүмкіндігі\n\nТолық ақпарат:\n📞 95 885 22 33"
        }
      };
      var item = copy[lang] || copy.uz;
      return [{
        id: 'demo-loader-installer',
        title: item.title,
        details: item.details,
        publishedAt: '2026-04-14T09:00:00+05:00',
        orderNo: 1
      }];
    }

    var demoVacancies = buildLocalizedDemoVacancies();

    function closeModal(modal) {
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    function syncDesiredPosition(title) {
      if (!desiredPositionInput) return;
      var raw = String(title || '').trim().toLowerCase();
      var map = [
        { test: 'sotuv', value: 'sales_manager' },
        { test: 'kassir', value: 'cashier' },
        { test: 'ombor', value: 'warehouse' },
        { test: 'marketing', value: 'marketing' },
        { test: 'smm', value: 'smm' },
        { test: 'hr', value: 'hr' },
        { test: 'target', value: 'target' },
        { test: 'call', value: 'call_center' },
        { test: 'yuk', value: 'loader' },
        { test: 'gruz', value: 'loader' },
        { test: 'tashuv', value: 'loader' }
      ];
      var matched = map.find(function (item) { return raw.indexOf(item.test) !== -1; });
      desiredPositionInput.value = matched ? matched.value : '';
    }

    function onlyDigits(value) {
      return String(value || '').replace(/\D+/g, '');
    }

    function formatUzPhone(value) {
      var digits = onlyDigits(value);
      if (digits.indexOf('998') === 0) digits = digits.slice(3);
      digits = digits.slice(0, 9);
      var p1 = digits.slice(0, 2);
      var p2 = digits.slice(2, 5);
      var p3 = digits.slice(5, 7);
      var p4 = digits.slice(7, 9);
      var out = '+998';
      if (p1) out += ' (' + p1;
      if (p1.length === 2) out += ')';
      if (p2) out += ' ' + p2;
      if (p3) out += ' ' + p3;
      if (p4) out += ' ' + p4;
      return out;
    }

    function normalizedPhone(value) {
      var digits = onlyDigits(value);
      if (digits.indexOf('998') !== 0) {
        if (digits.length === 9) digits = '998' + digits;
        else return '';
      }
      if (digits.length !== 12) return '';
      return '+998 (' + digits.slice(3, 5) + ') ' + digits.slice(5, 8) + ' ' + digits.slice(8, 10) + ' ' + digits.slice(10, 12);
    }

    function formatSalaryValue(value) {
      var digits = onlyDigits(value).slice(0, 15);
      if (!digits) return '';
      return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function normalizedSalaryValue(value) {
      return onlyDigits(value).slice(0, 15);
    }

    function compressPhoto(file) {
      return new Promise(function (resolve) {
        if (!file || !window.FileReader) {
          resolve({ photoDataUrl: '', photoName: '' });
          return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
          var dataUrl = String((ev && ev.target && ev.target.result) || '');
          if (!dataUrl || !window.Image || !window.document || !document.createElement) {
            resolve({ photoDataUrl: dataUrl.length > 180000 ? '' : dataUrl, photoName: String(file.name || '') });
            return;
          }
          var img = new Image();
          img.onload = function () {
            try {
              var canvas = document.createElement('canvas');
              var maxSide = 420;
              var ratio = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
              canvas.width = Math.max(1, Math.round((img.width || 1) * ratio));
              canvas.height = Math.max(1, Math.round((img.height || 1) * ratio));
              var ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve({ photoDataUrl: dataUrl.length > 180000 ? '' : dataUrl, photoName: String(file.name || '') });
                return;
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              var jpg = canvas.toDataURL('image/jpeg', 0.82);
              var finalUrl = jpg || dataUrl;
              if (finalUrl.length > 180000) finalUrl = '';
              resolve({ photoDataUrl: finalUrl, photoName: String(file.name || '') });
            } catch (e) {
              resolve({ photoDataUrl: dataUrl.length > 180000 ? '' : dataUrl, photoName: String(file.name || '') });
            }
          };
          img.onerror = function () {
            resolve({ photoDataUrl: dataUrl.length > 180000 ? '' : dataUrl, photoName: String(file.name || '') });
          };
          img.src = dataUrl;
        };
        reader.onerror = function () {
          resolve({ photoDataUrl: '', photoName: String(file.name || '') });
        };
        reader.readAsDataURL(file);
      });
    }

    if (phoneInput) {
      phoneInput.value = formatUzPhone(phoneInput.value || '');
      phoneInput.addEventListener('focus', function () {
        if (!String(phoneInput.value || '').trim()) phoneInput.value = '+998';
      });
      phoneInput.addEventListener('input', function () {
        phoneInput.value = formatUzPhone(phoneInput.value || '');
      });
      phoneInput.addEventListener('blur', function () {
        phoneInput.value = normalizedPhone(phoneInput.value || '') || '';
      });
    }

    if (salaryInput) {
      salaryInput.addEventListener('input', function () {
        salaryInput.value = formatSalaryValue(salaryInput.value || '');
      });
      salaryInput.addEventListener('blur', function () {
        salaryInput.value = formatSalaryValue(salaryInput.value || '');
      });
    }

    function pad2(v) {
      var n = Number(v || 0);
      return String(n).padStart(2, '0');
    }

    function fillSelectOptions(el, list, includeEmpty) {
      if (!el) return;
      var first = includeEmpty ? '<option value="">' + escapeHtml(includeEmpty) + '</option>' : '';
      el.innerHTML = first + list.map(function (item) {
        return '<option value="' + escapeHtml(String(item.value)) + '">' + escapeHtml(String(item.label)) + '</option>';
      }).join('');
    }

    function setupBirthDatePicker() {
      if (!birthDateInput || !birthDayInput || !birthMonthInput || !birthYearInput) return;

      function birthPickerLabels() {
        var map = {
          uz: { day: 'Kun', month: 'Oy', year: 'Yil' },
          ru: { day: 'День', month: 'Месяц', year: 'Год' },
          en: { day: 'Day', month: 'Month', year: 'Year' },
          zh: { day: '日', month: '月', year: '年' },
          kz: { day: 'Күн', month: 'Ай', year: 'Жыл' }
        };
        return map[getStoredLang()] || map.uz;
      }

      function monthOptionsByLocale() {
        var locale = t('meta.locale') || localeForLang(getStoredLang()) || 'uz-UZ';
        var out = [];
        for (var i = 0; i < 12; i += 1) {
          var label;
          try {
            label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, i, 1));
          } catch (e) {
            label = String(i + 1);
          }
          out.push({ value: i + 1, label: label });
        }
        return out;
      }

      function renderBaseBirthOptions() {
        var labels = birthPickerLabels();
        var prevMonth = birthMonthInput.value;
        var prevYear = birthYearInput.value;
        fillSelectOptions(birthMonthInput, monthOptionsByLocale(), labels.month);
        var currentYear = new Date().getFullYear();
        var years = [];
        for (var y = currentYear - 16; y >= 1950; y -= 1) years.push({ value: y, label: y });
        fillSelectOptions(birthYearInput, years, labels.year);
        if (prevMonth) birthMonthInput.value = prevMonth;
        if (prevYear) birthYearInput.value = prevYear;
      }

      function rebuildDays() {
        var selectedDay = Number(birthDayInput.value || 0);
        var month = Number(birthMonthInput.value || 0);
        var year = Number(birthYearInput.value || 0);
        var maxDay = 31;
        if (month && year) maxDay = new Date(year, month, 0).getDate();
        var days = [];
        for (var d = 1; d <= maxDay; d += 1) {
          days.push({ value: d, label: d });
        }
        fillSelectOptions(birthDayInput, days, birthPickerLabels().day);
        if (selectedDay > 0 && selectedDay <= maxDay) birthDayInput.value = String(selectedDay);
      }

      function syncBirthDateValue() {
        var day = Number(birthDayInput.value || 0);
        var month = Number(birthMonthInput.value || 0);
        var year = Number(birthYearInput.value || 0);
        if (!day || !month || !year) {
          birthDateInput.value = '';
          return;
        }
        birthDateInput.value = String(year) + '-' + pad2(month) + '-' + pad2(day);
      }

      renderBaseBirthOptions();
      rebuildDays();
      syncBirthDateValue();

      if (birthDateInput.dataset.birthPickerBound !== '1') {
        [birthMonthInput, birthYearInput].forEach(function (el) {
          el.addEventListener('change', function () {
            rebuildDays();
            syncBirthDateValue();
          });
        });
        birthDayInput.addEventListener('change', syncBirthDateValue);
        document.addEventListener('kuka:lang-changed', function () {
          renderBaseBirthOptions();
          rebuildDays();
          syncBirthDateValue();
        });
        birthDateInput.dataset.birthPickerBound = '1';
      }
    }

    setupBirthDatePicker();

    function splitVacancyBlocks(detailsText) {
      var text = String(detailsText || '').replace(/\r/g, '').trim();
      if (!text) return [];
      var markers = [
        'Talablar:',
        'Ish vaqti:',
        'Oylik maosh:',
        'Taklif qilamiz:',
        'Batafsil ma\'lumot uchun:',
        'Requirements:',
        'Work time:',
        'Salary:',
        'We offer:',
        'Contact:'
      ];
      markers.forEach(function (marker) {
        var idx = text.indexOf(marker);
        while (idx > 0) {
          var prefix = text.slice(0, idx).replace(/\s+$/, '');
          var suffix = text.slice(idx);
          text = prefix + '\n\n' + suffix;
          idx = text.indexOf(marker, idx + marker.length + 2);
        }
      });
      return text.split(/\n{2,}/).map(function (block) {
        return block.trim();
      }).filter(Boolean);
    }

    function renderVacancyDetail(row) {
      if (detailTitle) detailTitle.textContent = row.title || t('vacancy.modalDetailTitle');
      if (detailDate) {
        detailDate.textContent = t('vacancy.postedDate') + ' ' + formatDateLabel(row.publishedAt);
      }
      if (!detailSections) return;
      detailSections.innerHTML = '';
      var blocks = splitVacancyBlocks(row.details || t('vacancy.detailsFallback'));
      if (!blocks.length) blocks = [t('vacancy.detailsFallback')];
      blocks.forEach(function (block) {
        var lines = block.split('\n');
        var firstLine = String(lines[0] || '').trim();
        var title = '';
        var textLines = lines;
        if (/:$/.test(firstLine)) {
          title = firstLine.slice(0, -1).trim();
          textLines = lines.slice(1);
        } else {
          var dividerIndex = firstLine.indexOf(':');
          if (dividerIndex > 0 && dividerIndex < 40) {
            title = firstLine.slice(0, dividerIndex).trim();
            textLines = [firstLine.slice(dividerIndex + 1).trim()].concat(lines.slice(1));
          }
        }
        var card = document.createElement('article');
        card.className = 'vacancy-detail-section';
        if (title) {
          var heading = document.createElement('h4');
          heading.className = 'vacancy-detail-section-title';
          heading.textContent = title;
          card.appendChild(heading);
        }
        var text = document.createElement('p');
        text.className = 'vacancy-detail-text';
        text.textContent = textLines.join('\n').trim() || '-';
        card.appendChild(text);
        detailSections.appendChild(card);
      });
    }

    function openModal(modal) {
      if (!modal) return;
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        closeModal(detailModal);
        closeModal(applyModal);
      });
    });
    document.querySelectorAll('.vacancy-modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function () {
        closeModal(detailModal);
        closeModal(applyModal);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeModal(detailModal);
      closeModal(applyModal);
    });

    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        if (selectedVacancy && activeTitle) selectedVacancy.textContent = activeTitle;
        if (selectedVacancyInput && activeTitle) selectedVacancyInput.value = activeTitle;
        if (desiredPositionInput) desiredPositionInput.value = '';
        openModal(applyModal);
      });
    }

    function bindJobRowRemove(btn) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        var rows = jobRowsRoot ? jobRowsRoot.querySelectorAll('[data-job-row]') : [];
        if (!jobRowsRoot || rows.length <= 1) {
          var firstRow = rows[0];
          if (!firstRow) return;
          firstRow.querySelectorAll('input').forEach(function (input) { input.value = ''; });
          renumberJobRows();
          return;
        }
        var row = btn.closest('[data-job-row]');
        if (row) row.remove();
        renumberJobRows();
      });
    }

    function renumberJobRows() {
      if (!jobRowsRoot) return;
      var idx = 1;
      jobRowsRoot.querySelectorAll('[data-job-row]').forEach(function (row) {
        var marker = row.querySelector('[data-job-index]');
        if (!marker) {
          marker = document.createElement('span');
          marker.className = 'vacancy-job-index';
          marker.setAttribute('data-job-index', '');
          row.insertBefore(marker, row.firstChild);
        }
        marker.textContent = String(idx) + '.';
        idx += 1;
      });
    }

    if (jobRowsRoot) {
      jobRowsRoot.querySelectorAll('[data-job-remove]').forEach(bindJobRowRemove);
      renumberJobRows();
    }
    if (addJobRowBtn && jobRowsRoot) {
      addJobRowBtn.addEventListener('click', function () {
        var row = document.createElement('div');
        row.className = 'vacancy-job-row';
        row.setAttribute('data-job-row', '');
        row.innerHTML = ''
          + '<span class="vacancy-job-index" data-job-index></span>'
          + '<input type="text" name="jobCompany[]" data-i18n-placeholder="vacancy.jobCompanyPlaceholder" placeholder="' + escapeHtml(t('vacancy.jobCompanyPlaceholder')) + '">'
          + '<input type="text" name="jobRole[]" data-i18n-placeholder="vacancy.jobRolePlaceholder" placeholder="' + escapeHtml(t('vacancy.jobRolePlaceholder')) + '">'
          + '<input type="text" name="jobYears[]" data-i18n-placeholder="vacancy.jobYearsPlaceholder" placeholder="' + escapeHtml(t('vacancy.jobYearsPlaceholder')) + '">'
          + '<button type="button" class="vacancy-job-remove" data-job-remove data-i18n-aria-label="vacancy.removeRowAria" aria-label="' + escapeHtml(t('vacancy.removeRowAria')) + '">'
          + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
          + '</button>';
        jobRowsRoot.appendChild(row);
        bindJobRowRemove(row.querySelector('[data-job-remove]'));
        renumberJobRows();
      });
    }

    function renderVacancies(rows) {
      var sourceRows = (Array.isArray(rows) && rows.length) ? rows : demoVacancies;
      var sorted = sourceRows.slice().sort(function (a, b) {
        var ta = Date.parse(a.publishedAt || '') || 0;
        var tb = Date.parse(b.publishedAt || '') || 0;
        if (ta !== tb) return tb - ta;
        return (a.orderNo || 0) - (b.orderNo || 0);
      });
      if (!sorted.length) {
        listRoot.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;
      activeTitle = sorted[0].title;
      if (selectedVacancy) selectedVacancy.textContent = activeTitle;
      if (selectedVacancyInput) selectedVacancyInput.value = activeTitle;

      listRoot.innerHTML = sorted.map(function (row, idx) {
        return '<article class="vacancy-item">'
          + '<button type="button" class="vacancy-item-btn" data-vacancy-id="' + escapeHtml(row.id) + '">'
          + '<span class="vacancy-order">' + (idx + 1) + '.</span>'
          + '<span class="vacancy-main"><strong>' + escapeHtml(row.title) + '</strong>'
          + '<em>' + formatDateLabel(row.publishedAt) + '</em></span>'
          + '</button></article>';
      }).join('');

      listRoot.querySelectorAll('[data-vacancy-id]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-vacancy-id');
          var row = sorted.find(function (item) { return item.id === id; });
          if (!row) return;
          activeTitle = row.title;
          if (selectedVacancy) selectedVacancy.textContent = activeTitle;
          if (selectedVacancyInput) selectedVacancyInput.value = activeTitle;
          renderVacancyDetail(row);
          openModal(detailModal);
        });
      });
    }

    renderVacancies(demoVacancies);
    fetchVacancies().then(renderVacancies).catch(function () {
      renderVacancies(demoVacancies);
    });

    if (applyForm) {
      applyForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = applyForm.querySelector('button[type="submit"]');
        var firstName = (applyForm.querySelector('input[name="firstName"]') || {}).value || '';
        var lastName = (applyForm.querySelector('input[name="lastName"]') || {}).value || '';
        var birthDate = (birthDateInput || {}).value || '';
        var phone = normalizedPhone((phoneInput || {}).value || '');
        var otherLang = (applyForm.querySelector('input[name="otherLanguage"]') || {}).value || '';
        var expectedSalary = normalizedSalaryValue((applyForm.querySelector('input[name="expectedSalary"]') || {}).value || '');
        var currency = (applyForm.querySelector('select[name="salaryCurrency"]') || {}).value || 'UZS';
        var extra = (applyForm.querySelector('textarea[name="additionalInfo"]') || {}).value || '';
        var desiredPosition = applyForm.querySelector('select[name="desiredPosition"]');
        var desiredPositionValue = (desiredPosition || {}).value || '';
        var desiredPositionLabel = '';
        if (desiredPosition && desiredPosition.selectedIndex >= 0 && desiredPosition.options[desiredPosition.selectedIndex]) {
          desiredPositionLabel = String(desiredPosition.options[desiredPosition.selectedIndex].textContent || '').trim();
        }
        var vacancyTitle = desiredPositionLabel || ((selectedVacancyInput && selectedVacancyInput.value) ? selectedVacancyInput.value : activeTitle);
        var langValues = [];
        applyForm.querySelectorAll('input[name="languages"]:checked').forEach(function (el) {
          langValues.push(el.value);
        });
        var hasLanguage = langValues.length > 0 || Boolean(String(otherLang || '').trim());
        var hasSalary = Boolean(String(expectedSalary || '').trim());
        var hasPhoto = Boolean(photoInput && photoInput.files && photoInput.files[0]);

        var jobs = [];
        applyForm.querySelectorAll('[data-job-row]').forEach(function (row) {
          var company = (row.querySelector('input[name="jobCompany[]"]') || {}).value || '';
          var role = (row.querySelector('input[name="jobRole[]"]') || {}).value || '';
          var years = (row.querySelector('input[name="jobYears[]"]') || {}).value || '';
          if (company || role || years) {
            jobs.push({ company: company.trim(), role: role.trim(), years: years.trim() });
          }
        });

        var payload = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: (firstName + ' ' + lastName).trim(),
          birthDate: String(birthDate || '').trim(),
          vacancyTitle: String(vacancyTitle || '').trim(),
          desiredPosition: String(desiredPositionLabel || '').trim(),
          desiredPositionCode: String(desiredPositionValue || '').trim(),
          languages: langValues,
          otherLanguage: otherLang.trim(),
          jobs: jobs,
          expectedSalary: String(expectedSalary || '').trim(),
          salaryCurrency: String(currency || 'UZS').trim(),
          additionalInfo: String(extra || '').trim(),
          phone: String(phone || '').trim(),
          source: 'website_vacancy',
          lang: getStoredLang(),
          locale: t('meta.locale') || 'uz-UZ'
        };

        if (!payload.firstName || !payload.lastName || !payload.birthDate || !payload.phone || !desiredPositionValue || !hasPhoto || !hasLanguage || !hasSalary) {
          var requiredNames = [
            t('vacancy.firstName'),
            t('vacancy.lastName'),
            t('vacancy.birthDate'),
            t('vacancy.positionLabel'),
            t('vacancy.photo'),
            t('vacancy.phone'),
            t('vacancy.languagesLegend'),
            t('vacancy.expectedSalary')
          ].join(', ');
          if (errorEl) errorEl.textContent = t('vacancy.requiredFields') + ': ' + requiredNames;
          return;
        }
        if (submitBtn) submitBtn.disabled = true;
        if (successEl) successEl.textContent = '';
        if (errorEl) errorEl.textContent = '';

        var photoFile = (photoInput && photoInput.files && photoInput.files[0]) ? photoInput.files[0] : null;
        compressPhoto(photoFile)
          .then(function (photoPayload) {
            payload.photoName = String((photoPayload && photoPayload.photoName) || '');
            payload.photoDataUrl = String((photoPayload && photoPayload.photoDataUrl) || '');
            return submitVacancyApplication(payload);
          })
          .then(function () {
            if (successEl) successEl.textContent = t('vacancy.success');
            applyForm.reset();
            if (phoneInput) phoneInput.value = '';
            if (birthDayInput) birthDayInput.value = '';
            if (birthMonthInput) birthMonthInput.value = '';
            if (birthYearInput) birthYearInput.value = '';
            if (birthDateInput) birthDateInput.value = '';
            if (jobRowsRoot) {
              var allRows = jobRowsRoot.querySelectorAll('[data-job-row]');
              allRows.forEach(function (row, idx) {
                if (idx > 0) row.remove();
              });
              renumberJobRows();
            }
            if (desiredPositionInput) desiredPositionInput.value = '';
          })
          .catch(function () {
            if (errorEl) errorEl.textContent = t('vacancy.error');
          })
          .finally(function () {
            if (submitBtn) submitBtn.disabled = false;
          });
      });
    }
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    if (typeof AbortController === 'undefined') {
      return fetch(url, options);
    }
    var controller = new AbortController();
    var timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || 2200);
    var merged = Object.assign({}, options || {}, { signal: controller.signal });
    return fetch(url, merged).finally(function () {
      clearTimeout(timer);
    });
  }

  function leadDateUz() {
    try {
      return new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Asia/Tashkent',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date());
    } catch (e) {
      var now = new Date();
      var dd = String(now.getDate()).padStart(2, '0');
      var mm = String(now.getMonth() + 1).padStart(2, '0');
      var yy = String(now.getFullYear()).slice(-2);
      return dd + '.' + mm + '.' + yy;
    }
  }

  function sendLeadToCrm(phone, message) {
    var page = getCurrentPage();
    var lang = getStoredLang();
    var payload = {
      date: leadDateUz(),
      showroom: '',
      manager: '',
      phone: phone,
      source: 'instagram',
      interest: '',
      note: message + '\n\n[Site: ' + page + ', lang: ' + lang + ']',
      status: '',
      price: 0,
      result: '',
      creator_role: 'website',
      creator_login: 'website',
      assigned_manager_login: ''
    };
    var endpoints = [CHAT_CONFIG.crmClientsUrl, CHAT_CONFIG.crmClientsAltUrl]
      .filter(Boolean)
      .filter(function (value, idx, arr) { return arr.indexOf(value) === idx; });

    var attempts = endpoints.map(function (endpoint) {
      return fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, CHAT_CONFIG.crmTimeoutMs)
        .then(function (res) {
          if (!res.ok) throw new Error('CRM failed: ' + endpoint);
          var ct = String(res.headers.get('content-type') || '').toLowerCase();
          if (ct.indexOf('application/json') === -1) throw new Error('CRM non-json response: ' + endpoint);
          return res.json();
        })
        .then(function (data) {
          if (data && data.success === false) throw new Error('CRM rejected: ' + endpoint);
          return true;
        });
    });

    if (Promise.any) {
      return Promise.any(attempts);
    }
    return attempts[0].catch(function () {
      if (attempts[1]) return attempts[1];
      throw new Error('CRM unavailable');
    });
  }

  function submitLead(phone, message) {
    return sendLeadToCrm(phone, message);
  }

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
        submitLead(phone, message)
          .then(function () {
            if (successEl) successEl.textContent = t('chat.success');
            form.reset();
          })
          .catch(function (err) {
            if (window && window.console) console.error('Chat CRM submit failed', err);
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
      submitLead(phone, name ? 'Name: ' + name + '\n\n' + message : message)
        .then(function () {
          if (successEl) successEl.textContent = t('chat.success');
          form.reset();
        })
        .catch(function (err) {
          if (window && window.console) console.error('Contact CRM submit failed', err);
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
    initPagePreloader();
    var lang = getStoredLang();
    Promise.allSettled([loadTranslations('uz'), loadTranslations(lang)])
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
    initMobileBottomNav();
    initChatWidget();
    initContactForm();
    initVacancyPage();
    initYandexLinks();
    initHeroSlider();
    initReveal();
    initVideoModal();
    initCounters();
    initRipple();
    initAboutImageZoom();
    initFurnitureGallery();
  }

  initPagePreloader();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
