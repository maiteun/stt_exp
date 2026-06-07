// =====================================================================
//  Google Apps Script — 실험 데이터 수집 엔드포인트 (업데이트 버전)
//
//  기존 코드와 다른 점:
//   - 이름/전화번호/전공/영어점수 등 새 필드 처리
//   - 영상 시청 통계 (시청시간, 일시정지, 완주여부) 처리
//   - 샘플 영상 응답 처리
//
//  적용 방법:
//   1. 기존 Google Sheets → 확장 프로그램 → Apps Script
//   2. 아래 코드 전체를 복사하여 기존 코드 위에 덮어쓰기
//   3. 저장 (Ctrl+S)
//   4. 배포 → 배포 관리 → 기존 배포 선택 → 편집(연필) → 새 버전 → 배포
//   5. 시트 헤더도 아래 RECOMMENDED_HEADERS 참고하여 추가
// =====================================================================

const SHEET_NAME = 'responses';  // 응답이 저장될 시트 이름

// 권장 헤더 (참고용)
const RECOMMENDED_HEADERS = [
  'participant_id', 'group', 'start_ts', 'end_ts',
  'name', 'phone', 'major', 'english_score',
  'sample_clip_response',
  'v1_play_time', 'v1_max_time', 'v1_pause_count', 'v1_completed',
  'v2_play_time', 'v2_max_time', 'v2_pause_count', 'v2_completed',
  'ch_first', 'cond_first', 'score_first', 'q_times_first', 'q_answers_first',
  'ch_second', 'cond_second', 'score_second', 'q_times_second', 'q_answers_second',
  'SP1', 'SP3',
  'SU1a', 'SU1b', 'SU1c',
  'SU2a', 'SU2b', 'SU2c',
  'SU3',
  'FR1', 'FR2',
  'backup_code',
  'q_orders_first', 'q_orders_second'
];

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      // 시트가 없으면 자동 생성 + 헤더
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, RECOMMENDED_HEADERS.length).setValues([RECOMMENDED_HEADERS]);
    }

    const data = JSON.parse(e.postData.contents);

    const row = [
      data.participant_id || '',
      data.group || '',
      data.start_ts || '',
      data.end_ts || new Date().toISOString(),

      data.name || '',
      data.phone || '',
      data.major || '',
      data.english_score || '',
      data.sample_clip_response || '',

      data.v1_play_time || 0,
      data.v1_max_time || 0,
      data.v1_pause_count || 0,
      data.v1_completed || false,

      data.v2_play_time || 0,
      data.v2_max_time || 0,
      data.v2_pause_count || 0,
      data.v2_completed || false,

      data.ch_first || '',
      data.cond_first || '',
      data.score_first || 0,
      JSON.stringify(data.q_times_first || []),
      JSON.stringify(data.q_answers_first || []),

      data.ch_second || '',
      data.cond_second || '',
      data.score_second || 0,
      JSON.stringify(data.q_times_second || []),
      JSON.stringify(data.q_answers_second || []),

      data.SP1 || '',
      data.SP3 || '',
      data.SU1a || '', data.SU1b || '', data.SU1c || '',
      data.SU2a || '', data.SU2b || '', data.SU2c || '',
      data.SU3 || '',
      data.FR1 || '',
      data.FR2 || '',

      data.backup_code || '',
      JSON.stringify(data.q_orders_first || []),
      JSON.stringify(data.q_orders_second || [])
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput('STT experiment endpoint v2 is alive.')
    .setMimeType(ContentService.MimeType.TEXT);
}
