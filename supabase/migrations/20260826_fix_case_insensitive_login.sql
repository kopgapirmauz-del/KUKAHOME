-- Login xatosini tuzatish: "parolni to'g'ri tersa ham kirmayapti".
--
-- Sabablari:
--  1. verify_login() loginni `u.login = p_login` deb, ya'ni katta-kichik harfga
--     sezgir taqqoslardi. Bazadagi loginlar `Charos`, `Muxammad`, `shaxlo`
--     ko'rinishida saqlangan, telefon klaviaturasi esa birinchi harfni
--     avtomatik kattalashtiradi -> `charos` yoki `Shaxlo` terilsa, parol
--     to'g'ri bo'lsa ham 0 qator qaytardi va foydalanuvchi "parol xato"
--     xabarini ko'rardi.
--  2. Login/parol atrofidagi bo'shliq (mobil klaviatura qo'shib yuboradigan
--     probel yoki nusxa-ko'chirishdan qolgan probel) ham xuddi shunday
--     rad etilardi.
--  3. Eski, ochiq matnda saqlangan parolli qatorlar (bcrypt emas) uchun
--     verify_login har doim 0 qator qaytarardi; ular faqat ilovadagi
--     zaxira yo'l orqali kirardi va u yo'l ham katta-kichik harfga sezgir edi.
--
-- Yechim: login `lower(btrim(...))` bo'yicha solishtiriladi, eski ochiq matnli
-- parollar shu yerning o'zida bcryptga ko'chiriladi, va crypt() xatosi
-- (yaroqsiz salt) butun funksiyani yiqitmaydi.
--
-- Eski ta'rif (rollback uchun):
--   WHERE u.login = p_login
--     AND u.password_hash = extensions.crypt(p_password, u.password_hash)

begin;

-- ---------------------------------------------------------------------------
-- set_user_password: bcrypt narxini 6 dan 10 ga ko'taramiz. Mavjud hashlar
-- o'z narxini hash ichida saqlaydi, shuning uchun bu o'zgarish eski
-- parollarni buzmaydi - ular keyingi almashtirishda 10 ga ko'chadi.
-- ---------------------------------------------------------------------------
create or replace function public.set_user_password(p_user_id uuid, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
begin
  if p_new_password is null or length(p_new_password) = 0 then
    raise exception 'empty_password';
  end if;

  update users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = p_user_id;

  return found;
end;
$function$;

-- ---------------------------------------------------------------------------
-- verify_login: katta-kichik harfga sezgir emas + eski parollarni ko'chiradi.
-- ---------------------------------------------------------------------------
create or replace function public.verify_login(p_login text, p_password text)
returns table (
  id uuid,
  full_name text,
  login text,
  role user_role,
  store_id uuid,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_user public.users%rowtype;
  v_login text := lower(btrim(coalesce(p_login, '')));
  v_password text := coalesce(p_password, '');
  v_ok boolean := false;
begin
  if v_login = '' or v_password = '' then
    return;
  end if;

  -- Aynan mos keladigan login birinchi bo'lsin: kelajakda faqat harf
  -- registri bilan farq qiladigan ikkita login paydo bo'lsa ham, aniq
  -- yozilgani ustun turadi.
  select u.* into v_user
  from users u
  where lower(btrim(u.login)) = v_login
  order by (u.login = p_login) desc, u.created_at asc
  limit 1;

  if not found then
    return;
  end if;

  if v_user.password_hash ~ '^\$2[aby]\$\d{2}\$' then
    -- crypt() yaroqsiz salt uchun exception tashlaydi. Uni shu yerda ushlamasak,
    -- bitta buzuq qator butun login endpointini 500 ga olib boradi.
    begin
      v_ok := v_user.password_hash = extensions.crypt(v_password, v_user.password_hash);
    exception when others then
      v_ok := false;
    end;
  else
    -- Eski, ochiq matnda saqlangan parol. Mos kelsa, darhol bcryptga ko'chiramiz,
    -- shunda bu qator ham qolgan hammasi bilan bir xil yo'ldan tekshiriladi.
    v_ok := v_user.password_hash = v_password;
    if v_ok then
      update users
      set password_hash = extensions.crypt(v_password, extensions.gen_salt('bf', 10)),
          updated_at = now()
      where users.id = v_user.id;
    end if;
  end if;

  if not v_ok then
    return;
  end if;

  return query
  select v_user.id, v_user.full_name, v_user.login, v_user.role,
         v_user.store_id, v_user.phone, v_user.created_at;
end;
$function$;

-- ---------------------------------------------------------------------------
-- Login endi registrga sezgir emas, shuning uchun `Ali` va `ali` bir vaqtda
-- mavjud bo'lib qolishi mumkin emas - aks holda ikkalasi bir xil login
-- hisoblanib, biri hech qachon kira olmasdi. Mavjud loginlarda bunday
-- to'qnashuv yo'q (tekshirilgan), shuning uchun indeks xavfsiz.
-- ---------------------------------------------------------------------------
create unique index if not exists users_login_lower_key
  on public.users (lower(btrim(login)));

-- Faqat service_role chaqira olsin (login API service role key bilan ishlaydi).
revoke all on function public.verify_login(text, text) from public, anon, authenticated;
revoke all on function public.set_user_password(uuid, text) from public, anon, authenticated;
grant execute on function public.verify_login(text, text) to service_role;
grant execute on function public.set_user_password(uuid, text) to service_role;

commit;
