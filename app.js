const lessons=[
['فصل اول: آفرینش','۱','آفریدگار زیبایی'],['فصل اول: آفرینش','۲','کوچ پرستوها'],['فصل دوم: دانایی و هوشیاری','۳','راز نشانه‌ها'],['فصل دوم: دانایی و هوشیاری','۴','ارزش علم'],['فصل دوم: دانایی و هوشیاری','۵','رهایی از قفس'],['فصل سوم: ایران من','۶','آرش کمانگیر'],['فصل سوم: ایران من','۷','مهمان شهر ما'],['فصل چهارم: فرهنگ بومی','۸','درس آزاد'],['فصل چهارم: فرهنگ بومی','۹','درس آزاد'],['فصل پنجم: نام‌آوران','۱۰','باغچه اطفال'],['فصل پنجم: نام‌آوران','۱۱','فرمانده دل‌ها'],['فصل پنجم: نام‌آوران','۱۲','اتفاق ساده'],['فصل ششم: راه زندگی','۱۳','لطف حق'],['فصل ششم: راه زندگی','۱۴','ادب از که آموختی؟'],['فصل ششم: راه زندگی','۱۵','شیر و موش'],['فصل هفتم: علم و عمل','۱۶','پرسشگری'],['فصل هفتم: علم و عمل','۱۷','مدرسه هوشمند']];
const chapters={
'فصل اول: آفرینش':['آفریدگار زیبایی','کوچ پرستوها'],'فصل دوم: دانایی و هوشیاری':['راز نشانه‌ها','ارزش علم','رهایی از قفس'],'فصل سوم: ایران من':['آرش کمانگیر','مهمان شهر ما'],'فصل چهارم: فرهنگ بومی':['درس آزاد','درس آزاد'],'فصل پنجم: نام‌آوران':['باغچه اطفال','فرمانده دل‌ها','اتفاق ساده'],'فصل ششم: راه زندگی':['لطف حق','ادب از که آموختی؟','شیر و موش'],'فصل هفتم: علم و عمل':['پرسشگری','مدرسه هوشمند']};
const lessonHints={
'آفریدگار زیبایی':['مشاهده و گفت‌وگو درباره زیبایی‌های طبیعت','واژه‌آموزی و توصیف','درک مطلب و دلیل‌آوری','خوانش با لحن','نوشتن یک توصیف کوتاه'],
'کوچ پرستوها':['پیش‌بینی موضوع','گوش دادن و بازگویی','واژه‌های دشوار','درک ترتیب رویدادها','نوشتن یک پیام برای پرستوها'],
'راز نشانه‌ها':['بازی کارآگاه نشانه‌ها','حدس بر اساس نشانه‌ها','درست و نادرست','واژه‌های هم‌آوا','قصه‌گویی'],
'ارزش علم':['پرسش آغازین','گفت‌وگوی سقراطی','واژه و جمله','درک مطلب','جمع‌بندی یک دقیقه‌ای'],
'رهایی از قفس':['تصویرسازی ذهنی','پرسش‌های چرا','واژه‌های هم‌معنی','قصه‌گویی','پیام داستان'],
'آرش کمانگیر':['نقشه داستان','شخصیت و هدف','واژه‌های حماسی','خوانش آهنگین','ساخت پایان جایگزین'],
'مهمان شهر ما':['معرفی شهر','نشانه‌های فرهنگی','مصاحبه کلاسی','واژه‌سازی','نامه به یک مهمان'],
'درس آزاد':['محتوای بومی کلاس','جمع‌آوری واژه‌های محلی','قصه یا خاطره','ارائه دانش‌آموز','ساخت صفحه مجله کلاس'],
'باغچه اطفال':['مشاهده شخصیت‌ها','نقش‌آفرینی','واژه‌آموزی','سؤال از متن','یک پاراگراف خلاق'],
'فرمانده دل‌ها':['شناخت شخصیت','ویژگی‌های اخلاقی','گفت‌وگو','درک مطلب','نوشتن یک پیام'],
'اتفاق ساده':['پیش‌بینی','علت و معلول','واژه‌آموزی','قصه‌گویی','بازنویسی'],
'لطف حق':['خوانش شعر','معنی واژه‌ها','پیام شعر','تکمیل مصراع','بازگویی مفهوم'],
'ادب از که آموختی؟':['نقش‌آفرینی','موقعیت‌های واقعی','واژه و جمله','درک پیام','یک قانون طلایی ادب'],
'شیر و موش':['نقش‌آفرینی داستان','ترتیب رویدادها','مترادف و متضاد','پایان دیگر','پیام داستان'],
'پرسشگری':['ساخت سؤال خوب','کارآگاه سؤال','طبقه‌بندی سؤال‌ها','گفت‌وگوی گروهی','ثبت یک پرسش تازه'],
'مدرسه هوشمند':['ایده‌پردازی','فناوری و یادگیری','واژه‌های مرتبط','طراحی کلاس آینده','ارائه کوتاه']};
let S=JSON.parse(localStorage.getItem('farsiyar-pro')||'null')||{classCode:'FAR-4821',lesson:0,mission:null,responses:[],scores:{},notice:'',teacher:false};
function save(){localStorage.setItem('farsiyar-pro',JSON.stringify(S))}function toast(x){let t=document.getElementById('toast');t.textContent=x;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function go(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');scrollTo(0,0)}
function openTeacher(){go('teacher')}function openBook(){go('book')}
function loginTeacher(){if(document.getElementById('teacherPass').value==='19121912'){S.teacher=true;save();showTeacher();toast('به اتاق فرمان خوش آمدی 👩‍🏫')}else toast('رمز اشتباه است')}
function showTeacher(){document.getElementById('teacherLogin').classList.add('hidden');document.getElementById('teacherPanel').classList.remove('hidden');document.getElementById('classCode').textContent=S.classCode;updateLesson();renderScores();renderResponses()}
function newClass(){S.classCode='FAR-'+Math.floor(1000+Math.random()*9000);save();document.getElementById('classCode').textContent=S.classCode;toast('کد کلاس جدید ساخته شد')}
function updateLesson(){let i=+document.getElementById('lessonSelect').value;S.lesson=i;save();let [ch,n,title]=lessons[i];document.getElementById('lessonInfo').innerHTML=`<span class="eyebrow">${ch} • درس ${n}</span><h3>${title}</h3><p>این درس را با مسیر پیشنهادی اجرا کن؛ هر مرحله را می‌توانی به ابزار زنده تبدیل کنی.</p>`;document.getElementById('route').innerHTML=lessonHints[title].map((x,j)=>`<div class="step"><span>${['🎬','🔎','🧩','🎤','✍️'][j]}</span><b>مرحله ${j+1}</b><small>${x}</small></div>`).join('');renderTools()}
const tools=[['warm','🔥','شروع جذاب'],['word','🔤','آزمایشگاه واژه'],['dict','✏️','املای هوشمند'],['comprehend','🧠','درک مطلب'],['poem','🎵','شعر را کامل کن'],['story','🎭','صندلی قصه‌گویی'],['sentence','🧩','جمله‌ساز'],['quiz','🎯','مسابقه چهارگزینه‌ای'],['spin','🎲','گردونه کلاس'],['timer','⏱️','زمان‌سنج'],['notice','📢','پیام معلم'],['book','📖','نمایش صفحه کتاب']];
function renderTools(){document.getElementById('toolCards').innerHTML=tools.map(t=>`<div class="toolCard" onclick="tool('${t[0]}')"><div class="ico">${t[1]}</div><b>${t[2]}</b></div>`).join('')}
function tool(type){let title=lessons[S.lesson][2],a=document.getElementById('toolArea');
if(type==='warm')a.innerHTML=`<h3>🔥 شروع جذاب: ${title}</h3><div class="questionBox">اگر تو معلم بودی، قبل از خواندن این درس چه سؤالی از بچه‌ها می‌پرسیدی تا کنجکاو شوند؟</div><div class="row"><button class="primary" onclick="startCustom('پرسش آغازین','هر دانش‌آموز یک حدس یا سؤال جذاب بنویسد.')">ارسال به کلاس</button><button onclick="randomPrompt()">🎲 سؤال تصادفی</button></div><p id="randomOut"></p>`;
if(type==='word')a.innerHTML=`<h3>🔤 آزمایشگاه واژه</h3><p>واژه را وارد کن تا کلاس درباره معنی، هم‌خانواده یا مترادف آن فعالیت کند.</p><input id="wordInput" placeholder="مثلاً: دانش، تلاش، شگفتی"><div class="row"><button class="primary" onclick="wordMission('معنی و کاربرد')">معنی و کاربرد</button><button onclick="wordMission('مترادف و متضاد')">مترادف/متضاد</button><button onclick="wordMission('جمله‌سازی')">جمله‌سازی</button></div>`;
if(type==='dict')a.innerHTML=`<h3>✏️ املای هوشمند</h3><p>معلم یک واژه یا جمله را وارد کند؛ سپس آن را به مأموریت کلاسی تبدیل کن.</p><textarea id="dictInput" placeholder="جمله یا واژه‌های املا..."></textarea><button class="primary" onclick="startCustom('املای کلاس',document.getElementById('dictInput').value)">شروع املا</button>`;
if(type==='comprehend')a.innerHTML=`<h3>🧠 درک مطلب</h3><p>یک سؤال متنی برای گفت‌وگوی کلاسی بساز.</p><textarea id="compInput" placeholder="سؤال درک مطلب..."></textarea><button class="primary" onclick="startCustom('درک مطلب',document.getElementById('compInput').value)">پرسش از کلاس</button>`;
if(type==='poem')a.innerHTML=`<h3>🎵 شعر را کامل کن</h3><p>معلم بخش ناقص شعر/مصراع را خودش وارد می‌کند تا دانش‌آموزان ادامه را حدس بزنند.</p><textarea id="poemInput" placeholder="بخش شعر یا مصراع ناقص..."></textarea><input id="poemKey" placeholder="پاسخ/ادامه صحیح (اختیاری)"><button class="primary" onclick="startCustom('شعر را کامل کن',document.getElementById('poemInput').value,document.getElementById('poemKey').value)">شروع مسابقه</button>`;
if(type==='story')a.innerHTML=`<h3>🎭 صندلی قصه‌گویی</h3><p>دانش‌آموز باید داستان را با لحن و ترتیب رویدادها ادامه دهد.</p><input id="storyPrompt" placeholder="شروع داستان..."><button class="primary" onclick="startCustom('صندلی قصه‌گویی',document.getElementById('storyPrompt').value)">صندلی را آماده کن</button>`;
if(type==='sentence')a.innerHTML=`<h3>🧩 جمله‌ساز</h3><p>واژه‌ها را وارد کن تا دانش‌آموزان از آن‌ها جمله بسازند.</p><input id="sentInput" placeholder="مثلاً: دانش‌آموز / کتاب / خواند"><button class="primary" onclick="startCustom('جمله‌سازی',document.getElementById('sentInput').value)">ارسال به کلاس</button>`;
if(type==='quiz')a.innerHTML=`<h3>🎯 مسابقه چهارگزینه‌ای</h3><input id="qInput" placeholder="سؤال"><input id="q1" placeholder="گزینه ۱"><input id="q2" placeholder="گزینه ۲"><input id="q3" placeholder="گزینه ۳"><input id="q4" placeholder="گزینه ۴"><select id="correct"><option value="1">پاسخ ۱</option><option value="2">پاسخ ۲</option><option value="3">پاسخ ۳</option><option value="4">پاسخ ۴</option></select><button class="primary" onclick="quizMission()">شروع مسابقه</button>`;
if(type==='spin')a.innerHTML=`<h3>🎲 گردونه کلاس</h3><p>برای مشارکت تصادفی یک مأموریت انتخاب کن.</p><button class="primary" onclick="spin()">چرخاندن گردونه 🎲</button><div id="spinOut" class="questionBox">آماده‌ای؟</div>`;
if(type==='timer')a.innerHTML=`<h3>⏱️ زمان‌سنج فعالیت</h3><input id="mins" type="number" min="1" max="60" value="3"><button class="primary" onclick="runTimer()">شروع</button><div id="clock" class="questionBox">03:00</div>`;
if(type==='notice')a.innerHTML=`<h3>📢 پیام معلم</h3><textarea id="noticeInput" placeholder="مثلاً: تا دو دقیقه دیگر پاسخ‌ها را ارسال کنید.">${S.notice}</textarea><button class="primary" onclick="sendNotice()">نمایش برای کلاس</button>`;
if(type==='book')a.innerHTML=`<h3>📖 کتاب فارسی چهارم</h3><p>صفحهٔ کامل کتاب در فایل پروژه قرار دارد.</p><a class="pdfBtn" href="book/chaharom-farsi-1404.pdf" target="_blank">باز کردن کتاب</a>`;
}
function startCustom(kind,prompt,key=''){if(!prompt){toast('متن فعالیت را وارد کن');return}S.mission={kind,prompt,key,lesson:lessons[S.lesson][2],at:Date.now()};save();renderMission();toast('مأموریت برای کلاس آماده شد 🚀')}
function wordMission(mode){let w=document.getElementById('wordInput').value;if(!w){toast('یک واژه وارد کن');return}startCustom(mode,`واژه «${w}» را بررسی کن و ${mode} را انجام بده.`)}
function quizMission(){let q=document.getElementById('qInput').value;if(!q)return toast('سؤال را وارد کن');let opts=[1,2,3,4].map(i=>document.getElementById('q'+i).value);startCustom('مسابقه چهارگزینه‌ای',JSON.stringify({q,opts}),document.getElementById('correct').value)}
function renderMission(){let m=S.mission;document.getElementById('missionBox').innerHTML=m?`<b>${m.kind}</b><p>${formatMission(m)}</p><small>درس: ${m.lesson}</small>`:'هنوز فعالیتی شروع نشده.';renderStudentMission()}
function formatMission(m){if(m.kind==='مسابقه چهارگزینه‌ای'){let x=JSON.parse(m.prompt);return `<div class="questionBox">${x.q}<div class="options">${x.opts.map((o,i)=>`<button>${i+1}) ${o}</button>`).join('')}</div></div>`}return m.prompt}
function startMission(){if(!S.mission){let title=lessons[S.lesson][2];startCustom('فعالیت فوری',`هر دانش‌آموز درباره «${title}» یک نکته، سؤال یا برداشت خود را بنویسد.`)}else toast('مأموریت فعلی فعال است')}
function stopMission(){S.mission=null;save();renderMission();toast('مأموریت پایان یافت')}
function renderResponses(){let r=document.getElementById('responses');r.innerHTML=S.responses.length?S.responses.slice().reverse().map(x=>`<div class="response"><b>${x.name}</b><small> • ${x.kind}</small><p>${escapeHtml(x.answer)}</p></div>`).join(''):'هنوز پاسخی ثبت نشده.'}
function joinStudent(){let n=document.getElementById('studentName').value.trim(),c=document.getElementById('studentCode').value.trim();if(!n||c!==S.classCode){toast('نام یا کد کلاس درست نیست');return}localStorage.setItem('studentName',n);document.querySelector('.studentJoin').classList.add('hidden');document.getElementById('studentRoom').classList.remove('hidden');document.getElementById('studentWelcome').textContent=`سلام ${n} 👋 آماده‌ای؟`;renderStudentMission();toast('وارد کلاس شدی')}
function renderStudentMission(){let box=document.getElementById('studentMission');if(!box)return;if(!S.mission){box.innerHTML='<div class="missionBox">منتظر مأموریت معلم باش...</div>';return}box.innerHTML=`<div class="missionBox"><span class="eyebrow">${S.mission.kind}</span><h3>${S.mission.lesson}</h3><p>${formatMission(S.mission)}</p></div>`}
function submitStudentAnswer(){let a=document.getElementById('studentAnswer').value.trim(),n=localStorage.getItem('studentName')||'دانش‌آموز';if(!a||!S.mission){toast('اول مأموریت فعال باشد و پاسخ را بنویس');return}S.responses.push({name:n,kind:S.mission.kind,answer:a,time:new Date().toLocaleString('fa-IR')});S.scores[n]=(S.scores[n]||0)+1;save();document.getElementById('studentAnswer').value='';toast('پاسخ ثبت شد ⭐');}
function renderScores(){let e=document.getElementById('scoreTable');let arr=Object.entries(S.scores).sort((a,b)=>b[1]-a[1]);e.innerHTML=arr.length?'<div class="scoreRow"><b>دانش‌آموز</b><b>امتیاز</b><b>رتبه</b></div>'+arr.map((x,i)=>`<div class="scoreRow"><span>${x[0]}</span><b>${x[1]} ⭐</b><span>${i+1}</span></div>`).join(''):'هنوز امتیازی ثبت نشده.'}
function clearScores(){S.scores={};save();renderScores();toast('امتیازها پاک شد')}
function randomPrompt(){let p=['اگر عنوان درس را عوض می‌کردی چه می‌گذاشتی؟','کدام واژهٔ درس برایت جالب‌تر است و چرا؟','اگر جای شخصیت اصلی بودی چه می‌کردی؟','از این درس چه چیزی می‌توانی در زندگی واقعی استفاده کنی؟'];document.getElementById('randomOut').textContent=p[Math.floor(Math.random()*p.length)]}
function spin(){let x=['یک سؤال بساز','یک واژه را توضیح بده','یک جمله بساز','داستان را ادامه بده','پیام درس را بگو','یک نفر را برای قصه‌گویی انتخاب کن'];document.getElementById('spinOut').textContent=x[Math.floor(Math.random()*x.length)]}
let timer;function runTimer(){clearInterval(timer);let sec=(+document.getElementById('mins').value||3)*60;let el=document.getElementById('clock');timer=setInterval(()=>{let m=Math.floor(sec/60),s=sec%60;el.textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(--sec<0){clearInterval(timer);toast('زمان فعالیت تمام شد ⏰')}},1000)}
function sendNotice(){S.notice=document.getElementById('noticeInput').value;save();toast('پیام برای کلاس ثبت شد 📢')}
function escapeHtml(x){return String(x).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function exportData(){let blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='farsiyar-backup.json';a.click()}
function printReport(){let w=open('','_blank');w.document.write(`<html dir=rtl><body style="font-family:tahoma;padding:30px"><h1>گزارش جلسه فارسی‌یار</h1><p>درس: ${lessons[S.lesson][2]}</p><p>کد کلاس: ${S.classCode}</p><h2>پاسخ‌ها</h2>${S.responses.map(x=>`<p><b>${x.name}</b>: ${escapeHtml(x.answer)}</p>`).join('')}</body></html>`);w.print()}
function resetAll(){if(confirm('همه داده‌های محلی پاک شود؟')){localStorage.removeItem('farsiyar-pro');location.reload()}}
function clearBoard(){ctx.clearRect(0,0,canvas.width,canvas.height)}
let canvas,ctx,drawing=false;function initBoard(){canvas=document.getElementById('canvas');ctx=canvas.getContext('2d');canvas.addEventListener('pointerdown',e=>{drawing=true;ctx.beginPath();ctx.moveTo(...pos(e))});canvas.addEventListener('pointermove',e=>{if(!drawing)return;ctx.lineWidth=+document.getElementById('penSize').value;ctx.lineCap='round';ctx.lineTo(...pos(e));ctx.stroke()});['pointerup','pointerleave'].forEach(e=>canvas.addEventListener(e,()=>drawing=false))}function pos(e){let r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height]}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tabPage').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById(b.dataset.tab).classList.add('active');if(b.dataset.tab==='scores')renderScores();if(b.dataset.tab==='live'){renderMission();renderResponses()}});
document.getElementById('teacherBtn').onclick=openTeacher;document.getElementById('studentBtn').onclick=()=>go('student');document.getElementById('lessonSelect').innerHTML=lessons.map((x,i)=>`<option value="${i}">درس ${x[1]} — ${x[2]}</option>`).join('');document.getElementById('lessonSelect').onchange=updateLesson;document.getElementById('lessonSelect').value=S.lesson;
document.getElementById('chapters').innerHTML=Object.entries(chapters).map(([c,l])=>`<article class="chapter"><h3>${c}</h3><div class="lessonList">${l.map(x=>`<span class="lessonChip">${x}</span>`).join('')}</div></article>`).join('');initBoard();if(S.teacher)showTeacher();else updateLesson();renderStudentMission();setInterval(()=>{if(document.getElementById('teacherPanel')&&!document.getElementById('teacherPanel').classList.contains('hidden')){renderMission();renderResponses();}},1500);

/* ====== همگام‌سازی چنددستگاهی فارسی‌یار ====== */
let cloud=null, realtime=null, cloudReady=false;
const originalSave=save;
function cloudConfigured(){return !!(window.FARSYAR_SUPABASE_URL && window.FARSYAR_SUPABASE_ANON_KEY)}
async function initCloud(){
  if(!cloudConfigured() || !window.supabase){return false}
  try{
    cloud=window.supabase.createClient(window.FARSYAR_SUPABASE_URL,window.FARSYAR_SUPABASE_ANON_KEY);
    cloudReady=true;
    return true;
  }catch(e){console.warn('Supabase init failed',e);return false}
}
async function createCloudClass(){
  if(!cloudReady)return false;
  const code='FAR-'+Math.floor(1000+Math.random()*9000);
  const {error}=await cloud.from('farsiyar_classes').insert({room_code:code,title:'کلاس فارسی چهارم',lesson_index:S.lesson,mission:null,notice:''});
  if(error){console.error(error);toast('اتصال ابری آماده نیست؛ تنظیمات Supabase را بررسی کن');return false}
  S.classCode=code; S.responses=[]; S.scores={}; S.mission=null; S.notice=''; originalSave();
  document.getElementById('classCode').textContent=code;
  subscribeRoom(code);
  toast('کلاس آنلاین جدید ساخته شد 🌐');
  return true;
}
async function loadCloudClass(code){
  if(!cloudReady)return null;
  const {data,error}=await cloud.from('farsiyar_classes').select('*').eq('room_code',code).maybeSingle();
  if(error||!data)return null;
  S.classCode=code; S.lesson=data.lesson_index||0; S.mission=data.mission||null; S.notice=data.notice||'';
  const [rr,ss]=await Promise.all([
    cloud.from('farsiyar_responses').select('*').eq('room_code',code).order('created_at',{ascending:true}),
    cloud.from('farsiyar_scores').select('*').eq('room_code',code)
  ]);
  S.responses=(rr.data||[]).map(x=>({name:x.student_name,kind:x.kind,answer:x.answer,time:new Date(x.created_at).toLocaleString('fa-IR')}));
  S.scores={}; (ss.data||[]).forEach(x=>S.scores[x.student_name]=x.points);
  originalSave(); subscribeRoom(code); return data;
}
function subscribeRoom(code){
  if(!cloudReady)return;
  if(realtime)cloud.removeChannel(realtime);
  realtime=cloud.channel('farsiyar-room-'+code)
   .on('postgres_changes',{event:'*',schema:'public',table:'farsiyar_classes',filter:`room_code=eq.${code}`},payload=>{
      if(payload.eventType==='DELETE')return;
      const x=payload.new||{}; S.lesson=x.lesson_index??S.lesson; S.mission=x.mission||null; S.notice=x.notice||''; originalSave();
      renderMission();renderStudentMission();renderResponses();renderScores();
   })
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'farsiyar_responses',filter:`room_code=eq.${code}`},payload=>{
      const x=payload.new; if(!S.responses.some(r=>r.id===x.id)){S.responses.push({id:x.id,name:x.student_name,kind:x.kind,answer:x.answer,time:new Date(x.created_at).toLocaleString('fa-IR')});originalSave();renderResponses()}
   })
   .on('postgres_changes',{event:'*',schema:'public',table:'farsiyar_scores',filter:`room_code=eq.${code}`},payload=>{
      const x=payload.new||payload.old; if(x?.student_name){S.scores[x.student_name]=x.points;originalSave();renderScores()}
   })
   .subscribe();
}
async function cloudUpdateClass(patch){
  if(!cloudReady)return false;
  const {error}=await cloud.from('farsiyar_classes').update(patch).eq('room_code',S.classCode);
  if(error){console.error(error);toast('ذخیره آنلاین انجام نشد');return false} return true;
}
async function cloudAddResponse(name,kind,answer){
  if(!cloudReady)return false;
  const {error}=await cloud.from('farsiyar_responses').insert({room_code:S.classCode,student_name:name,kind,answer});
  if(error){console.error(error);toast('ارسال پاسخ ناموفق بود');return false}
  const next=(S.scores[name]||0)+1;
  await cloud.from('farsiyar_scores').upsert({room_code:S.classCode,student_name:name,points:next,updated_at:new Date().toISOString()},{onConflict:'room_code,student_name'});
  return true;
}

// نسخه ابری توابع اصلی را جایگزین می‌کند؛ اگر کلید تنظیم نشده باشد، نسخه آفلاین همچنان کار می‌کند.
const _newClass=newClass;
newClass=async function(){ if(cloudReady){await createCloudClass()} else {_newClass();toast('این کلاس فعلاً آفلاین است؛ کلید عمومی Supabase را در supabase-config.js وارد کن.')} };
const _startCustom=startCustom;
startCustom=async function(kind,prompt,key=''){
  if(!prompt){toast('متن فعالیت را وارد کن');return}
  S.mission={kind,prompt,key,lesson:lessons[S.lesson][2],at:Date.now()}; originalSave();
  if(cloudReady) await cloudUpdateClass({lesson_index:S.lesson,mission:S.mission});
  renderMission();toast(cloudReady?'مأموریت برای همه گوشی‌ها ارسال شد 🚀':'مأموریت آماده شد 🚀');
};
const _stopMission=stopMission;
stopMission=async function(){S.mission=null;originalSave();if(cloudReady)await cloudUpdateClass({mission:null});renderMission();toast('مأموریت پایان یافت')};
const _sendNotice=sendNotice;
sendNotice=async function(){S.notice=document.getElementById('noticeInput').value;originalSave();if(cloudReady)await cloudUpdateClass({notice:S.notice});toast(cloudReady?'پیام برای همه گوشی‌ها ارسال شد 📢':'پیام ثبت شد 📢')};
const _updateLesson=updateLesson;
updateLesson=function(){_updateLesson();if(cloudReady&&S.teacher)cloudUpdateClass({lesson_index:S.lesson})};
const _joinStudent=joinStudent;
joinStudent=async function(){
  const n=document.getElementById('studentName').value.trim(),c=document.getElementById('studentCode').value.trim().toUpperCase();
  if(!n||!c){toast('نام و کد کلاس را وارد کن');return}
  if(cloudReady){const data=await loadCloudClass(c);if(!data){toast('کد کلاس پیدا نشد');return}}
  else if(c!==S.classCode){toast('در حالت آفلاین، کد باید با کلاس همین دستگاه یکی باشد');return}
  localStorage.setItem('studentName',n);localStorage.setItem('farsiyar-room',c);
  document.querySelector('.studentJoin').classList.add('hidden');document.getElementById('studentRoom').classList.remove('hidden');document.getElementById('studentWelcome').textContent=`سلام ${n} 👋 آماده‌ای؟`;renderStudentMission();toast('با موفقیت وارد کلاس شدی 🌐');
};
const _submitStudentAnswer=submitStudentAnswer;
submitStudentAnswer=async function(){
  const a=document.getElementById('studentAnswer').value.trim(),n=localStorage.getItem('studentName')||'دانش‌آموز';
  if(!a||!S.mission){toast('اول مأموریت فعال باشد و پاسخ را بنویس');return}
  if(cloudReady){if(await cloudAddResponse(n,S.mission.kind,a)){S.responses.push({name:n,kind:S.mission.kind,answer:a,time:new Date().toLocaleString('fa-IR')});S.scores[n]=(S.scores[n]||0)+1;originalSave()}}
  else {S.responses.push({name:n,kind:S.mission.kind,answer:a,time:new Date().toLocaleString('fa-IR')});S.scores[n]=(S.scores[n]||0)+1;originalSave()}
  document.getElementById('studentAnswer').value='';renderScores();renderResponses();toast('پاسخ برای معلم ارسال شد ⭐');
};

(async()=>{
  if(await initCloud()){
    document.documentElement.dataset.cloud='on';
    const room=localStorage.getItem('farsiyar-room');
    if(room)await loadCloudClass(room);
    if(S.teacher && S.classCode) { const existing=await loadCloudClass(S.classCode); if(!existing) await createCloudClass(); }
  }
})();
