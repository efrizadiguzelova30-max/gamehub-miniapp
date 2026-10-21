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
const $=s=>document.querySelector(s),$=s=>[...document.querySelectorAll(s)];
// Public Telegram numeric ID is used only to reveal the owner UI; every privileged API action must still be verified by admin-worker.js.
const OWNER_TELEGRAM_ID = "7271410328";
function getTelegramUser(){return window.Telegram?.WebApp?.initDataUnsafe?.user||null}
function isTelegramOwner(){const u=getTelegramUser();return !!u&&String(u.id)===OWNER_TELEGRAM_ID}
let state={points:0,done:[]},filter="Все",lastLookup=0,lookupTimes=[],chatTimes=[],lastRandomGame="";
try{const stored=JSON.parse(localStorage.getItem("gamehub-demo")||"{}");if(stored&&typeof stored==="object"){state.done=Array.isArray(stored.done)?[...new Set(stored.done.filter(id=>quests.some(q=>q.id===id)))]:[];state.points=state.done.reduce((sum,id)=>sum+(quests.find(q=>q.id===id)?.reward||0),0)}}catch(e){state={points:0,done:[]}}
function save(){try{localStorage.setItem("gamehub-demo",JSON.stringify(state))}catch(e){}stats();renderQuests()}
function stats(){const doneCount=quests.filter(q=>state.done.includes(q.id)).length;const pointsEl=$("#points");if(pointsEl)pointsEl.textContent=String(state.points);const doneEl=$("#doneCount");if(doneEl)doneEl.textContent=doneCount+"/3";const pct=Math.min(100,doneCount/quests.length*100);["#progressBar","#progressBar2"].forEach(s=>{const el=$(s);if(el)el.style.width=pct+"%"});const progressText=$("#progressText");if(progressText)progressText.textContent="Выполнено "+doneCount+" из "+quests.length+" заданий";const progressText2=$("#progressText2");if(progressText2)progressText2.textContent="Выполнено "+doneCount+" из "+quests.length+" заданий"}
function gameCard(g){return `<article class="game"><div class="cover" style="background:${g.color}">${g.emoji}</div><div class="game-info"><h3>${g.name}</h3><p>${g.desc}</p><span class="tag">${g.cat}</span></div><button class="arrow" data-game="${g.id}" aria-label="Открыть совет: ${g.name}">↗</button></article>`}
function renderGames(){const term=($("#searchInput")?.value||"").toLowerCase().trim();const arr=games.filter(g=>(filter==="Все"||g.cat===filter)&&(g.name+" "+g.desc+" "+g.cat).toLowerCase().includes(term));$("#allGames").innerHTML=arr.length?arr.map(gameCard).join(""):'<p class="subtle-note">Ничего не найдено. Попробуй другое название.</p>'}
function qCard(q){const done=state.done.includes(q.id);return `<article class="quest ${done?"done":""}"><button class="check" data-quest="${q.id}" aria-label="${done?"Отменить":"Выполнить"}: ${q.title}">${done?"✓":""}</button><div class="quest-copy"><h3>${q.title}</h3><p>${q.desc}</p></div><span class="reward">+${q.reward} ✦</span></article>`}
function renderQuests(){$("#allQuests").innerHTML=quests.map(qCard).join("");$("#homeQuests").innerHTML=quests.slice(0,2).map(qCard).join("")}
function toast(s){const t=$("#toast");t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2400)}
function openGame(id){const g=games.find(x=>x.id===id);if(!g)return;$("#dialogContent").innerHTML=`<div class="cover" style="background:${g.color};width:68px;height:68px">${g.emoji}</div><p class="tag">${g.cat}</p><h2>${g.name}</h2><p class="subtle-note">${g.desc}</p><div class="tip"><b>💡 Совет</b><br>${g.tip}</div><button class="btn primary full-button" id="saveTip">Запомнил совет</button>`;$("#gameDialog").showModal();$("#saveTip").onclick=()=>{toast("Отлично! Совет изучен");$("#gameDialog").close()}}
function tab(n){const target=$("#view-"+n);if(!target)return;$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===n));$$(".view").forEach(v=>v.classList.toggle("active",v===target));if(n==="games")renderGames();if(n==="graph"){const p=$("#graphPoints");if(p)p.textContent=String(state.points);const q=$("#graphTasks");if(q)q.textContent=state.done.length+"/3"}if(n==="profile"){const u=window.Telegram?.WebApp?.initDataUnsafe?.user;if(u){const p=$("#profileName");if(p)p.textContent=[u.first_name,u.last_name].filter(Boolean).join(" ")||u.username||"Пользователь";const s=$("#profileStatus");if(s)s.textContent="Telegram-профиль обнаружен. Права доступа подтверждаются только сервером.";const r=$("#profileRole");if(r)r.textContent=adminActor?.role==="owner"?"Роль: владелец":adminActor?.role==="co_owner"?"Роль: совладелец":adminActor?.role==="admin"?"Роль: администратор":adminConfigured?"Роль: проверка сервером не завершена":"Роль: сервер авторизации не подключён"}}const d=$("#sideDrawer"),s=$("#drawerScrim");d?.classList.remove("open");s?.classList.remove("open");window.scrollTo({top:0,behavior:"smooth"})}
const menuToggle=$("#menuToggle"),sideDrawer=$("#sideDrawer"),drawerScrim=$("#drawerScrim");function closeDrawer(){sideDrawer?.classList.remove("open");drawerScrim?.classList.remove("open")}menuToggle?.addEventListener("click",()=>{sideDrawer?.classList.add("open");drawerScrim?.classList.add("open")});$("#sideClose")?.addEventListener("click",closeDrawer);drawerScrim?.addEventListener("click",closeDrawer);$("#settingsReset")?.addEventListener("click",()=>{state={points:0,done:[]};save();toast("Прогресс сброшен")});$("#themeToggle")?.addEventListener("click",()=>{document.body.classList.toggle("bright-accent");toast("Оформление обновлено")});$("#lockAccessButton")?.addEventListener("click",()=>{tab("admin");if(!adminActor||adminActor.role!=="owner")toast("Открыта справочная страница доступа. Изменять блокировку может только подтверждённый владелец.")});
document.addEventListener("click",e=>{const t=e.target.closest("[data-tab]");if(t){tab(t.dataset.tab);return}const go=e.target.closest("[data-goto]");if(go){tab(go.dataset.goto);return}const g=e.target.closest("[data-game]");if(g){openGame(g.dataset.game);return}if(e.target.closest("[data-random-game]")){const options=games.filter(x=>x.id!==lastRandomGame);const pick=options[Math.floor(Math.random()*options.length)]||games[0];lastRandomGame=pick.id;openGame(pick.id);return}const q=e.target.closest("[data-quest]");if(q){const item=quests.find(x=>x.id===q.dataset.quest);if(!item)return;if(state.done.includes(item.id)){state.done=state.done.filter(x=>x!==item.id);state.points=Math.max(0,state.points-item.reward);toast("Задание отменено")}else{state.done.push(item.id);state.points+=item.reward;toast("+"+item.reward+" очков!")}save();return}const f=e.target.closest("[data-filter]");if(f){filter=f.dataset.filter;$$("[data-filter]").forEach(b=>b.classList.toggle("selected",b===f));renderGames();return}const prompt=e.target.closest("[data-prompt]");if(prompt){$("#chatInput").value=prompt.dataset.prompt;$("#chatInput").focus()}});
$("#searchInput")?.addEventListener("input",renderGames);$("#closeDialog").onclick=()=>$("#gameDialog").close();$("#resetButton").onclick=()=>{state={points:0,done:[]};save();toast("Демо-прогресс сброшен")};
if(window.Telegram&&window.Telegram.WebApp){const tg=window.Telegram.WebApp;tg.ready();tg.expand();const u=tg.initDataUnsafe?.user;if(u)$("#avatar").textContent=(u.first_name||"G").slice(0,2).toUpperCase();if(isTelegramOwner()){const nav=$("#sideAdminNav");if(nav)nav.hidden=false;const identity=$("#adminIdentity");if(identity)identity.textContent="Владелец подтверждён по Telegram ID. Подключаем функции управления…";const unavailable=$("#adminUnavailable");if(unavailable)unavailable.hidden=false;const msg=$("#adminUnavailableText");if(msg)msg.textContent="Telegram распознал владельца. Для команд, ключей и управления группами требуется подключённый Admin Worker; интерфейс не просит у владельца ключ доступа."}}
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


// Owner tools are dormant until the Cloudflare Worker is deployed and configured.
// Authentication uses Telegram WebApp initData, verified server-side by the Worker.
const ADMIN_API_ENDPOINT = "PASTE_CLOUDFLARE_ADMIN_WORKER_URL_HERE";
const ACCESS_API_ENDPOINT = ADMIN_API_ENDPOINT;
const accessApiConfigured = /^https:\/\//.test(ACCESS_API_ENDPOINT) && !ACCESS_API_ENDPOINT.includes("PASTE_");
const adminConfigured = /^https:\/\//.test(ADMIN_API_ENDPOINT) && !ADMIN_API_ENDPOINT.includes("PASTE_");
const adminNav = $("#adminNav");
if (adminNav) if(adminNav)adminNav.hidden = false; // The status page is visible; privileged controls remain server-gated.
const sideAdminNav=$("#sideAdminNav");if(sideAdminNav)sideAdminNav.hidden=false;
const maintenanceBanner = $("#maintenanceBanner");
let adminActor = null;
if (!adminConfigured) {
  const identity = $("#adminIdentity");
  const unavailable = $("#adminUnavailable");
  const unavailableText = $("#adminUnavailableText");
  if (identity) identity.textContent = "Панель владельца GameHub";
  if (unavailable) unavailable.hidden = false;
  if (unavailableText) unavailableText.textContent = "Админ-сервер пока не подключён. Интерфейс доступен для просмотра, но действия управления заблокированы до настройки Cloudflare Worker, Telegram ID владельца и базы данных.";
}
let adminFlags = { siteLocked: false, botEnabled: true };

async function adminRequest(path, options = {}) {
  if (!adminConfigured) throw new Error("Админ-сервер ещё не подключён.");
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.initData) throw new Error("Открой GameHub внутри Telegram, чтобы подтвердить личность.");
  const headers = new Headers(options.headers || {});
  headers.set("X-Telegram-Init-Data", tg.initData);
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(ADMIN_API_ENDPOINT.replace(/\/+$/, "") + path, {
    ...options, headers, cache: "no-store"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Ошибка сервера (" + response.status + ").");
  return data;
}

function renderAdminFlags() {
  $("#siteLockStatus").textContent = adminFlags.siteLocked
    ? "Включён режим обслуживания. Статические файлы GitHub Pages всё ещё публичны."
    : "Обычный режим сайта.";
  $("#adminLockToggle").textContent = adminFlags.siteLocked ? "Выключить режим обслуживания" : "Включить режим обслуживания";
  $("#botStatus").textContent = adminFlags.botEnabled
    ? "В базе указано, что бот должен работать. Сам процесс бота должен читать этот флаг."
    : "В базе указано, что бот выключен. Фоновый процесс должен соблюдать этот флаг.";
  $("#adminBotToggle").textContent = adminFlags.botEnabled ? "Выключить бота" : "Включить бота";
  if (maintenanceBanner) {
    maintenanceBanner.hidden = !adminFlags.siteLocked;
    maintenanceBanner.textContent = adminFlags.siteLocked
      ? "GameHub находится на техническом обслуживании. Некоторые функции временно ограничены."
      : "";
  }
}

async function loadAdminList() {
  const list = $("#adminList");
  list.replaceChildren();
  const data = await adminRequest("/api/admin/admins");
  if (!data.admins || !data.admins.length) {
    const empty = document.createElement("p");
    empty.className = "subtle-note";
    empty.textContent = "Дополнительных администраторов пока нет.";
    list.append(empty);
    return;
  }
  for (const entry of data.admins) {
    const row = document.createElement("div");
    row.className = "admin-row";
    const details = document.createElement("div");
    const id = document.createElement("b");
    id.textContent = "Telegram ID: " + String(entry.telegram_id);
    const role = document.createElement("small");
    role.textContent = entry.role === "co_owner" ? "Совладелец" : "Администратор";
    details.append(id, role);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn secondary";
    remove.textContent = "Удалить";
    remove.addEventListener("click", async () => {
      if (!window.confirm("Удалить роль у Telegram ID " + entry.telegram_id + "?")) return;
      remove.disabled = true;
      try {
        await adminRequest("/api/admin/admins?telegramId=" + encodeURIComponent(String(entry.telegram_id)), { method: "DELETE" });
        toast("Роль удалена.");
        await loadAdminList();
      } catch (error) {
        toast(error.message || "Не удалось удалить роль.");
        remove.disabled = false;
      }
    });
    row.append(details, remove);
    list.append(row);
  }
}

async function loadGroupList() {
  const list = $("#managedGroupList");
  const select = $("#moderationGroup");
  list.replaceChildren();
  select.replaceChildren();
  const data = await adminRequest("/api/admin/groups");
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = groups.length ? "Выбери группу" : "Сначала добавь группу";
  select.append(placeholder);
  for (const group of groups) {
    const option = document.createElement("option");
    option.value = String(group.chat_id);
    option.textContent = String(group.title) + " (" + String(group.chat_id) + ")";
    select.append(option);
    const row = document.createElement("div");
    row.className = "admin-row";
    const details = document.createElement("div");
    const name = document.createElement("b");
    name.textContent = String(group.title);
    const id = document.createElement("small");
    id.textContent = "ID: " + String(group.chat_id);
    details.append(name, id);
    row.append(details);
    if (["owner", "co_owner"].includes(adminActor.role)) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn secondary";
      remove.textContent = "Убрать";
      remove.addEventListener("click", async () => {
        if (!window.confirm("Убрать группу из управления GameHub? Это не удалит саму группу в Telegram.")) return;
        remove.disabled = true;
        try {
          await adminRequest("/api/admin/groups?chatId=" + encodeURIComponent(String(group.chat_id)), { method: "DELETE" });
          toast("Группа убрана из списка.");
          await loadGroupList();
        } catch (error) {
          toast(error.message || "Не удалось убрать группу.");
          remove.disabled = false;
        }
      });
      row.append(remove);
    }
    list.append(row);
  }
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "subtle-note";
    empty.textContent = "Группы ещё не добавлены. Используй /groupid в нужной группе, чтобы узнать её ID.";
    list.append(empty);
  }
}

async function loadAdminPanel() {
  if (!adminConfigured) {
    if(isTelegramOwner()){
      const nav=$("#sideAdminNav");if(nav)nav.hidden=false;
      const identity=$("#adminIdentity");if(identity)identity.textContent="Владелец GameHub · Telegram ID "+OWNER_TELEGRAM_ID;
      const unavailable=$("#adminUnavailable");if(unavailable)unavailable.hidden=false;
      const unavailableText=$("#adminUnavailableText");if(unavailableText)unavailableText.textContent="Владелец распознан автоматически. Но команды управления, список ключей и действия бота не могут выполняться, пока ADMIN_API_ENDPOINT не указывает на развернутый Admin Worker.";
      const ownerControls=$("#ownerControls");if(ownerControls)ownerControls.hidden=false;
      const groupControls=$("#groupControls");if(groupControls)groupControls.hidden=false;
      const groupAddForm=$("#groupAddForm");if(groupAddForm)groupAddForm.hidden=false;
    }
    return;
  }
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.initData) return;
  try {
    const data = await adminRequest("/api/admin/status");
    adminActor = data.actor || null;
    adminFlags = { siteLocked: Boolean(data.siteLocked), botEnabled: Boolean(data.botEnabled) };
    if (adminActor && ["owner", "admin", "co_owner"].includes(adminActor.role)) {
      const profileRole=$("#profileRole");
      if(profileRole)profileRole.textContent=adminActor.role==="owner"?"Роль: владелец":adminActor.role==="co_owner"?"Роль: совладелец":"Роль: администратор";
      const profileStatus=$("#profileStatus");
      if(profileStatus)profileStatus.textContent="Личность и роль подтверждены сервером Telegram.";
      if(adminNav)adminNav.hidden = false;
      const unavailablePanel=$("#adminUnavailable");if(unavailablePanel)unavailablePanel.hidden=true;
      if (sideAdminNav) sideAdminNav.hidden = false;
      $("#adminIdentity").textContent = "Вход подтверждён через Telegram. Уровень доступа: " +
        (adminActor.role === "owner" ? "владелец" : adminActor.role === "co_owner" ? "совладелец" : "администратор") + ".";
      $("#ownerControls").hidden = adminActor.role !== "owner";
      $("#groupControls").hidden = false;
      $("#groupAddForm").hidden = !["owner", "co_owner"].includes(adminActor.role);
      if (adminActor.role === "owner") {
        renderAdminFlags();
        await loadAdminList();
        try { await loadAccessKeyList(); } catch (error) { toast(error.message || "Не удалось загрузить ключи."); }
      }
      await loadGroupList();
    }
  } catch (error) {
    if (error.message && !error.message.includes("Нет прав доступа")) {
      $("#adminIdentity").textContent = error.message;
      const profileRole=$("#profileRole");
      if(profileRole)profileRole.textContent=error.message.includes("Сессия Telegram")?"Роль: повторно открой мини-приложение в Telegram":"Роль: сервер не подтвердил доступ";
      const profileStatus=$("#profileStatus");
      if(profileStatus)profileStatus.textContent="Не удалось подтвердить права доступа. Привилегированные действия остаются закрыты.";
    }
  }
}

if (adminConfigured) {
  fetch(ADMIN_API_ENDPOINT.replace(/\/+$/, "") + "/api/site-status", { cache: "no-store" })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      if (!data) return;
      adminFlags = { siteLocked: Boolean(data.siteLocked), botEnabled: Boolean(data.botEnabled) };
      renderAdminFlags();
    })
    .catch(() => {});
}
loadAdminPanel();

$("#adminLockToggle").addEventListener("click", async () => {
  const next = !adminFlags.siteLocked;
  const button = $("#adminLockToggle");
  button.disabled = true;
  try {
    const data = await adminRequest("/api/admin/site-lock", { method: "POST", body: JSON.stringify({ locked: next }) });
    adminFlags = { siteLocked: Boolean(data.siteLocked), botEnabled: Boolean(data.botEnabled) };
    renderAdminFlags();
    toast(next ? "Режим обслуживания включён." : "Режим обслуживания выключен.");
  } catch (error) {
    toast(error.message || "Не удалось изменить режим.");
  } finally { button.disabled = false; }
});

$("#adminBotToggle").addEventListener("click", async () => {
  const next = !adminFlags.botEnabled;
  const button = $("#adminBotToggle");
  button.disabled = true;
  try {
    const data = await adminRequest("/api/admin/bot", { method: "POST", body: JSON.stringify({ enabled: next }) });
    adminFlags = { siteLocked: Boolean(data.siteLocked), botEnabled: Boolean(data.botEnabled) };
    renderAdminFlags();
    toast(next ? "Флаг запуска бота включён." : "Флаг остановки бота включён.");
  } catch (error) {
    toast(error.message || "Не удалось изменить состояние бота.");
  } finally { button.disabled = false; }
});

$("#adminAddForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const telegramId = form.elements.telegramId.value.trim();
  if (!/^\d{1,20}$/.test(telegramId)) { toast("Введи корректный числовой Telegram ID."); return; }
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  try {
    await adminRequest("/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ telegramId, role: form.elements.role.value })
    });
    form.reset();
    toast("Роль администратора сохранена.");
    await loadAdminList();
  } catch (error) {
    toast(error.message || "Не удалось сохранить роль.");
  } finally { submit.disabled = false; }
});

$("#groupAddForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!adminActor || !["owner", "co_owner"].includes(adminActor.role)) { toast("Недостаточно прав для добавления группы."); return; }
  const form = event.currentTarget;
  const chatId = form.elements.chatId.value.trim();
  const title = form.elements.title.value.trim();
  if (!/^-?\d{1,20}$/.test(chatId) || !title) { toast("Проверь ID и название группы."); return; }
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  try {
    await adminRequest("/api/admin/groups", { method: "POST", body: JSON.stringify({ chatId, title }) });
    form.reset();
    toast("Группа добавлена.");
    await loadGroupList();
  } catch (error) {
    toast(error.message || "Не удалось добавить группу.");
  } finally { submit.disabled = false; }
});

$("#groupActionForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const chatId = form.elements.chatId.value;
  const userId = form.elements.userId.value.trim();
  const action = form.elements.action.value;
  if (!chatId || !/^\d{1,20}$/.test(userId)) { toast("Выбери группу и укажи числовой ID участника."); return; }
  if (["ban", "mute"].includes(action) && !window.confirm(action === "ban" ? "Заблокировать этого пользователя в выбранной группе?" : "Запретить участнику отправлять сообщения в выбранной группе?")) return;
  const submit = form.querySelector("button[type='submit']");
  submit.disabled = true;
  try {
    await adminRequest("/api/admin/group-action", { method: "POST", body: JSON.stringify({ chatId, userId, action }) });
    toast(({ ban: "Участник заблокирован.", unban: "Блокировка снята.", mute: "Участнику запрещено писать.", unmute: "Участнику снова разрешено писать." })[action] || "Действие выполнено.");
    form.elements.userId.value = "";
  } catch (error) {
    toast(error.message || "Telegram не выполнил действие. Проверь права бота.");
  } finally { submit.disabled = false; }
});


// Safe OSINT tools: public IP metadata and links to public username search.
function osintShowResult(box, lines) {
  box.replaceChildren();
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = String(line);
    box.append(p);
  }
}
$("#osintIpForm").addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.currentTarget;
  if (form.elements.website?.value) return;
  const ip = $("#osintIp").value.trim();
  const box = $("#osintIpResult");
  const validChars = /^[0-9a-fA-F:.]+$/.test(ip);
  const isIPv4 = /^(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ip);
  const isIPv6Like = ip.includes(":") && validChars && ip.length <= 45;
  if (!validChars || (!isIPv4 && !isIPv6Like) || ip.length > 45) {
    osintShowResult(box, ["Введи корректный публичный IPv4 или IPv6 адрес. Доменные имена в этом поле не поддерживаются."]);
    return;
  }
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Проверяем…";
  osintShowResult(box, ["Запрашиваем открытые сетевые сведения."]);
  try {
    const response = await fetch("https://hackmyip.com/api/lookup?ip=" + encodeURIComponent(ip), {headers: {"Accept":"application/json"}});
    if (!response.ok) throw new Error("HTTP " + response.status);
    const json = await response.json();
    const d = json && json.data ? json.data : json;
    const loc = d.location || {};
    const net = d.network || {};
    const privacy = d.privacy || {};
    const lines = [
      "IP: " + String(d.ip || ip),
      "Страна: " + String(loc.country_name || loc.country || "нет данных"),
      "Регион: " + String(loc.region || "нет данных"),
      "Город (примерно): " + String(loc.city || "нет данных"),
      "Провайдер/организация: " + String(net.isp || d.isp || "нет данных"),
      "ASN: " + String(net.asn || d.asn || "нет данных"),
      "VPN/прокси: " + (privacy.is_vpn === true ? "возможно используется VPN" : privacy.proxy === true ? "обнаружен прокси" : "не подтверждено"),
      "Важно: геолокация приблизительная; результат не устанавливает личность или домашний адрес."
    ];
    osintShowResult(box, lines);
  } catch (err) {
    osintShowResult(box, ["Не удалось получить данные. Сервис может быть временно недоступен или блокировать запросы браузера.", "Попробуй позже либо проверь IP на официальном сайте поставщика."]);
  } finally {
    btn.disabled = false; btn.textContent = "Проверить бесплатно";
  }
});
$("#osintUserForm").addEventListener("submit", e => {
  e.preventDefault();
  const username = $("#osintUsername").value.trim();
  const box = $("#osintUserResult");
  if (!/^[A-Za-z0-9_.-]{2,40}$/.test(username)) {
    osintShowResult(box, ["Допустимы латинские буквы, цифры, точка, подчёркивание и дефис; от 2 до 40 символов."]);
    return;
  }
  box.replaceChildren();
  const p = document.createElement("p");
  p.textContent = "Поиск открытых страниц по никнейму: " + username + ". Одинаковые никнеймы не доказывают, что профили принадлежат одному человеку.";
  box.append(p);
  const links = [
    ["Google", "https://www.google.com/search?q=" + encodeURIComponent('"' + username + '"')],
    ["GitHub", "https://github.com/search?q=" + encodeURIComponent(username) + "&type=users"],
    ["Reddit", "https://www.reddit.com/search/?q=" + encodeURIComponent(username)],
    ["YouTube", "https://www.youtube.com/results?search_query=" + encodeURIComponent(username)]
  ];
  for (const [label, href] of links) {
    const a = document.createElement("a");
    a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.className = "copy-id"; a.textContent = label + " ↗";
    box.append(a);
  }
});


// Optional relaxing background ambience (generated locally; no external track or tracking request).
// Audio starts only after the visitor presses the button because mobile browsers block autoplay.
(function setupRelaxMusic(){
  const button=document.querySelector("#relaxMusicButton");
  if(!button)return;
  let context=null,master=null,notes=[],timer=null,playing=false,step=0;
  const melody=[392,440,523.25,440,392,329.63,349.23,392,293.66,349.23,392,440,392,349.23,329.63,293.66];
  function stop(){
    playing=false;
    if(timer!==null){clearInterval(timer);timer=null}
    if(context&&master){try{master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(0.0001,context.currentTime,0.12)}catch(_){}}
    notes.forEach(n=>{try{n.osc.stop(context.currentTime+0.25)}catch(_){}});notes=[];
    button.textContent="♫ Включить музыку";button.setAttribute("aria-pressed","false");
  }
  async function start(){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){if(typeof toast==="function")toast("Браузер не поддерживает воспроизведение звука.");return}
    context=context&&context.state!=="closed"?context:new AC();
    if(context.state!=="running")await context.resume();
    if(context.state!=="running")throw new Error("AudioContext не перешёл в running");
    master=context.createGain();master.gain.value=0.0001;master.connect(context.destination);
    const pad=context.createOscillator(),padGain=context.createGain();
    pad.type="sine";pad.frequency.value=196;padGain.gain.value=0.11;pad.connect(padGain);padGain.connect(master);pad.start();
    const harmony=context.createOscillator(),harmonyGain=context.createGain();
    harmony.type="sine";harmony.frequency.value=246.94;harmonyGain.gain.value=0.055;harmony.connect(harmonyGain);harmonyGain.connect(master);harmony.start();
    notes.push({osc:pad,gain:padGain},{osc:harmony,gain:harmonyGain});
    const lead=context.createOscillator(),leadGain=context.createGain();
    lead.type="triangle";lead.frequency.value=melody[0];leadGain.gain.value=0.0001;lead.connect(leadGain);leadGain.connect(master);lead.start();
    notes.push({osc:lead,gain:leadGain});
    master.gain.setTargetAtTime(0.72,context.currentTime,0.7);
    leadGain.gain.setTargetAtTime(0.075,context.currentTime,0.8);
    step=0;
    timer=setInterval(()=>{
      if(!playing||!context||context.state!=="running")return;
      step=(step+1)%melody.length;
      lead.frequency.setTargetAtTime(melody[step],context.currentTime,0.16);
      if(step%4===0)pad.frequency.setTargetAtTime([196,174.61,146.83,164.81][Math.floor(step/4)],context.currentTime,0.8);
      if(step%4===0)harmony.frequency.setTargetAtTime([246.94,220,196,207.65][Math.floor(step/4)],context.currentTime,0.8);
    },720);
    playing=true;button.textContent="♫ Выключить музыку";button.setAttribute("aria-pressed","true");
  }
  button.addEventListener("click",async()=>{
    if(playing){stop();return}
    button.disabled=true;
    try{await start();if(!playing&&typeof toast==="function")toast("Не удалось включить звук. Проверь разрешение звука браузера.")}
    catch(_){if(typeof toast==="function")toast("Звук не запустился. Нажми ещё раз и проверь громкость устройства.")}
    finally{button.disabled=false}
  });
  document.addEventListener("visibilitychange",()=>{
    if(!context)return;
    if(document.hidden&&playing)context.suspend().catch(()=>{});
    else if(!document.hidden&&playing)context.resume().catch(()=>{});
  });
})();



// Access-key gate: requires a deployed Worker URL to become mandatory.

(function setupAccessGate(){
  const gate=$("#accessGate"),app=$("#luniumApp"),form=$("#accessKeyForm"),input=$("#accessKeyInput"),result=$("#accessKeyResult"),message=$("#accessGateMessage");
  if(!gate||!app||!form)return;
  if(!accessApiConfigured){
    gate.hidden=true;app.hidden=false;
    if(message)message.textContent="Сервис ключей ещё не подключён. После настройки сервера вход будет по ключу.";
    return;
  }
  let granted=false;
  try{granted=sessionStorage.getItem("lunium-access-granted")==="yes"}catch(_){}
  if(!granted){gate.hidden=false;app.hidden=true}
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const key=input.value.trim().toUpperCase();
    if(!/^LUN-(?:[A-F0-9]{8}-){3}[A-F0-9]{8}$/.test(key)){result.textContent="Проверь формат ключа.";return}
    const submit=form.querySelector('button[type="submit"]');
    submit.disabled=true;result.textContent="Проверяем ключ на сервере…";
    try{
      const response=await fetch(ACCESS_API_ENDPOINT.replace(/\/+$/,"")+"/api/access/validate",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify({key})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data.valid!==true)throw new Error(data.error||"Ключ недействителен.");
      try{sessionStorage.setItem("lunium-access-granted","yes")}catch(_){}
      gate.hidden=true;app.hidden=false;result.textContent="";toast("Доступ подтверждён.");
    }catch(error){result.textContent=error.message||"Не удалось проверить ключ. Попробуй позже."}
    finally{submit.disabled=false}
  });
})();

// Owner-only key generation, listing, and reset.

async function loadAccessKeyList(){
  const list=$("#accessKeyList");if(!list)return;
  list.replaceChildren();
  const data=await adminRequest("/api/admin/keys");
  const keys=Array.isArray(data.keys)?data.keys:[];
  if(!keys.length){const p=document.createElement("p");p.className="subtle-note";p.textContent="Ключей пока нет. Создай ключ здесь или командой /key 24 в боте.";list.append(p);return}
  keys.forEach(k=>{
    const row=document.createElement("div");row.className="admin-row key-row";
    const meta=document.createElement("div");meta.className="key-meta";
    const status=document.createElement("b");status.className="key-status "+(k.active?"active":"inactive");status.textContent=k.active?"АКТИВЕН":k.revoked_at?"ОТОЗВАН":"ИСТЁК";
    const expires=document.createElement("small");expires.textContent="Истекает: "+new Date(k.expires_at).toLocaleString("ru-RU");
    const usage=document.createElement("small");usage.textContent="Использований: "+String(k.used_count||0)+(k.last_used_at?" · последний вход: "+new Date(k.last_used_at).toLocaleString("ru-RU"):"");
    meta.append(status,expires,usage);row.append(meta);list.append(row);
  });
}
$("#accessKeyCreateForm")?.addEventListener("submit",async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button[type="submit"]'),hours=Number(form.elements.hours.value);
  button.disabled=true;
  try{
    const data=await adminRequest("/api/admin/keys",{method:"POST",body:JSON.stringify({hours})});
    const box=$("#accessKeyCreated");box.hidden=false;box.replaceChildren();
    const title=document.createElement("b");title.textContent="Новый ключ — скопируй сейчас, повторно он не показывается.";
    const code=document.createElement("p");code.textContent=data.key;code.style.cssText="font-weight:900;letter-spacing:1px;word-break:break-all";
    const copy=document.createElement("button");copy.type="button";copy.className="btn secondary";copy.textContent="Скопировать ключ";
    copy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(data.key);toast("Ключ скопирован.")}catch(_){toast("Выдели ключ и скопируй вручную.")}});
    box.append(title,code,copy);toast("Ключ создан.");await loadAccessKeyList();
  }catch(error){toast(error.message||"Не удалось создать ключ.")}
  finally{button.disabled=false}
});
$("#accessKeyRefresh")?.addEventListener("click",async()=>{try{await loadAccessKeyList();toast("Список обновлён.")}catch(error){toast(error.message||"Не удалось загрузить ключи.")}});
$("#accessKeyReset")?.addEventListener("click",async()=>{
  if(!window.confirm("Отозвать ВСЕ ключи доступа? Все пользователи должны будут получить новые ключи."))return;
  const button=$("#accessKeyReset");button.disabled=true;
  try{const data=await adminRequest("/api/admin/keys/reset",{method:"POST",body:"{}"});toast("Сброшено ключей: "+String(data.revoked||0));await loadAccessKeyList()}
  catch(error){toast(error.message||"Не удалось сбросить ключи.")}
  finally{button.disabled=false}
});
