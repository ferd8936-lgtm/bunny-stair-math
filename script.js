'use strict';

const TOTAL = 20;
const TIME_LIMIT = 20;

const el = {
  startPanel: document.getElementById('startPanel'),
  btnStart: document.getElementById('btnStart'),
  bunny: document.getElementById('bunny'),
  scene: document.querySelector('.scene'),

  questionModal: document.getElementById('questionModal'),
  qStageBadge: document.getElementById('qStageBadge'),
  qTimeLeft: document.getElementById('qTimeLeft'),
  questionText: document.getElementById('questionText'),
  answerForm: document.getElementById('answerForm'),
  answerInput: document.getElementById('answerInput'),

  monsterName: document.getElementById('monsterName'),
  monsterSay: document.getElementById('monsterSay'),

  resultModal: document.getElementById('resultModal'),
  resCorrect: document.getElementById('resCorrect'),
  resScore: document.getElementById('resScore'),
  resReward: document.getElementById('resReward'),
  resultTitle: document.getElementById('resultTitle'),
};

const state = {
  stage: 0,
  correct: 0,
  answer: 0,
  timer: null,
  time: TIME_LIMIT,
};

function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

function makeQuestion(stage){
  let a,b;
  if(stage<=6){a=rand(1,9);b=rand(1,9);}
  else if(stage<=13){a=rand(1,9);b=rand(10,30);}
  else{a=rand(10,60);b=rand(10,60);}
  return {a,b,answer:a+b};
}

function show(e){e.classList.remove('hidden')}
function hide(e){e.classList.add('hidden')}

/* 숲속 동물 응원 */
function cheer(){
  const animals=['🐿️','🦊','🐦','🦌'];
  const msgs=['화이팅!','잘하고 있어!','넌 할 수 있어!','조금만 더!'];

  const a=document.createElement('div');
  a.className='cheer-animal';
  a.textContent=animals[rand(0,3)];

  const b=document.createElement('div');
  b.className='cheer-bubble';
  b.textContent=msgs[rand(0,3)];

  el.scene.appendChild(a);
  el.scene.appendChild(b);
  setTimeout(()=>{a.remove();b.remove();},2500);
}

function startTimer(){
  clearInterval(state.timer);
  state.time=TIME_LIMIT;
  el.qTimeLeft.textContent=state.time;
  const badge=el.qTimeLeft.parentElement;

  state.timer=setInterval(()=>{
    state.time--;
    el.qTimeLeft.textContent=state.time;
    if(state.time<=5) badge.classList.add('time-urgent');
    if(state.time<=0){
      clearInterval(state.timer);
      fail();
    }
  },1000);
}

function nextStage(){
  state.stage++;
  el.bunny.classList.add('tired');
  cheer();

  setTimeout(()=>{
    el.bunny.classList.remove('tired');
    const q=makeQuestion(state.stage);
    state.answer=q.answer;

    el.monsterName.textContent=`선생님 괴물 ${state.stage}호`;
    el.monsterSay.textContent=
      '문제를 맞히면 더 올라갈 수 있어 😊\n틀리거나 시간이 지나면 사라진단다';

    el.qStageBadge.textContent=`${state.stage}/20`;
    el.questionText.textContent=`${q.a} + ${q.b} = ?`;
    el.answerInput.value='';

    show(el.questionModal);
    startTimer();
  },3000);
}

function startGame(){
  state.stage=0;
  state.correct=0;
  hide(el.startPanel);
  nextStage();
}

function success(){
  clearInterval(state.timer);
  hide(el.questionModal);
  state.correct++;
  if(state.stage>=TOTAL) end(true);
  else nextStage();
}

function fail(){
  clearInterval(state.timer);
  hide(el.questionModal);
  el.bunny.classList.add('vanish');
  end(false);
}

function end(clear){
  el.resCorrect.textContent=state.correct;
  el.resScore.textContent=Math.round((state.correct/TOTAL)*100);
  el.resReward.textContent=clear&&state.correct===20?'소원권 1개 🎟️':'없음';
  el.resultTitle.textContent=clear?'🎉 완주 성공!':'게임 종료';
  show(el.resultModal);
}

el.btnStart.onclick=startGame;
el.answerForm.onsubmit=e=>{
  e.preventDefault();
  Number(el.answerInput.value)===state.answer?success():fail();
};
