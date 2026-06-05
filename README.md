# 실험 패키지 v2 — 편집 가능한 구조

## 파일 구성

```
experiment_v2/
├── config.js              ← 모든 편집 가능한 내용 (여기만 수정!)
├── experiment.js          ← 로직 (수정 X)
├── experiment.css         ← 스타일
├── experiment_G1.html     ← 1줄짜리 래퍼 (수정 X)
├── experiment_G2.html
├── experiment_G3.html
├── experiment_G4.html
├── apps_script.gs         ← Google Sheets 측 업데이트 코드
└── README.md
```

---

## 수정하는 방법

### `config.js`만 수정하면 됨

`config.js`에는 **모든 텍스트, 문항, 설정**이 모여 있습니다. VS Code나 메모장에서 열어서 직접 편집:

| 수정하고 싶은 것 | config.js 내 위치 |
|----------------|-----------------|
| 동의서 문구 | `[3] consent` 블록 |
| 보상 내용, 절차 안내 | `[3] consent.items` |
| 기본정보 필드 (이름/전화/전공/영어점수) | `[4] basicInfo.fields` |
| 영어 청취 샘플 영상 (YouTube ID) | `[5] sampleClip.youtubeId` |
| 이해도 문항 (28_2, 31_1) | `[6] quizzes` |
| 사후 설문 항목 | `[7] survey.items` |
| 영상 호스팅 URL | `[1] videoBase` |
| 타이머 시간 (현재 45초) | `[8] settings.softTimerSeconds` |
| 답 선택 후 다음 자동 이동 시간 (현재 700ms) | `[8] settings.autoAdvanceMs` |
| 휴식 시간 (현재 20초) | `[8] settings.restSeconds` |

수정 후 저장하면 4개 HTML 전부에 즉시 반영.

---

## YouTube 샘플 영상 추가하기

`config.js`의 `sampleClip.youtubeId` 부분에 YouTube 영상 ID 입력:

```javascript
sampleClip: {
  enabled: true,
  youtubeId: "ABC123def45",   // ← 여기
  startSeconds: 0,
  endSeconds: 20,
  ...
}
```

영상 ID는 YouTube URL에서 추출:
- 전체 URL: `https://www.youtube.com/watch?v=ABC123def45`
- 영상 ID: `ABC123def45` (v= 다음 11글자)

샘플 영상으로 추천:
- TED-Ed 짧은 클립 (10~30초)
- BBC Learning English 인터뷰 클립
- 영화/드라마의 자연스러운 대화 장면

비활성화하려면 `enabled: false` 또는 `youtubeId: ""` (빈 문자열).

---

## 로컬 테스트

```bash
cd experiment_v2
python3 -m http.server 8001
```

브라우저:
```
http://localhost:8001/experiment_G1.html
```

처음부터 끝까지 한 번 돌려보고 Google Sheets에 데이터가 들어오는지 확인.

---

## Apps Script 업데이트 (중요)

새 필드(이름, 전화번호, 영상 시청 통계 등)가 추가되었으므로 **기존 Apps Script 코드를 업데이트해야** Sheets에 모든 데이터가 쌓입니다.

### 절차

1. Google Sheets 열기 → **확장 프로그램** → **Apps Script**
2. 기존 코드 **전체 삭제**
3. `apps_script.gs` 파일 내용을 **전체 복사 → 붙여넣기**
4. **저장** (Ctrl+S)
5. 우측 상단 **배포** → **배포 관리** → 기존 항목의 **편집(연필)** 아이콘
6. 버전 드롭다운에서 **새 버전** 선택 → **배포** 클릭
7. URL은 그대로 유지 (config.js 수정 불필요)

### 시트 헤더 추가

`responses`라는 새 시트가 자동 생성되며 헤더도 자동으로 추가됩니다. 만약 기존 시트를 그대로 사용하고 싶다면 `apps_script.gs`의 `SHEET_NAME` 값을 기존 시트 이름으로 변경하세요.

---

## 데이터 형식

응답 한 건당 1행. 주요 컬럼:

| 컬럼 | 설명 |
|------|------|
| participant_id | 자동 생성된 익명 ID |
| name, phone | 보상 지급용 (분석에서는 사용 X) |
| major | 경영/경제, 영어영문, 이공계, 기타 |
| english_score | 자유 입력 |
| sample_clip_response | good/partial/poor |
| v1/v2_play_time | 실제 재생된 시간(초) |
| v1/v2_max_time | 시청한 가장 먼 지점(초) |
| v1/v2_pause_count | 일시정지 횟수 |
| v1/v2_completed | 영상 끝까지 봤는지 (true/false) |
| ch_first/second | 챕터 (28_2 또는 31_1) |
| cond_first/second | 자막 조건 (dynamic 또는 plain) |
| score_first/second | 6점 만점 |
| q_times_first/second | 문항별 응답시간 [초] (JSON 배열) |
| q_answers_first/second | 문항별 선택지 인덱스 (JSON 배열) |
| SP1, SP3, SU1a~c, SU2a~c, SU3 | 사후 설문 응답 |
| FR1, FR2 | 자유응답 |
| backup_code | 자동 제출 실패 대비 백업 |

---

## 배포 (GitHub Pages)

1. GitHub 계정에서 새 repo 생성 (Public)
2. 모든 파일 업로드 (`.html`, `.js`, `.css`)
3. Settings → Pages → Branch: main → Save
4. URL 4개 확보:
   ```
   https://본인.github.io/repo/experiment_G1.html
   https://본인.github.io/repo/experiment_G2.html
   https://본인.github.io/repo/experiment_G3.html
   https://본인.github.io/repo/experiment_G4.html
   ```

각 참가자에게 본인 그룹에 맞는 링크 전달.
