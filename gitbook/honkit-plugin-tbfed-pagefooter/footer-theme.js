(function(){
  try{
  var themeColors = (window && window.__tbfed_pagefooter_config && window.__tbfed_pagefooter_config.theme_colors) ? window.__tbfed_pagefooter_config.theme_colors : { 'color-theme-1': '#000000ff', 'color-theme-2': '#d9d9d9ff' };

    function getDefaultColor(){
      try{ return (getComputedStyle(document.documentElement).getPropertyValue('--font-color') || '#080000').trim(); }catch(e){ return '#080000'; }
    }

    var defaultColor = getDefaultColor();

    function updateFontColor(){
      try{
        var root = document.documentElement;
        var bookElement = document.querySelector('.book');
        var found = false;
        for(var key in themeColors){
          if(!Object.prototype.hasOwnProperty.call(themeColors, key)) continue;
          try{
            // 兼容：优先检测 root（某些主题在 <html> 或根元素上打类）
            if(root.classList && root.classList.contains(key)){
              root.style.setProperty('--font-color', themeColors[key]);
              found = true; break;
            }
            // 检查 .book 本身是否包含该类
            if(bookElement && bookElement.classList && bookElement.classList.contains(key)){
              root.style.setProperty('--font-color', themeColors[key]);
              found = true; break;
            }
            // 检查 .book 内部是否存在带该类的子元素
            if(bookElement && bookElement.querySelector && bookElement.querySelector('.' + key)){
              root.style.setProperty('--font-color', themeColors[key]);
              found = true; break;
            }
          }catch(e){}
        }
        if(!found){ root.style.setProperty('--font-color', defaultColor); }
      }catch(e){}
    }

    document.addEventListener('DOMContentLoaded', function(){
      // 运行一次初始化
      updateFontColor();

      // 优先监听 .book 的 class 变化（更精确，低开销）
      var bookEl = document.querySelector('.book');
      if(bookEl){
        try{
          var bookObserver = new MutationObserver(function(muts){ try{ updateFontColor(); }catch(e){} });
          bookObserver.observe(bookEl, { attributes: true, attributeFilter: ['class'] });
        }catch(e){}
      }

      // 兼容性：有些主题或脚本可能会替换整个 .book 元素或在根元素上切换类，
      // 因此再在 document.documentElement 上注册一个宽泛的观察器以捕获替换/类切换。
      try{
        var globalObserver = new MutationObserver(function(muts){ try{ updateFontColor(); }catch(e){} });
        globalObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
      }catch(e){}
    });
  }catch(e){}
})();
