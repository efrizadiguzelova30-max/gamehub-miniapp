"use strict";
const games=[
{id:"roblox",name:"Roblox",cat:"Песочница",emoji:"🧱",color:"linear-gradient(135deg,#363b4b,#171a24)",desc:"Миллионы пользовательских миров и режимов.",tip:"Перед сложным заданием проверь цель, инвентарь и условия победы. В команде заранее распределите роли."},
{id:"minecraft",name:"Minecraft",cat:"Песочница",emoji:"⛏️",color:"linear-gradient(135deg,#3c8c65,#254b3d)",desc:"Исследуй мир, добывай ресурсы и строй.",tip:"Сначала собери дерево и инструменты, затем подготовь безопасное место до наступления ночи."},
{id:"brawl",name:"Brawl Stars",cat:"Экшен",emoji:"⭐",color:"linear-gradient(135deg,#d85d52,#7d2d55)",desc:"Командные бои, бойцы и разные режимы.",tip:"Используй укрытия и выбирай бойца под карту и режим, а не только по личным предпочтениям."},
{id:"standoff",name:"Standoff 2",cat:"Экшен",emoji:"🎯",color:"linear-gradient(135deg,#527db6,#253450)",desc:"Тактический шутер про позицию и реакцию.",tip:"Держи прицел на уровне головы, проверяй углы по очереди и передавай команде точную информацию."},
{id:"grand",name:"Grand Mobile",cat:"Ролевые",emoji:"🚘",color:"linear-gradient(135deg,#ba874d,#49372b)",desc:"Ролевая жизнь в открытом городе.",tip:"Проверь правила сервера и условия задания. Не передавай пароль и коды другим игрокам."},
{id:"genshin",name:"Genshin Impact",cat:"Ролевые",emoji:"🌌",color:"linear-gradient(135deg,#6c8ed2,#393b79)",desc:"Приключения, исследование и отряд персонажей.",tip:"Подбирай персонажей с дополняющими навыками и улучшай оружие основного героя."}
];
const quests=[{id:"q1",title:"Изучи новую механику",desc:"Выбери игру и попробуй то, чего раньше не делал.",reward:20},{id:"q2",title:"Прочитай игровой совет",desc:"Открой карточку игры и ознакомься с рекомендацией.",reward:15},{id:"q3",title:"Составь план на матч",desc:"Определи цель и способ улучшить результат.",reward:25}];
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let state={points:0,done:[]},filter="Все",lastLookup=0,lookupTimes=[],chatTimes=[];
try{const stored=JSON.parse(localStorage.getItem("gamehub-demo")||"{}");state={...state,...stored};if(!Array.isArray(state.done))state.done=[];state.points=Number(state.points)||0}catch(e){}
function save(){try{localStorage.setItem("gamehub-demo",JSON.stringify(state))}catch(e){}stats();renderQuests()}
function stats(){ $("#points").textContent=state.points;$("#doneCount").textContent=state.done.length+"/3";const pct=Math.min(100,state.done.length/quests.length*100);["#progressBar","#progressBar2"].forEach(s=>$(s).style.width=pct+"%");$("#progressText").textContent="Выполнено "+state.done.length+" из 3 заданий";$("#progressText2").textContent="Выполнено "+state.done.length+" из 3 заданий"}
function gameCard(g){return `<article class="game"><div class="cover" style="background:${g.color}">${g.emoji}</div><div class="game-info"><h3>${g.name}</h3><p>${g.desc}</p><span class="tag">${g.cat}</span></div><button class="arrow" data-game="${g.id}" aria-label="Открыть совет: ${g.name}">↗</button></article>`}
function renderGames(){const term=$("#searchInput").value.toLowerCase().trim();const arr=games.filter(g=>(filter==="Все"||g.cat===filter)&&(g.name+" "+g.desc+" "+g.cat).toLowerCase().includes(term));$("#allGames").innerHTML=arr.length?arr.map(gameCard).join(""):'<p class="subtle-note">Ничего не найдено. Попробуй другое название.</p>'}
function qCard(q){const done=state.done.includes(q.id);return `<article class="quest ${done?"done":""}"><button class="check" data-quest="${q.id}" aria-label="${done?"Отменить":"Выполнить"}: ${q.title}">${done?"✓":""}</button><div class="quest-copy"><h3>${q.title}</h3><p>${q.desc}</p></div><span class="reward">+${q.reward} ✦</span></article>`}
function renderQuests(){$("#allQuests").innerHTML=quests.map(qCard).join("");$("#homeQuests").innerHTML=quests.slice(0,2).map(qCard).join("")}
function toast(s){const t=$("#toast");t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2400)}
function openGame(id){const g=games.find(x=>x.id===id);if(!g)return;$("#dialogContent").innerHTML=`<div class="cover" style="background:${g.color};width:68px;height:68px">${g.emoji}</div><p class="tag">${g.cat}</p><h2>${g.name}</h2><p class="subtle-note">${g.desc}</p><div class="tip"><b>💡 Совет</b><br>${g.tip}</div><button class="btn primary full-button" id="saveTip">Запомнил совет</button>`;$("#gameDialog").showModal();$("#saveTip").onclick=()=>{toast("Отлично! Совет изучен");$("#gameDialog").close()}}
function tab(n){const target=$("#view-"+n);if(!target)return;$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===n));$$(".view").forEach(v=>v.classList.toggle("active",v===target));if(n==="games")renderGames();window.scrollTo({top:0,behavior:"smooth"})}
document.addEventListener("click",e=>{const t=e.target.closest("[data-tab]");if(t){tab(t.dataset.tab);return}const go=e.target.closest("[data-goto]");if(go){tab(go.dataset.goto);return}const g=e.target.closest("[data-game]");if(g){openGame(g.dataset.game);return}const q=e.target.closest("[data-quest]");if(q){const item=quests.find(x=>x.id===q.dataset.quest);if(!item)return;if(state.done.includes(item.id)){state.done=state.done.filter(x=>x!==item.id);state.points=Math.max(0,state.points-item.reward);toast("Задание отменено")}else{state.done.push(item.id);state.points+=item.reward;toast("+"+item.reward+" очков!")}save();return}const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;$$("[data-filter]").forEach(b=>b.classList.toggle("selected",b===f));renderGames();return}const prompt=e.target.closest("[data-prompt]");if(prompt){$("#chatInput").value=prompt.dataset.prompt;$("#chatInput").focus()}});
$("#searchInput").addEventListener("input",renderGames);$("#closeDialog").onclick=()=>$("#gameDialog").close();$("#resetButton").onclick=()=>{state={points:0,done:[]};save();toast("Демо-прогресс сброшен")};
if(window.Telegram&&window.Telegram.WebApp){const tg=window.Telegram.WebApp;tg.ready();tg.expand();const u=tg.initDataUnsafe?.user;if(u)$("#avatar").textContent=(u.first_name||"G").slice(0,2).toUpperCase()}
$("#featuredGames").innerHTML=games.slice(0,4).map(gameCard).join("");renderGames();renderQuests();stats();
// Public Roblox username lookup. Client-side throttling is only a basic UX safeguard, not server-side anti-abuse protection.
function allowedLookup(){const now=Date.now();lookupTimes=lookupTimes.filter(t=>now-t<60000);if(now-lastLookup<2500){toast("Подожди пару секунд перед следующим поиском.");return false}if(lookupTimes.length>=5){toast("Лимит: не больше 5 поисков в минуту.");return false}lastLookup=now;lookupTimes.push(now);return true}
$("#robloxForm").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget;if(form.elements.website.value){toast("Запрос отклонён.");return}const username=$("#robloxUsername").value.trim();const box=$("#robloxResult");if(!/^[A-Za-z0-9_]{3,20}$/.test(username)){box.textContent="Проверь имя: от 3 до 20 символов, только буквы, цифры и _.";return}if(!allowedLookup())return;const btn=$("#robloxSubmit");btn.disabled=true;btn.textContent="Ищем…";box.textContent="Идёт запрос к публичному поиску Roblox…";try{const response=await fetch("https://users.roblox.com/v1/usernames/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({usernames:[username],excludeBannedUsers:false})});if(!response.ok)throw new Error("HTTP "+response.status);const data=await response.json();const matches=Array.isArray(data.data)?data.data:[];if(!matches.length){box.textContent="Пользователь не найден. Проверь точное имя и попробуй позже.";return}const user=matches[0];const safeName=String(user.name||username);const display=String(user.displayName||safeName);const id=Number(user.id);if(!Number.isSafeInteger(id)||id<1)throw new Error("Invalid ID");box.innerHTML='<div class="result-user"><div class="result-avatar">🎮</div><div><b></b><small></small><small>ID: '+id+'</small></div></div><button class="copy-id" id="copyRobloxId">Копировать ID</button> <a class="copy-id" href="https://www.roblox.com/users/'+id+'/profile" target="_blank" rel="noopener noreferrer">Открыть профиль ↗</a>';box.querySelector("b").textContent=display;box.querySelectorAll("small")[0].textContent="@"+safeName;$("#copyRobloxId").onclick=async()=>{try{await navigator.clipboard.writeText(String(id));toast("ID скопирован")}catch(err){toast("Не удалось скопировать. Выдели ID вручную.")}}}catch(err){box.textContent="Не удалось получить ответ Roblox. Возможно, запрос заблокирован браузером (CORS) или сервис временно недоступен. Открой официальный поиск Roblox и попробуй позже."; }finally{btn.disabled=false;btn.textContent="Найти ID"}});
// Real AI chat uses a Cloudflare Worker proxy. Never put the Gemini API key in this file.
const GAMEHUB_AI_ENDPOINT = "PASTE_CLOUDFLARE_WORKER_URL_HERE";
$("#chatForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  if (form.elements.contact.value) { toast("Сообщение отклонено."); return; }
  const now = Date.now();
  chatTimes = chatTimes.filter(t => now - t < 60000);
  if (chatTimes.length >= 5) { toast("Лимит: 5 сообщений в минуту. Попробуй позже."); return; }
  const text = $("#chatInput").value.trim();
  if (!text) return;
  if (GAMEHUB_AI_ENDPOINT === "PASTE_CLOUDFLARE_WORKER_URL_HERE") {
    toast("Сначала подключи адрес Cloudflare Worker по инструкции.");
    const reply = document.createElement("div");
    reply.className = "message bot-message";
    reply.textContent = "ИИ почти готов. Осталось создать Cloudflare Worker, добавить секрет GEMINI_API_KEY и вставить адрес Worker в настройку сайта.";
    $("#chatMessages").append(reply);
    return;
  }
  chatTimes.push(now);
  const send = $("#chatForm button[type='submit']");
  send.disabled = true;
  const user = document.createElement("div");
  user.className = "message user-message";
  user.textContent = text;
  $("#chatMessages").append(user);
  $("#chatInput").value = "";
  const reply = document.createElement("div");
  reply.className = "message bot-message";
  reply.textContent = "Думаю…";
  $("#chatMessages").append(reply);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  try {
    const response = await fetch(GAMEHUB_AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Сервис временно недоступен (" + response.status + ").");
    reply.textContent = String(data.reply || "ИИ не вернул текст ответа.");
  } catch (err) {
    reply.textContent = "Не удалось связаться с ИИ. Проверь адрес Worker и настройки. " + (err.message || "");
  } finally {
    send.disabled = false;
    $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
  }
});
