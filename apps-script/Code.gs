const SHEET_ID = 'YOUR_SHEET_ID';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'order') return createOrder(data);
  if (action === 'lead') return createLead(data);

  return json({status:'error', message:'unknown action'});
}

function createOrder(data){
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('orders');
  sheet.appendRow([
    new Date(),
    data.name,
    data.phone,
    data.city,
    data.product,
    data.amount,
    data.status || 'new'
  ]);

  return json({status:'ok'});
}

function createLead(data){
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('leads');
  sheet.appendRow([
    new Date(),
    data.name,
    data.phone,
    data.city,
    data.comment || ''
  ]);

  return json({status:'ok'});
}

function json(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
