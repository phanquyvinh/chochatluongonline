/**
 * In-platform chat UI — modal theo đơn, không lộ SĐT.
 */
(function (global) {
  let activeThreadId = null;
  let pollTimer = null;

  function ensureModal() {
    if (document.getElementById('cclChatModal')) return;
    const wrap = document.createElement('div');
    wrap.id = 'cclChatModal';
    wrap.innerHTML = `
      <div class="ccl-chat-backdrop" onclick="CCLChat.close()"></div>
      <div class="ccl-chat-panel" role="dialog" aria-label="Chat trong sàn">
        <div class="ccl-chat-head">
          <div>
            <div class="ccl-chat-title" id="cclChatTitle">Chat</div>
            <div class="ccl-chat-sub" id="cclChatSub">Trao đổi qua sàn — không chia sẻ SĐT bên ngoài</div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="CCLChat.close()">Đóng</button>
        </div>
        <div class="ccl-chat-body" id="cclChatBody"></div>
        <div class="ccl-chat-foot">
          <div class="ccl-chat-tools">
            <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('cclChatImg').click()">Ảnh</button>
            <input type="file" id="cclChatImg" accept="image/*" hidden>
          </div>
          <textarea id="cclChatInput" rows="2" placeholder="Nhập tin nhắn... (SĐT/Zalo sẽ bị ẩn tự động)" maxlength="2000"></textarea>
          <button type="button" class="btn btn-primary btn-sm" id="cclChatSend">Gửi</button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    if (!document.getElementById('cclChatStyles')) {
      const st = document.createElement('style');
      st.id = 'cclChatStyles';
      st.textContent = `
        #cclChatModal { display:none; position:fixed; inset:0; z-index:2000; align-items:center; justify-content:center; padding:12px; }
        #cclChatModal.open { display:flex; }
        .ccl-chat-backdrop { position:absolute; inset:0; background:rgba(0,0,0,.4); }
        .ccl-chat-panel { position:relative; width:min(440px,100%); max-height:min(640px,92vh); background:var(--surface,#fff); border-radius:16px; border:1px solid var(--border,#e5e7eb); display:flex; flex-direction:column; box-shadow:0 20px 50px rgba(0,0,0,.18); }
        .ccl-chat-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; padding:14px 16px; border-bottom:1px solid var(--border,#e5e7eb); }
        .ccl-chat-title { font-weight:800; font-size:1rem; }
        .ccl-chat-sub { font-size:0.75rem; color:var(--text-muted,#6b7280); margin-top:2px; }
        .ccl-chat-body { flex:1; overflow-y:auto; padding:12px 14px; background:var(--bg,#f8fafc); min-height:220px; }
        .ccl-chat-msg { max-width:88%; margin-bottom:10px; padding:8px 12px; border-radius:12px; font-size:0.9rem; line-height:1.4; }
        .ccl-chat-msg.me { margin-left:auto; background:#2563eb; color:#fff; border-bottom-right-radius:4px; }
        .ccl-chat-msg.them { margin-right:auto; background:#fff; border:1px solid var(--border,#e5e7eb); border-bottom-left-radius:4px; }
        .ccl-chat-msg .meta { font-size:0.7rem; opacity:.8; margin-bottom:3px; }
        .ccl-chat-msg img { max-width:100%; border-radius:8px; margin-top:4px; display:block; }
        .ccl-chat-foot { display:grid; grid-template-columns:auto 1fr auto; gap:8px; padding:10px 12px; border-top:1px solid var(--border,#e5e7eb); align-items:end; }
        .ccl-chat-foot textarea { width:100%; resize:none; border:1.5px solid var(--border,#e5e7eb); border-radius:10px; padding:8px 10px; font:inherit; }
        .ccl-chat-empty { text-align:center; color:var(--text-muted,#6b7280); font-size:0.9rem; padding:24px 8px; }
        .ccl-chat-badge { display:inline-block; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:#ef4444; color:#fff; font-size:0.7rem; font-weight:700; line-height:18px; text-align:center; margin-left:4px; }
      `;
      document.head.appendChild(st);
    }

    document.getElementById('cclChatSend').onclick = () => send();
    document.getElementById('cclChatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    document.getElementById('cclChatImg').addEventListener('change', onImage);
  }

  function roleLabel(role) {
    return ({ buyer: 'Khách', seller: 'Shop', shipper: 'Ship', admin: 'Admin' })[role] || role;
  }

  function renderBody(thread) {
    const box = document.getElementById('cclChatBody');
    if (!box || !thread) return;
    const s = global.CCLStore && CCLStore.getSession();
    const me = (s && s.email || '').toLowerCase();
    const msgs = thread.messages || [];
    if (!msgs.length) {
      box.innerHTML = '<div class="ccl-chat-empty">Chưa có tin nhắn.<br>Hãy hỏi về đơn hàng, giờ giao, đổi địa chỉ…<br><small>Không gửi SĐT / Zalo — hệ thống sẽ ẩn tự động.</small></div>';
      return;
    }
    box.innerHTML = msgs.map((m) => {
      const mine = m.email === me;
      return '<div class="ccl-chat-msg ' + (mine ? 'me' : 'them') + '">' +
        '<div class="meta">' + (mine ? 'Bạn' : (m.name || roleLabel(m.role))) +
        ' · ' + new Date(m.at).toLocaleString('vi-VN') + '</div>' +
        (m.text ? '<div>' + escapeHtml(m.text) + '</div>' : '') +
        (m.image ? '<img src="' + m.image + '" alt="ảnh">' : '') +
      '</div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function refresh() {
    if (!activeThreadId || !global.CCLStore) return;
    const thread = CCLStore.getChatThread(activeThreadId);
    if (thread) {
      document.getElementById('cclChatTitle').textContent = thread.title || 'Chat đơn hàng';
      const peers = (thread.participants || []).map((p) => p.name || p.role).join(' · ');
      document.getElementById('cclChatSub').textContent = peers + ' — chỉ trao đổi trong sàn';
      renderBody(thread);
    }
  }

  function openThread(threadId) {
    ensureModal();
    activeThreadId = threadId;
    document.getElementById('cclChatModal').classList.add('open');
    refresh();
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refresh, 2500);
    setTimeout(() => document.getElementById('cclChatInput')?.focus(), 100);
  }

  function openForOrder(orderId, packageId) {
    const s = global.CCLStore && CCLStore.getSession();
    if (!s) {
      if (typeof toast === 'function') toast('Vui lòng đăng nhập để chat', 'error');
      return;
    }
    const res = CCLStore.openOrderChat(orderId, packageId, {
      email: s.email,
      role: s.role,
      name: s.name || s.shopName || s.email,
    });
    if (res.error) {
      if (typeof toast === 'function') toast(res.error, 'error');
      return;
    }
    openThread(res.thread.id);
  }

  function close() {
    const el = document.getElementById('cclChatModal');
    if (el) el.classList.remove('open');
    activeThreadId = null;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function send(imageDataUrl) {
    const s = global.CCLStore && CCLStore.getSession();
    if (!s || !activeThreadId) return;
    const input = document.getElementById('cclChatInput');
    const text = (input && input.value) || '';
    const res = CCLStore.postChatMessage(activeThreadId, {
      email: s.email,
      role: s.role,
      name: s.name || s.shopName || s.email,
      text,
      imageDataUrl: imageDataUrl || null,
    });
    if (res.error) {
      if (typeof toast === 'function') toast(res.error, 'error');
      return;
    }
    if (input) input.value = '';
    renderBody(res.thread);
  }

  function onImage(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        send(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /** Unread count helper (messages from others after lastSeen — simplified: last 24h from others) */
  function unreadCount(email) {
    if (!global.CCLStore || !email) return 0;
    const e = email.toLowerCase();
    let n = 0;
    const since = Date.now() - 48 * 3600 * 1000;
    CCLStore.listChatsForUser(e).forEach((th) => {
      (th.messages || []).forEach((m) => {
        if (m.email !== e && new Date(m.at).getTime() > since) n += 1;
      });
    });
    return n;
  }

  global.CCLChat = {
    openForOrder,
    openThread,
    close,
    refresh,
    unreadCount,
    ensureModal,
  };
})(typeof window !== 'undefined' ? window : globalThis);
