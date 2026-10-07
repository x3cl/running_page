// Garmin Portable UI Helper
// Injects floating sync & settings controls onto the running dashboard
(function() {
  // If not running in a browser environment, exit
  if (typeof window === 'undefined') return;

  function initPortalHelper() {
    // Only inject on main dashboard pages, not on /setup
    if (window.location.pathname.startsWith('/setup')) return;

    // Create floating control bar
    const floatingBar = document.createElement('div');
    floatingBar.id = 'garmin-portable-controls';
    floatingBar.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 999px;
      padding: 6px 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #f1f5f9;
      user-select: none;
      transition: transform 0.2s ease, opacity 0.2s ease;
    `;

    // Sync button
    const syncBtn = document.createElement('button');
    syncBtn.innerHTML = '🔄 <span class="btn-text">同步数据</span>';
    syncBtn.style.cssText = `
      background: linear-gradient(135deg, #ff7a18, #ff5200);
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    `;
    syncBtn.title = '增量拉取最新的佳明运动记录';

    // Settings button
    const settingsBtn = document.createElement('a');
    settingsBtn.href = '/setup';
    settingsBtn.innerHTML = '⚙️ <span class="btn-text">设置</span>';
    settingsBtn.style.cssText = `
      color: #94a3b8;
      text-decoration: none;
      padding: 6px 10px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.2s ease;
    `;
    settingsBtn.title = '重新配置佳明账号与地区';
    settingsBtn.onmouseenter = () => settingsBtn.style.color = '#fff';
    settingsBtn.onmouseleave = () => settingsBtn.style.color = '#94a3b8';

    // Toast notification function
    function showToast(message, type = 'info') {
      let toast = document.getElementById('garmin-portable-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'garmin-portable-toast';
        toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          right: 24px;
          z-index: 100000;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 13px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(10px);
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = message;
      toast.style.borderColor = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#ff7a18');
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
      }, 4000);
    }

    // Handle sync click
    let isSyncing = false;
    syncBtn.addEventListener('click', async () => {
      if (isSyncing) return;
      isSyncing = true;
      syncBtn.disabled = true;
      syncBtn.innerHTML = '⏳ <span class="btn-text">同步中...</span>';
      showToast('正在增量拉取佳明最新数据...', 'info');

      try {
        const res = await fetch('/api/sync', { method: 'POST' });
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || '同步失败');
        }

        // Poll until done
        const pollTimer = setInterval(async () => {
          try {
            const pRes = await fetch('/api/progress');
            const pData = await pRes.json();
            if (pData.status === 'done') {
              clearInterval(pollTimer);
              showToast('🎉 同步完成！正在刷新页面...', 'success');
              setTimeout(() => {
                window.location.reload();
              }, 1200);
            } else if (pData.status === 'error') {
              clearInterval(pollTimer);
              isSyncing = false;
              syncBtn.disabled = false;
              syncBtn.innerHTML = '🔄 <span class="btn-text">同步数据</span>';
              showToast('❌ 同步失败: ' + (pData.error || '请检查网络或重新登录'), 'error');
            } else {
              if (pData.step) {
                showToast(pData.step, 'info');
              }
            }
          } catch (e) {
            console.warn(e);
          }
        }, 1500);

      } catch (err) {
        isSyncing = false;
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 <span class="btn-text">同步数据</span>';
        showToast('❌ 启动同步异常: ' + err.message, 'error');
      }
    });

    floatingBar.appendChild(syncBtn);
    floatingBar.appendChild(settingsBtn);
    document.body.appendChild(floatingBar);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalHelper);
  } else {
    initPortalHelper();
  }
})();
