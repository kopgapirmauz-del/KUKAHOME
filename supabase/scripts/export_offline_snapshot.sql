-- ===========================================================================
-- CRM ma'lumotini offline rejim uchun eksport qilish.
--
-- QAYERDA ISHGA TUSHIRILADI:
--   Supabase Dashboard -> KUKAHOME -> SQL Editor.
--   (SQL Editor ishlaydi - u boshqa yo'ldan boradi, 402 unga tegmaydi.)
--
-- KEYIN:
--   Natijadagi yagona katakni to'liq nusxalab, `crm-offline.json` nomi bilan
--   saqlang. So'ng CRM ni shu manzil bilan oching:
--       https://kukahome.uz/crm/?offline=1
--   va "Offline rejim" oynasidan o'sha faylni tanlang.
--
-- PAROL: offline rejimda parol brauzerda tekshiriladi, shuning uchun quyida
-- vaqtinchalik parol beriladi. Uni o'zingiz xohlagan qiymatga o'zgartiring.
-- Bu parol faqat shu faylga tegishli - serverdagi haqiqiy parollarga aloqasi
-- yo'q va ularni o'zgartirmaydi.
--
-- OGOHLANTIRISH: bu fayl mijozlar bazasining to'liq nusxasi. Uni begonaga
-- bermang, ish tugagach o'chirib tashlang.
-- ===========================================================================

with parol as (
  select 'Kuka2026!' as qiymat            -- <<< SHU YERNI O'ZGARTIRING
)
select jsonb_pretty(jsonb_build_object(
  'meta', jsonb_build_object('updatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),

  'stores', coalesce((
    select jsonb_agg(jsonb_build_object('id', 'store_' || s.id, 'name', s.name) order by s.name)
    from public.stores s), '[]'::jsonb),

  -- full_name birinchi so'zi ism, qolgani familiya (ilovadagi splitName bilan bir xil).
  'users', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', 'mgr_' || u.id,
      'role', u.role::text,
      'login', u.login,
      'password', (select qiymat from parol),
      'firstName', split_part(btrim(u.full_name), ' ', 1),
      'lastName', btrim(substr(btrim(u.full_name), length(split_part(btrim(u.full_name), ' ', 1)) + 1)),
      'avatar', '',
      'storeId', case when u.store_id is null then '' else 'store_' || u.store_id end,
      'phone', coalesce(u.phone, ''),
      'telegramId', coalesce(u.telegram_id, '')
    ) order by u.created_at)
    from public.users u), '[]'::jsonb),

  'clients', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id::text,
      'date', coalesce(c.date::text, ''),
      'contact', c.phone,
      'source', c.source,
      'interest', c.interest,
      'comment', c.note,
      'attended', c.result,
      'price', c.price,
      'currency', c.currency,
      'status', c.status,
      'storeId', case when c.store_id is null then '' else 'store_' || c.store_id end,
      'managerId', case when c.manager_id is null then '' else 'mgr_' || c.manager_id end,
      'createdAt', to_char(c.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'createdBy', case when c.created_by is null then '' else 'mgr_' || c.created_by end
    ) order by c.created_at desc)
    from public.clients c), '[]'::jsonb),

  -- Bildirishnomalar login bo'yicha bog'lanadi, id bo'yicha emas.
  'notifications', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', n.id::text,
      'type', n.type,
      'to_login', coalesce(tu.login, ''),
      'actor_login', coalesce(au.login, ''),
      'client_contact', n.client_contact,
      'is_read', case when n.is_read then 1 else 0 end,
      'created_at', to_char(n.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by n.id desc)
    from public.notifications n
    left join public.users tu on tu.id = n.to_user_id
    left join public.users au on au.id = n.actor_user_id), '[]'::jsonb),

  'salesChecks', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', sc.id::text,
      'checkNo', sc.check_no,
      'storeId', case when sc.store_id is null then '' else 'store_' || sc.store_id end,
      'managerId', case when sc.manager_id is null then '' else 'mgr_' || sc.manager_id end,
      'orderDate', coalesce(sc.order_date::text, ''),
      'formData', sc.form_data,
      'receiptUrl', sc.receipt_url,
      'receiptDataUrl', sc.receipt_data_url,
      'receiptFileName', sc.receipt_file_name,
      'createdAt', to_char(sc.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by sc.created_at desc)
    from public.sales_checks sc), '[]'::jsonb),

  'warehouseStock', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ws.id::text,
      'model', ws.model,
      'info', ws.info,
      'qty', ws.qty,
      'locationType', ws.location_type::text,
      'storeId', case when ws.store_id is null then '' else 'store_' || ws.store_id end,
      'status', ws.status,
      'reservation', ws.reservation,
      'imageUrl', coalesce(ws.image_url, ''),
      'createdAt', to_char(ws.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by ws.created_at desc)
    from public.warehouse_stock ws), '[]'::jsonb),

  'warrantyTickets', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', wt.id::text,
      'ticketNo', wt.ticket_no,
      'storeId', coalesce(wt.store_id, ''),
      'managerId', coalesce(wt.manager_id, ''),
      'saleDate', coalesce(wt.sale_date::text, ''),
      'warrantyStartDate', coalesce(wt.warranty_start_date::text, ''),
      'warrantyEndDate', coalesce(wt.warranty_end_date::text, ''),
      'ticketUrl', wt.ticket_url,
      'ticketDataUrl', wt.ticket_data_url,
      'ticketFileName', wt.ticket_file_name,
      'formData', wt.form_data,
      'createdAt', to_char(wt.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by wt.created_at desc)
    from public.warranty_tickets wt), '[]'::jsonb),

  'vacancies', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', v.id::text,
      'fullName', v.full_name,
      'phone', v.phone,
      'position', v.position,
      'note', v.note,
      'resumeUrl', v.resume_url,
      'resumeFileName', v.resume_file_name,
      'photoUrl', v.photo_url,
      'source', v.source,
      'status', v.status,
      'createdAt', to_char(v.created_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) order by v.created_at desc)
    from public.vacancies v), '[]'::jsonb),

  -- Bu ro'yxatlar faqat storage'dagi snapshot faylida yashaydi, u esa hozir
  -- 402 tufayli o'qilmayapti. Bo'sh qoldiriladi.
  'warehouseOrders', '[]'::jsonb,
  'warehouseIncoming', '[]'::jsonb,
  'vacancyOpenings', '[]'::jsonb
)) as crm_offline_json;
