// 优化的 Giscus 主题与字体颜色同步脚本
(function () {
    // 定义全局函数，以便在页面跳转后调用
    window.applyGiscusTheme = function() {
        if (window._internalApplyGiscusTheme) {
            window._internalApplyGiscusTheme();
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        // 精简优化版：保留选择器优先级、映射注入和 iframe postMessage；移除 themeColors 支持

        // 默认主题映射（可被 window.giscusThemeMapping 覆盖）
        var defaultThemeMapping = {
            'color-theme-1': 'light',
            'color-theme-2': 'dark_dimmed',
            'default': 'light',
            'sepia': 'preferred_color_scheme',
            'night': 'dark_dimmed',
            'white': 'light'
        };

        var themeMapping = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object')
            ? window.giscusThemeMapping
            : defaultThemeMapping;

    var iframeSelector = 'iframe.giscus-frame';
        var pendingTheme = null;
        var scheduled = null;
        var iframeRef = null;
    var _pendingAttempts = 0;
    var _maxAttempts = 8;
    var _backoffBase = 150; // ms
    // 可配置项：当 ensureIframeReceivesTheme 超时未生效时是否触发受保护的 reload（默认开启）
    try { if (typeof window.giscusEnsureReloadOnTimeout === 'undefined') window.giscusEnsureReloadOnTimeout = true; } catch (e) {}
    // ensureIframeReceivesTheme 超时时间（ms），默认 6000
    try { if (typeof window.giscusEnsureReceiveTimeoutMs === 'undefined') window.giscusEnsureReceiveTimeoutMs = 6000; } catch (e) {}

    // 读取运行时配置的辅助函数（包装 window.giscusConfig）
    function getGiscusConfig() {
        try { return window.giscusConfig || {}; } catch (e) { return {}; }
    }

        // 防抖工具
        function debounce(fn, wait) {
            var t = null;
            return function () {
                var args = arguments;
                if (t) clearTimeout(t);
                t = setTimeout(function () { t = null; fn.apply(null, args); }, wait);
            };
        }

        function findIframe() {
            try {
                if (iframeRef && document.contains(iframeRef)) return iframeRef;
            } catch (e) {}
            try {
                // Try several selectors to locate the giscus iframe in different page structures
                var selectors = [
                    'iframe.giscus-frame',
                    '#giscus-container iframe.giscus-frame',
                    '#giscus-container iframe',
                    '.giscus iframe',
                    'iframe[src*="giscus" i]',
                    'iframe[src*="giscus.app" i]',
                    'iframe[title*="giscus" i]'
                ];
                var f = null;
                for (var si = 0; si < selectors.length; si++) {
                    try {
                        f = document.querySelector(selectors[si]);
                        if (f) break;
                    } catch (e) { /* ignore selector errors */ }
                }
                // last resort: any iframe inside an element with id/class that hints giscus
                if (!f) {
                    try { f = document.querySelector('#giscus iframe'); } catch (e) {}
                }
                if (f) {
                    iframeRef = f;
                    // attach load handler to flush pending theme when iframe finishes loading
                    try { attachIframeLoadHandler(iframeRef); } catch (e) {}
                }
                return f;
            } catch (e) { return null; }
        }

        function attachIframeLoadHandler(iframe) {
            try {
                if (!iframe) return;
                // avoid duplicating listeners
                if (iframe.__giscusLoadHandlerAttached) return;
                iframe.__giscusLoadHandlerAttached = true;
                iframe.addEventListener('load', function () {
                    try {
                        if (pendingTheme) {
                            safePostMessage(iframe, { giscus: { setConfig: { theme: pendingTheme } } }, true);
                            pendingTheme = null;
                        }
                    } catch (e) {}
                });
            } catch (e) {}
        }

        // 安全的 postMessage，同时支持尝试多种消息形态与多个 origin 以提高兼容性
        // 用法: safePostMessage(iframe, msg, true) -> 尝试多种变体
        function safePostMessage(iframe, msg, variants) {
            try {
                if (!(iframe && iframe.contentWindow)) return false;
                if (!variants) {
                    iframe.contentWindow.postMessage(msg, '*');
                    return true;
                }

                // 当要求 variants 时，尝试多种消息形态（覆盖不同 giscus 版本）和多个 origin
                var theme = null;
                try {
                    if (msg && msg.giscus && msg.giscus.setConfig && typeof msg.giscus.setConfig.theme !== 'undefined') theme = msg.giscus.setConfig.theme;
                    else if (msg && msg.setConfig && typeof msg.setConfig.theme !== 'undefined') theme = msg.setConfig.theme;
                } catch (e) { theme = null; }

                var payloads = [];
                if (theme !== null) {
                    payloads.push({ giscus: { setConfig: { theme: theme } } });
                    payloads.push({ setConfig: { theme: theme } });
                    // historical variants
                    payloads.push({ type: 'setConfig', config: { theme: theme } });
                }
                // 保留原始 msg 以防其他拓展使用不同字段
                payloads.push(msg);

                var origins = ['*', 'https://giscus.app', 'https://giscus.github.com'];
                for (var pi = 0; pi < payloads.length; pi++) {
                    for (var oi = 0; oi < origins.length; oi++) {
                        try {
                            iframe.contentWindow.postMessage(payloads[pi], origins[oi]);
                            return true;
                        } catch (e) {}
                    }
                }
            } catch (e) {}
            return false;
        }

        var scheduleIframeCheck = debounce(function () {
            try {
                var f = findIframe();
                if (f && pendingTheme) {
                    if (safePostMessage(f, { giscus: { setConfig: { theme: pendingTheme } } }, true)) {
                        pendingTheme = null;
                        _pendingAttempts = 0;
                    }
                }
            } catch (e) {}
        }, 150);

        // 创建并插入 giscus client.js（使用 window.giscusConfig），确保 data-theme 在插入时为映射后的主题
        function createGiscusClient(theme) {
            try {
                var cfg = getGiscusConfig();
                var container = document.getElementById('giscus-container');
                if (!container) return null;

                // 移除旧的 script/iframe
                try { var oldScript = document.getElementById('giscus-script'); if (oldScript) oldScript.remove(); } catch (e) {}
                try { var oldIframe = document.querySelector('iframe.giscus-frame'); if (oldIframe) oldIframe.remove(); } catch (e) {}

                var script = document.createElement('script');
                script.id = 'giscus-script';
                script.className = 'giscus-script';
                script.src = 'https://giscus.app/client.js';
                script.setAttribute('crossorigin', 'anonymous');
                // Set data attributes from config
                try { if (cfg.repo) script.setAttribute('data-repo', cfg.repo); } catch (e) {}
                try { if (cfg.repoId) script.setAttribute('data-repo-id', cfg.repoId); } catch (e) {}
                try { if (cfg.category) script.setAttribute('data-category', cfg.category); } catch (e) {}
                try { if (cfg.categoryId) script.setAttribute('data-category-id', cfg.categoryId); } catch (e) {}
                try { if (cfg.mapping) script.setAttribute('data-mapping', cfg.mapping); } catch (e) {}
                try {
                    var term = (window.location.pathname || '');
                    if (term && term.endsWith('/index.html')) term = term.substring(0, term.length - 11);
                    else if (term && term.endsWith('.html')) term = term.substring(0, term.length - 5);
                    script.setAttribute('data-term', term);
                } catch (e) {}
                try { if (cfg.strict) script.setAttribute('data-strict', cfg.strict); } catch (e) {}
                try { if (typeof cfg.reactionsEnabled !== 'undefined') script.setAttribute('data-reactions-enabled', cfg.reactionsEnabled); } catch (e) {}
                try { if (typeof cfg.emitMetadata !== 'undefined') script.setAttribute('data-emit-metadata', cfg.emitMetadata); } catch (e) {}
                try { if (cfg.inputPosition) script.setAttribute('data-input-position', cfg.inputPosition); } catch (e) {}
                try { script.setAttribute('data-theme', theme || (cfg.theme || 'light')); } catch (e) {}
                try { if (cfg.lang) script.setAttribute('data-lang', cfg.lang); } catch (e) {}
                try { script.setAttribute('data-loading', (cfg.loading || 'eager')); } catch (e) {}
                // async to avoid blocking
                script.async = true;

                // load handler: ensure theme applied after script loads
                script.onload = function () {
                    try {
                        if (window.giscusDebug) console.log('[giscus-theme] giscus client loaded, applying theme', theme);
                        setTimeout(function () { tryPostThemeImmediate(true); }, 300);
                    } catch (e) {}
                };

                container.appendChild(script);
                return script;
            } catch (e) { return null; }
        }

        function detectActiveThemeClass() {
            var book = document.querySelector('.book');
            if (!book) return 'default';
            
            // 调试日志，帮助诊断主题检测
            if (window.giscusDebug) {
                console.log('[giscus-theme] Book element classes:', Array.from(book.classList));
            }
            // 优先：如果页面注入了 themeMapping（来自 HonKit 的 book.json），按 mapping 中的 key检测子元素或类
            try {
                var injectedMap = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object') ? window.giscusThemeMapping : (themeMapping || null);
                if (injectedMap) {
                    for (var mapKey in injectedMap) {
                        if (!Object.prototype.hasOwnProperty.call(injectedMap, mapKey)) continue;
                        if (mapKey === 'default') continue; // default 作为回退
                        try {
                            // 优先在 .book 内查找带有该类的子元素
                            if (book.querySelector && book.querySelector('.' + mapKey)) return mapKey;
                            // 检查 .book 本身是否有该类
                            if (book.classList && book.classList.contains(mapKey)) return mapKey;
                            // 检查 data-theme / data-theme-* 属性
                            try {
                                if (book.getAttribute && book.getAttribute('data-theme') === mapKey) return mapKey;
                                if (document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-theme') === mapKey) return mapKey;
                                // 匹配 data-theme-<key> = "true" 或存在
                                if (book.querySelector && book.querySelector('[data-theme-' + mapKey + ']')) return mapKey;
                            } catch (e) {}
                            // 检查根元素（某些主题会在根元素打类）
                            if (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains(mapKey)) return mapKey;
                        } catch (e) {}
                    }
                }
            } catch (e) {}

            // 第一优先级：检查特定主题类名（兼容旧逻辑）
            if (book.classList.contains('color-theme-1')) return 'color-theme-1';
            if (book.classList.contains('theme-color-1')) return 'color-theme-1'; // 别名处理
            
            if (book.classList.contains('color-theme-2')) return 'color-theme-2';
            if (book.classList.contains('theme-color-2')) return 'color-theme-2'; // 别名处理

            // 第二优先级：查找 color-theme-* 类
            for (var i = 0; i < book.classList.length; i++) {
                var c = book.classList[i];
                if (c.indexOf('color-theme-') === 0) return c;
                if (c.indexOf('theme-color-') === 0) {
                    // 将theme-color-X转换为color-theme-X
                    return 'color-theme-' + c.substring(12); 
                }
            }
            
            // 第三优先级：检查 .book.font-size-2.font-family-1.<key> 形式
            for (var key in themeMapping) {
                if (!Object.prototype.hasOwnProperty.call(themeMapping, key)) continue;
                if (book.classList.contains(key)) return key;
                var sel = '.book.font-size-2.font-family-1.' + key;
                if (document.querySelector(sel)) return key;
            }

            // 其它常见类名回退
            if (book.classList.contains('night')) return 'night';
            if (book.classList.contains('sepia')) return 'sepia';
            if (book.classList.contains('white')) return 'white';
            return 'default';
        }

        function mapToGiscusTheme(activeClass) {
            if (activeClass && themeMapping[activeClass]) return themeMapping[activeClass];
            // 回退：检测 body / document 或系统偏好
            if (
                document.body.classList.contains('dark') ||
                document.body.classList.contains('honkit-dark') ||
                document.documentElement.classList.contains('dark') ||
                (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ) {
                return 'dark';
            }
            return 'light';
        }

        // 从注入的 theme mapping 中检测并直接返回对应的 giscus 主题（值），否则返回 null
        function getGiscusThemeFromConfig() {
            try {
                var book = document.querySelector('.book');
                var mapping = (window.giscusThemeMapping && typeof window.giscusThemeMapping === 'object') ? window.giscusThemeMapping : themeMapping;
                if (!mapping) return null;
                var defaultTheme = mapping['default'] || null;
                for (var k in mapping) {
                    if (!Object.prototype.hasOwnProperty.call(mapping, k)) continue;
                    if (k === 'default') continue;
                    try {
                        // 优先检查 root
                        if (document.documentElement && document.documentElement.classList && document.documentElement.classList.contains(k)) return mapping[k];
                        // 检查 .book 自身
                        if (book && book.classList && book.classList.contains(k)) return mapping[k];
                        // 检查 .book 内部子元素
                        if (book && book.querySelector && book.querySelector('.' + k)) return mapping[k];
                    } catch (e) {}
                }
                return defaultTheme;
            } catch (e) { return null; }
        }

        function postThemeToIframe(theme) {
            var f = findIframe();
            if (f) {
                var ok = safePostMessage(f, { giscus: { setConfig: { theme: theme } } });
                if (ok) {
                    try { _lastSentTheme = theme; } catch (e) {}
                    try { window._giscusLastSentTheme = _lastSentTheme; } catch (e) {}
                } else {
                    pendingTheme = theme;
                }
            } else {
                pendingTheme = theme;
                _pendingAttempts = 0;
                scheduleIframeRetry();
            }
        }

        function scheduleIframeRetry() {
            try {
                if (!_pendingAttempts) _pendingAttempts = 0;
                if (_pendingAttempts >= _maxAttempts) return;
                _pendingAttempts++;
                var delay = Math.min(2000, _backoffBase * Math.pow(1.6, _pendingAttempts));
                setTimeout(function () {
                    try {
                        if (!pendingTheme) return;
                        var f = findIframe();
                        if (f) {
                            if (safePostMessage(f, { giscus: { setConfig: { theme: pendingTheme } } }, true)) {
                                try { _lastSentTheme = pendingTheme; window._giscusLastSentTheme = _lastSentTheme; } catch (e) {}
                                pendingTheme = null;
                                _pendingAttempts = 0;
                                return;
                            }
                        }
                        // re-schedule if still pending
                        scheduleIframeRetry();
                    } catch (e) { }
                }, delay);
            } catch (e) {}
        }

        // 立即尝试通过 postMessage 将主题发送到 iframe 的轻量函数
        // 带速率限制与回退，不会强制 reload iframe（除非找不到 iframe，则设置 pending）
        function tryPostThemeImmediate(force) {
            try {
                var now = Date.now();
                // 速率限制：同一上下文内不超过一次/600ms（除非 force 为 true）
                if (!force && window._giscusLastImmediateAttempt && (now - window._giscusLastImmediateAttempt) < 600) return;
                window._giscusLastImmediateAttempt = now;

                // 获取映射后的主题
                var theme = (window._internalApplyGiscusTheme ? window._internalApplyGiscusTheme() : null);
                if (!theme) return;

                var f = findIframe();
                if (f) {
                    // 优先通过 postMessage 更新主题，不 reload
                    if (safePostMessage(f, { giscus: { setConfig: { theme: theme } } }, true)) {
                        try { f.__giscusThemeSent = theme; _lastSentTheme = theme; } catch (e) {}
                        return;
                    }
                    // postMessage 失败则走重试逻辑
                    pendingTheme = theme;
                    _pendingAttempts = 0;
                    scheduleIframeRetry();
                    // 对于较长页面，持续尝试确保 iframe 真正接收到主题
                    try { ensureIframeReceivesTheme(f, theme, 6000); } catch (e) {}
                } else {
                    // iframe 不存在时，设置 pending 并启动重试（不会立即 reload）
                    pendingTheme = theme;
                    _pendingAttempts = 0;
                    scheduleIframeRetry();
                    // 如果配置为 eager，则尝试创建 client.js 以触发 iframe 尽早加载
                    try { if (window.giscusConfig && window.giscusConfig.loading === 'eager') createGiscusClient(theme); } catch (e) {}
                }
            } catch (e) {}
        }

        // 在导航后短时间内强力刷新 pendingTheme：每 interval 尝试发送，最多持续 duration 毫秒
        function aggressiveFlushPendingTheme(duration, interval) {
            try {
                if (window._giscusAggressiveFlushInProgress) return;
                window._giscusAggressiveFlushInProgress = true;
                var start = Date.now();
                var iv = setInterval(function () {
                    try {
                        var now = Date.now();
                        if (!pendingTheme && _lastSentTheme) {
                            clearInterval(iv);
                            window._giscusAggressiveFlushInProgress = false;
                            return;
                        }
                        var f = findIframe();
                        if (f && pendingTheme) {
                            if (safePostMessage(f, { giscus: { setConfig: { theme: pendingTheme } } }, true)) {
                                try { _lastSentTheme = pendingTheme; f.__giscusThemeSent = pendingTheme; } catch (e) {}
                                pendingTheme = null;
                                clearInterval(iv);
                                window._giscusAggressiveFlushInProgress = false;
                                return;
                            }
                        }
                        if (now - start > duration) {
                            clearInterval(iv);
                            window._giscusAggressiveFlushInProgress = false;
                        }
                    } catch (e) {
                        clearInterval(iv);
                        window._giscusAggressiveFlushInProgress = false;
                    }
                }, interval || 200);
            } catch (e) {}
        }

        // 确保特定 iframe 在较长时间窗口内能收到主题（用于内容较多导致 iframe 初始化慢的页面）
        function ensureIframeReceivesTheme(iframe, theme, timeoutMs) {
            try {
                if (!iframe || !theme) return;
                // 如果 iframe 标记已收到相同主题，则无需额外操作
                try { if (iframe.__giscusThemeSent === theme) return; } catch (e) {}
                // 优化：如果 iframe 使用 lazy loading，尝试将其改为 eager 以提前触发加载
                try {
                    var loading = iframe.getAttribute && iframe.getAttribute('loading');
                    if (loading === 'lazy') {
                        try { iframe.setAttribute('loading', 'eager'); } catch (e) {}
                    }
                } catch (e) {}

                // 避免重复创建多个计时器
                if (iframe.__giscusReceiveTimer) return;
                var start = Date.now();
                var deadline = start + (typeof timeoutMs === 'number' ? timeoutMs : (window.giscusEnsureReceiveTimeoutMs || 6000));
                iframe.__giscusReceiveTimer = setInterval(function () {
                    try {
                        // 若已达到期望主题，则结束
                        if (iframe.__giscusThemeSent === theme) {
                            clearInterval(iframe.__giscusReceiveTimer);
                            iframe.__giscusReceiveTimer = null;
                            return;
                        }
                        // 若超时且未达到，清理并允许外层决定是否 reload（由 ensureSingleReloadFor 控制）
                        if (Date.now() > deadline) {
                            // 超时未生效：若启用了 reload-on-timeout，则进行受保护的 reload
                            try {
                                if (window.giscusDebug) console.log('[giscus-theme] ensureIframeReceivesTheme timeout for theme', theme, 'iframe', iframe);
                                if (window.giscusEnsureReloadOnTimeout) {
                                    try {
                                        var urlKey = (location.pathname || '') + (location.search || '') + (location.hash || '');
                                        ensureSingleReloadFor(urlKey, theme, iframe);
                                    } catch (e) {}
                                }
                            } catch (e) {}
                            clearInterval(iframe.__giscusReceiveTimer);
                            iframe.__giscusReceiveTimer = null;
                            return;
                        }
                        // 每次尝试 postMessage
                        try {
                            if (safePostMessage(iframe, { giscus: { setConfig: { theme: theme } } }, true)) {
                                try { iframe.__giscusThemeSent = theme; _lastSentTheme = theme; } catch (e) {}
                                clearInterval(iframe.__giscusReceiveTimer);
                                iframe.__giscusReceiveTimer = null;
                                return;
                            }
                        } catch (e) {}
                        // 若 iframe.contentWindow 不可用，触发一次 findIframe 以更新引用
                        try { if (!iframe.contentWindow) findIframe(); } catch (e) {}
                    } catch (e) {
                        try { clearInterval(iframe.__giscusReceiveTimer); iframe.__giscusReceiveTimer = null; } catch (ee) {}
                    }
                }, 300);
            } catch (e) {}
        }

        // reload guard：确保相同 URL+theme 只做一次 reload
        function ensureSingleReloadFor(url, theme, iframe) {
            try {
                if (!window._giscusReloadedFor) window._giscusReloadedFor = {};
                var key = url + '|' + theme;
                if (window._giscusReloadedFor[key]) return false;
                window._giscusReloadedFor[key] = Date.now();
                // 清理旧条目
                setTimeout(function() {
                    try { delete window._giscusReloadedFor[key]; } catch (e) {}
                }, 15000);
                // 执行 reload
                try { reloadGiscusIframe(iframe, theme); } catch (e) {}
                return true;
            } catch (e) { return false; }
        }

        // 确保 --font-color 存在（不主动从外部注入颜色）
        function ensureFontColorVar() {
            try {
                var root = document.documentElement;
                var has = root.style.getPropertyValue('--font-color');
                if (!has) {
                    var computed = '#000000';
                    try { computed = (getComputedStyle(root).getPropertyValue('--font-color') || computed).trim(); } catch (e) {}
                    root.style.setProperty('--font-color', computed);
                }
            } catch (e) { /* ignore */ }
        }

        // 定义内部应用主题的函数
        window._internalApplyGiscusTheme = function() {
            // 先尝试根据注入的 mapping 查找具体的 giscus 主题值
            var activeClass = null;
            var gTheme = getGiscusThemeFromConfig();
            if (!gTheme) {
                activeClass = detectActiveThemeClass();
                gTheme = mapToGiscusTheme(activeClass);
            }
            postThemeToIframe(gTheme);
            ensureFontColorVar();
            
            if (window.giscusDebug) {
                console.log('[giscus-theme] 应用主题:', { class: activeClass, theme: gTheme });
            }
            
            return gTheme;
        };
        // 记录上次成功发送的主题与重载时间，避免重复快速重载
        var _lastSentTheme = null;
        var _lastReloadAt = 0;
        var _minReloadInterval = 800; // ms

        // 强制重载 giscus iframe（通过修改 src 的查询参数来避开缓存）
    function reloadGiscusIframe(iframe, newTheme) {
            try {
                var f = iframe || findIframe();
                if (!f) {
                    // iframe 不存在：记录期望主题并启动重试，等待 iframe 被插入
                    try { if (newTheme) pendingTheme = newTheme; } catch (e) {}
                    try { _pendingAttempts = 0; scheduleIframeRetry(); } catch (e) {}
                    return false;
                }
                var now = Date.now();
                if (now - _lastReloadAt < _minReloadInterval) return false;
                _lastReloadAt = now;
                var src = f.getAttribute('src') || f.src || '';
                try {
                    var u = new URL(src, location.href);
                    u.searchParams.set('_g_reload', String(now));
                    f.setAttribute('src', u.toString());
                } catch (e) {
                    // URL 构造失败时，退回到简单拼接参数
                    var sep = src.indexOf('?') === -1 ? '?' : '&';
                    f.setAttribute('src', src + sep + '_g_reload=' + now);
                }
                // 清除缓存的 iframe 引用，等待新的 iframe 加载并被重新发现
                try { iframeRef = null; } catch (e) {}
                // 设置 pendingTheme 以便在新的 iframe load 后能发送主题
                try { if (newTheme) pendingTheme = newTheme; } catch (e) {}
                return true;
            } catch (e) { return false; }
        }

        // 应用主题并在需要时重载 giscus（force = true 表示在导航后强制重载）
        function applyThemeAndMaybeReload(force) {
            try {
                var applied = window._internalApplyGiscusTheme();
                try { if (window.giscusDebug) console.log('[giscus-theme] applyThemeAndMaybeReload', { theme: applied, force: !!force }); } catch (e) {}
                // 若强制重载或当前页面尚未有 iframe，则尝试 reload
                var f = findIframe();
                // 如果页面没有注入 giscus client.js，但我们有配置且首选 eager，则创建 client
                try {
                    var existingScript = document.getElementById('giscus-script');
                    if (!existingScript && window.giscusConfig && (window.giscusConfig.loading === 'eager' || typeof window.giscusConfig.loading === 'undefined')) {
                        try { createGiscusClient(applied); } catch (e) {}
                    }
                } catch (e) {}
                // 如果主题实际发生变化（与上次发送的不同），则发送并在必要时重载
                    if (applied && applied !== _lastSentTheme) {
                    // 如果没有 iframe，则设置 pendingTheme 并启动重试
                    if (!f) {
                        try { pendingTheme = applied; } catch (e) {}
                        try { _pendingAttempts = 0; scheduleIframeRetry(); } catch (e) {}
                    } else if (force) {
                        // 有 iframe 且为导航强制时，重载 iframe 并在新 iframe 上发送主题
                        reloadGiscusIframe(f, applied);
                    } else {
                        // 直接发送新主题到已存在的 iframe
                        postThemeToIframe(applied);
                        // 对于长页面，持续确保 iframe 收到主题（避免因页面未滚动或 lazy 加载导致主题回退）
                        try { ensureIframeReceivesTheme(f, applied, 6000); } catch (e) {}
                    }
                } else {
                    // 主题无变化
                    if (!f) scheduleIframeCheck();
                    else if (force && f) {
                        // 若强制但主题相同，短路避免重复重载
                        // 不进行 reload，以减少不必要的重载
                    }
                }
                return applied;
            } catch (e) { return null; }
        }
        
        function updateAll() {
            if (scheduled) return;
            scheduled = setTimeout(function () {
                scheduled = null;
                window._internalApplyGiscusTheme();
            }, 80);
        }

        // 观察 iframe 出现并发送挂起主题
        var iframeObserver = new MutationObserver(function (mutations, obs) {
            // 轻量检测：只在新增节点时尝试查找 iframe
            var found = false;
            for (var mi = 0; mi < mutations.length; mi++) {
                if (mutations[mi].addedNodes && mutations[mi].addedNodes.length) { found = true; break; }
            }
            if (found) {
                scheduleIframeCheck();
                setTimeout(function () {
                    if (findIframe()) obs.disconnect();
                }, 300);
            }
        });
        try { iframeObserver.observe(document.body, { childList: true, subtree: true }); } catch (e) {}

        // 观察 .book 类名变化（如果 .book 尚未插入则观察 body 以等待插入）
        function observeBook() {
            var bookEl = document.querySelector('.book');
            if (bookEl) {
                try {
                    var bookObserver = new MutationObserver(function (mutations) {
                        // 只在 class 属性变化时触发
                        updateAll();
                    });
                    bookObserver.observe(bookEl, { attributes: true, attributeFilter: ['class'] });
                } catch (e) {}
            } else {
                // 监听 body 的子节点插入，寻找 .book
                try {
                    var insertObs = new MutationObserver(function (muts, obs) {
                        try {
                            var b = document.querySelector('.book');
                            if (b) {
                                obs.disconnect();
                                observeBook();
                                updateAll();
                            }
                        } catch (e) {}
                    });
                    insertObs.observe(document.body, { childList: true, subtree: true });
                } catch (e) {}
            }
        }
        observeBook();

        // 宽泛观察器：当根元素或子树发生替换时，尝试触发一次更新（兼容静态 html 替换 .book 的情况）
        try {
            // Observe attribute changes on <html> and <body> specifically (class and data-theme)
            var attrCb = debounce(function () { updateAll(); }, 120);
            try {
                var htmlObserver = new MutationObserver(attrCb);
                htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            } catch (e) {}
            try {
                var bodyObserver = new MutationObserver(attrCb);
                if (document.body) {
                    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
                } else {
                    // body may not exist yet; watch for insertion
                    var bodyInsertObs = new MutationObserver(function (muts, obs) {
                        try {
                            if (document.body) {
                                obs.disconnect();
                                try { bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] }); } catch (e) {}
                                updateAll();
                            }
                        } catch (e) {}
                    });
                    try { bodyInsertObs.observe(document.documentElement || document, { childList: true, subtree: true }); } catch (e) {}
                }
            } catch (e) {}
        } catch (e) {}

        // 监听常见的主题切换触发器（按钮、切换器） - 使用冒泡阶段
        document.addEventListener('click', function (e) {
            try {
                var t = e.target;
                if (t && t.closest && t.closest('.js-toggle-theme, .theme-toggler, [data-theme-toggle]')) {
                    updateAll();
                }
            } catch (e) {}
        }, false);

        // 监听系统主题变化
        if (window.matchMedia) {
            try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateAll); } catch (e) {}
        }

        // 首次运行：应用并尽量通过 postMessage 更新 giscus 主题（避免 reload）
    updateAll();
    try { setTimeout(function () { tryPostThemeImmediate(true); }, 120); } catch (e) {}
        
        // 为了确保正确应用主题（主题类可能在 JS 之后才添加），进行少量重试
        var initialAttempts = [200, 800, 2000];
        initialAttempts.forEach(function (ms) { setTimeout(window._internalApplyGiscusTheme, ms); });

        // Hook history API (pushState/replaceState) to handle SPA-like navigations
        try {
            ['pushState', 'replaceState'].forEach(function (name) {
                var orig = history[name];
                history[name] = function () {
                    var rv = orig.apply(this, arguments);
                    try { window.dispatchEvent(new Event('giscus:nav')); } catch (e) {}
                    return rv;
                };
            });
            window.addEventListener('popstate', function () { try { window.dispatchEvent(new Event('giscus:nav')); } catch (e) {} });
            window.addEventListener('giscus:nav', function () {
                try {
                    updateAll();
                    observeBook();
                    scheduleIframeCheck();
                    // 立即尝试 postMessage 更新主题（不 reload）
                    tryPostThemeImmediate(false);
                    // 强力 flush pendingTheme 短时间内尝试发送
                    aggressiveFlushPendingTheme(700, 180);
                    // 若短时间内未生效，尝试更强的 postMessage
                    setTimeout(function () { tryPostThemeImmediate(true); }, 300);
                    // 导航时确保 client 存在（若配置为 eager）
                    try { var s = document.getElementById('giscus-script'); if (!s && window.giscusConfig && window.giscusConfig.loading === 'eager') { var th = (window._internalApplyGiscusTheme ? window._internalApplyGiscusTheme() : null); if (th) createGiscusClient(th); } } catch (e) {}
                    // 最后保障：在更长延迟后按需重载一次，但确保同一 URL+theme 只 reload 一次
                    setTimeout(function () { try {
                        var theme = (window._internalApplyGiscusTheme ? window._internalApplyGiscusTheme() : null);
                        if (theme) {
                            var f = findIframe();
                            var urlKey = (location.pathname || '') + (location.search || '') + (location.hash || '');
                            ensureSingleReloadFor(urlKey, theme, f);
                        }
                    } catch (e) {} }, 800);
                } catch (e) {}
            });
        } catch (e) {}

        // 监听路径变化（path/name/search/hash），用于不走 history hook 的场景或额外保险
        try {
            var _lastPathForGiscus = (location.pathname || '') + (location.search || '') + (location.hash || '');
        function _onPathChangeDetected(newPath) {
                try {
            if (window.giscusDebug) console.log('[giscus-theme] path change detected:', newPath);
            updateAll();
            observeBook();
            scheduleIframeCheck();
            // 立即尝试通过 postMessage 更新主题（轻量，不 reload）
            tryPostThemeImmediate(false);
            // 短时内强力 flush pendingTheme（最多 700ms，每 180ms 尝试）
            aggressiveFlushPendingTheme(700, 180);
            // 若短延迟后仍不生效，再走较重的重试/受限重载路径
            setTimeout(function () { tryPostThemeImmediate(true); }, 350);
            // 最后保障：在更长延迟后按需重载一次，但确保同一 URL+theme 只 reload 一次
            setTimeout(function () { try {
                    var theme = (window._internalApplyGiscusTheme ? window._internalApplyGiscusTheme() : null);
                    if (theme) {
                        var f = findIframe();
                        var urlKey = (location.pathname || '') + (location.search || '') + (location.hash || '');
                        ensureSingleReloadFor(urlKey, theme, f);
                    }
                } catch (e) {} }, 900);
                } catch (e) {}
            }

            // hashchange 立即处理（单页应用可能只变 hash）
            try { window.addEventListener('hashchange', function () { var cur = (location.pathname || '') + (location.search || '') + (location.hash || ''); if (cur !== _lastPathForGiscus) { _lastPathForGiscus = cur; _onPathChangeDetected(cur); } }); } catch (e) {}

            // 轻量轮询：在某些环境下 pushState/replaceState 未被触发或页面通过 location.assign 导航时也能捕获
            try {
                setInterval(function () {
                    try {
                        var cur = (location.pathname || '') + (location.search || '') + (location.hash || '');
                        if (cur !== _lastPathForGiscus) {
                            _lastPathForGiscus = cur;
                            _onPathChangeDetected(cur);
                        }
                    } catch (e) {}
                }, 300);
            } catch (e) {}
        } catch (e) {}

        // 在 window load 后再强制一次（某些页面主题在 load 后才会被应用）
        try { window.addEventListener('load', function () { try { applyThemeAndMaybeReload(true); } catch (e) {} }); } catch (e) {}

        // 短期轮询：监测 body/html 类名或常见 localStorage 主题键的变化（仅在页面加载初期短时启用，避免长轮询）
        try {
            var watchedKeys = ['theme', 'color-scheme', 'color_mode', 'colorTheme', 'book-theme', 'honkit-theme'];
            var lastSnapshot = {
                htmlClass: document.documentElement ? document.documentElement.className : '',
                bodyClass: document.body ? document.body.className : ''
            };
            watchedKeys.forEach(function (k) { try { lastSnapshot[k] = window.localStorage.getItem(k); } catch (e) { lastSnapshot[k] = null; } });
            var pollCount = 0;
            var pollMax = 20; // check for ~4s (interval 200ms)
            var pollInterval = setInterval(function () {
                try {
                    pollCount++;
                    var changed = false;
                    var hc = document.documentElement ? document.documentElement.className : '';
                    var bc = document.body ? document.body.className : '';
                    if (hc !== lastSnapshot.htmlClass) { changed = true; lastSnapshot.htmlClass = hc; }
                    if (bc !== lastSnapshot.bodyClass) { changed = true; lastSnapshot.bodyClass = bc; }
                    for (var i = 0; i < watchedKeys.length; i++) {
                        var key = watchedKeys[i];
                        var v = null;
                        try { v = window.localStorage.getItem(key); } catch (e) { v = null; }
                        if (v !== lastSnapshot[key]) { changed = true; lastSnapshot[key] = v; }
                    }
                    if (changed) {
                        try { updateAll(); } catch (e) {}
                    }
                    if (pollCount >= pollMax) clearInterval(pollInterval);
                } catch (e) { clearInterval(pollInterval); }
            }, 200);
        } catch (e) {}
        
        // 为HonKit页面变化事件添加特殊处理
        if (window.gitbook) {
            window.gitbook.events.on("page.change", function() {
                // 页面变化后先尝试立即通过 postMessage 更新主题（轻量）
                try { tryPostThemeImmediate(false); } catch (e) {}
                // 短延迟后再尝试一次（提高成功率）
                setTimeout(function() { try { tryPostThemeImmediate(true); } catch (e) {} }, 220);
                // 兼容回退：在稍后再确保内部应用函数运行
                setTimeout(window._internalApplyGiscusTheme, 500);
            });
        }
    });
})();
