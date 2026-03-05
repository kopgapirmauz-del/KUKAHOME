
# API Endpoints

## POST /api/order
Create new order.

Body:
{
  "name": "Customer name",
  "phone": "+998901234567",
  "city": "Tashkent",
  "product": "KF7053",
  "amount": 8600000
}

Response:
{
  "status": "ok"
}

---

## POST /api/lead
Create lead.

Body:
{
  "name": "Customer",
  "phone": "+998901234567",
  "city": "Tashkent",
  "comment": "Interested in sofa"
}

Response:
{
  "status": "ok"
}
