// engine-final.js – محرك التحقيق مع DeepSeek API (المفتاح مضمن)
class InvestigationEngine {
    constructor() {
        this.currentCase = null;
        this.suspects = [];
        this.clues = [];
        this.interrogations = {};
        this.foundClues = new Set();
        this.questionsAsked = 0;
        this.startTime = null;
        this.solved = false;
        this.progress = 0;
        
        // إعدادات DeepSeek – المفتاح مضمن هنا
        this.apiKey = 'sk-3f8cc6b4af934e88b9d505278b56d939';
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        this.model = 'deepseek-chat';
        this.provider = 'deepseek'; // deepseek, openai, local
    }

    loadCase(caseData) {
        this.currentCase = JSON.parse(JSON.stringify(caseData));
        this.suspects = this.currentCase.suspects.map(s => ({
            ...s,
            mood: 'محايد',
            trust: 50,
            testimony: [],
            secrets: this.generateSecrets(s)
        }));
        this.clues = this.currentCase.clues.map(c => ({ ...c, found: false }));
        this.interrogations = {};
        this.foundClues = new Set();
        this.questionsAsked = 0;
        this.startTime = Date.now();
        this.solved = false;
        this.progress = 0;

        this.suspects.forEach(s => {
            this.interrogations[s.name] = [];
        });

        return this.currentCase;
    }

    generateSecrets(suspect) {
        const secrets = [
            'كان على علاقة بالضحية',
            'لديه دين كبير للضحية',
            'كان يخطط للهروب',
            'يعرف شيئاً لم يخبر به',
            'كان في مكان الجريمة لكنه يخفي ذلك'
        ];
        return secrets[Math.floor(Math.random() * secrets.length)];
    }

    // ===== بناء سياق القضية =====
    buildContext(suspect, isKiller) {
        const caseData = this.currentCase;
        const allTestimony = suspect.testimony.map(t => `س: ${t.q}\nج: ${t.a}`).join('\n');
        const foundCluesList = this.clues.filter(c => c.found).map(c => c.desc).join('، ') || 'لا توجد أدلة مكتشفة بعد';

        return {
            systemPrompt: `
أنت "${suspect.name}"، ${suspect.job}، في قضية جريمة.
تفاصيل القضية:
- الجريمة: ${caseData.crime ? caseData.crime.type || caseData.crime : 'غير معروفة'}
- المكان: ${caseData.location}
- الوقت: ${caseData.time}
- السلاح: ${caseData.weapon || 'غير معروف'}

شخصيتك: ${suspect.personality || 'طبيعي'}
دافعك الظاهر: ${suspect.motive || 'لا يوجد'}
${isKiller ? '⚠️ أنت الجاني الحقيقي. يجب أن تحاول التهرب وعدم الاعتراف إلا إذا واجهتك أدلة قاطعة.' : 'أنت بريء. حاول إقناع المحقق ببراءتك.'}

أسرارك: ${suspect.secrets || 'لا شيء مهم'}

الأدلة المكتشفة حتى الآن: ${foundCluesList}

سجل الاستجواب السابق:
${allTestimony || 'لا يوجد استجواب سابق'}

قواعد الرد:
1. تحدث بلهجة عربية فصحى أو عامية حسب شخصيتك.
2. كن طبيعياً ومقنعاً.
3. إذا كنت الجاني، حاول التهرب ولا تعترف إلا عند الضغط الشديد.
4. إذا كنت بريئاً، تعاون ولكن مع بعض التحفظ.
5. ردودك يجب أن تكون مختلفة لكل سؤال، وليست مكررة.
6. استخدم أدوات لغوية مثل: التردد، التكتم، التغيير المفاجئ في النبرة.
7. لا تخرج عن دورك.
8. اجعل ردودك قصيرة ومباشرة (لا تتجاوز 3 جمل).
`,
            suspectName: suspect.name,
            isKiller,
            caseData
        };
    }

    // ===== استدعاء DeepSeek API =====
    async callAI(context, question) {
        if (this.provider === 'local') {
            return this.simulateResponse(context, question);
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: context.systemPrompt },
                        { role: 'user', content: `المحقق يسأل: ${question}` }
                    ],
                    temperature: 0.85,
                    max_tokens: 200,
                    presence_penalty: 0.5,
                    frequency_penalty: 0.3,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ خطأ DeepSeek:', errorData);
                throw new Error(`API Error: ${errorData.error?.message || response.status}`);
            }

            const data = await response.json();
            let reply = data.choices[0].message.content.trim();
            
            // تنظيف الرد من أي إضافات
            reply = reply.replace(/^["']|["']$/g, '');
            
            return reply;

        } catch (error) {
            console.error('❌ فشل الاتصال بـ DeepSeek:', error);
            return this.simulateResponse(context, question);
        }
    }

    // ===== محاكاة محلية (للاختبار) =====
    simulateResponse(context, question) {
        const isKiller = context.isKiller;
        const q = question.toLowerCase();
        
        const responses = {
            'متى|وقت|ساعة': isKiller 
                ? `كان الوقت حوالي ${this.currentCase.time}... لكن لا أتذكر بالضبط.`
                : `كنت في منزلي في ذلك الوقت. لدي شهود.`,
            'أين|مكان|موقع': isKiller
                ? `كنت في ${this.currentCase.location}... لكن ليس طوال الوقت.`
                : `كنت في العمل حتى وقت متأخر. زملائي يؤكدون ذلك.`,
            'سلاح|قتل|جريمة': isKiller
                ? `السلاح؟ لا أعرف عن أي سلاح تتحدث!`
                : `سمعت أن السلاح كان ${this.currentCase.weapon || 'غير معروف'}.`,
            'دليل|بصمة|أثر': isKiller
                ? `ربما تركت شيئاً دون قصد... لكن هذا لا يعني أني الجاني!`
                : `الأدلة يمكن أن تكون مضللة.`,
            'اعترف|أنت الفاعل|قتلت': isKiller
                ? `(صمت طويل)... لا أستطيع...`
                : `كيف تجرؤ؟! أنا بريء تماماً!`,
            'الدافع|سبب|لماذا': isKiller
                ? `الدافع كان... لا أريد التحدث عن هذا.`
                : `ليس لدي أي دافع. علاقتي بالضحية كانت جيدة.`
        };

        for (const [pattern, response] of Object.entries(responses)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(q)) {
                return response;
            }
        }

        return isKiller
            ? `أنا متوتر... لا أتذكر جيداً. دعني أفكر.`
            : `هذا السؤال لا يخدم التحقيق. اسأل شيئاً آخر.`;
    }

    // ===== الاستجواب الرئيسي =====
    async interrogate(suspectName, question) {
        const suspect = this.suspects.find(s => s.name === suspectName);
        if (!suspect) return 'المشتبه به غير موجود.';

        this.questionsAsked++;
        const isKiller = (this.suspects.indexOf(suspect) === this.currentCase.killerId);
        const context = this.buildContext(suspect, isKiller);

        try {
            const response = await this.callAI(context, question);
            this.analyzeResponse(response, suspect);
            
            suspect.testimony.push({ q: question, a: response });
            this.interrogations[suspect.name].push({ q: question, a: response });
            this.updateProgress();

            return response;
        } catch (error) {
            console.error('❌ خطأ:', error);
            return 'عذراً، حدث خطأ. حاول مرة أخرى.';
        }
    }

    // ===== تحليل الرد =====
    analyzeResponse(response, suspect) {
        const lower = response.toLowerCase();
        
        if (lower.includes('اعترف') || lower.includes('أنا من فعل') || lower.includes('نعم أنا')) {
            suspect.mood = 'منهار';
            suspect.trust = 10;
        } else if (lower.includes('خائف') || lower.includes('خوف') || lower.includes('لا أعرف')) {
            suspect.mood = 'خائف';
            suspect.trust = Math.max(0, suspect.trust - 10);
        } else if (lower.includes('غاضب') || lower.includes('كيف تجرؤ') || lower.includes('اتهام')) {
            suspect.mood = 'غاضب جداً';
            suspect.trust = Math.max(0, suspect.trust - 15);
        } else if (lower.includes('متوتر') || lower.includes('قلق') || lower.includes('تردد')) {
            suspect.mood = 'متوتر';
            suspect.trust = Math.max(0, suspect.trust - 5);
        } else if (lower.includes('بريء') || lower.includes('شاهد') || lower.includes('دليل')) {
            suspect.mood = 'واثق';
            suspect.trust = Math.min(100, suspect.trust + 10);
        }

        // كشف الأدلة
        this.clues.forEach(c => {
            if (!c.found && (lower.includes(c.desc.substring(0, 10)) || lower.includes(c.icon))) {
                c.found = true;
                this.foundClues.add(c.id);
            }
        });
    }

    updateProgress() {
        const totalClues = this.clues.length;
        const found = this.foundClues.size;
        const trustSum = this.suspects.reduce((sum, s) => sum + s.trust, 0);
        const trustAvg = trustSum / this.suspects.length;
        
        this.progress = Math.min(100, (found / totalClues) * 50 + (trustAvg / 100) * 50);
        this.progress = Math.round(this.progress);
    }

    getProgress() { return this.progress; }

    accuse(suspectName) {
        const suspect = this.suspects.find(s => s.name === suspectName);
        if (!suspect) return { success: false, message: 'المشتبه به غير موجود.' };

        const isKiller = (this.suspects.indexOf(suspect) === this.currentCase.killerId);
        
        if (isKiller) {
            this.solved = true;
            this.progress = 100;
            return {
                success: true,
                message: `✅ صحيح! ${suspectName} هو الفاعل.`,
                details: `الدليل القاطع: ${this.currentCase.finalProof}`,
                motive: suspect.motive,
                evidence: this.clues.filter(c => c.found).map(c => c.desc),
                time: Math.round((Date.now() - this.startTime) / 60000),
                questions: this.questionsAsked,
                performance: this.getPerformance()
            };
        } else {
            return {
                success: false,
                message: `❌ خطأ! ${suspectName} بريء.`,
                details: 'أعد التحقيق وابحث عن الأدلة الحاسمة.'
            };
        }
    }

    getPerformance() {
        const score = this.progress;
        if (score >= 90) return 'ممتاز 🏆';
        if (score >= 70) return 'جيد جداً ⭐';
        if (score >= 50) return 'جيد 👍';
        return 'يحتاج تحسين 📚';
    }

    getTimeline() {
        return [
            { time: '10:00 مساءً', event: 'الضحية كان في اجتماع' },
            { time: '10:30 مساءً', event: 'مغادرة الضحية الاجتماع' },
            { time: '11:00 مساءً', event: 'وصول الضحية إلى المنزل' },
            { time: '11:30 مساءً', event: 'آخر مكالمة هاتفية للضحية' },
            { time: '11:47 مساءً', event: 'وقت الوفاة المقدر' },
            { time: '12:00 صباحاً', event: 'اكتشاف الجثة' }
        ];
    }

    getRelations() {
        const names = this.suspects.map(s => s.name);
        const relations = [];
        for (let i = 0; i < names.length; i++) {
            for (let j = i+1; j < names.length; j++) {
                if (Math.random() > 0.6) {
                    relations.push(`${names[i]} ↔ ${names[j]}: ${['عداوة', 'صداقة', 'شراكة', 'خلاف عائلي', 'علاقة سرية'][Math.floor(Math.random()*5)]}`);
                }
            }
        }
        return relations;
    }

    getHint() {
        const found = this.foundClues.size;
        const total = this.clues.length;
        if (found === 0) return '💡 حاول التركيز على الأدلة المادية في مسرح الجريمة.';
        if (found < total / 2) return '💡 اسأل المشتبهين عن علاقتهم بالضحية ودوافعهم.';
        if (found < total * 0.75) return '💡 ركز على التناقضات في أقوال المشتبهين.';
        return '💡 لديك أدلة كافية. حان وقت الاتهام.';
    }

    // ===== اختبار الاتصال =====
    async testConnection() {
        if (this.provider === 'local') {
            return { success: true, message: 'المحاكاة المحلية تعمل' };
        }
        
        if (!this.apiKey || this.apiKey.length < 10) {
            return { success: false, message: 'مفتاح API غير صحيح' };
        }

        try {
            const response = await fetch('https://api.deepseek.com/v1/models', {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            
            if (response.ok) {
                return { success: true, message: '✅ الاتصال بـ DeepSeek ناجح!' };
            } else {
                const error = await response.text();
                return { success: false, message: `⚠️ فشل الاتصال: ${error}` };
            }
        } catch (e) {
            return { success: false, message: `❌ خطأ: ${e.message}` };
        }
    }
}

window.InvestigationEngine = InvestigationEngine;
console.log('✅ تم تحميل محرك التحقيق مع DeepSeek (المفتاح مضمن)');