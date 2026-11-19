(function () {
    'use strict';

    if (typeof Vue === 'undefined') {
        console.warn('[vue-app] Vue 未加载，交互模块保持静态兜底展示');
        return;
    }

    var { createApp, ref, computed, onMounted } = Vue;

    var store = (function () {
        try {
            var ls = window.localStorage;
            ls.setItem('__probe__', '1');
            ls.removeItem('__probe__');
            return ls;
        } catch (e) {
            var mem = Object.create(null);
            return {
                getItem: function (k) {
                    return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
                },
                setItem: function (k, v) { mem[k] = String(v); },
                removeItem: function (k) { delete mem[k]; }
            };
        }
    })();

    function mountIf(selector, app) {
        var el = document.querySelector(selector);
        if (el) {
            app.mount(el);
        } else {
            console.warn('[vue-app] 未找到挂载点 ' + selector);
        }
    }

    /* =========================================================
       1. 学术诚信承诺墙
       ========================================================= */
    var KEY_COUNT = 'qingfeng_promise_count';
    var KEY_DONE = 'qingfeng_promise_done';

    mountIf('#promiseApp', createApp({
        setup: function () {
            var count = ref(0);
            var done = ref(false);

            onMounted(function () {
                var saved = parseInt(store.getItem(KEY_COUNT), 10);
                count.value = (isNaN(saved) || saved < 0) ? 0 : saved;
                done.value = store.getItem(KEY_DONE) === '1';
            });
              return { count: count, done: done };
        },
        template: `
            <div class="promise-box" id="promise">
                <h3>学术诚信承诺墙</h3>
                <p>我承诺：诚信为学，清白做人，杜绝作弊与学术不端。</p>
                <div class="promise-count">{{ count }}</div>
                <div>位同学已作出承诺</div>
                <a class="promise-btn promise-link" :class="{ 'is-done': done }" href="promise.html">
                      {{ done ? '已承诺' : '前往承诺页面 →' }}
                  </a>
                <div class="promise-note" v-if="done">你已作出学术诚信承诺，点击可再次查看承诺书</div>
            </div>`
    }));

    /* =========================================================
       2. 廉洁寄语墙
       ========================================================= */
    var KEY_WISH = 'qingfeng_wish_list';
    var MAX_WISH = 30;

    var DEFAULT_WISHES = [
        { text: '愿吾辈以清白立身，以勤学立业，清风常伴左右。', who: '佚名同学' },
        { text: '不贪一时之利，不负四年青春，诚信考试，踏实做人。', who: '一名在校生' },
        { text: '俭以养德，廉以养心，愿校园处处皆是清风正气。', who: '佚名同学' }
    ];

    function loadWishes() {
        try {
            var raw = store.getItem(KEY_WISH);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    return parsed.filter(function (w) {
                        return w && typeof w.text === 'string' && w.text.trim();
                    });
                }
            }
        } catch (e) {
            console.warn('[vue-app] 寄语数据解析失败，已使用默认数据');
        }
        return DEFAULT_WISHES.map(function (w, i) {
            return { id: 'seed-' + i, text: w.text, who: w.who };
        });
    }

    mountIf('#wishApp', createApp({
        setup: function () {
            var wishes = ref([]);
            var name = ref('');
            var text = ref('');
            var tip = ref('');
            var tipTimer = null;

            onMounted(function () {
                wishes.value = loadWishes();
            });

            function flashTip(msg) {
                tip.value = msg;
                window.clearTimeout(tipTimer);
                tipTimer = window.setTimeout(function () { tip.value = ''; }, 2600);
            }

            function submit() {
                var body = text.value.trim();
                if (!body) {
                    flashTip('请先写下一句寄语，再点击发布');
                    return;
                }
                wishes.value.unshift({
                    id: 'w' + Date.now() + Math.floor(Math.random() * 1000),
                    text: body,
                    who: name.value.trim() || '佚名同学'
                });
                if (wishes.value.length > MAX_WISH) {
                    wishes.value = wishes.value.slice(0, MAX_WISH);
                }
                try {
                    store.setItem(KEY_WISH, JSON.stringify(wishes.value));
                } catch (e) {
                    console.warn('[vue-app] 寄语保存失败，本次仅在本页显示');
                }
                text.value = '';
                name.value = '';
                flashTip('寄语已发布，保存在本机');
            }

            return {
                wishes: wishes, name: name, text: text, tip: tip,
                submit: submit
            };
        },
        template: `
            <form class="wish-form" autocomplete="off" @submit.prevent="submit">
                <input type="text" v-model="name" placeholder="你的称呼（选填）" maxlength="12">
                <input type="text" v-model="text" placeholder="写下你的廉洁寄语…" maxlength="50" required>
                <button type="submit" class="btn btn-primary">发布寄语</button>
            </form>
            <div class="wish-tip" v-if="tip">{{ tip }}</div>
            <div class="wish-wall">
                <div class="wish-item" v-for="w in wishes" :key="w.id">
                    <p>{{ w.text }}</p>
                    <div class="who">—— {{ w.who }}</div>
                </div>
            </div>`
    }));
})();
