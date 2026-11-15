/**
 * 배달 설문 응답 수집용 Google Apps Script
 * 사용법은 '설정가이드.md' 참고.
 *  - doPost : 설문 페이지가 보낸 응답을 'responses' 시트에 한 줄씩 추가
 *  - doGet  : 결과 페이지가 응답 전체를 JSON으로 읽어감
 */
const SHEET_NAME = 'responses';
const HEADERS = [
  'respondent_id', 'submitted_at', 'round', 'group', 'category',
  'chosen_store', 'chosen_name', 'chosen_rating', 'chosen_reviews',
  'chosen_position', 'display_order', 'response_ms', 'groups_assigned',
  'is_test', 'version'
];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents);
    const rows = (data.rows || []).slice(0, 10).map(r => HEADERS.map(h => r[h] === undefined ? '' : r[h]));
    if (rows.length) {
      const sh = getSheet_();
      sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    }
    return json_({ ok: true, added: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const sh = getSheet_();
  const values = sh.getDataRange().getValues();
  const head = values.shift() || HEADERS;
  const rows = values.map(v => Object.fromEntries(head.map((h, i) => [h, v[i]])));
  return json_({ ok: true, rows });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
