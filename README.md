# Real-Time Chat Backend (Node.js, Express, Socket.io)

这是一个功能完备、可直接部署的即时通讯（IM）后端服务。它基于Node.js生态系统，采用了Express、Socket.io、MongoDB和JWT等成熟技术，实现了稳定可靠的实时通讯功能。

## ✨ 功能特性

- **完整的用户体系**: JWT认证、邮箱注册、加密密码、个人资料管理。
- **一对一聊天**: 实时消息、在线状态、消息送达/已读回执、正在输入提示。
- **群组聊天**: 创建/加入群聊、群管理（踢人/禁言）、群公告、@成员提醒。
- **好友管理**: 好友申请/同意/拒绝、好友列表、黑名单功能。
- **消息持久化与操作**: 消息存储于MongoDB、历史消息漫游、消息撤回与删除。
- **实时状态同步**: 用户上下线状态实时广播。
- **二维码支持**: 生成个人/群组二维码用于快速添加好友或入群。
- **为部署而生**: 完美适配Render等云平台，支持环境变量和健康检查。

## 🛠️ 技术栈

- **后端**: Node.js, Express.js
- **实时通讯**: Socket.io 4.x
- **数据库**: MongoDB (使用 Mongoose ODM)
- **身份验证**: JSON Web Tokens (JWT)
- **密码安全**: bcrypt
- **邮件服务**: Nodemailer
- **二维码生成**: qrcode

## 🚀 快速开始

### 1. 环境准备

- [Node.js](https://nodejs.org/) (v18.x 或更高版本)
- [MongoDB](https://www.mongodb.com/) 数据库。推荐使用云服务如 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。

### 2. 本地运行

1.  **克隆仓库**
    ```bash
    git clone <your-repo-url>
    cd render-im-backend
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **配置环境变量**
    - 复制 `.env.example` 文件为 `.env`。
      ```bash
      cp .env.example .env
      ```
    - 编辑 `.env` 文件，填入你的配置信息：
      ```env
      PORT=3000
      MONGODB_URI=your_mongodb_connection_string
      JWT_SECRET=a_very_strong_secret_key_at_least_32_chars_long
      JWT_EXPIRES_IN=7d
      EMAIL_SERVICE=gmail
      EMAIL_USER=your-email@gmail.com
      EMAIL_PASS=your-gmail-app-password
      MESSAGE_ROAMING_DAYS=7
      ```

4.  **启动服务**
    - **开发模式** (使用 nodemon 自动重启):
      ```bash
      npm run dev
      ```
    - **生产模式**:
      ```bash
      npm start
      ```

服务将启动在 `http://localhost:3000`。

---

## ☁️ 部署到 Render

Render 是一个优秀的云平台，可以非常方便地部署此项目。

### **步骤 1: 准备 MongoDB Atlas**

1.  访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)，创建一个免费的集群。
2.  在 **Database Access** 中创建一个数据库用户，并记下用户名和密码。
3.  在 **Network Access** 中，添加 `0.0.0.0/0` 到 IP 访问列表（允许任何IP访问），或者添加 Render 的出口 IP。
4.  点击 **Connect** -> **Connect your application**，选择 Node.js 版本，复制生成的连接字符串（Connection String）。将字符串中的 `<password>` 替换为你创建的数据库用户密码。这个字符串就是你的 `MONGODB_URI`。

### **步骤 2: 在 Render 上创建 Web Service**

1.  登录你的 Render 账号，点击 **New +** -> **Web Service**。
2.  连接你的 GitHub/GitLab 仓库。
3.  配置服务：
    - **Name**: 给你的服务起个名字 (例如 `im-backend`)。
    - **Region**: 选择一个离你用户近的地区。
    - **Branch**: 选择你的主分支 (例如 `main`)。
    - **Root Directory**: 保持默认即可。
    - **Runtime**: 选择 `Node`。
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
    - **Instance Type**: `Free` (或根据需求选择付费计划)

4.  **添加环境变量**:
    - 点击 **Advanced**，然后点击 **Add Environment Variable**。
    - 将你在 `.env` 文件中配置的所有键值对（`PORT`, `MONGODB_URI`, `JWT_SECRET`等）逐一添加进来。**不要**提交你的 `.env` 文件到 Git 仓库！

5.  点击 **Create Web Service**。Render 会自动拉取代码、安装依赖并启动你的服务。部署完成后，你的后端服务就可以通过 Render 提供的域名访问了。Render 会自动处理 WebSocket (WSS) 连接，无需额外配置。

---

## 🔌 API & Socket 事件文档

### RESTful API Endpoints

(所有需要认证的接口都需要在请求头中添加 `Authorization: Bearer <your-jwt-token>`)

-   `POST /api/auth/register`: 用户注册 (需要邮箱、密码、昵称)。
-   `POST /api/auth/login`: 用户登录，成功后返回 JWT。
-   `GET /api/users/me`: 获取当前用户信息。
-   `PUT /api/users/me`: 更新当前用户信息。
-   `GET /api/friends`: 获取好友列表。
-   `POST /api/friends/add`: 发送好友申请。
-   `POST /api/groups`: 创建群组。
-   `GET /api/messages/private/:friendId`: 获取与好友的历史消息。
-   ... (更多接口请参考 `routes/` 目录下的代码)

### Socket.io Events

**客户端 -> 服务端**

-   `private_message` (data: `{ receiverId, content, contentType }`): 发送私聊消息。
-   `group_message` (data: `{ groupId, content, contentType }`): 发送群聊消息。
-   `message_status_update` (data: `{ messageId, status: 'read' }`): 标记消息为已读。
-   `typing_status` (data: `{ to, isTyping }`): 发送正在输入状态。
-   `join_group_room` (data: `{ groupId }`): 加入群聊房间以接收消息。

**服务端 -> 客户端**

-   `connect_error` (error): 连接认证失败时触发。
-   `new_private_message` (message): 收到新的私聊消息。
-   `new_group_message` (message): 收到新的群聊消息。
-   `user_presence` (data: `{ userId, status }`): 用户在线状态变更。
-   `message_read` (data: `{ messageId, readerId }`): 你发送的消息被对方读取。
-   `typing_status_update` (data: `{ from, isTyping }`): 收到对方的正在输入状态。
-   `group_announcement_updated` (data: `{ groupId, announcement }`): 群公告更新。

## ✅ 测试与验证

1.  **注册与登录**: 使用 Postman 或类似工具测试 `/api/auth/register` 和 `/api/auth/login` 接口，确保能成功获取JWT。
2.  **Socket 连接**: 使用一个简单的 Socket.io 客户端，携带获取的 JWT 进行连接测试。
    ```javascript
    const io = require('socket.io-client');
    const socket = io('http://localhost:3000', { // 或者你的Render服务地址
      query: { token: 'your-jwt-token' }
    });

    socket.on('connect', () => {
      console.log('Connected!');
    });

    socket.on('connect_error', (err) => {
      console.error('Connection failed:', err.message);
    });
    ```
3.  **发送消息**: 连接成功后，使用 `socket.emit('private_message', ...)` 测试消息发送功能，并在另一个客户端监听 `new_private_message` 事件。
