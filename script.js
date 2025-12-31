const TOTAL = 20;
const TIME_LIMIT = 20;
const NAME = "정아인";

const stairs = document.getElementById("stairs");
const bunny = document.getElementById("bunny");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const popupBtn = document.getElementById("popupBtn");
const form = document.getElementById("answerForm");
const input = document.getElementById("answerInput");

const timerEl = document.getElementById("timer");
const progressEl = document.getElementById("progress");

let stage = 0;
let correct = 0;
let answer = 0;
let timer = null;

/* 사운드 */
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function beep(freq=600,dur=0.12){
  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  o.frequency.value=freq;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  o.stop(audioCtx.currentTime+dur);
}

/* 계단 */
for(let i=0;i<TOTAL;i++){
  const d=document.createElement("div");
  d.className="step";
  stairs.appendChild(d);
}

/* 팝업 */
function showPopup(txt,withInput=false){
  popupText.innerHTML=txt;
  popup.classList.remove("hidden");
  form.classList.toggle("hidden",!withInput);
  popupBtn.style.display=withInput?"none":"block";
}

/* 문제 */
function makeQuestion(){
  let a,b;
  if(stage<6){a=r(1,9);b=r(1,9);}
  else if(stage<13){a=r(5,30);b=r(1,9);}
  else{a=r(10,60);b=r(10,60);}
  answer=a+b;
  input.value=""; // 👈 입력값 초기화

  showPopup(
    `👩‍🏫 선생님 괴물 등장!<br><br>
     ${NAME}아 맞히면 더 올라갈 수 있어!<br>
     <b>${a} + ${b} = ?</b>`,
    true
  );
  startTimer();
}

/* 타이머 */
function startTimer(){
  let t=TIME_LIMIT;
  timerEl.textContent=`⏱ ${t}초`;
  clearInterval(timer);
  timer=setInterval(()=>{
    t--;
    timerEl.textContent=`⏱ ${t}초`;
    if(t===10||t===5){beep(800);}
    if(t<=0){fail();}
  },1000);
}

/* 제출 */
form.onsubmit=e=>{
  e.preventDefault();
  clearInterval(timer);
  popup.classList.add("hidden");
  if(Number(input.value)===answer){
    correct++; stage++;
    beep(1000);
    bunny.classList.add("jump");
    setTimeout(()=>bunny.classList.remove("jump"),300);
    window.scrollBy({top:-120,behavior:"smooth"}); // 👈 위로 올라감
    if(stage>=TOTAL) finish(true);
    else setTimeout(makeQuestion,600);
  }else fail();
};

/* 실패 */
function fail(){
  beep(300);
  bunny.classList.add("vanish");
  finish(false);
}

/* 종료 */
function finish(clear){
  showPopup(
    clear
    ? `🎉 완주 성공!<br><br>
       ⭐ ${correct}/20 정답<br>
       💯 점수 ${Math.round(correct/TOTAL*100)}점<br>
       🎟 소원권 1개`
    : `😳 앗!<br><br>
       ${correct}/20 정답<br>
       점수 ${Math.round(correct/TOTAL*100)}점`
  );
}

/* 시작 */
function updateHud(){
  progressEl.textContent=`맞춘 문제 ${correct} / 남은 문제 ${TOTAL-correct}`;
}
popupBtn.onclick=()=>{
  popup.classList.add("hidden");
  makeQuestion();
  updateHud();
};

showPopup(`🐰 ${NAME}의 수학 모험!<br>계단을 올라가보자!`);

function r(a,b){return Math.floor(Math.random()*(b-a+1))+a}
