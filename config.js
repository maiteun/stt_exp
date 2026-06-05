// =====================================================================
//  실험 설정 파일 (이 파일만 수정하면 4개 HTML 전부에 반영됩니다)
// =====================================================================

window.EXPERIMENT_CONFIG = {

  // -------------------------------------------------------------------
  //  [1] 서버 설정 - 영상 호스팅 + 데이터 수집 엔드포인트
  // -------------------------------------------------------------------
  videoBase: "https://pub-2e4afc3be5d241ff86b5bd1a84710d81.r2.dev/",
  endpoint:  "https://script.google.com/macros/s/AKfycbzItO33QmHCicAYFg9lv0t683GZmKUUsIdGmg7PTl8vpI9Q5J-754bqVJ5P2Vkfb8uQAA/exec",


  // -------------------------------------------------------------------
  //  [2] 그룹별 영상 배정 (수정 시 카운터밸런싱 검토 필요)
  // -------------------------------------------------------------------
  groups: {
    G1: { v1_file: "28.b.mp4", v1_chapter: "28_2", v1_cond: "dynamic",
          v2_file: "31.a.mp4", v2_chapter: "31_1", v2_cond: "plain" },
    G2: { v1_file: "28.a.mp4", v1_chapter: "28_2", v1_cond: "plain",
          v2_file: "31.b.mp4", v2_chapter: "31_1", v2_cond: "dynamic" },
    G3: { v1_file: "31.b.mp4", v1_chapter: "31_1", v1_cond: "dynamic",
          v2_file: "28.a.mp4", v2_chapter: "28_2", v2_cond: "plain" },
    G4: { v1_file: "31.a.mp4", v1_chapter: "31_1", v1_cond: "plain",
          v2_file: "28.b.mp4", v2_chapter: "28_2", v2_cond: "dynamic" }
  },


  // -------------------------------------------------------------------
  //  [3] 동의서 화면 텍스트
  // -------------------------------------------------------------------
  consent: {
    title: "자막 표시 방식과 학습 이해도 연구",
    intro: "본 연구는 강의 영상의 자막 표시 방식이 학습 이해도에 미치는 영향을 알아보기 위한 실험입니다.",
    items: [
      "소요 시간: 약 18분",
      "절차: 짧은 강의 영상 2편을 시청하고 각각의 이해도 문항에 답합니다. 마지막에 자막에 대한 간단한 설문이 있습니다.",
      "환경: 조용한 곳에서 PC/노트북 + 이어폰을 사용해 주세요. 영상은 한 번만 자연스럽게 시청해 주세요.",
      "보상: 완료 시 컴포즈커피 쿠폰 지급",
      "데이터: 응답은 익명 처리되며 연구 목적으로만 사용됩니다."
    ],
    agreeLabel: "위 내용을 이해하고 연구 참여에 동의합니다.",
    nextButton: "다음"
  },


  // -------------------------------------------------------------------
  //  [4] 기본 정보 화면
  // -------------------------------------------------------------------
  basicInfo: {
    title: "기본 정보",
    hint: "이름과 전화번호는 실험 종료 후 일괄 보상 지급을 위해 수집됩니다. 데이터베이스에는 익명 ID로만 저장되며, 분석 시 개인정보는 사용되지 않습니다.",
    fields: [
      { id: "name",  label: "이름",   type: "text", required: true, placeholder: "홍길동" },
      { id: "phone", label: "전화번호", type: "tel",  required: true, placeholder: "010-0000-0000" },
      { id: "major", label: "전공 계열", type: "radio", required: true,
        options: [
          { value: "econ_biz",      label: "경영 / 경제" },
          { value: "english",       label: "영어영문" },
          { value: "humanities",    label: "인문 계열" },
          { value: "sci_eng",       label: "이공계" },
          { value: "other",         label: "기타" }
        ] },
      { id: "english_score",
        label: "가장 최근 영어 시험 점수를 입력해 주세요 (수능 / 토익 / 오픽 등)",
        type: "text", required: true, placeholder: "예: 토익 850, 수능 영어 2등급, 오픽 IM2" }
    ],
    nextButton: "다음"
  },


  // -------------------------------------------------------------------
  //  [5] 영어 청취 자가평가 (샘플 영상)
  //   - YouTube 영상 ID 넣기. URL이 youtube.com/watch?v=ABCD1234 라면 ID는 ABCD1234.
  //   - 추천: 10~30초 분량, 자막 포함된 영어 영상 (TED, 인터뷰, 영화 클립 등)
  //   - youtubeId를 null로 두면 이 섹션을 건너뜁니다.
  // -------------------------------------------------------------------
  sampleClip: {
    enabled: true,
    title: "샘플 영어 영상",
    hint: "본 실험은 영어 강의를 사용합니다. 아래 짧은 영어 영상을 시청하신 후, 본인의 청취 이해도를 평가해 주세요.",
    // R2 직접 영상 (우선순위 높음). 파일명만 입력 — videoBase에 자동 연결됨
    sampleVideoFile: "sample.mp4",   // ← R2의 파일명. 사용 안 하려면 "" 또는 삭제
    // YouTube 임베드 (sampleVideoFile이 없을 때만 사용)
    youtubeId: "",
    startSeconds: 0,
    endSeconds: 20,
    question: "이 영상의 내용이 (자막 도움을 받아) 이해되었나요?",
    options: [
      { value: "1", label: "거의 못 알아들었다" },
      { value: "2", label: "단어만 일부 들렸다" },
      { value: "3", label: "대략의 흐름은 잡혔다" },
      { value: "4", label: "핵심 메시지를 이해했다" },
      { value: "5", label: "세부 내용까지 이해했다" }
    ],
    nextButton: "다음 (1차 영상으로)"
  },


  // -------------------------------------------------------------------
  //  [6] 이해도 문항 (한 문항씩 표시 + 문항별 45초 타이머)
  // -------------------------------------------------------------------
  quizzes: {

    // -- Chapter 28_2 ---------------------------------------------------
    "28_2": {
      title: "1차 강의 이해도 문항",
      questions: [
        { q: "강의에 따르면, 자연실업률(natural rate of unemployment)에 대한 설명은 몇 가지로 분류되나요?",
          opts: ["한 가지 (one)", "두 가지 (two)", "세 가지 (three)"], correct: 1 },
        { q: "강의에서 마찰적 실업(frictional unemployment)은 대부분의 노동자에게 어떤 성격으로 묘사되나요?",
          opts: ["영구적이다 (permanent)", "장기적이다 (long-term)", "단기적이다 (short-term)"], correct: 2 },
        { q: "강의에 따르면, 구조적 실업(structural unemployment)이 발생하는 상황은?",
          opts: ["노동자가 일하기를 원하지 않을 때 (workers don't want to work)",
                 "시장 구조로 인해 노동자 수보다 일자리 수가 적을 때 (fewer jobs than workers due to market structure)",
                 "정부가 최저임금을 낮출 때 (government lowers minimum wage)"], correct: 1 },
        { q: "한 대졸자가 자신의 전공과 흥미에 맞는 일자리를 찾기 위해 3개월간 구직 활동을 했습니다. 강의에 따르면 이 사례는 어떤 실업에 가장 가깝나요?",
          opts: ["구조적 실업 (structural)", "경기적 실업 (cyclical)", "마찰적 실업 (frictional)"], correct: 2 },
        { q: "한 공장 노동자가 도시의 모든 제조업이 다른 나라로 이전하면서 일자리를 잃었습니다. 강의에 따르면 이 상황을 가장 잘 설명하는 실업 유형은?",
          opts: ["마찰적 실업 (frictional)", "구조적 실업 (structural)", "자연 실업 (natural)"], correct: 1 },
        { q: "강의에 따르면, 마찰적 실업과 구조적 실업의 차이를 가장 잘 설명한 것은?",
          opts: ["마찰적은 정부 정책의 문제, 구조적은 노동자 태도의 문제 (govt policy vs worker attitude)",
                 "마찰적은 일자리 탐색 시간의 문제, 구조적은 일자리 수의 부족 문제 (job search time vs shortage of jobs)",
                 "마찰적은 숙련 노동자만, 구조적은 비숙련 노동자만 겪는 문제 (skilled only vs unskilled only)"], correct: 1 }
      ]
    },

    // -- Chapter 31_1 ---------------------------------------------------
    "31_1": {
      title: "1차 강의 이해도 문항",
      questions: [
        { q: "강의에서 두 국가 간 거래가 더 활발하다고 묘사한 것은?",
          opts: ["서비스 (services)", "재화 (goods)", "둘 다 동일 (both equally)"], correct: 1 },
        { q: "강의에서 서비스(services)가 국가 간 거래에 어려운 이유로 든 것은?",
          opts: ["가격이 비싸기 때문 (too expensive)",
                 "형체가 없기 때문 (intangible)",
                 "품질을 보장하기 어렵기 때문 (hard to guarantee quality)"], correct: 1 },
        { q: "강의에서 일본이 한국에서 반도체(semiconductor)를 사 왔다고 설명했습니다. 강의에서는 이 거래를 누구의 입장에서 수출(export)로 설명했나요?",
          opts: ["일본의 입장 — 일본이 재화를 얻었으므로 (Japan's perspective)",
                 "한국의 입장 — 한국이 생산하여 판매했으므로 (Korea's perspective)",
                 "양국 모두의 입장 — 국제 거래이기 때문 (both perspectives)"], correct: 1 },
        { q: "강의에 따르면, 수입(import)의 정의는?",
          opts: ["국내에서 생산되어 해외에 판매되는 재화 (produced domestically, sold abroad)",
                 "해외에서 생산되어 국내에 판매되는 재화 (produced abroad, sold domestically)",
                 "해외에서 생산되어 제3국으로 판매되는 재화 (produced abroad, sold through third country)"], correct: 1 },
        { q: "강의에 따르면, 한 나라의 순수출(net export)은 어떻게 계산하나요?",
          opts: ["수출액과 수입액을 더한다 (exports plus imports)",
                 "수출액에서 수입액을 뺀다 (exports minus imports)",
                 "수입액에서 수출액을 뺀다 (imports minus exports)"], correct: 1 },
        { q: "강의에서 \"trade balance\"라는 용어는 어떤 의미로 사용되었나요?",
          opts: ["수출과 수입의 차이를 의미 (the gap between exports and imports)",
                 "수출(export)과 같은 의미로 사용 (used same as export)",
                 "무역 균형 상태를 의미 (a balanced trade state — neither surplus nor deficit)"], correct: 1 }
      ]
    }
  },


  // -------------------------------------------------------------------
  //  [7] 사후 설문
  // -------------------------------------------------------------------
  survey: {
    title: "자막에 대한 설문",
    intro: "두 영상의 자막을 비교하여 답해 주세요.",
    items: [
      { id: "SP1", type: "single",
        question: "두 영상을 비교했을 때, 어떤 자막이 더 보기 좋았나요?",
        options: [
          { value: "1", label: "첫 번째 영상의 자막이 훨씬 더 좋았다" },
          { value: "2", label: "첫 번째 영상의 자막이 조금 더 좋았다" },
          { value: "3", label: "비슷했다" },
          { value: "4", label: "두 번째 영상의 자막이 조금 더 좋았다" },
          { value: "5", label: "두 번째 영상의 자막이 훨씬 더 좋았다" }
        ] },
      { id: "SP3", type: "single",
        question: "만약 영어 강의를 다시 시청한다면, 어떤 자막을 사용하고 싶나요?",
        options: [
          { value: "plain",   label: "일반 자막 (모든 단어가 흰색)" },
          { value: "dynamic", label: "강조 자막 (중요한 단어가 색으로 강조됨)" },
          { value: "none",    label: "자막 없이 시청" }
        ] },
      { id: "SU1", type: "scale-group", label: "강조 자막 (노란색/주황색 단어가 있는 영상)에 대해 평가해 주세요.",
        rows: [
          { id: "SU1a", label: "내용을 이해하기 쉬웠다" },
          { id: "SU1b", label: "중요한 부분에 집중할 수 있었다" },
          { id: "SU1c", label: "자막의 색상 변화가 시선을 분산시켰다" }
        ] },
      { id: "SU2", type: "scale-group", label: "일반 자막 (모든 단어가 흰색인 영상)에 대해 평가해 주세요.",
        rows: [
          { id: "SU2a", label: "내용을 이해하기 쉬웠다" },
          { id: "SU2b", label: "중요한 부분에 집중할 수 있었다" },
          { id: "SU2c", label: "자막이 부족하게 느껴졌다" }
        ] },
      { id: "SU3", type: "single",
        question: "강조 자막에서 강조된 단어들이 실제로 중요한 내용을 담고 있었다고 느꼈나요?",
        options: [
          { value: "1", label: "전혀 그렇지 않다" },
          { value: "2", label: "그렇지 않다" },
          { value: "3", label: "보통이다" },
          { value: "4", label: "그렇다" },
          { value: "5", label: "매우 그렇다" }
        ] },
      { id: "FR1", type: "text-area", required: false,
        question: "강조 자막을 보면서 느낀 점을 자유롭게 적어주세요. (좋았던 점, 불편했던 점 모두 가능)" },
      { id: "FR2", type: "text-area", required: false,
        question: "강조 자막을 더 효과적으로 만들기 위한 제안이 있다면 적어주세요. (선택 사항)" }
    ],
    submitButton: "제출하기"
  },


  // -------------------------------------------------------------------
  //  [8] 동작 설정
  // -------------------------------------------------------------------
  settings: {
    softTimerSeconds: 45,
    autoAdvanceMs:    700,
    restSeconds:      20,
    requirePlayPercent: 0.95
  }
};
