'use strict';

/**
 * 토끼의 하늘계단 수학모험
 * - 20문제(선생님 괴물 20마리)
 * - 각 문제 20초 제한
 * - 오답 또는 시간초과 => 토끼 마법 소멸 + 게임 종료
 * - 종료/완주 모두 통계 표시(맞힌 개수, 100점 환산)
 * - 20문제 모두 정답이면 소원권 1개
 */

const TOTAL = 20;
const TIME_LIMIT = 20;

const el = {
  hudStage: document.getElementById('hudStage'),
  hudCorrect: document.getElementById('hudCorrect'),
  hudTime: document.getElementById('hudTime'),

  startPanel: document.getElementById('startPanel'),
  btnStart: document.getElementById('btnStart'),

  bunny: document.getElementById('bunny'),

  questionModal: document.getElementById('questionModal'),
  qStageBadge: document.getElementById('qStageBadge'),
  qTimeLeft: document.getElementById('qTimeLeft'),
  questionText: document.getElementById('questionText'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),
  hintText: document.getElementById('hintText'),

  monsterName: document.getElementById('monsterName'),
  monsterSay: document.getElementById('monsterSay'),
  monsterFace: document.getElementById('monsterFace'),

  resultModal: document.getElementById('resultModal'),
  resultTitle: document.getElementById('resultTitle'),
  resCorrect: document.getElementById('resCorrect'),
  resScore: document.getElementById('resScore'),
  resReward: document.getElementById('resReward'),
  resultNote: document.getElementById('resultNote'),
  btnRestart: document.getElementById('btnRestart'),
  btnCloseResult: document.getElementById('btnCloseResult'),
};

const state = {
  stageIndex: 0,        // 0..19
  correctCount: 0,
  timerId: null,
  timeLeft: TIME_LIMIT,
  currentAnswer: null,
  running: false,
};

// -------------------- 문제 생성(난이도: 1학년 중간) --------------------
function randInt(min, maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

/**
 * 난이도 증가 규칙(총 20문제):
 * 1~6:  1자리 + 1자리 (합 10~18 정도 포함)
 * 7~13: 1자리 + 2자리(10~30) 또는 2자리(10~30)+1자리
 * 14~20: 2자리(10~60) + 2자리(10~60)
 * - 1학년 "중간" 기준으로 2자리 범위를 너무 크게(90대) 올리지 않음
 */
function makeQuestion(stageNumber1to20) {
  let a, b;

  if (stageNumber1to20 <= 6) {
    a = randInt(1, 9);
    b = randInt(1, 9);
  } else if (stageNumber1to20 <= 13) {
    const flip = Math.random() < 0.5;
    const one = randInt(1, 9);
    const two = randInt(10, 30);
    a = flip ? one : two;
    b = flip ? two : one;
  } else {
    a = randInt(10, 60);
    b = randInt(10, 60);
  }

  const answer = a + b;
  return { a, b, answer };
}

// -------------------- UI 업데이트 --------------------
function setHud() {
  el.hudStage.textContent = String(state.stageIndex);
  el.hudCorrect.textContent = String(state.correctCount);
  el.hudTime.textContent = state.running ? String(state.timeLeft) : '-';
}

function show(elm) { elm.classList.remove('hidden'); }
function hide(elm) { elm.classList.add('hidden'); }

function setMonsterLook(stageNumber1to20) {
  // 단계가 올라갈수록 괴물 색 분위기 변화(아이 눈에 재밌게)
  const hue = Math.min(140, 70 + stageNumber1to20 * 3); // 70~130대
  const face = el.monsterFace;
  face.style.background = `radial-gradient(40px 40px at 30% 30%, rgba(255,255,255,.25), transparent 60%),
                           linear-gradient(180deg, hsla(${hue}, 95%, 72%, .95), hsla(${hue}, 70%, 48%, .70))`;
}

function setBunnyProgress(stageNumber1to20) {
  // 토끼가 계단을 “올라가는 느낌” (x/y 이동)
  // 진행될수록 오른쪽+위로 이동
  const t = (stageNumber1to20 - 1) / (TOTAL - 1);
  const x = 10 + t * 62; // vw 기준 느낌을 주기 위해 %
  const y = 18 + t * 38; // 아래->위로 (퍼센트)
  el.bunny.style.left = `${x}%`;
  el.bunny.style.bottom = `${y}%`;
  el.bunny.style.transform = `translateZ(0) scale(${0.95 + t * 0.10})`;
}

// -------------------- 타이머 --------------------
function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  clearTimer();
  state.timeLeft = TIME_LIMIT;
  el.qTimeLeft.textContent = String(state.timeLeft);
  setHud();

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    el.qTimeLeft.textContent = String(state.timeLeft);
    setHud();

    if (state.timeLeft <= 0) {
      clearTimer();
      failGame('시간 초과!');
    }
  }, 1000);
}

// -------------------- 게임 흐름 --------------------
function startGame() {
  // 초기화
  state.stageIndex = 0;
  state.correctCount = 0;
  state.running = true;
  el.bunny.classList.remove('vanish');

  hide(el.resultModal);
  hide(el.startPanel);

  // HUD는 stageIndex가 "0부터" 보이면 헷갈리니, 표시용은 +1로 갱신할 때 처리
  nextStage();
}

function nextStage() {
  const stageNumber = state.stageIndex + 1; // 1..20

  // HUD 표시(단계는 1..20)
  el.hudStage.textContent = String(stageNumber);
  el.hudCorrect.textContent = String(state.correctCount);

  // 토끼 위치 업데이트
  setBunnyProgress(stageNumber);

  // 문제 생성
  const q = makeQuestion(stageNumber);
  state.currentAnswer = q.answer;

  // 괴물 텍스트
  el.monsterName.textContent = `선생님 괴물 ${stageNumber}호`;
  el.monsterSay.textContent = stageNumber <= 6
    ? '아주 쉬운 연습문제야! 😊'
    : stageNumber <= 13
      ? '조금만 더 집중해볼까? ✨'
      : '이제 진짜 실력이 필요해! 💪';

  // 괴물 외형 변화
  setMonsterLook(stageNumber);

  // 문제 표시
  el.qStageBadge.textContent = `${stageNumber}/20`;
  el.questionText.textContent = `${q.a} + ${q.b} = ?`;
  el.hintText.textContent = stageNumber <= 6
    ? '힌트: 손가락으로 세어도 좋아요 🙂'
    : stageNumber <= 13
      ? '힌트: 10을 먼저 만들면 쉬워요!'
      : '힌트: 십의 자리부터 차근차근!';

  // 입력 초기화
  el.answerInput.value = '';
  el.answerInput.focus({ preventScroll: true });

  show(el.questionModal);
  startTimer();
}

function succeedAnswer() {
  clearTimer();
  hide(el.questionModal);

  state.correctCount += 1;

  // 20문제 다 끝?
  if (state.stageIndex >= TOTAL - 1) {
    endGame(true);
    return;
  }

  // 다음 단계
  state.stageIndex += 1;
  // 약간의 연출 텀
  setTimeout(() => {
    nextStage();
  }, 380);
}

function failGame(reason) {
  clearTimer();
  hide(el.questionModal);

  // 토끼 소멸 연출
  el.bunny.classList.add('vanish');

  endGame(false, reason);
}

function endGame(completedAll, reason = '') {
  state.running = false;
  setHud();

  const score = Math.round((state.correctCount / TOTAL) * 100);

  el.resCorrect.textContent = String(state.correctCount);
  el.resScore.textContent = String(score);

  const gotWish = completedAll && state.correctCount === TOTAL;
  el.resReward.textContent = gotWish ? '소원권 1개 🎟️' : '없음';

  if (gotWish) {
    el.resultTitle.textContent = '🎉 완주 성공!';
    el.resultNote.textContent =
      '20마리 선생님 괴물을 모두 이겼어요! 소원권 1개를 받았습니다. (가족 규칙으로 소원 사용하기 😊)';
  } else {
    el.resultTitle.textContent = '게임 종료';
    const why = reason ? `종료 사유: ${reason}` : '';
    el.resultNote.textContent =
      `${why}\n그래도 괜찮아요! 다시 도전하면 더 잘할 수 있어요 🙂`;
  }

  show(el.resultModal);
}

function restartGame() {
  // 완전 초기화
  clearTimer();
  state.running = false;
  state.stageIndex = 0;
  state.correctCount = 0;
  state.currentAnswer = null;

  el.hudStage.textContent = '0';
  el.hudCorrect.textContent = '0';
  el.hudTime.textContent = '-';

  el.bunny.classList.remove('vanish');
  el.bunny.style.left = '18%';
  el.bunny.style.bottom = '18%';
  el.bunny.style.transform = 'translateZ(0)';

  hide(el.questionModal);
  hide(el.resultModal);
  show(el.startPanel);
}

// -------------------- 이벤트 --------------------
el.btnStart.addEventListener('click', () => startGame());

el.answerForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.running) return;

  const val = el.answerInput.value.trim();
  if (val === '') return;

  const num = Number(val);
  if (!Number.isFinite(num)) return;

  if (num === state.currentAnswer) {
    succeedAnswer();
  } else {
    failGame('오답!');
  }
});

el.btnRestart.addEventListener('click', () => restartGame());
el.btnCloseResult.addEventListener('click', () => {
  // 결과창 닫으면 시작 화면으로
  restartGame();
});

// 모바일에서 엔터키/제출 편의: 입력 후 바로 제출 가능
el.answerInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // form submit이 처리
  }
});

// 최초 HUD
setHud();
