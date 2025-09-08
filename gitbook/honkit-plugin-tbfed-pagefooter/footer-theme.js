(function(){
  try{
    var themeColors = (window && window.__tbfed_pagefooter_config && window.__tbfed_pagefooter_config.theme_colors) ? window.__tbfed_pagefooter_config.theme_colors : { 'color-theme-1': '#000000ff', 'color-theme-2': '#d9d9d9ff' };

    var themeKeys = Object.keys(themeColors || {});

    function getDefaultColor(){
      try{ return (getComputedStyle(document.documentElement).getPropertyValue('--font-color') || '#080000').trim(); }catch(e){ return '#080000'; }
    }

    var defaultColor = getDefaultColor();

    // scheduleUpdate 使用 requestIdleCallback（若存在）或 setTimeout 去抖，避免短时间内重复运行昂贵的 DOM 查询
    var scheduled = false;
    function flushUpdate(){ scheduled = false; try{ updateFontColor(); }catch(e){} }
    function scheduleUpdate(){
      if(scheduled) return;
      scheduled = true;
      if(window.requestIdleCallback) {
        try{ requestIdleCallback(flushUpdate, {timeout: 300}); }catch(e){ setTimeout(flushUpdate, 120); }
      } else {
        setTimeout(flushUpdate, 120);
      }
    }

    function updateFontColor(){
      try{
        // 如果页面处于不可见状态，跳过更新，等用户回到页面再更新
        if(document.visibilityState === 'hidden') return;

        var root = document.documentElement;

        // 只需要判断 .book 是否存在对应的主题类
        var bookElement = document.getElementsByClassName('book')[0] || null;
        if(bookElement && bookElement.classList){
          for(var j=0;j<themeKeys.length;j++){
            var k = themeKeys[j];
            if(bookElement.classList.contains(k)){
              root.style.setProperty('--font-color', themeColors[k]);
              return;
            }
          }
        }

        // 没有匹配到任何主题类，恢复默认颜色
        root.style.setProperty('--font-color', defaultColor);
      }catch(e){
        // 忽略所有运行时错误，避免中断页面脚本
      }
    }

    document.addEventListener('DOMContentLoaded', function(){
      try{
        // 初始化一次
        scheduleUpdate();

        // 监听 .book 的 class 属性变化（精确且低开销）
        var bookEl = document.getElementsByClassName('book')[0];
        if(bookEl){
          try{
            var bookObserver = new MutationObserver(function(){ scheduleUpdate(); });
            bookObserver.observe(bookEl, { attributes: true, attributeFilter: ['class'] });
          }catch(e){}
        }

        // 监听根元素 class 变化（通常主题会在根节点切换 class）
        try{
          var rootObserver = new MutationObserver(function(){ scheduleUpdate(); });
          rootObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }catch(e){}

        // 兼容：某些主题会替换 .book 或在文档中动态插入节点，监听 body 的子节点变化，但用去抖避免高频执行
        try{
          var bodyObserver = new MutationObserver(function(muts){
            for(var q=0;q<muts.length;q++){
              var mu = muts[q];
              // 如果是属性变动，且变动的是 class，则仅当变动目标是 .book 时触发
              if(mu.type === 'attributes' && mu.attributeName === 'class'){
                var t = mu.target;
                try{
                  if(t && t.classList && t.classList.contains('book')){ scheduleUpdate(); return; }
                }catch(e){}
                continue;
              }
              // 否则（新增或删除节点）触发更新
              if(mu.addedNodes && mu.addedNodes.length>0) { scheduleUpdate(); return; }
              if(mu.removedNodes && mu.removedNodes.length>0) { scheduleUpdate(); return; }
            }
          });
          if(document.body){ bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }
        }catch(e){}
      }catch(e){}
    });
  }catch(e){}
})();
