/* FarsiYar - repaired client application */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const data = window.FarsiYarData || {};
  const lessons = data.lessons || [];
  const routes = data.routes || {};
  let sb = null, teacherUser = null, classRow = null;
  let teacherChannel = null, roomChannel = null, studentChannel = null;
  let responses = [], scores = [], roster = Array(29).fill('');
  let currentMission = null, selectedMissionType = 'text', boardState = [];
  let drawing = false, lastPoint = null, boardTimer = null, timerHandle = null;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const faNum = (value) => String(value).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
  const normalizeMission = (value) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length ? value : null;
  const messageOf = (err) => String(err?.message || err?.details || err?.hint || err || 'خطای نامشخص');

  function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(window.__farsiyarToastTimer);
    window.__farsiyarToastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  function setConnection(ok, message) {
    const el = $('connection');
    if (!el) return;
    el.className = 'connection ' + (ok ? 'ok' : 'bad');
    el.textContent = (ok ? '● ' : '● ') + message;
  }

  function errorText(err) {
    const raw = messageOf(err);
    const m = raw.toLowerCase();
    console.error('[FarsiYar]', err);
    if (!navigator.onLine) return 'اینترنت قطع است؛ اتصال را بررسی کنید.';
    if (m.includes('invalid login credentials')) return 'ایمیل یا رمز عبور اشتباه است.';
    if (m.includes('email not confirmed')) return 'ایمیل حساب معلم هنوز تأیید نشده است.';
    if (m.includes('invalid api key') || m.includes('apikey') || m.includes('jwt')) return 'کلید اتصال Supabase معتبر نیست؛ فایل supabase-config.js را بررسی کنید.';
    if (m.includes('permission denied') || m.includes('row-level security') || m.includes('not_class_owner')) return 'دسترسی دیتابیس اجازه این کار را نمی‌دهد. جزئیات: ' + raw;
    if (m.includes('does not exist') || m.includes('schema cache') || m.includes('could not find the function') || m.includes('relation') || m.includes('column')) return 'ساختار دیتابیس با برنامه هماهنگ نیست. جزئیات: ' + raw;
    return 'خطا: ' + raw;
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
    $(id)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cleanupChannels() {
    [teacherChannel, roomChannel, studentChannel].forEach((ch) => {
      if (ch && sb) sb.removeChannel(ch);
    });
    teacherChannel = roomChannel = studentChannel = null;
  }

  async function initSupabase() {
    const url = window.FARSYAR_SUPABASE_URL;
    const key = window.FARSYAR_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      setConnection(false, 'تنظیمات اتصال ناقص است');
      if ($('supabaseInfo')) $('supabaseInfo').textContent = 'آدرس یا Publishable key در supabase-config.js وارد نشده است.';
      return;
    }
    if (!window.supabase?.createClient) {
      setConnection(false, 'کتابخانه Supabase بارگذاری نشد');
      if ($('supabaseInfo')) $('supabaseInfo').textContent = 'کتابخانه Supabase از CDN بارگذاری نشد. اتصال اینترنت را بررسی کنید.';
      return;
    }
    try {
      sb = window.supabase.createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const { data: sessionData, error } = await sb.auth.getSession();
      if (error) throw error;
      teacherUser = sessionData.session?.user || null;
      setConnection(true, 'اتصال برقرار است');
      if ($('supabaseInfo')) $('supabaseInfo').textContent = 'اتصال به سرویس Supabase برقرار است. برای بررسی جدول‌ها روی «آزمون اتصال» بزنید.';
      if (teacherUser) await enterTeacher();
      sb.auth.onAuthStateChange((_event, session) => {
        teacherUser = session?.user || null;
        if (teacherUser) void enterTeacher();
        else leaveTeacherUI();
      });
    } catch (err) {
      setConnection(false, 'خطا در اتصال');
      if ($('authError')) $('authError').textContent = errorText(err);
      if ($('supabaseInfo')) $('supabaseInfo').textContent = errorText(err);
    }
  }

  async function signIn() {
    const email = $('teacherEmail')?.value.trim();
    const password = $('teacherPassword')?.value || '';
    if (!email || !password) { $('authError').textContent = 'ایمیل و رمز عبور را وارد کنید.'; return; }
    if (!sb) { $('authError').textContent = 'اتصال Supabase آماده نیست.'; return; }
    $('loginBtn').disabled = true;
    $('authError').textContent = '';
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      teacherUser = data.user;
      await enterTeacher();
      toast('ورود موفق بود.');
    } catch (err) {
      $('authError').textContent = errorText(err);
    } finally { $('loginBtn').disabled = false; }
  }

  async function signOut() {
    if (sb) await sb.auth.signOut();
    teacherUser = null;
    leaveTeacherUI();
    toast('از حساب معلم خارج شدید.');
  }

  function leaveTeacherUI() {
    $('authBox')?.classList.remove('hidden');
    $('teacherApp')?.classList.add('hidden');
    classRow = null; responses = []; scores = [];
    cleanupChannels();
  }

  async function enterTeacher() {
    if (!teacherUser || !sb) return;
    $('authBox')?.classList.add('hidden');
    $('teacherApp')?.classList.remove('hidden');
    await loadTeacherClass();
    renderRoster();
  }

  async function loadTeacherClass() {
    try {
      const { data, error } = await sb.from('farsiyar_classes').select('*')
        .eq('owner_id', teacherUser.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        classRow = data;
        hydrateFromClass(data);
        await Promise.all([loadResponses(), refreshScores()]);
        subscribeTeacher();
      } else await createClass();
    } catch (err) {
      const text = errorText(err);
      if ($('authError')) $('authError').textContent = text;
      if ($('supabaseInfo')) $('supabaseInfo').textContent = text;
    }
  }

  async function createClass() {
    if (!teacherUser || !sb) { toast('ابتدا با حساب معلم وارد شوید.'); return; }
    const btn = $('newClassBtn');
    if (btn) btn.disabled = true;
    try {
      const { data, error } = await sb.rpc('create_farsiyar_class');
      if (error) throw error;
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.room_code) throw new Error('تابع create_farsiyar_class اجرا شد اما کد کلاس برنگرداند.');
      classRow = created; responses = []; scores = [];
      hydrateFromClass(created);
      subscribeTeacher();
      await Promise.all([loadResponses(), refreshScores()]);
      toast('کلاس ' + created.room_code + ' ساخته شد.');
    } catch (err) {
      const text = errorText(err);
      toast(text);
      if ($('authError')) $('authError').textContent = text;
    } finally { if (btn) btn.disabled = false; }
  }

  function hydrateFromClass(c) {
    roster = Array.isArray(c.roster) ? c.roster.slice(0, 29).concat(Array(Math.max(0, 29 - c.roster.length)).fill('')).slice(0, 29) : Array(29).fill('');
    currentMission = normalizeMission(c.mission);
    boardState = Array.isArray(c.board_state) ? c.board_state : [];
    if ($('roomCode')) $('roomCode').textContent = c.room_code || '----';
    if ($('liveLink')) $('liveLink').textContent = c.room_code ? `${location.origin}${location.pathname}?class=${encodeURIComponent(c.room_code)}` : '';
    if ($('lessonSelect')) $('lessonSelect').value = String(c.lesson_index ?? 0);
    if ($('noticeInput')) $('noticeInput').value = c.notice || '';
    renderLesson(); renderMissionPreview(); renderRoster(); renderScores(); renderReport();
    drawBoard($('teacherCanvas'), boardState);
  }

  function subscribeTeacher() {
    if (!classRow || !sb) return;
    if (teacherChannel) sb.removeChannel(teacherChannel);
    if (roomChannel) sb.removeChannel(roomChannel);
    teacherChannel = sb.channel('teacher:' + classRow.room_code)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farsiyar_responses', filter: `room_code=eq.${classRow.room_code}` }, (payload) => {
        if (payload.eventType === 'INSERT') responses.unshift(payload.new);
        else if (payload.eventType === 'DELETE') responses = responses.filter((r) => r.id !== payload.old.id);
        renderResponses(); renderReport();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'farsiyar_scores', filter: `room_code=eq.${classRow.room_code}` }, () => void refreshScores())
      .subscribe((status) => { if (status === 'CHANNEL_ERROR') console.warn('[FarsiYar] teacher realtime channel error'); });
    roomChannel = sb.channel('room:' + classRow.room_code).subscribe();
  }

  async function refreshScores() {
    if (!classRow || !sb) return;
    const { data, error } = await sb.from('farsiyar_scores').select('student_name,points')
      .eq('room_code', classRow.room_code).order('points', { ascending: false }).order('student_name', { ascending: true });
    if (error) { console.warn('[FarsiYar] refresh scores:', error); return; }
    scores = data || []; renderScores(); renderReport();
  }

  async function loadResponses() {
    if (!classRow || !sb) return;
    const { data, error } = await sb.from('farsiyar_responses').select('*')
      .eq('room_code', classRow.room_code).order('created_at', { ascending: false }).limit(100);
    if (error) { console.warn('[FarsiYar] load responses:', error); return; }
    responses = data || []; renderResponses(); renderReport();
  }

  async function saveClass(patch, broadcast = true) {
    if (!classRow || !sb) return false;
    const { data, error } = await sb.from('farsiyar_classes').update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', classRow.id).select('*').single();
    if (error) { toast(errorText(error)); return false; }
    classRow = data;
    currentMission = normalizeMission(data.mission);
    boardState = Array.isArray(data.board_state) ? data.board_state : boardState;
    if (broadcast) await broadcastState();
    hydrateFromClass(data);
    return true;
  }

  async function broadcastState() {
    if (!classRow || !roomChannel) return;
    try { await roomChannel.send({ type: 'broadcast', event: 'state', payload: {
      room_code: classRow.room_code, lesson_index: classRow.lesson_index,
      mission: classRow.mission, notice: classRow.notice, board_state: classRow.board_state
    } }); } catch (err) { console.warn('[FarsiYar] broadcast:', err); }
  }

  function renderLesson() {
    const select = $('lessonSelect');
    const index = Number(select?.value || 0);
    const lesson = lessons[index];
    if (!lesson) return;
    $('lessonCard').innerHTML = `<div class="lessonCard"><div><span class="kicker" style="color:#8ed8d3">${esc(lesson.chapter)} • درس ${faNum(lesson.no)}</span><h3>${esc(lesson.title)}</h3><p>صفحه آغاز درس: ${faNum(lesson.page)}</p><div class="lessonMeta"><span class="chip">گام ۵ مرحله‌ای</span><span class="chip">مأموریت زنده</span><span class="chip">PDF مستقیم</span></div></div><div><a class="goldBtn" style="display:block;text-decoration:none;padding:11px 14px;border-radius:11px" target="_blank" rel="noopener" href="${esc(lesson.video)}">▶ ویدیوی درس</a></div></div>`;
    $('routeGrid').innerHTML = (routes[lesson.title] || []).map((step, i) => `<div class="routeStep"><b>مرحله ${faNum(i + 1)}</b><strong>${esc(step)}</strong><small>${i === 0 ? 'ورود به موضوع' : i === 4 ? 'جمع‌بندی و ارزشیابی' : 'تمرین مشارکتی و گفت‌وگو'}</small></div>`).join('');
    $('bookLinks').innerHTML = (lesson.parts || [['درس', lesson.page]]).map(([label, page]) => `<a class="bookLink" target="_blank" rel="noopener" href="book/chaharom-farsi-1404.pdf#page=${page}">${esc(label)} • صفحه ${faNum(page)}</a>`).join('') + '<a class="bookLink" target="_blank" rel="noopener" href="book/chaharom-farsi-1404.pdf#page=140">نیایش • صفحه ۱۴۰</a><a class="bookLink" target="_blank" rel="noopener" href="book/chaharom-farsi-1404.pdf#page=141">واژه‌نامه • صفحه ۱۴۱</a>';
  }

  async function setLesson() {
    if (!classRow) { renderLesson(); return; }
    const index = Number($('lessonSelect').value || 0);
    await saveClass({ lesson_index: index, mission: {}, notice: '' });
  }

  function renderMissionPreview() {
    const m = currentMission;
    if (!m) { $('teacherMission').textContent = 'هنوز مأموریتی ارسال نشده است.'; return; }
    $('teacherMission').innerHTML = `<b>${esc(m.title)}</b><p>${esc(m.prompt)}</p>${m.options?.length ? `<ul>${m.options.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}<small>نوع: ${esc(m.kind)}</small>`;
  }

  function selectMission(type) {
    selectedMissionType = type;
    document.querySelectorAll('[data-mission]').forEach((b) => b.classList.toggle('active', b.dataset.mission === type));
    const box = $('builder');
    if (type === 'text') box.innerHTML = '<textarea id="mPrompt" placeholder="سؤال یا مأموریت نوشتاری…"></textarea><button class="primary" id="publishMission">ارسال به کلاس</button>';
    if (type === 'quiz') box.innerHTML = '<input id="mPrompt" placeholder="متن سؤال"><div class="optionRow"><input id="q0" placeholder="گزینه ۱"><input type="radio" name="correct" value="0" checked></div><div class="optionRow"><input id="q1" placeholder="گزینه ۲"><input type="radio" name="correct" value="1"></div><div class="optionRow"><input id="q2" placeholder="گزینه ۳"><input type="radio" name="correct" value="2"></div><div class="optionRow"><input id="q3" placeholder="گزینه ۴"><input type="radio" name="correct" value="3"></div><button class="primary" id="publishMission">ارسال آزمون</button>';
    if (type === 'dictation') box.innerHTML = '<textarea id="mPrompt" placeholder="جمله یا واژه‌ای که باید خوانده شود…"></textarea><input id="mAnswer" placeholder="پاسخ صحیح (برای تصحیح خودکار)"><button class="primary" id="publishMission">شروع املای صوتی</button>';
    if (type === 'sentence') box.innerHTML = '<input id="mPrompt" placeholder="واژه‌ها را با / جدا کن؛ مثال: دانش‌آموز / کتاب / خواند"><input id="mAnswer" placeholder="جمله صحیح یا یکی از پاسخ‌های پذیرفتنی"><button class="primary" id="publishMission">شروع جمله‌ساز</button>';
    $('publishMission').onclick = publishMission;
  }

  async function publishMission() {
    if (!classRow) { toast('ابتدا با حساب معلم وارد شوید و کلاس را بسازید.'); return; }
    const kind = selectedMissionType;
    const prompt = $('mPrompt')?.value.trim();
    if (!prompt) { toast('متن مأموریت را وارد کنید.'); return; }
    const mission = { id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), kind,
      title: kind === 'text' ? 'پاسخ نوشتاری' : kind === 'quiz' ? 'چهارگزینه‌ای' : kind === 'dictation' ? 'املای صوتی' : 'جمله‌ساز',
      prompt, created_at: new Date().toISOString() };
    if (kind === 'quiz') {
      mission.options = [0, 1, 2, 3].map((i) => $('q' + i).value.trim());
      if (mission.options.some((v) => !v)) { toast('هر چهار گزینه را کامل کنید.'); return; }
      mission.correct = Number(document.querySelector('input[name="correct"]:checked')?.value || 0);
    }
    if (kind === 'dictation' || kind === 'sentence') mission.answerKey = $('mAnswer').value.trim();
    if (kind === 'sentence') mission.words = prompt.split('/').map((v) => v.trim()).filter(Boolean);
    if (await saveClass({ mission })) toast('مأموریت برای کلاس ارسال شد.');
  }

  async function endMission() { if (classRow && await saveClass({ mission: {} })) toast('مأموریت پایان یافت.'); }
  async function sendNotice() { if (!classRow) return; if (await saveClass({ notice: $('noticeInput').value.trim() })) toast('پیام به کلاس ارسال شد.'); }
  async function copyLink() {
    if (!classRow) return;
    const url = `${location.origin}${location.pathname}?class=${encodeURIComponent(classRow.room_code)}`;
    try { await navigator.clipboard.writeText(url); toast('لینک ورود کپی شد.'); }
    catch { prompt('لینک ورود کلاس را کپی کنید:', url); }
  }

  function renderRoster() {
    if (!$('rosterGrid')) return;
    $('rosterGrid').innerHTML = roster.map((name, i) => `<div class="rosterItem"><span>${faNum(i + 1)}</span><input data-roster="${i}" value="${esc(name)}" maxlength="80" placeholder="نام دانش‌آموز"></div>`).join('');
  }
  async function saveRoster() {
    const values = Array.from(document.querySelectorAll('[data-roster]')).map((el) => el.value.trim().replace(/\s+/g, ' '));
    const nonempty = values.filter(Boolean);
    if (new Set(nonempty).size !== nonempty.length) { toast('نام‌ها باید یکتا باشند.'); return; }
    if (!nonempty.length) { toast('حداقل یک نام وارد کنید.'); return; }
    roster = values;
    if (!classRow) { toast('ابتدا کلاس را بسازید.'); return; }
    if (await saveClass({ roster })) toast('فهرست دانش‌آموزان ذخیره شد.');
  }

  async function award(name, delta) {
    if (!classRow || !sb) return;
    try {
      const { error } = await sb.rpc('award_farsiyar_points', { p_room_code: classRow.room_code, p_student_name: name, p_delta: delta });
      if (error) throw error;
      toast(`${name}: ${delta > 0 ? '+' : ''}${delta} امتیاز`);
      await refreshScores();
    } catch (err) { toast(errorText(err)); }
  }
  window.__award = (encodedName, delta) => void award(decodeURIComponent(encodedName), Number(delta));

  function renderResponses() {
    const box = $('responses');
    if (!box) return;
    if (!responses.length) { box.innerHTML = '<p class="muted">هنوز پاسخی ثبت نشده است.</p>'; return; }
    box.innerHTML = responses.slice(0, 60).map((r) => `<div class="responseItem"><b>${esc(r.student_name)}</b><small>${esc(r.kind)} • ${new Date(r.created_at).toLocaleTimeString('fa-IR')}</small><div>${esc(r.answer)}</div><small>${r.is_correct === true ? '✓ درست' : r.is_correct === false ? '× نادرست' : ''}</small><div class="responseActions"><button onclick="window.__award('${encodeURIComponent(r.student_name)}',1)">+۱</button><button onclick="window.__award('${encodeURIComponent(r.student_name)}',2)">+۲</button><button onclick="window.__award('${encodeURIComponent(r.student_name)}',3)">+۳</button></div></div>`).join('');
  }
  function renderScores() {
    if (!$('scoreBoard')) return;
    $('scoreBoard').innerHTML = scores.length ? scores.slice(0, 29).map((s, i) => `<div class="scoreRow"><span><i class="rank">${faNum(i + 1)}</i>${esc(s.student_name)}</span><b>${faNum(s.points)}</b></div>`).join('') : '<p class="muted">امتیازی ثبت نشده است.</p>';
  }
  function renderReport() {
    if (!$('reportTable')) return;
    const map = new Map(scores.map((s) => [s.student_name, s.points]));
    const rows = roster.filter(Boolean).map((name) => `<tr><td>${esc(name)}</td><td>${faNum(map.get(name) || 0)}</td><td>${faNum(responses.filter((r) => r.student_name === name).length)}</td></tr>`).join('');
    $('reportTable').innerHTML = `<div class="reportTable"><table><thead><tr><th>دانش‌آموز</th><th>امتیاز</th><th>تعداد پاسخ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  async function clearScores() {
    if (!classRow) return;
    try { const { error } = await sb.rpc('clear_farsiyar_scores', { p_room_code: classRow.room_code }); if (error) throw error; scores = []; renderScores(); renderReport(); toast('تابلو امتیاز پاک شد.'); }
    catch (err) { toast(errorText(err)); }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), class: classRow, responses, scores, roster }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `farsiyar-${classRow?.room_code || 'class'}.json`; a.click(); URL.revokeObjectURL(url);
  }
  function printReport() { window.print(); }
  function renderBook() {
    if (!$('bookList')) return;
    const chapters = {};
    lessons.forEach((lesson) => (chapters[lesson.chapter] ||= []).push(lesson));
    $('bookList').innerHTML = Object.entries(chapters).map(([chapter, list]) => `<article class="bookChapter"><h3>${esc(chapter)}</h3><div class="bookLessons">${list.map((l) => `<a class="bookLesson" target="_blank" rel="noopener" href="book/chaharom-farsi-1404.pdf#page=${l.page}"><b>درس ${faNum(l.no)}</b>${esc(l.title)} <small>صفحه ${faNum(l.page)}</small></a>`).join('')}</div></article>`).join('') + '<article class="bookChapter"><h3>بخش‌های پایانی کتاب</h3><div class="bookLessons"><a class="bookLesson" target="_blank" href="book/chaharom-farsi-1404.pdf#page=140">نیایش • ۱۴۰</a><a class="bookLesson" target="_blank" href="book/chaharom-farsi-1404.pdf#page=141">واژه‌نامه • ۱۴۱</a></div></article>';
  }

  async function loadStudentNames() {
    const code = $('studentCode').value.trim().toUpperCase();
    $('studentError').textContent = '';
    if (!/^FAR-\d{4}$/.test(code)) { $('studentError').textContent = 'کد کلاس باید مثل FAR-1234 باشد.'; return; }
    if (!sb) { $('studentError').textContent = 'اتصال Supabase برقرار نیست.'; return; }
    $('studentName').innerHTML = '<option value="">در حال دریافت فهرست…</option>';
    try {
      const { data, error } = await sb.rpc('student_get_roster', { p_room_code: code });
      if (error) throw error;
      const names = data || [];
      $('studentName').innerHTML = '<option value="">انتخاب نام…</option>' + names.map((row) => `<option value="${esc(row.student_name)}">${esc(row.student_name)}</option>`).join('');
      if (!names.length) $('studentError').textContent = 'کلاس پیدا نشد یا هنوز فهرست دانش‌آموزان ذخیره نشده است.';
    } catch (err) {
      $('studentName').innerHTML = '<option value="">فهرست پیدا نشد</option>';
      $('studentError').textContent = errorText(err);
    }
  }
  async function joinStudent() {
    const code = $('studentCode').value.trim().toUpperCase();
    const name = $('studentName').value.trim();
    $('studentError').textContent = '';
    if (!/^FAR-\d{4}$/.test(code)) { $('studentError').textContent = 'کد کلاس نادرست است.'; return; }
    if (!name) { $('studentError').textContent = 'نام خود را انتخاب کنید.'; return; }
    try {
      const { data, error } = await sb.rpc('student_get_class', { p_room_code: code, p_student_name: name });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) { $('studentError').textContent = 'این نام در فهرست کلاس ثبت نشده یا کلاس وجود ندارد.'; return; }
      localStorage.setItem('farsiyar-student', JSON.stringify({ code, name }));
      showStudentClass(row); subscribeStudent(code, name);
    } catch (err) { $('studentError').textContent = errorText(err); }
  }
  function showStudentClass(row) {
    $('studentJoin').classList.add('hidden'); $('studentApp').classList.remove('hidden');
    const student = JSON.parse(localStorage.getItem('farsiyar-student') || '{}');
    $('studentGreeting').textContent = `سلام ${student.name || ''}؛ آماده‌ای؟`;
    currentMission = normalizeMission(row.mission);
    renderStudentState(row);
  }
  function renderStudentState(row) {
    const student = JSON.parse(localStorage.getItem('farsiyar-student') || '{}');
    const mission = normalizeMission(row.mission);
    $('studentNotice').textContent = row.notice || '';
    $('studentNotice').classList.toggle('show', Boolean(row.notice));
    const lesson = lessons[Number(row.lesson_index) || 0] || lessons[0];
    if (lesson) $('studentLesson').innerHTML = `<h3>درس ${faNum(lesson.no)}: ${esc(lesson.title)}</h3><p class="muted">صفحه ${faNum(lesson.page)}</p><a class="outline" target="_blank" rel="noopener" href="book/chaharom-farsi-1404.pdf#page=${lesson.page}">باز کردن درس در کتاب</a> <a class="outline" target="_blank" rel="noopener" href="${esc(lesson.video)}">ویدیوی آموزشی</a>`;
    $('studentMissionTitle').textContent = mission?.title || 'هنوز مأموریتی نیست';
    $('studentMissionBody').innerHTML = mission ? studentMissionHtml(mission) : '<p class="muted">وقتی معلم فعالیت را شروع کند اینجا نمایش داده می‌شود.</p>';
    void loadStudentScores(student.code, student.name);
    drawBoard($('studentCanvas'), row.board_state || []);
  }
  function studentMissionHtml(m) {
    if (m.kind === 'text') return `<p>${esc(m.prompt)}</p><div class="answerArea"><textarea id="sText" placeholder="پاسخت را بنویس…"></textarea><button class="primary wide" onclick="window.__submitStudent('text')">ارسال پاسخ</button></div>`;
    if (m.kind === 'quiz') return `<p>${esc(m.prompt)}</p><div class="quizOptions">${(m.options || []).map((option, i) => `<button onclick="window.__quiz(${i})">${esc(option)}</button>`).join('')}</div><div id="quizFeedback"></div>`;
    if (m.kind === 'dictation') return `<p>بعد از گوش دادن، پاسخ را بنویس.</p><button class="goldBtn" onclick="window.__speak('${encodeURIComponent(m.prompt)}')">🔊 پخش صوت فارسی</button><div class="answerArea"><textarea id="sText" placeholder="آنچه شنیدی…"></textarea><button class="primary wide" onclick="window.__submitStudent('dictation')">ارسال املا</button></div>`;
    if (m.kind === 'sentence') return `<p>کلمه‌ها را مرتب کن و یک جمله درست بساز:</p><div class="chips">${(m.words || []).map((word) => `<button onclick="window.__word('${encodeURIComponent(word)}')">${esc(word)}</button>`).join(' ')}</div><input id="sentenceBuilt" style="width:100%;margin-top:10px;padding:11px;border:1px solid var(--line);border-radius:10px" placeholder="جمله‌ات را اینجا بساز"><button class="primary wide" style="margin-top:8px" onclick="window.__submitStudent('sentence')">ارسال جمله</button>`;
    return '<p class="muted">نوع مأموریت ناشناخته است.</p>';
  }
  window.__speak = (text) => {
    if (!('speechSynthesis' in window)) { toast('مرورگر از گفتار پشتیبانی نمی‌کند.'); return; }
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(decodeURIComponent(text)); utterance.lang = 'fa-IR'; speechSynthesis.speak(utterance);
  };
  window.__word = (word) => { const input = $('sentenceBuilt'); if (input) input.value = (input.value + ' ' + decodeURIComponent(word)).trim(); };
  window.__quiz = async (index) => {
    const student = JSON.parse(localStorage.getItem('farsiyar-student') || '{}');
    const mission = currentMission || {};
    const correct = Number(mission.correct) === index;
    document.querySelectorAll('.quizOptions button').forEach((button) => { button.disabled = true; });
    if ($('quizFeedback')) $('quizFeedback').textContent = correct ? '✓ درست!' : '× این گزینه درست نیست.';
    await submitResponse(student.code, student.name, 'quiz', mission.options?.[index] || '', correct);
  };
  window.__submitStudent = async (kind) => {
    const student = JSON.parse(localStorage.getItem('farsiyar-student') || '{}');
    const answer = (kind === 'sentence' ? $('sentenceBuilt')?.value : $('sText')?.value)?.trim() || '';
    if (!answer) { toast('پاسخ را بنویسید.'); return; }
    const mission = currentMission || {};
    let correct = null;
    if (kind === 'dictation') correct = normalize(answer) === normalize(mission.answerKey || '');
    if (kind === 'sentence' && mission.answerKey) correct = normalize(answer) === normalize(mission.answerKey);
    await submitResponse(student.code, student.name, kind, answer, correct);
  };
  async function submitResponse(code, name, kind, answer, isCorrect) {
    try {
      const { error } = await sb.from('farsiyar_responses').insert({ room_code: code, student_name: name, kind, answer, is_correct: isCorrect, points_awarded: 0 });
      if (error) throw error;
      toast(isCorrect === true ? 'پاسخ درست ثبت شد ⭐' : 'پاسخ ثبت شد.');
    } catch (err) { toast(errorText(err)); }
  }
  function normalize(value) { return String(value || '').replace(/[\u200c\u200f\u200e\s]/g, '').replace(/[؟?!.،,؛;]/g, '').trim().toLowerCase(); }
  async function loadStudentScores(code, name) {
    if (!code || !name || !sb) return;
    try {
      const { data, error } = await sb.rpc('student_get_scores', { p_room_code: code, p_student_name: name });
      if (error) throw error;
      const rows = data || []; const me = rows.find((row) => row.student_name === name);
      $('myPoints').textContent = faNum(me?.points || 0);
      $('studentScores').innerHTML = rows.slice(0, 10).map((row, i) => `<div class="scoreRow"><span><i class="rank">${faNum(i + 1)}</i>${esc(row.student_name)}</span><b>${faNum(row.points)}</b></div>`).join('') || '<p class="muted">هنوز امتیازی ثبت نشده است.</p>';
    } catch (err) { $('studentScores').innerHTML = '<p class="muted">تابلو امتیاز فعلاً در دسترس نیست.</p>'; console.warn(err); }
  }
  function subscribeStudent(code, name) {
    if (studentChannel) sb.removeChannel(studentChannel);
    studentChannel = sb.channel('room:' + code).on('broadcast', { event: 'state' }, (event) => {
      const payload = event.payload;
      if (payload?.room_code !== code) return;
      currentMission = normalizeMission(payload.mission);
      renderStudentState({ lesson_index: payload.lesson_index, mission: payload.mission, notice: payload.notice, board_state: payload.board_state });
    }).subscribe();
  }

  function initBoard() {
    const canvas = $('teacherCanvas');
    if (!canvas) return;
    canvas.addEventListener('pointerdown', (event) => { drawing = true; lastPoint = point(event, canvas); canvas.setPointerCapture?.(event.pointerId); });
    canvas.addEventListener('pointermove', (event) => {
      if (!drawing) return;
      const next = point(event, canvas);
      boardState.push({ x1: lastPoint.x, y1: lastPoint.y, x2: next.x, y2: next.y,
        color: $('boardMode').value === 'eraser' ? '#fffef9' : $('boardColor').value,
        size: Number($('boardSize').value), mode: $('boardMode').value });
      lastPoint = next; drawBoard(canvas, boardState); syncBoardDebounced();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => canvas.addEventListener(eventName, () => { drawing = false; lastPoint = null; }));
    drawBoard(canvas, boardState);
  }
  function point(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  function drawBoard(canvas, state) {
    if (!canvas?.getContext) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fffef9'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.lineCap = 'round';
    for (const stroke of state || []) {
      ctx.beginPath(); ctx.moveTo(stroke.x1 * canvas.width / 1100, stroke.y1 * canvas.height / 560); ctx.lineTo(stroke.x2 * canvas.width / 1100, stroke.y2 * canvas.height / 560);
      ctx.strokeStyle = stroke.color || '#0b2a42'; ctx.lineWidth = stroke.size || 5; ctx.stroke();
    }
  }
  function syncBoardDebounced() { clearTimeout(boardTimer); boardTimer = setTimeout(() => { if (classRow) void saveClass({ board_state: boardState }); }, 350); }
  function undoBoard() { boardState.pop(); drawBoard($('teacherCanvas'), boardState); syncBoardDebounced(); }
  function clearBoard() { boardState = []; drawBoard($('teacherCanvas'), boardState); syncBoardDebounced(); }
  function randomStudent() {
    const names = roster.filter(Boolean);
    if (!names.length) { toast('ابتدا فهرست دانش‌آموزان را وارد کنید.'); return; }
    const name = names[Math.floor(Math.random() * names.length)]; $('quickToolOut').innerHTML = `<b>انتخاب شد:</b> ${esc(name)} ⭐`; toast('نوبت ' + name + ' است.');
  }
  function startTimer() {
    let left = 60; clearInterval(timerHandle); $('quickToolOut').textContent = `زمان باقی‌مانده: ${faNum(left)} ثانیه`;
    timerHandle = setInterval(() => { left -= 1; if (left <= 0) { clearInterval(timerHandle); $('quickToolOut').textContent = '⏰ زمان تمام شد.'; toast('زمان فعالیت تمام شد.'); }
      else $('quickToolOut').textContent = `زمان باقی‌مانده: ${faNum(left)} ثانیه`; }, 1000);
  }
  async function deleteClass() {
    if (!classRow || !confirm('کلاس فعلی حذف شود؟ این کار برگشت‌پذیر نیست.')) return;
    try { const { error } = await sb.from('farsiyar_classes').delete().eq('id', classRow.id); if (error) throw error; classRow = null; responses = []; scores = []; await createClass(); }
    catch (err) { toast(errorText(err)); }
  }
  function previewStudent() {
    if (!classRow) { toast('ابتدا کلاس را بسازید.'); return; }
    showScreen('student'); $('studentJoin').classList.add('hidden'); $('studentApp').classList.remove('hidden');
    $('studentGreeting').textContent = 'پیش‌نمایش پنل دانش‌آموز برای معلم'; renderStudentState(classRow);
  }
  async function checkConnection() {
    try {
      if (!sb) throw new Error('Supabase هنوز مقداردهی نشده است.');
      const { error } = await sb.from('farsiyar_classes').select('room_code').limit(1);
      if (error) throw error;
      $('supabaseInfo').textContent = 'اتصال برقرار است و جدول farsiyar_classes پاسخ می‌دهد.'; setConnection(true, 'متصل');
    } catch (err) { $('supabaseInfo').textContent = errorText(err); setConnection(false, 'خطا'); }
  }
  function tabs() {
    document.querySelectorAll('.sideBtn').forEach((button) => button.onclick = () => {
      document.querySelectorAll('.sideBtn').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
      button.classList.add('active'); $(button.dataset.tab)?.classList.add('active');
      if (button.dataset.tab === 'reports') { void refreshScores(); void loadResponses(); renderReport(); }
    });
  }
  function wire() {
    const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
    on('homeBtn', () => showScreen('home')); on('teacherBtn', () => showScreen('teacher')); on('studentBtn', () => showScreen('student'));
    on('heroTeacher', () => showScreen('teacher')); on('heroStudent', () => showScreen('student')); on('studentHome', () => showScreen('home'));
    on('previewStudent', previewStudent); on('loginBtn', signIn); on('teacherLogout', signOut); on('newClassBtn', createClass);
    on('sendNotice', sendNotice); on('endMission', endMission); on('copyLink', copyLink); on('saveRoster', saveRoster);
    on('exportJson', exportJson); on('printReport', printReport); on('deleteClass', deleteClass); on('randomStudent', randomStudent);
    on('timerBtn', startTimer); on('reconnect', checkConnection); on('undoBoard', undoBoard); on('clearBoard', clearBoard);
    on('loadNames', loadStudentNames); on('joinBtn', joinStudent);
    document.querySelectorAll('[data-mission]').forEach((button) => button.onclick = () => selectMission(button.dataset.mission));
    if ($('lessonSelect')) {
      $('lessonSelect').innerHTML = lessons.map((lesson, i) => `<option value="${i}">درس ${faNum(lesson.no)} — ${esc(lesson.title)}</option>`).join('');
      $('lessonSelect').onchange = setLesson;
    }
    tabs(); selectMission('text'); renderBook(); initBoard(); renderLesson();
    const classCode = new URLSearchParams(location.search).get('class');
    if (classCode) { $('studentCode').value = classCode.toUpperCase(); showScreen('student'); }
  }

  window.addEventListener('online', () => { if (sb) setConnection(true, 'آنلاین'); });
  window.addEventListener('offline', () => setConnection(false, 'اینترنت قطع است'));
  wire();
  void initSupabase();
})();
