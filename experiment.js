// =====================================================================
//  EXPERIMENT.JS  —  메인 로직 (수정 X. 수정은 config.js에서)
// =====================================================================

(() => {

const CFG = window.EXPERIMENT_CONFIG;
const GRP = CFG.groups[window.GROUP];
if (!GRP) {
  document.body.innerHTML = '<p style="padding:40px">Invalid group: ' + window.GROUP + '</p>';
  return;
}

// =====================================================================
//  상태
// =====================================================================
const state = {
  participantId: 'P_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
  startTs: new Date().toISOString(),
  group: window.GROUP,
  consent: false,
  basicInfo: {},
  sampleClipResponse: null,
  video1: makeVideoStats(),
  video2: makeVideoStats(),
  quiz1: { answers: [], times: [], score: 0 },
  quiz2: { answers: [], times: [], score: 0 },
  survey: {},
  currentQuizIdx: 0
};

function makeVideoStats() {
  return {
    totalPlayTime: 0,
    maxTime: 0,
    pauseCount: 0,
    completed: false,
    lastPlayStart: null
  };
}

// =====================================================================
//  섹션 순서
// =====================================================================
const SECTIONS = [
  'consent', 'basicInfo',
  ...(CFG.sampleClip.enabled ? ['sampleClip'] : []),
  'video1', 'quiz1', 'rest', 'video2', 'quiz2', 'survey', 'done'
];

let currentSectionIdx = 0;

// =====================================================================
//  헬퍼
// =====================================================================
function $(sel)  { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') node.className = attrs[k];
    else if (k === 'html') node.innerHTML = attrs[k];
    else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else node.setAttribute(k, attrs[k]);
  }
  children.flat().forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

function showSection(name) {
  const idx = SECTIONS.indexOf(name);
  if (idx < 0) return;
  $$('.section').forEach(s => s.classList.remove('active'));
  const target = document.querySelector('[data-section="' + name + '"]');
  if (target) target.classList.add('active');
  currentSectionIdx = idx;
  updateProgress();
  pauseAllVideos();
  window.scrollTo(0, 0);
}

function pauseAllVideos() {
  $$('video').forEach(v => { try { v.pause(); } catch (e) {} });
}

function updateProgress() {
  const pct = (currentSectionIdx / (SECTIONS.length - 1)) * 100;
  $('#progFill').style.width = pct + '%';
  const labels = {
    consent: '동의', basicInfo: '기본 정보', sampleClip: '샘플 영상',
    video1: '1차 영상', quiz1: '1차 문항', rest: '휴식',
    video2: '2차 영상', quiz2: '2차 문항', survey: '설문', done: '완료'
  };
  $('#progLabel').textContent = labels[SECTIONS[currentSectionIdx]]
    + ' (' + (currentSectionIdx + 1) + '/' + SECTIONS.length + ')';
}

function setupOptionHighlight(scope) {
  scope.querySelectorAll('input[type="radio"]').forEach(input => {
    input.addEventListener('change', () => {
      const name = input.name;
      scope.querySelectorAll('input[name="' + name + '"]').forEach(i => {
        const lbl = i.closest('.option');
        if (lbl) lbl.classList.toggle('selected', i.checked);
      });
    });
  });
}

function getRadio(name, scope = document) {
  const el = scope.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : null;
}

// =====================================================================
//  섹션 빌더
// =====================================================================

function buildConsent() {
  const c = CFG.consent;
  return el('div', { class: 'section', 'data-section': 'consent' },
    el('h1', {}, c.title),
    el('p', { class: 'lead' }, c.intro),
    el('ul', {}, c.items.map(t => el('li', {}, t))),
    el('div', { class: 'field', style: 'margin-top:20px' },
      el('label', { class: 'option', id: 'consentBox' },
        el('input', { type: 'checkbox', id: 'consentCheck' }),
        el('span', { class: 'option-label' }, c.agreeLabel)
      )
    ),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'consentNext', disabled: '' }, c.nextButton)
    )
  );
}

function buildBasicInfo() {
  const b = CFG.basicInfo;
  const fields = b.fields.map(f => {
    if (f.type === 'text' || f.type === 'tel') {
      return el('div', { class: 'field' },
        el('label', { class: 'field-label' }, f.label),
        el('input', { type: f.type, id: 'bi_' + f.id, placeholder: f.placeholder || '' })
      );
    }
    if (f.type === 'radio') {
      return el('div', { class: 'field' },
        el('label', { class: 'field-label' }, f.label),
        el('div', { class: 'options', 'data-fid': f.id },
          f.options.map(o =>
            el('label', { class: 'option' },
              el('input', { type: 'radio', name: 'bi_' + f.id, value: o.value }),
              el('span', { class: 'option-label' }, o.label)
            )
          )
        )
      );
    }
  });

  return el('div', { class: 'section', 'data-section': 'basicInfo' },
    el('h2', {}, b.title),
    el('p', { class: 'lead' }, b.hint),
    fields,
    el('div', { class: 'alert', id: 'biAlert', style: 'display:none' }, '필수 항목을 모두 입력해 주세요.'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'biNext' }, b.nextButton)
    )
  );
}

function buildSampleClip() {
  const s = CFG.sampleClip;
  
  // R2 직접 영상 (sampleVideoFile) 우선, 없으면 YouTube
  let videoEl;
  if (s.sampleVideoFile) {
    videoEl = el('div', { class: 'video-wrap' },
      el('video', {
        src: CFG.videoBase + s.sampleVideoFile,
        controls: '', playsinline: '', preload: 'auto'
      })
    );
  } else if (s.youtubeId) {
    const ytSrc = 'https://www.youtube.com/embed/' + s.youtubeId
        + '?start=' + (s.startSeconds || 0)
        + '&end=' + (s.endSeconds || 30)
        + '&rel=0&modestbranding=1';
    videoEl = el('div', { class: 'iframe-wrap' },
      el('iframe', {
        src: ytSrc,
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: ''
      })
    );
  } else {
    videoEl = el('div', { class: 'alert' },
      '⚠ 샘플 영상이 설정되지 않았습니다. config.js에 sampleVideoFile 또는 youtubeId를 설정하세요.');
  }

  return el('div', { class: 'section', 'data-section': 'sampleClip' },
    el('h2', {}, s.title),
    el('p', { class: 'lead' }, s.hint),
    videoEl,
    el('div', { class: 'field' },
      el('label', { class: 'field-label' }, s.question),
      el('div', { class: 'options' },
        s.options.map(o =>
          el('label', { class: 'option' },
            el('input', { type: 'radio', name: 'sample_resp', value: o.value }),
            el('span', { class: 'option-label' }, o.label)
          )
        )
      )
    ),
    el('div', { class: 'alert', id: 'sampleAlert', style: 'display:none' },
      '평가를 선택해 주세요.'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'sampleNext' }, s.nextButton)
    )
  );
}

function buildVideoSection(num) {
  const isFirst = num === 1;
  return el('div', { class: 'section', 'data-section': 'video' + num },
    el('h2', {}, (isFirst ? '1차' : '2차') + ' 강의 영상'),
    el('p', { class: 'lead' },
      '영상을 한 번만 시청해 주세요. 영상 재생이 ' +
      Math.round(CFG.settings.requirePlayPercent * 100) +
      '% 이상 진행되어야 다음 버튼이 활성화됩니다.'),
    el('div', { class: 'video-wrap' },
      el('video', { id: 'video' + num, controls: '', playsinline: '', preload: 'auto' })
    ),
    el('div', { class: 'video-status', id: 'video' + num + 'Status' },
      '영상이 끝날 때까지 시청해 주세요.'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'video' + num + 'Next', disabled: '' },
        '다음 (이해도 문항으로)')
    )
  );
}

function buildQuizSection(num) {
  return el('div', { class: 'section', 'data-section': 'quiz' + num },
    el('h2', {}, (num === 1 ? '1차' : '2차') + ' 영상 이해도 문항'),
    el('p', { class: 'lead' },
      '문항당 권장 시간은 ' + CFG.settings.softTimerSeconds + '초입니다. ' +
      '답을 선택하면 자동으로 다음 문항으로 넘어갑니다. 영상을 다시 보거나 검색하지 말아 주세요.'),
    el('div', { class: 'quiz-counter', id: 'quiz' + num + 'Counter' }),
    el('div', { id: 'quiz' + num + 'Body' })
  );
}

function buildRest() {
  return el('div', { class: 'section', 'data-section': 'rest' },
    el('h2', {}, '휴식 시간'),
    el('div', { class: 'rest-countdown', id: 'restCountdown' }, CFG.settings.restSeconds + ''),
    el('div', { class: 'rest-label' },
      '잠시 쉬어주세요. 자동으로 다음으로 넘어갑니다.'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'restSkip' }, '건너뛰기 (바로 2차 영상으로)')
    )
  );
}

function buildSurvey() {
  const s = CFG.survey;

  const items = s.items.map(item => {
    if (item.type === 'single') {
      return el('div', { class: 'field' },
        el('label', { class: 'field-label' }, item.question),
        el('div', { class: 'options' },
          item.options.map(o =>
            el('label', { class: 'option' },
              el('input', { type: 'radio', name: 'sv_' + item.id, value: o.value }),
              el('span', { class: 'option-label' }, o.label)
            )
          )
        )
      );
    }
    if (item.type === 'scale-group') {
      const headers = ['', '매우<br>그렇지 않다', '그렇지 않다', '보통', '그렇다', '매우<br>그렇다'];
      return el('div', { class: 'field scale-group' },
        el('div', { class: 'scale-label' }, item.label),
        el('div', { class: 'scale-header' },
          headers.map(h => el('div', { html: h }))),
        ...item.rows.map(row =>
          el('div', { class: 'scale-row' },
            el('div', { class: 'row-label' }, row.label),
            ...[1, 2, 3, 4, 5].map(v =>
              el('div', { class: 'scale-cell' },
                el('input', { type: 'radio', name: 'sv_' + row.id, value: String(v) })
              )
            )
          )
        )
      );
    }
    if (item.type === 'text-area') {
      return el('div', { class: 'field' },
        el('label', { class: 'field-label' }, item.question),
        el('textarea', { id: 'sv_' + item.id })
      );
    }
  });

  return el('div', { class: 'section', 'data-section': 'survey' },
    el('h2', {}, s.title),
    el('p', { class: 'lead' }, s.intro),
    items,
    el('div', { class: 'alert', id: 'surveyAlert', style: 'display:none' },
      '필수 항목(자유 응답 제외)을 모두 입력해 주세요.'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', id: 'surveySubmit' }, s.submitButton)
    )
  );
}

function buildDone() {
  return el('div', { class: 'section', 'data-section': 'done' },
    el('h2', {}, '참여 감사합니다!'),
    el('div', { class: 'success', id: 'submitMsg' }, '데이터를 제출하고 있습니다...'),
    el('p', { class: 'lead' }, '컴포즈커피 쿠폰은 모집 시 안내한 방법으로 발송됩니다.'),
    el('div', { id: 'backupArea', style: 'display:none' },
      el('h3', {}, '백업 코드 (자동 제출 실패 시)'),
      el('p', { class: 'lead' },
        '아래 코드를 복사해서 연구자에게 보내주시면 데이터가 안전하게 보관됩니다.'),
      el('div', { class: 'backup-box', id: 'backupCode' })
    )
  );
}

// =====================================================================
//  렌더링
// =====================================================================
function render() {
  const app = $('#app');
  app.innerHTML = '';
  app.appendChild(el('div', { class: 'progress' },
    el('div', { class: 'progress-bar' },
      el('div', { class: 'progress-fill', id: 'progFill' })),
    el('div', { class: 'progress-label', id: 'progLabel' })
  ));

  app.appendChild(buildConsent());
  app.appendChild(buildBasicInfo());
  if (CFG.sampleClip.enabled) app.appendChild(buildSampleClip());
  app.appendChild(buildVideoSection(1));
  app.appendChild(buildQuizSection(1));
  app.appendChild(buildRest());
  app.appendChild(buildVideoSection(2));
  app.appendChild(buildQuizSection(2));
  app.appendChild(buildSurvey());
  app.appendChild(buildDone());

  attachHandlers();
  showSection('consent');
}

// =====================================================================
//  핸들러
// =====================================================================
function attachHandlers() {

  // -- Consent --------------------------------------------------------
  $('#consentCheck').addEventListener('change', e => {
    $('#consentNext').disabled = !e.target.checked;
    $('#consentBox').classList.toggle('selected', e.target.checked);
  });
  $('#consentNext').addEventListener('click', () => {
    state.consent = true;
    showSection('basicInfo');
  });

  // -- Basic Info -----------------------------------------------------
  setupOptionHighlight(document.querySelector('[data-section="basicInfo"]'));
  $('#biNext').addEventListener('click', () => {
    const data = {};
    let valid = true;
    for (const f of CFG.basicInfo.fields) {
      let v;
      if (f.type === 'radio') v = getRadio('bi_' + f.id);
      else v = document.getElementById('bi_' + f.id).value.trim();
      if (f.required && !v) valid = false;
      data[f.id] = v;
    }
    if (!valid) { $('#biAlert').style.display = 'block'; return; }
    $('#biAlert').style.display = 'none';
    state.basicInfo = data;
    showSection(CFG.sampleClip.enabled ? 'sampleClip' : 'video1');
    if (!CFG.sampleClip.enabled) loadVideo(1);
  });

  // -- Sample Clip ----------------------------------------------------
  if (CFG.sampleClip.enabled) {
    setupOptionHighlight(document.querySelector('[data-section="sampleClip"]'));
    $('#sampleNext').addEventListener('click', () => {
      const v = getRadio('sample_resp');
      if (!v) { $('#sampleAlert').style.display = 'block'; return; }
      $('#sampleAlert').style.display = 'none';
      state.sampleClipResponse = v;
      showSection('video1');
      loadVideo(1);
    });
  }

  // -- Videos ---------------------------------------------------------
  // Video event handlers attached in loadVideo()

  // -- Survey ---------------------------------------------------------
  setupOptionHighlight(document.querySelector('[data-section="survey"]'));
  $('#surveySubmit').addEventListener('click', handleSurveySubmit);
}

// =====================================================================
//  비디오 로딩 + 통계
// =====================================================================
function loadVideo(num) {
  const file  = num === 1 ? GRP.v1_file : GRP.v2_file;
  const stats = num === 1 ? state.video1 : state.video2;
  const video = document.getElementById('video' + num);
  const nextBtn = document.getElementById('video' + num + 'Next');
  const statusEl = document.getElementById('video' + num + 'Status');

  video.src = CFG.videoBase + file;

  video.addEventListener('play', () => {
    stats.lastPlayStart = Date.now();
  });
  video.addEventListener('pause', () => {
    if (stats.lastPlayStart) {
      stats.totalPlayTime += (Date.now() - stats.lastPlayStart) / 1000;
      stats.lastPlayStart = null;
    }
    if (!video.ended) stats.pauseCount++;
  });
  video.addEventListener('timeupdate', () => {
    stats.maxTime = Math.max(stats.maxTime, video.currentTime);
    if (video.duration && stats.maxTime / video.duration >= CFG.settings.requirePlayPercent) {
      if (nextBtn.disabled) {
        nextBtn.disabled = false;
        statusEl.textContent = '시청 완료. 다음 버튼을 눌러주세요.';
        statusEl.classList.add('done');
      }
    }
  });
  video.addEventListener('ended', () => {
    stats.completed = true;
    if (stats.lastPlayStart) {
      stats.totalPlayTime += (Date.now() - stats.lastPlayStart) / 1000;
      stats.lastPlayStart = null;
    }
    nextBtn.disabled = false;
    statusEl.textContent = '시청 완료. 다음 버튼을 눌러주세요.';
    statusEl.classList.add('done');
  });

  nextBtn.addEventListener('click', () => {
    video.pause();
    const chapter = num === 1 ? GRP.v1_chapter : GRP.v2_chapter;
    state.currentQuizIdx = 0;
    showSection('quiz' + num);
    startQuiz(num, chapter);
  });
}

// =====================================================================
//  퀴즈 (한 문항씩)
// =====================================================================
let timerInterval = null;
let questionStartTime = null;

function startQuiz(num, chapterKey) {
  const quiz = CFG.quizzes[chapterKey];
  const target = (num === 1 ? state.quiz1 : state.quiz2);
  target.answers = [];
  target.times = [];
  state.currentQuizIdx = 0;
  showNextQuestion(num, chapterKey);
}

function showNextQuestion(num, chapterKey) {
  const quiz = CFG.quizzes[chapterKey];
  const idx = state.currentQuizIdx;

  if (idx >= quiz.questions.length) {
    finishQuiz(num, chapterKey);
    return;
  }

  const q = quiz.questions[idx];
  const counter = $('#quiz' + num + 'Counter');
  const body = $('#quiz' + num + 'Body');
  const isLast = (idx === quiz.questions.length - 1);

  counter.textContent = 'Q' + (idx + 1) + ' / ' + quiz.questions.length;

  body.innerHTML = '';
  body.appendChild(el('div', { class: 'quiz-question' }, q.q));
  body.appendChild(
    el('div', { class: 'timer-bar' },
      el('div', { class: 'timer-fill', id: 'timerFill' })
    )
  );
  body.appendChild(
    el('div', { class: 'timer-label' },
      el('span', {}, '권장 시간 ' + CFG.settings.softTimerSeconds + '초 (지나도 응답 가능)'),
      el('span', { id: 'timerLeft' }, CFG.settings.softTimerSeconds + '초')
    )
  );

  const opts = el('div', { class: 'options' });
  q.opts.forEach((optText, j) => {
    const label = el('label', { class: 'option' },
      el('input', { type: 'radio', name: 'curq', value: String(j) }),
      el('span', { class: 'option-label' }, optText)
    );
    opts.appendChild(label);
  });
  body.appendChild(opts);

  // 다음 버튼 (답 선택 전엔 비활성)
  const nextBtnLabel = isLast ? '완료' : '다음 문항';
  const nextBtn = el('button', { class: 'btn quiz-next-btn', disabled: '' }, nextBtnLabel);
  const nextBtnRow = el('div', { class: 'btn-row' }, nextBtn);
  body.appendChild(nextBtnRow);

  setupOptionHighlight(body);

  // 답 선택 시: 응답시간 기록 + 다음 버튼 활성화
  body.querySelectorAll('input[name="curq"]').forEach(input => {
    input.addEventListener('change', () => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const target = (num === 1 ? state.quiz1 : state.quiz2);
      target.answers[idx] = parseInt(input.value);
      target.times[idx] = +elapsed.toFixed(2);
      nextBtn.disabled = false;
    });
  });

  // 다음 버튼 클릭 시: 타이머 정지 + 다음 문항
  nextBtn.addEventListener('click', () => {
    stopTimer();
    state.currentQuizIdx++;
    showNextQuestion(num, chapterKey);
  });

  startTimer();
}

function startTimer() {
  questionStartTime = Date.now();
  const fill = $('#timerFill');
  const label = $('#timerLeft');
  const DURATION = CFG.settings.softTimerSeconds;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - questionStartTime) / 1000;
    const remaining = Math.max(0, DURATION - elapsed);
    const pct = Math.min(100, (elapsed / DURATION) * 100);
    if (fill) fill.style.width = pct + '%';
    if (label) {
      if (remaining > 0) label.textContent = remaining.toFixed(0) + '초';
      else {
        label.textContent = '초과 (응답 가능)';
        if (fill) fill.classList.add('over');
      }
    }
  }, 200);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function finishQuiz(num, chapterKey) {
  const quiz = CFG.quizzes[chapterKey];
  const target = (num === 1 ? state.quiz1 : state.quiz2);

  target.score = target.answers.reduce(
    (acc, ans, i) => acc + (ans === quiz.questions[i].correct ? 1 : 0), 0);

  stopTimer();

  if (num === 1) startRest();
  else showSection('survey');
}

// =====================================================================
//  휴식
// =====================================================================
function startRest() {
  showSection('rest');
  let n = CFG.settings.restSeconds;
  $('#restCountdown').textContent = n;
  
  const proceed = () => {
    clearInterval(t);
    showSection('video2');
    loadVideo(2);
  };
  
  const t = setInterval(() => {
    n--;
    $('#restCountdown').textContent = n;
    if (n <= 0) proceed();
  }, 1000);
  
  // 건너뛰기 버튼
  const skipBtn = $('#restSkip');
  if (skipBtn) {
    skipBtn.onclick = proceed;
  }
}

// =====================================================================
//  설문 제출
// =====================================================================
function handleSurveySubmit() {
  const data = {};
  let valid = true;

  for (const item of CFG.survey.items) {
    if (item.type === 'single') {
      const v = getRadio('sv_' + item.id);
      if (!v) { valid = false; }
      data[item.id] = v;
    } else if (item.type === 'scale-group') {
      for (const row of item.rows) {
        const v = getRadio('sv_' + row.id);
        if (!v) { valid = false; }
        data[row.id] = v;
      }
    } else if (item.type === 'text-area') {
      data[item.id] = document.getElementById('sv_' + item.id).value || '';
    }
  }

  if (!valid) {
    $('#surveyAlert').style.display = 'block';
    return;
  }
  $('#surveyAlert').style.display = 'none';

  state.survey = data;
  showSection('done');
  submitData();
}

// =====================================================================
//  데이터 전송
// =====================================================================
function submitData() {
  const payload = {
    participant_id: state.participantId,
    group: state.group,
    start_ts: state.startTs,
    end_ts: new Date().toISOString(),

    // 기본 정보
    name:           state.basicInfo.name || '',
    phone:          state.basicInfo.phone || '',
    major:          state.basicInfo.major || '',
    english_score:  state.basicInfo.english_score || '',
    sample_clip_response: state.sampleClipResponse || '',

    // 영상 시청 통계
    v1_play_time:   +state.video1.totalPlayTime.toFixed(1),
    v1_max_time:    +state.video1.maxTime.toFixed(1),
    v1_pause_count: state.video1.pauseCount,
    v1_completed:   state.video1.completed,

    v2_play_time:   +state.video2.totalPlayTime.toFixed(1),
    v2_max_time:    +state.video2.maxTime.toFixed(1),
    v2_pause_count: state.video2.pauseCount,
    v2_completed:   state.video2.completed,

    // 1차 영상
    ch_first:   GRP.v1_chapter,
    cond_first: GRP.v1_cond,
    score_first:     state.quiz1.score,
    q_times_first:   state.quiz1.times,
    q_answers_first: state.quiz1.answers,

    // 2차 영상
    ch_second:   GRP.v2_chapter,
    cond_second: GRP.v2_cond,
    score_second:     state.quiz2.score,
    q_times_second:   state.quiz2.times,
    q_answers_second: state.quiz2.answers,

    // 설문
    ...state.survey
  };

  payload.backup_code = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

  fetch(CFG.endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  })
  .then(r => r.json())
  .then(res => {
    if (res.ok) {
      $('#submitMsg').textContent = '✅ 데이터가 정상 제출되었습니다. 참여해 주셔서 감사합니다!';
    } else {
      throw new Error('Server error: ' + (res.error || 'unknown'));
    }
  })
  .catch(err => {
    $('#submitMsg').textContent = '⚠ 자동 제출에 실패했습니다. 아래 백업 코드를 복사하여 연구자에게 보내주세요.';
    $('#submitMsg').className = 'alert';
    $('#backupArea').style.display = 'block';
    $('#backupCode').textContent = payload.backup_code;
    console.error('Submit error:', err);
  });
}

// =====================================================================
//  시작
// =====================================================================
document.addEventListener('DOMContentLoaded', render);

})();
