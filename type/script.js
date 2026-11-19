/* =========================================================
   心沐清风 · 青春净芯 —— 页面基础交互
   说明：本文件负责与内容无关的通用交互（导航、滚动动效、
   渐显、数字动画、按钮波纹）；承诺墙 / 寄语墙 / 小测三个
   数据型交互模块由 js/vue-app.js 接管。
   ========================================================= */

/* ============ 通用工具 ============ */
var raf = window.requestAnimationFrame
    ? function (fn) { return window.requestAnimationFrame(fn); }
    : function (fn) { return setTimeout(fn, 16); };

var reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ 导航：滚动变色 + 回到顶部 + 进度条 + 锚点高亮 ============ */
var navbar = document.getElementById('navbar');
var backTop = document.getElementById('backTop');
var progressBar = document.getElementById('progressBar');

var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
var footerEl = document.querySelector('footer');
var footerTop = Infinity;
var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a'));
var sectionOffsets = [];
var ticking = false;

/* 缓存每个板块的位置，避免滚动时反复触发重排（offsetTop 强制同步布局） */
function cacheSectionOffsets() {
    sectionOffsets = sections.map(function (sec) {
        return { id: sec.id, top: sec.offsetTop, bottom: sec.offsetTop + sec.offsetHeight };
    });
    footerTop = footerEl ? footerEl.offsetTop : Infinity;
}

function updateScrollUi() {
    var y = window.scrollY || window.pageYOffset || 0;

    if (navbar) {
        navbar.classList[y > 40 ? 'add' : 'remove']('scrolled');

        /* 导航栏配色跟随所在板块：深色板块用深色导航，浅色板块用浅色导航 */
        var probe = y + 34;
        var theme = 'light';
        for (var j = 0; j < sectionOffsets.length; j++) {
            if (probe >= sectionOffsets[j].top && probe < sectionOffsets[j].bottom) {
                theme = sectionOffsets[j].id === 'home' ? 'dark' : 'light';
            }
        }
        if (probe >= footerTop) { theme = 'dark'; }
        if (navbar.getAttribute('data-theme') !== theme) {
            navbar.setAttribute('data-theme', theme);
        }
    }
    if (backTop) {
        backTop.classList[y > 400 ? 'add' : 'remove']('show');
    }
    if (progressBar) {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }

    /* 多页面站点导航为 .html 链接，不再按滚动位置改写高亮 */
    var hashNav = false;
    navLinks.forEach(function (l) {
        if ((l.getAttribute('href') || '').charAt(0) === '#') { hashNav = true; }
    });
    if (hashNav && sectionOffsets.length) {
        var current = sectionOffsets[0].id;
        for (var i = 0; i < sectionOffsets.length; i++) {
            if (y >= sectionOffsets[i].top - 110) {
                current = sectionOffsets[i].id;
            }
        }
        navLinks.forEach(function (link) {
            link.classList[link.getAttribute('href') === '#' + current ? 'add' : 'remove']('active');
        });
    }

    ticking = false;
}

function onScroll() {
    if (!ticking) {
        ticking = true;
        raf(updateScrollUi);
    }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', function () {
    cacheSectionOffsets();
    onScroll();
});
window.addEventListener('load', function () {
    cacheSectionOffsets();
    onScroll();
});

cacheSectionOffsets();
onScroll();

/* ============ 移动端菜单 ============ */
var navToggle = document.getElementById('navToggle');
var navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
        var open = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.forEach.call(navMenu.querySelectorAll('a'), function (link) {
        link.addEventListener('click', function () {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ============ 卡片交错入场延迟 ============ */
['.people-grid', '.story-grid', '.warning-grid', '.timeline'].forEach(function (sel) {
    var grid = document.querySelector(sel);
    if (!grid) return;
    Array.prototype.forEach.call(grid.children, function (child, idx) {
        child.style.transitionDelay = (idx * 0.08) + 's';
    });
});

/* ============ 滚动渐显（IntersectionObserver） ============ */
var revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
} else {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('visible'); });
}

/* ============ 数字滚动动画 ============ */
var nums = document.querySelectorAll('.num');

function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion) {
        el.textContent = target;
        return;
    }
    var current = 0;
    var step = Math.max(1, Math.ceil(target / 30));
    var timer = setInterval(function () {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = current;
    }, 40);
}

if ('IntersectionObserver' in window) {
    var numIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                numIo.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nums, function (n) { numIo.observe(n); });
} else {
    Array.prototype.forEach.call(nums, function (n) {
        n.textContent = n.getAttribute('data-count');
    });
}

/* ============ 按钮点击波纹 ============
   使用事件委托：Vue 动态渲染出的按钮同样能触发，不依赖初始化顺序 */
function addRipple(e, btn) {
    var rect = btn.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.width = size + 'px';
    rip.style.height = size + 'px';
    rip.style.left = (e.clientX - rect.left - size / 2) + 'px';
    rip.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(rip);
    setTimeout(function () {
        if (rip.parentNode) rip.parentNode.removeChild(rip);
    }, 600);
}

document.addEventListener('click', function (e) {
    if (reduceMotion) return;
    var target = e.target;
    var btn = target && target.closest ? target.closest('.btn, .promise-btn') : null;
    if (btn && !btn.disabled) {
        addRipple(e, btn);
    }
});

/* ============ 回到顶部 ============ */
if (backTop) {
    backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
}

/* ============ 首屏飘落花瓣 ============ */
var hero = document.getElementById('home');
if (hero && !reduceMotion) {
    for (var i = 0; i < 12; i++) {
        var petal = document.createElement('div');
        petal.className = 'petal';
        petal.style.left = Math.random() * 100 + '%';
        petal.style.animationDuration = 6 + Math.random() * 6 + 's';
        petal.style.animationDelay = Math.random() * 6 + 's';
        petal.style.opacity = 0.3 + Math.random() * 0.4;
        hero.appendChild(petal);
    }
}
