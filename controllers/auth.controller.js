    <script>
    document.addEventListener('DOMContentLoaded', () => {

        const BACKEND_URL = 'https://www.maochat.dpdns.org';
        const state = {
            token: localStorage.getItem('lumina-token'),
            user: null,
            socket: null,
            currentChat: null,
            friends: [],
        };

        const pages = {
            login: document.getElementById('login-page'),
            register: document.getElementById('register-page'),
            main: document.getElementById('main-app'),
        };
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterLink = document.getElementById('show-register-link');
        const showLoginLink = document.getElementById('show-login-link');
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const chatListContent = document.getElementById('chat-list-content');
        const contactListContent = document.getElementById('contact-list-content');
        const chatWelcomeScreen = document.getElementById('chat-welcome-screen');
        const chatWindow = document.getElementById('chat-window');
        const chatWindowTitle = document.getElementById('chat-window-title');
        const messageContainer = document.getElementById('message-container');
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const sidebarNavItems = document.querySelectorAll('.sidebar__nav-item');
        const mobileNavItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
        const listView = document.querySelector('.list-view');
        const listViews = document.querySelectorAll('.list-view__container');

        async function apiRequest(endpoint, method = 'GET', body = null) {
            const headers = { 'Content-Type': 'application/json' };
            if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
            const options = { method, headers, body: body ? JSON.stringify(body) : null };
            try {
                const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
                }
                return data.data;
            } catch (error) {
                alert(`请求错误: ${error.message}`);
                console.error('API Request Error:', endpoint, error);
                throw error;
            }
        }

        async function handleRegister(nickname, email, password) {
            try {
                // 【关键修复】: 注册成功后，直接接收返回的token和用户信息
                const data = await apiRequest('/api/auth/register', 'POST', { nickname, email, password });
                state.token = data.token;
                localStorage.setItem('lumina-token', data.token);
                // 【关键修复】: 直接进入主应用，不再需要登录
                await initializeMainApp();
            } catch (error) {}
        }

        async function handleLogin(email, password) {
            try {
                const data = await apiRequest('/api/auth/login', 'POST', { email, password });
                state.token = data.token;
                localStorage.setItem('lumina-token', data.token);
                await initializeMainApp();
            } catch (error) {}
        }

        async function initializeMainApp() {
            showPage('main');
            await getMyInfo();
            await getFriends();
            initializeSocket();
        }

        async function getMyInfo() {
            try {
                state.user = await apiRequest('/api/users/me');
                sidebarAvatar.src = state.user.avatar || `https://i.pravatar.cc/100?u=${state.user._id}`;
            } catch (error) { handleLogout(); }
        }

        async function getFriends() {
            try {
                state.friends = await apiRequest('/api/friends');
                renderFriendList(state.friends);
            } catch (error) {}
        }

        async function getPrivateMessages(friendId) {
            try {
                const messages = await apiRequest(`/api/messages/private/${friendId}`);
                renderMessages(messages);
            } catch(error) {}
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || !state.socket?.connected || !state.currentChat) return;

            const messagePayload = {
                receiverId: state.currentChat.id,
                content: text,
                contentType: 'text',
            };
            
            state.socket.emit('private_message', messagePayload, (response) => {
                if (response.success) {
                    const message = {
                        ...response.message,
                        sender: { _id: state.user._id, nickname: state.user.nickname, avatar: state.user.avatar },
                    };
                    appendMessage(message);
                    messageInput.value = '';
                } else {
                    alert('消息发送失败: ' + response.error);
                }
            });
        }

        function initializeSocket() {
            if (state.socket) state.socket.disconnect();
            
            state.socket = io(BACKEND_URL, { query: { token: state.token } });

            state.socket.on('connect', () => console.log('Socket.io 连接成功, ID:', state.socket.id));
            state.socket.on('connect_error', (err) => {
                console.error('Socket.io 连接错误:', err.message);
                alert('实时连接失败，请刷新页面重试。');
                handleLogout();
            });

            state.socket.on('new_private_message', (message) => {
                if (state.currentChat && state.currentChat.id === message.sender) {
                    appendMessage(message);
                } else {
                    alert(`收到来自好友的新消息！`);
                }
            });

            state.socket.on('user_presence', ({ userId, status }) => {
                const statusDot = document.querySelector(`.contact-item[data-contact-id="${userId}"] .contact-item__online-status`);
                if(statusDot) statusDot.style.display = status === 'online' ? 'block' : 'none';
            });
        }

        function renderFriendList(friends) {
            const friendMap = new Map(friends.map(f => [f._id, f]));
            chatListContent.innerHTML = friends.map(friend => `
                <div class="chat-item glass-morphism" data-chat-id="${friend._id}">
                    <img src="${friend.avatar || `https://i.pravatar.cc/100?u=${friend._id}`}" class="chat-item__avatar">
                    <div class="chat-item__details">
                        <div class="chat-item__name">${friend.nickname}</div>
                        <div class="chat-item__message">点击开始聊天...</div>
                    </div>
                </div>`).join('');
            
            contactListContent.innerHTML = friends.map(friend => `
                 <div class="contact-item glass-morphism" data-contact-id="${friend._id}">
                    <img src="${friend.avatar || `https://i.pravatar.cc/100?u=${friend._id}`}" class="contact-item__avatar">
                    <div class="contact-item__details"><div class="contact-item__name">${friend.nickname}</div></div>
                    <div class="contact-item__online-status" style="display: ${friend.status === 'online' ? 'block':'none'}"></div>
                </div>`).join('');

            document.querySelectorAll('.chat-item').forEach(item => {
                item.addEventListener('click', () => {
                    const friend = friendMap.get(item.dataset.chatId);
                    if (friend) openChatWindow(friend._id, friend.nickname);
                });
            });
        }
        
        function renderMessages(messages) {
            messageContainer.innerHTML = messages.map(createMessageHTML).join('');
            scrollToBottom();
        }

        function appendMessage(msg) {
            messageContainer.insertAdjacentHTML('beforeend', createMessageHTML(msg));
            scrollToBottom();
        }

        function createMessageHTML(msg) {
            const type = msg.sender._id === state.user._id ? 'sent' : 'received';
            return `<div class="message-bubble ${type}">${msg.content}</div>`;
        }

        function scrollToBottom() {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
        
        function openChatWindow(chatId, chatName) {
            chatWelcomeScreen.classList.add('hidden');
            chatWindow.classList.remove('hidden');
            state.currentChat = { id: chatId, name: chatName, type: 'private' };
            chatWindowTitle.textContent = chatName;
            getPrivateMessages(chatId);
            if (window.innerWidth <= 768) listView.classList.remove('mobile-active');
        }
        
        function showPage(pageId) {
            Object.values(pages).forEach(p => p.classList.remove('active'));
            pages[pageId].classList.add('active');
        }

        function switchView(viewName) {
            listViews.forEach(v => v.classList.add('hidden'));
            document.getElementById(`${viewName}-list-view`).classList.remove('hidden');
            [...sidebarNavItems, ...mobileNavItems].forEach(item => {
                item.classList.toggle('active', item.dataset.view === viewName);
            });
            if (window.innerWidth <= 768) {
                listView.classList.add('mobile-active');
                chatWindow.classList.add('hidden');
                chatWelcomeScreen.classList.remove('hidden');
            }
        }
        
        function handleLogout() {
            if (!confirm('确定要退出登录吗？')) return;
            state.token = null;
            state.user = null;
            if (state.socket) state.socket.disconnect();
            localStorage.removeItem('lumina-token');
            showPage('login');
        }

        loginForm.addEventListener('submit', e => { e.preventDefault(); handleLogin(document.getElementById('login-email').value, document.getElementById('login-password').value); });
        registerForm.addEventListener('submit', e => { e.preventDefault(); handleRegister(document.getElementById('register-nickname').value, document.getElementById('register-email').value, document.getElementById('register-password').value); });
        showRegisterLink.addEventListener('click', () => showPage('register'));
        showLoginLink.addEventListener('click', () => showPage('login'));
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        sidebarAvatar.addEventListener('click', handleLogout);
        [...sidebarNavItems, ...mobileNavItems].forEach(item => item.addEventListener('click', () => switchView(item.dataset.view)));

        if (state.token) {
            initializeMainApp();
        } else {
            showPage('login');
        }
    });
    </script>
