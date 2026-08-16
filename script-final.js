// script-final.js – التحكم الكامل في الواجهة مع DeepSeek
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تشغيل غرفة التحقيق');
    
    // عناصر الصفحة الرئيسية
    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const casesGrid = document.getElementById('cases-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const btnNewRandom = document.getElementById('btn-new-random');
    const btnBackHome = document.getElementById('btn-back-home');
    const btnHomeFromResult = document.getElementById('btn-home-from-result');

    // عناصر إعدادات API
    const apiKeyInput = document.getElementById('api-key-input');
    const apiProvider = document.getElementById('api-provider');
    const btnSaveApi = document.getElementById('btn-save-api');
    const apiStatus = document.getElementById('api-status');

    // عناصر اللعبة
    const sceneImg = document.getElementById('scene-img');
    const bodyImg = document.getElementById('body-img');
    const bodyContainer = document.getElementById('body-image-container');
    const sceneDescription = document.getElementById('scene-description');
    const cluesList = document.getElementById('clues-list');
    const suspectsTabs = document.getElementById('suspects-tabs');
    const suspectAvatar = document.getElementById('suspect-avatar');
    const suspectName = document.getElementById('suspect-name');
    const suspectJob = document.getElementById('suspect-job');
    const suspectMood = document.getElementById('suspect-mood');
    const suspectTrust = document.getElementById('suspect-trust');
    const messagesDiv = document.getElementById('messages');
    const questionInput = document.getElementById('question-input');
    const btnSend = document.getElementById('btn-send');
    const btnAccuse = document.getElementById('btn-accuse');
    const btnReport = document.getElementById('btn-report');
    const btnHint = document.getElementById('btn-hint');
    const btnSuspectNotes = document.getElementById('btn-suspect-notes');
    const proofList = document.getElementById('proof-list');
    const timelineEvents = document.getElementById('timeline-events');
    const relationsMap = document.getElementById('relations-map');
    const progressBar = document.getElementById('progress-bar');
    const caseIdDisplay = document.getElementById('case-id-display');

    // عناصر النتيجة
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const resultSummary = document.getElementById('result-summary');
    const resultProofs = document.getElementById('result-proofs');
    const resultTime = document.getElementById('result-time');
    const resultQuestions = document.getElementById('result-questions');
    const resultPerformance = document.getElementById('result-performance');
    const btnReplay = document.getElementById('btn-replay');
    const btnShare = document.getElementById('btn-share');

    // الحالة
    let engine = new InvestigationEngine();
    let currentCase = null;
    let currentSuspectName = '';
    let currentFilter = 'all';

    // ===== إعدادات API =====
    function setupAPI() {
        const key = apiKeyInput.value.trim();
        const provider = apiProvider.value;
        
        if (provider === 'local') {
            engine.provider = 'local';
            engine.apiKey = '';
            apiStatus.textContent = '🟡 المحاكاة المحلية';
            apiStatus.style.color = '#ff9800';
            return;
        }
        
        if (!key || key.length < 10) {
            apiStatus.textContent = '⚠️ مفتاح API غير صحيح';
            apiStatus.style.color = '#f44336';
            return;
        }
        
        engine.apiKey = key;
        engine.provider = provider;
        
        if (provider === 'deepseek') {
            engine.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
            engine.model = 'deepseek-chat';
            apiStatus.textContent = '🟢 DeepSeek متصل';
            apiStatus.style.color = '#4caf50';
        } else if (provider === 'openai') {
            engine.apiUrl = 'https://api.openai.com/v1/chat/completions';
            engine.model = 'gpt-3.5-turbo';
            apiStatus.textContent = '🟢 OpenAI متصل';
            apiStatus.style.color = '#4caf50';
        }
        
        // اختبار الاتصال
        engine.testConnection().then(result => {
            if (!result.success) {
                apiStatus.textContent = `⚠️ ${result.message}`;
                apiStatus.style.color = '#ff9800';
            }
        });
    }

    btnSaveApi.addEventListener('click', setupAPI);

    // ===== عرض القضايا =====
    function renderCases(filter = 'all') {
        console.log('📋 جاري عرض القضايا، الفلتر:', filter);
        
        if (typeof window.CASES_DATABASE === 'undefined') {
            casesGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                    <p>❌ خطأ في تحميل البيانات</p>
                </div>
            `;
            return;
        }
        
        const cases = getCasesByType(filter);
        console.log('📦 عدد القضايا:', cases.length);
        
        if (!cases || cases.length === 0) {
            casesGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">
                    <p>📭 لا توجد قضايا في هذا التصنيف.</p>
                </div>
            `;
            return;
        }

        casesGrid.innerHTML = '';
        
        cases.forEach((c) => {
            try {
                const card = document.createElement('div');
                card.className = 'case-card';
                card.innerHTML = `
                    <img src="${c.image || 'https://picsum.photos/seed/default/800/400'}" 
                         alt="${c.title || 'قضية'}" 
                         class="case-card-image" 
                         loading="lazy"
                         onerror="this.src='https://picsum.photos/seed/error/800/400'">
                    <div class="case-card-body">
                        <div class="case-card-title">${c.title || 'قضية بدون عنوان'}</div>
                        <div class="case-card-subtitle">${c.subtitle || ''}</div>
                        <div class="case-card-meta">
                            <span>📍 ${c.location || 'موقع غير معروف'}</span>
                            <span class="case-card-difficulty difficulty-${c.difficulty || 'medium'}">
                                ${c.difficulty === 'easy' ? 'سهل' : c.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                            </span>
                        </div>
                        <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:var(--text-secondary); font-size:0.85rem;">🔍 ${c.type || 'عام'}</span>
                            <span class="case-card-status status-unsolved">⏳ غير محلولة</span>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => startCase(c.id));
                casesGrid.appendChild(card);
            } catch (err) {
                console.error('❌ خطأ في عرض البطاقة:', err);
            }
        });
        
        document.getElementById('total-cases').textContent = CASES_DATABASE.length;
        document.getElementById('solved-cases').textContent = Math.floor(CASES_DATABASE.length * 0.3);
        document.getElementById('rating').textContent = '4.8';
    }

    // ===== بدء قضية =====
    function startCase(caseId) {
        console.log('🕵️ بدء القضية:', caseId);
        const caseData = getCaseById(caseId);
        if (!caseData) {
            alert('⚠️ القضية غير موجودة');
            return;
        }

        currentCase = engine.loadCase(caseData);
        currentSuspectName = currentCase.suspects[0].name;
        
        caseIdDisplay.textContent = caseData.id;
        sceneImg.src = caseData.image || 'https://picsum.photos/seed/default/800/400';
        
        if (caseData.bodyImage) {
            bodyImg.src = caseData.bodyImage;
            bodyContainer.style.display = 'block';
        } else {
            bodyContainer.style.display = 'none';
        }
        
        sceneDescription.textContent = caseData.sceneDescription || 'وصف مسرح الجريمة غير متوفر';
        
        renderClues();
        renderSuspectsTabs();
        updateSuspectInfo();
        renderMessages();
        renderProofs();
        renderTimeline();
        renderRelations();
        updateProgress();
        
        homeScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        resultScreen.style.display = 'none';
        
        messagesDiv.innerHTML = `
            <div class="msg-system">🕵️ قضية: ${caseData.title}</div>
            <div class="msg-system">📍 ${caseData.location}</div>
            <div class="msg-system">⏰ ${caseData.time}</div>
            <div class="msg-suspect">🔹 ابدأ الاستجواب باختيار مشتبه به وطرح الأسئلة.</div>
        `;
    }

    // ===== عرض الأدلة =====
    function renderClues() {
        cluesList.innerHTML = '';
        if (!engine.clues || engine.clues.length === 0) {
            cluesList.innerHTML = '<div style="color:var(--text-muted);">لا توجد أدلة</div>';
            return;
        }
        
        engine.clues.forEach(c => {
            const div = document.createElement('div');
            div.className = `clue-item ${c.found ? 'found' : 'hidden'}`;
            div.innerHTML = `
                <span class="clue-icon">${c.icon || '🔍'}</span>
                <span>${c.desc}</span>
                ${c.found ? '<span style="color:#4caf50; font-size:0.7rem;">✓ مكتشف</span>' : '<span style="color:var(--text-muted); font-size:0.7rem;">🔒 غير مكتشف</span>'}
            `;
            cluesList.appendChild(div);
        });
    }

    // ===== عرض المشتبهين =====
    function renderSuspectsTabs() {
        suspectsTabs.innerHTML = '';
        if (!engine.suspects || engine.suspects.length === 0) {
            suspectsTabs.innerHTML = '<div style="color:var(--text-muted);">لا يوجد مشتبهين</div>';
            return;
        }
        
        engine.suspects.forEach(s => {
            const tab = document.createElement('button');
            const isActive = s.name === currentSuspectName;
            const statusClass = s.mood === 'منهار' ? 'broken' : s.mood === 'متوتر' || s.mood === 'غاضب' ? 'stressed' : 'normal';
            tab.className = `suspect-tab ${isActive ? 'active' : ''}`;
            tab.innerHTML = `
                <span class="tab-status ${statusClass}"></span>
                ${s.name}
            `;
            tab.onclick = () => {
                currentSuspectName = s.name;
                renderSuspectsTabs();
                updateSuspectInfo();
                renderMessages();
            };
            suspectsTabs.appendChild(tab);
        });
    }

    // ===== تحديث معلومات المشتبه =====
    function updateSuspectInfo() {
        const s = engine.suspects.find(s => s.name === currentSuspectName);
        if (!s) return;
        
        suspectAvatar.src = s.avatar || 'https://picsum.photos/seed/default/200/200';
        suspectName.textContent = s.name;
        suspectJob.textContent = s.job || 'مشتبه به';
        
        const moodMap = {
            'محايد': '😐 محايد',
            'متوتر': '😰 متوتر',
            'غاضب': '😡 غاضب',
            'غاضب جداً': '🤬 غاضب جداً',
            'منهار': '😩 منهار',
            'ندم': '😔 نادم',
            'هادئ': '😌 هادئ',
            'فضولي': '🤔 فضولي',
            'مستاء': '😒 مستاء',
            'واثق': '😏 واثق',
            'غير مبال': '😑 غير مبال',
            'خائف': '😨 خائف',
            'غامض': '🤨 غامض'
        };
        suspectMood.textContent = moodMap[s.mood] || '😐 محايد';
        
        const trustColor = s.trust > 70 ? '#4caf50' : s.trust > 40 ? '#ff9800' : '#f44336';
        suspectTrust.textContent = `الثقة: ${s.trust}%`;
        suspectTrust.style.color = trustColor;
    }

    // ===== عرض الرسائل =====
    function renderMessages() {
        const s = engine.suspects.find(s => s.name === currentSuspectName);
        if (!s) return;
        
        messagesDiv.innerHTML = '';
        if (s.testimony.length === 0) {
            const msg = document.createElement('div');
            msg.className = 'msg-suspect';
            msg.textContent = `🕵️ ${s.name} ينتظر سؤالك الأول...`;
            messagesDiv.appendChild(msg);
            return;
        }
        
        s.testimony.forEach(t => {
            const qDiv = document.createElement('div');
            qDiv.className = 'msg-player';
            qDiv.textContent = `أنت: ${t.q}`;
            messagesDiv.appendChild(qDiv);
            
            const aDiv = document.createElement('div');
            aDiv.className = 'msg-suspect';
            aDiv.textContent = `${s.name}: ${t.a}`;
            messagesDiv.appendChild(aDiv);
        });
        
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // ===== عرض الأدلة المثبتة =====
    function renderProofs() {
        proofList.innerHTML = '';
        if (!engine.clues) return;
        
        const found = engine.clues.filter(c => c.found);
        if (found.length === 0) {
            proofList.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem;">لم يتم اكتشاف أدلة بعد</div>';
            return;
        }
        found.forEach(c => {
            const div = document.createElement('div');
            div.className = 'proof-item';
            div.innerHTML = `${c.icon || '🔍'} ${c.desc}`;
            proofList.appendChild(div);
        });
    }

    // ===== عرض الجدول الزمني =====
    function renderTimeline() {
        timelineEvents.innerHTML = '';
        const events = engine.getTimeline();
        events.forEach(e => {
            const div = document.createElement('div');
            div.className = 'timeline-event';
            div.innerHTML = `<span class="time">${e.time}</span><span>${e.event}</span>`;
            timelineEvents.appendChild(div);
        });
    }

    // ===== عرض العلاقات =====
    function renderRelations() {
        relationsMap.innerHTML = '';
        const relations = engine.getRelations();
        if (relations.length === 0) {
            relationsMap.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem;">لا توجد علاقات مسجلة</div>';
            return;
        }
        relations.forEach(r => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:4px 0; font-size:0.85rem; border-bottom:1px solid var(--border);';
            div.textContent = r;
            relationsMap.appendChild(div);
        });
    }

    // ===== تحديث التقدم =====
    function updateProgress() {
        progressBar.textContent = `${engine.getProgress()}%`;
    }

    // ===== إرسال سؤال (مع DeepSeek) =====
    async function sendQuestion() {
        const q = questionInput.value.trim();
        if (!q) {
            questionInput.focus();
            return;
        }
        
        const suspect = engine.suspects.find(s => s.name === currentSuspectName);
        if (!suspect) return;

        // إضافة رسالة "جاري التفكير..."
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'msg-thinking';
        thinkingDiv.textContent = '⏳ جاري التفكير...';
        messagesDiv.appendChild(thinkingDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        btnSend.disabled = true;
        btnSend.textContent = '⏳';

        try {
            const response = await engine.interrogate(currentSuspectName, q);
            
            messagesDiv.removeChild(thinkingDiv);
            
            const qDiv = document.createElement('div');
            qDiv.className = 'msg-player';
            qDiv.textContent = `أنت: ${q}`;
            messagesDiv.appendChild(qDiv);
            
            const aDiv = document.createElement('div');
            aDiv.className = 'msg-suspect';
            aDiv.textContent = `${suspect.name}: ${response}`;
            messagesDiv.appendChild(aDiv);
            
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
            questionInput.value = '';
            questionInput.focus();
            
            updateSuspectInfo();
            renderClues();
            renderProofs();
            updateProgress();
            renderSuspectsTabs();
            
        } catch (error) {
            console.error('❌ خطأ:', error);
            messagesDiv.removeChild(thinkingDiv);
            alert('حدث خطأ في الاتصال بالذكاء الاصطناعي. حاول مرة أخرى.');
        } finally {
            btnSend.disabled = false;
            btnSend.textContent = '➤ إرسال';
        }
    }

    // ===== اتهام الفاعل =====
    function handleAccuse() {
        const result = engine.accuse(currentSuspectName);
        
        if (result.success) {
            gameScreen.style.display = 'none';
            resultScreen.style.display = 'flex';
            resultIcon.textContent = '✅';
            resultTitle.textContent = '⚖️ القضية محلولة';
            resultSummary.innerHTML = `
                <strong>${result.message}</strong><br>
                الدافع: ${result.motive || 'غير معروف'}<br>
                ${result.details}
            `;
            
            resultProofs.innerHTML = '';
            if (result.evidence && result.evidence.length > 0) {
                result.evidence.forEach(e => {
                    const li = document.createElement('li');
                    li.textContent = `🔍 ${e}`;
                    resultProofs.appendChild(li);
                });
            } else {
                resultProofs.innerHTML = '<li style="color:var(--text-muted);">لا توجد أدلة مسجلة</li>';
            }
            
            resultTime.textContent = `${result.time || 0} دقيقة`;
            resultQuestions.textContent = result.questions || 0;
            resultPerformance.textContent = result.performance || 'ممتاز';
        } else {
            alert(`${result.message}\n${result.details}`);
        }
    }

    // ===== التلميحة =====
    function handleHint() {
        alert(engine.getHint());
    }

    // ===== تقرير نهائي =====
    function handleReport() {
        const s = engine.suspects.find(s => s.name === currentSuspectName);
        if (!s) return;
        
        const report = `
📄 تقرير التحقيق
━━━━━━━━━━━━━━━━━━━
📋 القضية: ${currentCase ? currentCase.title : 'غير معروفة'}
🔍 المشتبه به: ${s.name}
😐 الحالة: ${s.mood}
📊 الثقة: ${s.trust}%
📝 عدد الأسئلة: ${s.testimony.length}
🔍 الأدلة المكتشفة: ${engine.clues ? engine.clues.filter(c => c.found).length : 0} / ${engine.clues ? engine.clues.length : 0}
📈 التقدم: ${engine.getProgress()}%
        `;
        alert(report);
    }

    // ===== الأحداث =====
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderCases(currentFilter);
        });
    });

    btnNewRandom.addEventListener('click', () => {
        const randomCase = getRandomCase();
        if (randomCase) startCase(randomCase.id);
    });

    btnBackHome.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        homeScreen.style.display = 'block';
        resultScreen.style.display = 'none';
        renderCases(currentFilter);
    });

    btnHomeFromResult.addEventListener('click', () => {
        resultScreen.style.display = 'none';
        homeScreen.style.display = 'block';
        renderCases(currentFilter);
    });

    btnSend.addEventListener('click', sendQuestion);
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendQuestion();
    });
    
    btnAccuse.addEventListener('click', handleAccuse);
    btnHint.addEventListener('click', handleHint);
    btnReport.addEventListener('click', handleReport);
    
    btnReplay.addEventListener('click', () => {
        resultScreen.style.display = 'none';
        const randomCase = getRandomCase();
        if (randomCase) startCase(randomCase.id);
    });

    btnShare.addEventListener('click', () => {
        const text = `🕵️ حللت قضية "${currentCase ? currentCase.title : 'غير معروفة'}" في غرفة التحقيق!\n⏱️ الزمن: ${resultTime.textContent}\n⭐ التقييم: ${resultPerformance.textContent}`;
        if (navigator.share) {
            navigator.share({ title: 'غرفة التحقيق', text: text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => alert('📋 تم نسخ النتيجة!')).catch(() => {});
        }
    });

    btnSuspectNotes.addEventListener('click', () => {
        const s = engine.suspects.find(s => s.name === currentSuspectName);
        if (!s) return;
        const notes = prompt(`📝 ملاحظات عن ${s.name}:\n(الحالة: ${s.mood}, الثقة: ${s.trust}%)`);
        if (notes) {
            alert('✅ تم حفظ الملاحظات في دفتر المحقق.');
        }
    });

    // تحميل الصفحة الرئيسية
    renderCases('all');
    
    // تعبئة المفتاح تلقائياً (إذا كان موجوداً)
    const savedKey = localStorage.getItem('deepseek_key');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        setTimeout(setupAPI, 500);
    }
    
    // حفظ المفتاح عند تغييره
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('deepseek_key', apiKeyInput.value.trim());
    });

    console.log('✅ تم تشغيل غرفة التحقيق بنجاح');
});