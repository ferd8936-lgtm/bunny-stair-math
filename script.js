const TOTAL = 20;
const TIME_LIMIT = 20;
const CHILD = "정아인";

const stairs = document.getElementById("stairs");
const bunny = document.getElementById("bunny");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const popupBtn = document.getElementById("popupBtn");
const form = document.getElementById("answerForm");
const input = document.getElementById("answerInput");

let stage = 0;
let correct = 0;
let answer = 0;
let timer = null;

/* 계단 생성 */
for(let i=0;i<TOTAL;i++){
  const s = document.createElement("div");
  s.className="step";
  stairs.appendChild(s);
}

/* 팝업 */
function showPopup(text, withInput=false){
  popupText.innerHTML = text;
  popup.classList.remove("hidden");
  form.classList.toggle("hidden", !withInput);
  popupBtn.style.display = withInput ? "none":"block";
}

popupBtn.onclick = ()=> popup.classList.add("hidden");

/* 문제 생성 */
function makeQuestion(n){
  let a,b;
  if(n<6){a=r(1,9);b=r(1,9);}
  else if(n<13){a=r(5,20);b=r(1,9);}
  else{a=r(10,60);b=r(10,60);}
  answer=a+b;
  showPopup(
    `👩‍🏫 선생님 괴물 등장!<br><br>
     ${CHILD}아 문제를 맞히면 더 올라갈 수 있어!<br>
     ⏱ ${TIME_LIMIT}초 안에 풀어보자!<br><br>
     <b>${a} + ${b} = ?</b>`,
    true
  );
  startTimer();
}

/* 타이머 */
function startTimer(){
  let t=TIME_LIMIT;
  clearInterval(timer);
  timer=setInterval(()=>{
    t--;
    if(t===10||t===5) showPopup(`⏰ 띵! ${t}초 남았어!`);
    if(t<=0){fail();}
  },1000);
}

/* 성공 */
form.onsubmit=e=>{
  e.preventDefault();
  clearInterval(timer);
  popup.classList.add("hidden");
  if(Number(input.value)===answer){
    correct++;
    bunny.classList.add("jump");
    setTimeout(()=>bunny.classList.remove("jump"),300);
    stage++;
    window.scrollBy({top:120,behavior:"smooth"});
    if(stage>=TOTAL) finish(true);
    else setTimeout(()=>makeQuestion(stage),600);
  }else fail();
};

/* 실패 */
function fail(){
  clearInterval(timer);
  bunny.classList.add("vanish");
  finish(false);
}

/* 종료 */
function finish(clear){
  showPopup(
    clear
    ? `🎉 완주 성공!<br>${correct}/20 정답<br>점수 ${Math.round(correct/20*100)}점<br>🎟 소원권 1개`
    : `😳 앗! 게임 종료<br>${correct}/20 정답<br>점수 ${Math.round(correct/20*100)}점`
  );
}

/* 시작 */
showPopup(
  `🐰 ${CHILD}의 수학 모험!<br><br>
   계단을 올라가며 문제를 풀어보자!`
);
popupBtn.onclick=()=>{
  popup.classList.add("hidden");
  makeQuestion(0);
};

function r(a,b){return Math.floor(Math.random()*(b-a+1))+a}
