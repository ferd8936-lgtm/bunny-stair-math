'use strict';

/**
 * 정아인의 하늘계단 수학모험
 * 요구사항 1~6 반영:
 * - 20문제(괴물 20마리), 난이도 점진 상승
 * - 각 문제 20초 카운트다운, 10/5초에 무음 "띵!" 시각 효과
 * - 오답/시간초과: "앗!" + 토끼 소멸 + 종료
 * - 정답: 폴짝 점프 + 반짝(스파클) + 다음 단계
 * - 만남 연출: 3초 땀 흘리며 힘들어함 -> 괴물 친절 설명 -> 문제 시작
 * - 중간 응원 동물(정아인 맞춤 멘트), 빈도 적정(랜덤)
 * - 종료/완주 모두 통계, 완주 시 별 떨어짐 + 소원권 1개
 */

const TOTAL = 20;
const TIME_LIMIT = 20;
const CHILD_NAME = '정아인';

const el = {
  bunny: document.getElementById('bunny'),
  overlay: document.getElementById('overlayLayer'),

  startPanel: document.getElementById('startPanel'),
  btnStart: document.getElementById('btnStart'),

  hudStage: document.getElementById('hudStage'),
  hudCorrect: document.getElementById('hudCorrect'),
  hudTime: document.getElementById('hudTime'),
  hudTimePill: document.getElementById('hudTimePill'),

  monsterBadge: document.getElementById('monsterBadge'),
  monsterFace: document.getElementById('monsterFace'),
  monsterName: document.getElementById('monsterName'),
  monsterSay: document.getElementById('monsterSay'),

  timeLeft: document.getElementById('timeLeft'),
  stageChip: document.getElementById('stageChip'),
  dingChip: document.getElementById('dingChip'),
  questionText: document.getElementById('questionText'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),
  helperText: document.getElementById('helperText'),

  finalBadge: document.getElementById('finalBadge'),
  statCorrect: document.getElementById('statCorrect'),
  statScore: document.getElementById('statScore'),
  statReward: document.getElementById('statReward'),
  btnRestart: document.getElementById('btnRestart'),
};

const state = {
  stageIndex: 0,       // 0..19
  correctCount: 0,
  timeLeft: TIME_LIMIT,
  timerId: null,

  // current question
  a: 0,
  b: 0,
  answer: 0,

  running: false,
  inQuestion: false,
};

function randInt(min, maxInclusive){
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

/**
 * 난이도 (초1 "중간" 기준)
 * 1~6:  1자리 + 1자리
 * 7~13: 1자리 + 2자리(10~30) 또는 2자리 + 1자리
 * 14~20: 2자리(10~60) + 2자리(10~60)
 */
function makeQuestion(stage1to20){
  let a, b;
  if(stage1to20 <= 6){
    a = randInt(1,9);
    b = randInt(1,9);
  } else if(stage1to20 <= 13){
    const flip = Math.random() < 0.5;
    const one = randInt(1,9);
    const two = randInt(10,30);
    a = flip ? one : two;
    b = flip ? two : one;
  } else {
    a = randInt(10,60);
    b = randInt(10,60);
  }
  return { a, b, answer: a + b };
}

function setMonsterLook(stage1to20){
  // 단계가 올라갈수록 색상 변화(친근하게)
  const hue = clamp(80 + stage1to20 * 2.8, 80, 140);
  el.monsterFace.style.background =
    `radial-gradient(40px 40px at 30% 30%, rgba(255,255,255,.25), transparent 60%),
     linear-gradient(180deg, hsla(${hue}, 95%, 72%, .95), hsla(${hue}, 70%, 48%, .70))`;
}

function updateHud(){
  el.hudStage.textContent = String(state.running ? (state.stageIndex + 1) : 0);
  el.hudCorrect.textContent = String(state.correctCount);
  el.hudTime.textContent = state.inQuestion ? String(state.timeLeft) : '-';

  // stats panel
  el.statCorrect.textContent = String(state.correctCount);
  el.statScore.textContent = String(Math.round((state.correctCount / TOTAL) * 100));

  // time pill urgent highlight
  if(state.inQuestion && state.timeLeft <= 5){
    el.hudTimePill.classList.add('urgent');
  } else {
    el.hudTimePill.classList.remove('urgent');
  }
}

function toast(text, kind=''){
  const t = document.createElement('div');
  t.className = `toast ${kind}`.trim();
  t.textContent = text;
  el.overlay.appendChild(t);
  setTimeout(()=> t.remove(), 1500);
}

function spawnSparkles(x, y){
  for(let i=0;i<10;i++){
    const s = document.createElement('div');
    s.className = 'sparkle';
    const dx = randInt(-40, 40);
    const dy = randInt(-45, 10);
    s.style.left = `${x}px`;
    s.style.top  = `${y}px`;
    s.style.setProperty('--dx', `${dx}px`);
    s.style.setProperty('--dy', `${dy}px`);
    el.overlay.appendChild(s);
    setTimeout(()=> s.remove(), 700);
  }
}

function bunnyJumpSparkle(){
  // jump
  el.bunny.classList.add('jump');
  const rect = el.bunny.getBoundingClientRect();
  const sceneRect = el.overlay.getBoundingClientRect();
  const cx = rect.left - sceneRect.left + rect.width/2;
  const cy = rect.top  - sceneRect.top  + rect.height/3;
  spawnSparkles(cx, cy);

  setTimeout(()=> el.bunny.classList.remove('jump'), 260);
}

function setBunnyProgress(stage1to20){
  // 진행에 따라 좌->우, 하->상 이동 (계단 오르는 느낌)
  const t = (stage1to20 - 1) / (TOTAL - 1);
  const x = 10 + t * 56;     // %
  const y = 16 + t * 52;     // %
  el.bunny.style.left = `${x}%`;
  el.bunny.style.bottom = `${y}%`;
}

function showCheerMaybe(stage1to20){
  // 등장 빈도 적정: 40% 확률, 연속 등장 방지 느낌
  if(Math.random() > 0.40) return;

  const animals = ['🐿️','🦊','🐦','🦌','🦝'];
  const msgs = [
    `${CHILD_NAME}아 화이팅!`,
    `${CHILD_NAME} 최고야!`,
    `잘하고 있어, ${CHILD_NAME}!`,
    `조금만 더 가자, ${CHILD_NAME}!`,
    `멋지다! 계속 올라가자!`
  ];

  const a = document.createElement('div');
  a.className = 'cheer-animal';
  a.textContent = animals[randInt(0, animals.length-1)];

  const b = document.createElement('div');
  b.className = 'cheer-bubble';
  b.textContent = msgs[randInt(0, msgs.length-1)];

  el.overlay.appendChild(a);
  el.overlay.appendChild(b);

  setTimeout(()=>{ a.remove(); b.remove(); }, 2200);
}

function clearTimer(){
  if(state.timerId){
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function setDingChip(text, urgent=false){
  el.dingChip.textContent = text;
  el.dingChip.classList.toggle('chip-urgent', urgent);
}

function startCountdown(){
  clearTimer();
  state.timeLeft = TIME_LIMIT;
  state.inQuestion = true;

  el.timeLeft.textContent = String(state.timeLeft);
  setDingChip('집중!', false);

  updateHud();

  state.timerId = setInterval(()=>{
    state.timeLeft -= 1;
    el.timeLeft.textContent = String(state.timeLeft);

    // 10초, 5초에 무음 "띵!" 효과(시각)
    if(state.timeLeft === 10){
      toast('띵! 10초 남았어요!', '');
      setDingChip('띵! 10초', false);
    }
    if(state.timeLeft === 5){
      toast('띵! 5초 남았어요!', '');
      setDingChip('띵! 5초', true);
    }

    updateHud();

    if(state.timeLeft <= 0){
      clearTimer();
      fail('시간 초과');
    }
  }, 1000);
}

function setPanelsForStage(stage1to20){
  el.stageChip.textContent = `${stage1to20}/20`;
  el.monsterBadge.textContent = `등장! (${stage1to20}호)`;
  el.finalBadge.textContent = '진행 중';
  setMonsterLook(stage1to20);
}

function monsterFriendlyIntro(stage1to20){
  el.monsterName.textContent = `선생님 괴물 ${stage1to20}호`;
  el.monsterSay.textContent =
    `안녕 ${CHILD_NAME}!\n내가 더하기 문제를 낼게.\n맞히면 토끼가 더 올라갈 수 있어!\n틀리거나 시간이 지나면… 토끼가 사라질 수도 있어.\n하지만 괜찮아! 천천히 해보자 😊`;

  // helper text
  el.helperText.textContent =
    stage1to20 <= 6 ? '힌트: 손가락으로 세어도 좋아요 🙂'
    : stage1to20 <= 13 ? '힌트: 10을 먼저 만들면 쉬워요!'
    : '힌트: 십의 자리부터 차근차근!';
}

function showQuestion(stage1to20){
  const q = makeQuestion(stage1to20);
  state.a = q.a;
  state.b = q.b;
  state.answer = q.answer;

  el.questionText.textContent = `${q.a} + ${q.b} = ?`;
  el.answerInput.value = '';
  el.answerInput.focus({ preventScroll: true });

  startCountdown();
}

async function climbAndMeetMonster(){
  const stage1to20 = state.stageIndex + 1;

  // bunny progress & tired for ~3s
  setBunnyProgress(stage1to20);
  el.bunny.classList.remove('vanish');
  el.bunny.classList.add('tired');

  // cheer sometimes while climbing
  showCheerMaybe(stage1to20);

  // 3초 연출
  await wait(3000);
  el.bunny.classList.remove('tired');

  // monster appears + friendly intro (no extra modal; in right panel text)
  setPanelsForStage(stage1to20);
  monsterFriendlyIntro(stage1to20);

  // then question
  state.inQuestion = true;
  showQuestion(stage1to20);
}

function wait(ms){ return new Promise(res=> setTimeout(res, ms)); }

function success(){
  clearTimer();
  state.inQuestion = false;

  // correct count
  state.correctCount += 1;
  updateHud();

  // jump + sparkle
  bunnyJumpSparkle();
  toast('정답! 토끼가 폴짝! ✨', '');

  // next stage or finish
  if(state.stageIndex >= TOTAL - 1){
    finish(true);
  } else {
    state.stageIndex += 1;
    // brief pause then next encounter
    setTimeout(()=> climbAndMeetMonster(), 600);
  }
}

function fail(reason){
  clearTimer();
  state.inQuestion = false;

  toast('앗! 😳', 'danger');

  // bunny vanish
  el.bunny.classList.add('vanish');

  finish(false, reason);
}

function spawnFallingStars(){
  const count = 34;
  const sceneRect = el.overlay.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const star = document.createElement('div');
    star.className = 'star';
    star.textContent = '⭐';
    const x = randInt(10, Math.floor(sceneRect.width - 10));
    const delay = Math.random() * 0.9;
    const size = randInt(14, 22);
    star.style.left = `${x}px`;
    star.style.animationDelay = `${delay}s`;
    star.style.fontSize = `${size}px`;
    el.overlay.appendChild(star);
    setTimeout(()=> star.remove(), 2200);
  }
}

function finish(completedAll, reason=''){
  state.running = false;
  updateHud();

  const score = Math.round((state.correctCount / TOTAL) * 100);
  el.statScore.textContent = String(score);

  if(completedAll && state.correctCount === TOTAL){
    el.finalBadge.textContent = '완주!';
    el.statReward.textContent = '소원권 1개 🎟️';
    el.monsterBadge.textContent = '축하해요!';
    el.monsterSay.textContent = `${CHILD_NAME}! 20문제 모두 성공! 정말 대단해! 🎉`;
    toast('완주 성공! 소원권 획득! 🎟️', '');
    spawnFallingStars();
  } else {
    el.finalBadge.textContent = '종료';
    el.statReward.textContent = '없음';
    el.monsterBadge.textContent = '다음에 또!';
    const why = reason ? `(${reason})` : '';
    el.monsterSay.textContent = `${CHILD_NAME}, 괜찮아! 다음에 다시 도전하자 😊 ${why}`;
  }
}

function reset(){
  clearTimer();
  state.stageIndex = 0;
  state.correctCount = 0;
  state.timeLeft = TIME_LIMIT;
  state.timerId = null;
  state.running = false;
  state.inQuestion = false;
  state.answer = 0;

  el.bunny.classList.remove('vanish', 'tired', 'jump');
  el.bunny.style.left = '12%';
  el.bunny.style.bottom = '16%';

  el.monsterBadge.textContent = '대기 중';
  el.monsterName.textContent = '선생님 괴물';
  el.monsterSay.textContent = '시작 버튼을 눌러줘!';
  el.stageChip.textContent = '0/20';
  el.questionText.textContent = '시작하기를 누르면 문제가 나와요!';
  el.timeLeft.textContent = '-';
  setDingChip('준비', false);
  el.finalBadge.textContent = '진행 중';
  el.statReward.textContent = '없음';

  updateHud();
}

function startGame(){
  reset();
  state.running = true;
  el.startPanel.style.display = 'none';
  toast(`${CHILD_NAME}의 모험 시작! 🐰`, '');
  climbAndMeetMonster();
}

el.btnStart.addEventListener('click', startGame);

el.answerForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  if(!state.running || !state.inQuestion) return;

  const v = el.answerInput.value.trim();
  if(v === '') return;

  const num = Number(v);
  if(!Number.isFinite(num)) return;

  // clear "ding" highlight after answer attempt
  setDingChip('집중!', false);

  if(num === state.answer){
    success();
  } else {
    fail('오답');
  }
});

el.btnRestart.addEventListener('click', ()=>{
  // 요구사항 범위 내: 새로고침으로 완전 재시작
  location.reload();
});

// init
reset();
