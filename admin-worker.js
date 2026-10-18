const ALLOWED_ORIGIN = "https://efrizadiguzelova30-max.github.io";
const MAX_AUTH_AGE_SECONDS = 3600;
const MAX_BODY_BYTES = 10000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN, "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data", "Vary": "Origin", "X-Content-Type-Options": "nosniff"
  }});
}
function equal(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function hmac(keyBytes,message){const key=await crypto.subtle.importKey("raw",keyBytes,{name:"HMAC",hash:"SHA-256"},false,["sign"]);return new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(message)))}
function hex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function verifyInitData(raw,token){
  if(!raw||!token||raw.length>8192)return null;
  const p=new URLSearchParams(raw),received=p.get("hash"),date=Number(p.get("auth_date")),now=Math.floor(Date.now()/1000);
  if(!received||!Number.isFinite(date)||date>now+60||now-date>MAX_AUTH_AGE_SECONDS)return null;
  p.delete("hash");
  const check=[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+"="+v).join("\n");
  const secret=await hmac(new TextEncoder().encode("WebAppData"),token);
  if(!equal(hex(await hmac(secret,check)),received.toLowerCase()))return null;
  try{const u=JSON.parse(p.get("user")||"null");if(!u||!Number.isSafeInteger(Number(u.id))||Number(u.id)<=0)return null;return{id:String(u.id),firstName:String(u.first_name||"").slice(0,80)}}catch{return null}
}
async function bodyJson(request){
  const length=Number(request.headers.get("Content-Length")||0);if(length>MAX_BODY_BYTES)throw new Error("TOO_LARGE");
  const text=await request.text();if(text.length>MAX_BODY_BYTES)throw new Error("TOO_LARGE");
  try{return JSON.parse(text)}catch{throw new Error("BAD_JSON")}
}
async function getSetting(db,key,fallback){const r=await db.prepare("SELECT value FROM site_settings WHERE key = ?").bind(key).first();return r?r.value:fallback}
async function setSetting(db,key,value){await db.prepare("INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(key,value,new Date().toISOString()).run()}
async function audit(db,actor,action,target=""){await db.prepare("INSERT INTO audit_log(actor_telegram_id,action,target,created_at) VALUES(?,?,?,?)").bind(actor,action,String(target).slice(0,120),new Date().toISOString()).run()}
async function getStatus(db){return{siteLocked:(await getSetting(db,"site_locked","false"))==="true",botEnabled:(await getSetting(db,"bot_enabled","true"))==="true"}}
async function auth(request,env){
  if(!env.DB||!env.BOT_TOKEN||!env.OWNER_TELEGRAM_ID)return{error:json({error:"Admin API не настроен. Нужны D1 DB, BOT_TOKEN и OWNER_TELEGRAM_ID."},503)};
  const user=await verifyInitData(request.headers.get("X-Telegram-Init-Data")||"",env.BOT_TOKEN);
  if(!user)return{error:json({error:"Сессия Telegram недействительна или устарела."},401)};
  if(user.id===String(env.OWNER_TELEGRAM_ID))return{user,role:"owner"};
  const row=await env.DB.prepare("SELECT role FROM admins WHERE telegram_id=?").bind(user.id).first();
  if(!row||!["admin","co_owner"].includes(row.role))return{error:json({error:"Нет прав доступа."},403)};
  return{user,role:row.role};
}

async function telegramSend(env, chatId, text) {
  if (!env.BOT_TOKEN) return;
  await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
  });
}

async function handleTelegramWebhook(request, env) {
  if (!env.TELEGRAM_WEBHOOK_SECRET) return json({ error: "Webhook secret is not configured." }, 503);
  const supplied = request.headers.get("X-Telegram-Bot-Api-Secret-Token") || "";
  if (!equal(supplied, env.TELEGRAM_WEBHOOK_SECRET)) return json({ error: "Forbidden." }, 403);
  if (!env.DB || !env.BOT_TOKEN) return json({ error: "Bot service is not configured." }, 503);
  let update;
  try { update = await bodyJson(request); }
  catch (error) { return json({ error: error.message === "TOO_LARGE" ? "Payload too large." : "Invalid JSON." }, error.message === "TOO_LARGE" ? 413 : 400); }

  const message = update && (update.message || update.edited_message);
  if (!message || !message.chat || !message.from || typeof message.text !== "string") return json({ ok: true });
  if ((await getSetting(env.DB, "bot_enabled", "true")) !== "true") return json({ ok: true, disabled: true });

  const chatId = message.chat.id;
  const command = message.text.trim().split(/\s+/)[0].split("@")[0].toLowerCase();
  const commands = {
    "/start": "Привет! Я бот GameHub. Используй /help, чтобы увидеть доступные команды.",
    "/help": "Команды GameHub:\n/start — запуск\n/help — помощь\n/status — состояние сервиса\n/groupid — ID текущего чата (в группах).",
    "/status": "Состояние GameHub: бот включён. Настройки сайта и права управления доступны владельцу через защищённую мини-панель."
  };
  if (command === "/groupid") {
    const type = message.chat.type;
    await telegramSend(env, chatId, type === "group" || type === "supergroup"
      ? "ID этой группы: " + String(chatId) + ". Передавай его только доверенным администраторам."
      : "Команда /groupid предназначена для групп и супергрупп.");
  } else if (commands[command]) {
    await telegramSend(env, chatId, commands[command]);
  }
  return json({ ok: true });
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/telegram/webhook")return request.method==="POST"?handleTelegramWebhook(request,env):json({error:"Method not allowed."},405);
  if(request.headers.get("Origin")!==ALLOWED_ORIGIN)return json({error:"Origin not allowed."},403);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"GET, POST, DELETE, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-Telegram-Init-Data","Access-Control-Max-Age":"86400","Vary":"Origin"}});
  if(url.pathname==="/api/site-status"&&request.method==="GET")return env.DB?json({...await getStatus(env.DB),configured:true}):json({siteLocked:false,botEnabled:true,configured:false});
  if(!url.pathname.startsWith("/api/admin/"))return json({error:"Not found."},404);
  if(!["GET","POST","DELETE"].includes(request.method))return json({error:"Method not allowed."},405);
  const a=await auth(request,env);if(a.error)return a.error;
  const {user,role}=a,owner=role==="owner",db=env.DB;
  if(url.pathname==="/api/admin/status"&&request.method==="GET")return json({...await getStatus(db),actor:{id:user.id,role}});
  if(url.pathname==="/api/admin/site-lock"&&request.method==="POST"){
    if(!owner)return json({error:"Только владелец может блокировать сайт."},403);
    let b;try{b=await bodyJson(request)}catch(e){return json({error:e.message==="TOO_LARGE"?"Слишком большой запрос.":"Некорректный JSON."},e.message==="TOO_LARGE"?413:400)}
    if(typeof b.locked!=="boolean")return json({error:"locked должен быть true или false."},400);
    await setSetting(db,"site_locked",String(b.locked));await audit(db,user.id,b.locked?"site_lock_enabled":"site_lock_disabled");return json(await getStatus(db));
  }
  if(url.pathname==="/api/admin/bot"&&request.method==="POST"){
    if(!owner)return json({error:"Только владелец может менять состояние бота."},403);
    let b;try{b=await bodyJson(request)}catch(e){return json({error:e.message==="TOO_LARGE"?"Слишком большой запрос.":"Некорректный JSON."},e.message==="TOO_LARGE"?413:400)}
    if(typeof b.enabled!=="boolean")return json({error:"enabled должен быть true или false."},400);
    await setSetting(db,"bot_enabled",String(b.enabled));await audit(db,user.id,b.enabled?"bot_enabled":"bot_disabled");return json(await getStatus(db));
  }
  if(url.pathname==="/api/admin/admins"&&request.method==="GET"){
    if(!owner)return json({error:"Список администраторов доступен только владельцу."},403);
    const r=await db.prepare("SELECT telegram_id,role,created_by,created_at FROM admins ORDER BY created_at DESC LIMIT 200").all();return json({admins:r.results||[]});
  }
  if(url.pathname==="/api/admin/admins"&&request.method==="POST"){
    if(!owner)return json({error:"Добавлять администраторов может только владелец."},403);
    let b;try{b=await bodyJson(request)}catch(e){return json({error:e.message==="TOO_LARGE"?"Слишком большой запрос.":"Некорректный JSON."},e.message==="TOO_LARGE"?413:400)}
    const target=String(b.telegramId||"");if(!/^\d{1,20}$/.test(target)||target===String(env.OWNER_TELEGRAM_ID))return json({error:"Укажи корректный Telegram ID другого пользователя."},400);
    if(!["admin","co_owner"].includes(b.role))return json({error:"Роль должна быть admin или co_owner."},400);
    await db.prepare("INSERT INTO admins(telegram_id,role,created_by,created_at) VALUES(?,?,?,?) ON CONFLICT(telegram_id) DO UPDATE SET role=excluded.role,created_by=excluded.created_by,created_at=excluded.created_at").bind(target,b.role,user.id,new Date().toISOString()).run();
    await audit(db,user.id,"admin_role_set",target+":"+b.role);return json({ok:true});
  }
  if(url.pathname==="/api/admin/admins"&&request.method==="DELETE"){
    if(!owner)return json({error:"Удалять администраторов может только владелец."},403);
    const target=url.searchParams.get("telegramId")||"";if(!/^\d{1,20}$/.test(target)||target===String(env.OWNER_TELEGRAM_ID))return json({error:"Укажи корректный Telegram ID администратора."},400);
    const r=await db.prepare("DELETE FROM admins WHERE telegram_id=?").bind(target).run();await audit(db,user.id,"admin_removed",target);return json({ok:true,removed:r.meta?.changes||0});
  }

  if(url.pathname==="/api/admin/groups"&&request.method==="GET"){
    const r=await db.prepare("SELECT chat_id,title,added_by,created_at FROM managed_groups ORDER BY created_at DESC LIMIT 200").all();
    return json({groups:r.results||[]});
  }
  if(url.pathname==="/api/admin/groups"&&request.method==="POST"){
    if(!["owner","co_owner"].includes(role))return json({error:"Добавлять группы может владелец или совладелец."},403);
    let b;try{b=await bodyJson(request)}catch(e){return json({error:e.message==="TOO_LARGE"?"Слишком большой запрос.":"Некорректный JSON."},e.message==="TOO_LARGE"?413:400)}
    const chatId=String(b.chatId||"").trim(),title=String(b.title||"").trim().slice(0,100);
    if(!/^-?\d{1,20}$/.test(chatId)||!title)return json({error:"Нужны числовой ID группы и название."},400);
    await db.prepare("INSERT INTO managed_groups(chat_id,title,added_by,created_at) VALUES(?,?,?,?) ON CONFLICT(chat_id) DO UPDATE SET title=excluded.title,added_by=excluded.added_by,created_at=excluded.created_at").bind(chatId,title,user.id,new Date().toISOString()).run();
    await audit(db,user.id,"group_registered",chatId);
    return json({ok:true});
  }
  if(url.pathname==="/api/admin/groups"&&request.method==="DELETE"){
    if(!["owner","co_owner"].includes(role))return json({error:"Удалять группы может владелец или совладелец."},403);
    const chatId=url.searchParams.get("chatId")||"";
    if(!/^-?\d{1,20}$/.test(chatId))return json({error:"Некорректный ID группы."},400);
    const r=await db.prepare("DELETE FROM managed_groups WHERE chat_id=?").bind(chatId).run();
    await audit(db,user.id,"group_unregistered",chatId);
    return json({ok:true,removed:r.meta?.changes||0});
  }
  if(url.pathname==="/api/admin/group-action"&&request.method==="POST"){
    let b;try{b=await bodyJson(request)}catch(e){return json({error:e.message==="TOO_LARGE"?"Слишком большой запрос.":"Некорректный JSON."},e.message==="TOO_LARGE"?413:400)}
    const chatId=String(b.chatId||"").trim(),userId=String(b.userId||"").trim(),action=b.action;
    if(!/^-?\d{1,20}$/.test(chatId)||!/^\d{1,20}$/.test(userId)||!Number.isSafeInteger(Number(chatId))||!Number.isSafeInteger(Number(userId))||!["ban","unban","mute","unmute"].includes(action))return json({error:"Проверь ID группы, ID пользователя и действие."},400);
    if(env.OWNER_TELEGRAM_ID&&userId===String(env.OWNER_TELEGRAM_ID))return json({error:"Действие над владельцем GameHub запрещено."},403);
    const group=await db.prepare("SELECT chat_id FROM managed_groups WHERE chat_id=?").bind(chatId).first();
    if(!group)return json({error:"Эта группа не зарегистрирована в GameHub."},404);
    if(!env.BOT_TOKEN)return json({error:"BOT_TOKEN не настроен."},503);
    const method=action==="ban"?"banChatMember":action==="unban"?"unbanChatMember":"restrictChatMember";
    const payload={chat_id:chatId,user_id:Number(userId)};
    if(action==="unban")payload.only_if_banned=true;
    if(action==="mute") { payload.permissions={can_send_messages:false,can_send_audios:false,can_send_documents:false,can_send_photos:false,can_send_videos:false,can_send_video_notes:false,can_send_voice_notes:false,can_send_polls:false,can_send_other_messages:false,can_add_web_page_previews:false}; payload.use_independent_chat_permissions=true; }
    if(action==="unmute") { payload.permissions={can_send_messages:true,can_send_audios:true,can_send_documents:true,can_send_photos:true,can_send_videos:true,can_send_video_notes:true,can_send_voice_notes:true,can_send_polls:true,can_send_other_messages:true,can_add_web_page_previews:true}; payload.use_independent_chat_permissions=true; }
    let upstream;
    try{
      upstream=await fetch("https://api.telegram.org/bot"+env.BOT_TOKEN+"/"+method,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    }catch{return json({error:"Не удалось связаться с Telegram."},502)}
    const result=await upstream.json().catch(()=>({}));
    if(!upstream.ok||result.ok!==true)return json({error:"Telegram отклонил действие. Проверь ID и права бота в группе."},502);
    await audit(db,user.id,"group_"+action,chatId+":"+userId);
    return json({ok:true,action,chatId,userId});
  }
  return json({error:"Not found."},404);
}};
