# Sahtak Chat Frontend Integration Guide

## 1. Overview

Sahtak chat is a secure **doctor ↔ patient** messaging module built with:

- **REST API** for conversation/message CRUD and uploads
- **Socket.IO** for realtime delivery/read/typing/presence updates

### Who can chat?

Only authenticated users with role:

- `doctor`
- `patient`

And only if doctor/patient pair has at least one **non-cancelled appointment**.  
Conversation creation is blocked otherwise.

---

## 2. Authentication

## REST Authentication

All chat endpoints require:

```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

### REST example

```js
const res = await fetch('http://localhost:3070/api/v1/chat/conversations', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Socket.IO Authentication

Socket connections require token in handshake auth:

```js
import { io } from 'socket.io-client';

const chatSocket = io('http://localhost:3070/chat', {
  auth: { token }, // JWT
});
```

For presence snapshot/realtime (root namespace):

```js
const presenceSocket = io('http://localhost:3070', {
  auth: { token }, // JWT
});
```

---

## 3. REST API Endpoints

Base URL: `http://localhost:3070/api/v1`  
All endpoints below are protected and accessible by **doctor + patient**.

> Response envelope is always:
>
> ```json
> {
>   "status": "success | created | ...",
>   "message": "string",
>   "data": {},
>   "meta": {}
> }
> ```

### 3.1 POST `/api/v1/chat/conversations`

Create conversation or return existing one.

- **Access**: doctor/patient
- **Body**:

```json
{
  "otherUserId": "67f2c8c35d6f1a5b89c12010"
}
```

- **Validation**: `otherUserId` must be 24-char ObjectId

#### Success (created)

```json
{
  "status": "created",
  "message": "Conversation created successfully",
  "data": {
    "isNew": true,
    "conversation": {
      "id": "67f2c9e85d6f1a5b89c1205a",
      "isActive": true,
      "lastMessage": null,
      "otherUser": {
        "id": "67f2c8c35d6f1a5b89c12010",
        "firstName": "Ahmed",
        "lastName": "Nabil",
        "fullName": "Ahmed Nabil",
        "role": "doctor",
        "profileImage": "https://res.cloudinary.com/sahtak/image/upload/v1713011111/doctors/profile.jpg"
      },
      "createdAt": "2026-04-14T10:30:11.245Z",
      "updatedAt": "2026-04-14T10:30:11.245Z"
    }
  },
  "meta": null
}
```

#### Error cases

- `400 bad request` — self conversation, invalid ObjectId
- `403 forbidden` — invalid doctor/patient pair or no shared non-cancelled appointment
- `404 not found` — other user not found
- `401 unauthorized` — token missing/invalid/revoked session

---

### 3.2 GET `/api/v1/chat/conversations`

List authenticated user conversations, sorted by latest message.

- **Access**: doctor/patient
- **Query**: none

#### Success

```json
{
  "status": "success",
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "67f2c9e85d6f1a5b89c1205a",
      "isActive": true,
      "lastMessage": {
        "content": "Please send your latest lab report.",
        "sentAt": "2026-04-14T10:41:23.008Z",
        "senderId": "67f2c8c35d6f1a5b89c12010",
        "messageType": "text"
      },
      "otherUser": {
        "id": "67f2c8c35d6f1a5b89c12010",
        "firstName": "Ahmed",
        "lastName": "Nabil",
        "fullName": "Ahmed Nabil",
        "role": "doctor",
        "profileImage": "https://res.cloudinary.com/sahtak/image/upload/v1713011111/doctors/profile.jpg"
      },
      "createdAt": "2026-04-14T10:30:11.245Z",
      "updatedAt": "2026-04-14T10:41:23.015Z"
    }
  ],
  "meta": null
}
```

#### Error cases

- `401 unauthorized`
- `403 forbidden` (role middleware)

---

### 3.3 GET `/api/v1/chat/conversations/:conversationId/messages`

Fetch paginated messages in one conversation.  
Also promotes receiver `sent -> delivered` during fetch.

- **Access**: doctor/patient, must be participant
- **Params**: `conversationId` (ObjectId)
- **Query**:
  - `page` (default `1`)
  - `limit` (default `50`, max `100`)

#### Success

```json
{
  "status": "success",
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": "67f2cb5a5d6f1a5b89c12120",
      "conversationId": "67f2c9e85d6f1a5b89c1205a",
      "senderId": "67f2c8c35d6f1a5b89c12010",
      "receiverId": "67f2c8125d6f1a5b89c11ff1",
      "content": "Please send your latest lab report.",
      "messageType": "text",
      "attachment": null,
      "status": "delivered",
      "readAt": null,
      "deliveredAt": "2026-04-14T10:42:06.214Z",
      "createdAt": "2026-04-14T10:41:23.008Z",
      "updatedAt": "2026-04-14T10:42:06.214Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Error cases

- `400 bad request` — invalid conversationId/query
- `403 forbidden` — user not participant
- `404 not found` — conversation not found
- `401 unauthorized`

---

### 3.4 POST `/api/v1/chat/conversations/:conversationId/messages`

Send text message.

- **Access**: doctor/patient, must be participant
- **Params**: `conversationId`
- **Body**:

```json
{
  "content": "I uploaded it, doctor."
}
```

- **Validation**: `content` required, trimmed, min 1, max 4000

#### Success

```json
{
  "status": "created",
  "message": "Message sent successfully",
  "data": {
    "id": "67f2cc095d6f1a5b89c121a3",
    "conversationId": "67f2c9e85d6f1a5b89c1205a",
    "senderId": "67f2c8125d6f1a5b89c11ff1",
    "receiverId": "67f2c8c35d6f1a5b89c12010",
    "content": "I uploaded it, doctor.",
    "messageType": "text",
    "attachment": null,
    "status": "sent",
    "readAt": null,
    "deliveredAt": null,
    "createdAt": "2026-04-14T10:45:09.641Z",
    "updatedAt": "2026-04-14T10:45:09.641Z"
  },
  "meta": null
}
```

#### Error cases

- `400 bad request` — invalid params/content empty/content > 4000
- `403 forbidden` — not participant
- `404 not found` — conversation not found
- `401 unauthorized`

---

### 3.5 POST `/api/v1/chat/conversations/:conversationId/attachments`

Send image or PDF attachment.

- **Access**: doctor/patient, must be participant
- **Params**: `conversationId`
- **Body**: `multipart/form-data`
  - `file` (required)
  - `content` (optional text, max 4000)

#### Success

```json
{
  "status": "created",
  "message": "Attachment sent successfully",
  "data": {
    "id": "67f2ccb95d6f1a5b89c12220",
    "conversationId": "67f2c9e85d6f1a5b89c1205a",
    "senderId": "67f2c8125d6f1a5b89c11ff1",
    "receiverId": "67f2c8c35d6f1a5b89c12010",
    "content": "cbc-results.pdf",
    "messageType": "file",
    "attachment": {
      "url": "https://res.cloudinary.com/sahtak/raw/upload/v1713012200/chat/67f2c9e85d6f1a5b89c1205a/cbc-results.pdf",
      "publicId": "chat-67f2c9e85d6f1a5b89c1205a-1713012200123",
      "fileName": "cbc-results.pdf",
      "fileSize": 248901,
      "mimeType": "application/pdf"
    },
    "status": "sent",
    "readAt": null,
    "deliveredAt": null,
    "createdAt": "2026-04-14T10:48:25.200Z",
    "updatedAt": "2026-04-14T10:48:25.200Z"
  },
  "meta": null
}
```

#### Error cases

- `400 bad request` — missing file, invalid MIME, invalid params/content
- `403 forbidden` — not participant
- `404 not found` — conversation not found
- `401 unauthorized`

---

### 3.6 GET `/api/v1/chat/conversations/search`

Search message text across all user conversations.

- **Access**: doctor/patient
- **Query**:
  - `q` (required, min length = 2)
  - `page` (default `1`)
  - `limit` (default `20`, max `100`)

#### Success

```json
{
  "status": "success",
  "message": "Message search completed successfully",
  "data": [
    {
      "id": "67f2cc095d6f1a5b89c121a3",
      "conversationId": "67f2c9e85d6f1a5b89c1205a",
      "senderId": "67f2c8125d6f1a5b89c11ff1",
      "receiverId": "67f2c8c35d6f1a5b89c12010",
      "content": "I uploaded it, doctor.",
      "messageType": "text",
      "attachment": null,
      "status": "sent",
      "readAt": null,
      "deliveredAt": null,
      "createdAt": "2026-04-14T10:45:09.641Z",
      "updatedAt": "2026-04-14T10:45:09.641Z",
      "conversation": {
        "id": "67f2c9e85d6f1a5b89c1205a",
        "isActive": true,
        "lastMessage": {
          "content": "I uploaded it, doctor.",
          "sentAt": "2026-04-14T10:45:09.641Z",
          "senderId": "67f2c8125d6f1a5b89c11ff1",
          "messageType": "text"
        },
        "otherUser": {
          "id": "67f2c8c35d6f1a5b89c12010",
          "firstName": "Ahmed",
          "lastName": "Nabil",
          "fullName": "Ahmed Nabil",
          "role": "doctor",
          "profileImage": "https://res.cloudinary.com/sahtak/image/upload/v1713011111/doctors/profile.jpg"
        },
        "createdAt": "2026-04-14T10:30:11.245Z",
        "updatedAt": "2026-04-14T10:45:09.650Z"
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

#### Error cases

- `400 bad request` — `q` missing/too short
- `401 unauthorized`

---

### 3.7 PATCH `/api/v1/chat/messages/:messageId/read`

Mark one message as read.

- **Access**: doctor/patient
- **Rule**: only **receiver** can mark read
- **Params**: `messageId`
- **Body**: none

#### Success

```json
{
  "status": "success",
  "message": "Message marked as read",
  "data": {
    "id": "67f2cc095d6f1a5b89c121a3",
    "conversationId": "67f2c9e85d6f1a5b89c1205a",
    "senderId": "67f2c8125d6f1a5b89c11ff1",
    "receiverId": "67f2c8c35d6f1a5b89c12010",
    "content": "I uploaded it, doctor.",
    "messageType": "text",
    "attachment": null,
    "status": "read",
    "readAt": "2026-04-14T10:50:02.501Z",
    "deliveredAt": "2026-04-14T10:49:44.120Z",
    "createdAt": "2026-04-14T10:45:09.641Z",
    "updatedAt": "2026-04-14T10:50:02.501Z"
  },
  "meta": null
}
```

#### Error cases

- `400 bad request` — invalid messageId
- `403 forbidden` — caller is not receiver
- `404 not found` — message not found
- `401 unauthorized`

---

## 4. Socket.IO Connection

## Namespaces used

- **Chat namespace**: `/chat` (chat events)
- **Presence namespace**: `/` (presence snapshot + presence changed)

### Basic initialization

```js
import { io } from 'socket.io-client';

const token = 'YOUR_JWT_TOKEN';

const chatSocket = io('http://localhost:3070/chat', {
  auth: { token },
});

const presenceSocket = io('http://localhost:3070', {
  auth: { token },
});
```

### Connection lifecycle events

```js
chatSocket.on('connect', () => console.log('chat connected', chatSocket.id));
chatSocket.on('disconnect', (reason) => console.log('chat disconnected', reason));
chatSocket.on('connect_error', (err) => console.error('chat connect_error', err.message));

presenceSocket.on('connect', () => console.log('presence connected', presenceSocket.id));
presenceSocket.on('disconnect', (reason) => console.log('presence disconnected', reason));
presenceSocket.on('connect_error', (err) => console.error('presence connect_error', err.message));
```

---

## 5. Socket.IO Events — Client → Server

> Event names are from `src/socket/socket.events.js`.

| Event | Namespace | When to emit | Payload |
|---|---|---|---|
| `chat:join` | `/chat` | Enter/open conversation | `{ conversationId: string }` |
| `chat:leave` | `/chat` | Leave conversation | `{ conversationId: string }` |
| `chat:typing` | `/chat` | User started typing | `{ conversationId: string }` |
| `chat:stop_typing` | `/chat` | Typing stopped | `{ conversationId: string }` |
| `presence:get_online_users` | `/` | Request initial presence snapshot | none |

### Example

```js
chatSocket.emit('chat:join', { conversationId });
chatSocket.emit('chat:typing', { conversationId });
chatSocket.emit('chat:stop_typing', { conversationId });
chatSocket.emit('chat:leave', { conversationId });

presenceSocket.emit('presence:get_online_users');
```

---

## 6. Socket.IO Events — Server → Client

### `chat:message`

- **Namespace**: `/chat`
- **When it fires**: new message created (text/attachment)
- **Payload type**

```ts
type ChatMessageEvent = {
  message: Message;
};
```

- **Frontend action**:
  1. Upsert message into active conversation state
  2. Update conversation preview (`lastMessage`)
  3. If receiver and conversation open, mark read

```js
chatSocket.on('chat:message', ({ message }) => {
  upsertMessage(message);
});
```

---

### `chat:delivered`

- **Namespace**: `/chat`
- **When**:
  - Receiver was online when message sent, or
  - Receiver fetched messages and backend promoted `sent -> delivered`
- **Payload**

```ts
type ChatDeliveredEvent = {
  messageId: string;
  deliveredAt: string; // ISO date
};
```

- **Frontend action**: set message status to `delivered`.

---

### `chat:read`

- **Namespace**: `/chat`
- **When**: receiver calls PATCH read endpoint
- **Payload**

```ts
type ChatReadEvent = {
  messageId: string;
  readAt: string; // ISO date
};
```

- **Frontend action**: set status `read`.

---

### `chat:typing`

- **Namespace**: `/chat`
- **When**: other participant emits typing in same joined room
- **Payload**

```ts
type ChatTypingEvent = {
  conversationId: string;
  userId: string;
};
```

- **Frontend action**: show typing indicator for this conversation.

---

### `chat:stop_typing`

- **Namespace**: `/chat`
- **When**: other participant stops typing
- **Payload**

```ts
type ChatStopTypingEvent = {
  conversationId: string;
  userId: string;
};
```

- **Frontend action**: hide typing indicator.

---

### Presence events (current implementation)

#### `user:presence_changed`

- **Namespace**: `/`
- **When**: user transitions online/offline (deduplicated)
- **Payload**

```ts
type UserPresenceChangedEvent = {
  userId: string;
  status: 'online' | 'offline';
  changedAt: string; // ISO date
};
```

#### `presence:online_users_snapshot`

- **Namespace**: `/`
- **When**: after client emits `presence:get_online_users`
- **Payload**

```ts
type OnlineUsersSnapshotEvent = {
  onlineUsers: string[]; // user ids
  generatedAt: string;
};
```

### Legacy note about `user:status`

`user:status` is **not emitted** by current backend code.  
Use `user:presence_changed` + `presence:online_users_snapshot`.

### `user:status` (legacy compatibility)

- **Event name**: `user:status`
- **Current behavior**: not fired by current backend
- **Payload (legacy shape used historically)**:

```ts
type LegacyUserStatusEvent = {
  userId: string;
  status: 'online' | 'offline';
};
```

- **Frontend recommendation**:
  - Do not depend on this event for new integration.
  - If you must support old backend versions, map it to the same handler as `user:presence_changed`.

```js
function onPresencePayload(payload) {
  // same logic for old/new payload style
}

presenceSocket.on('user:presence_changed', onPresencePayload);
presenceSocket.on('user:status', onPresencePayload); // legacy fallback only
```

---

## 7. Message Status Flow

```text
Sender creates message
    |
    v
status = sent
    |
    +--> if receiver online at send time -> status = delivered
    |
    +--> else remains sent until receiver fetches messages
                    |
                    v
             GET messages promotes sent -> delivered
                    |
                    v
Receiver marks read (PATCH /messages/:id/read)
                    |
                    v
status = read
```

### Frontend update rules

- `sent`: single check or pending state
- `delivered`: double check / delivered state
- `read`: highlighted double check / read state

---

## 8. Data Models (TypeScript style)

```ts
export type MessageType = 'text' | 'image' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Attachment {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ConversationLastMessage {
  content: string;
  sentAt: string; // Date ISO
  senderId: string;
  messageType: MessageType;
}

export interface ConversationOtherUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  role: 'doctor' | 'patient' | string | null;
  profileImage: string | null;
}

export interface Conversation {
  id: string;
  isActive: boolean;
  lastMessage: ConversationLastMessage | null;
  otherUser: ConversationOtherUser;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: MessageType;
  attachment: Attachment | null;
  status: MessageStatus;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
}
```

---

## 9. File/Image Upload

Endpoint: `POST /api/v1/chat/conversations/:conversationId/attachments`

### Rules

- Send as `FormData`
- Field name must be `file`
- Optional text field: `content`
- **Do not manually set `Content-Type`** (browser sets multipart boundary)
- Effective supported formats (service-level): **JPG, JPEG, PNG, PDF**
- Max size: **10 MB**

### Example

```js
const formData = new FormData();
formData.append('file', file);
formData.append('content', file.name);

const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/attachments`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### UI rendering

- If `messageType === "image"` and `attachment.url` exists:
  - render inline image (`max-width: 200px`)
- If `messageType === "file"`:
  - render clickable link with `attachment.fileName`

---

## 10. Typing Indicator

Recommended behavior:

1. Emit `chat:typing` on first keystroke
2. Debounce 1500ms inactivity
3. Emit `chat:stop_typing` after debounce timeout
4. Emit `chat:stop_typing` immediately on send/blur/unmount

### Example (1500ms debounce)

```js
let typingSent = false;
let typingTimer = null;

function onInputChange(conversationId) {
  if (!typingSent) {
    chatSocket.emit('chat:typing', { conversationId });
    typingSent = true;
  }

  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    chatSocket.emit('chat:stop_typing', { conversationId });
    typingSent = false;
  }, 1500);
}

function stopTypingNow(conversationId) {
  clearTimeout(typingTimer);
  if (typingSent) {
    chatSocket.emit('chat:stop_typing', { conversationId });
    typingSent = false;
  }
}
```

---

## 11. Online/Offline Status

Current implementation is snapshot + delta:

1. Connect root socket (`/`)
2. Emit `presence:get_online_users`
3. Receive `presence:online_users_snapshot`
4. Listen to `user:presence_changed` for updates

### Example

```js
const onlineUsers = new Set();

presenceSocket.on('connect', () => {
  presenceSocket.emit('presence:get_online_users');
});

presenceSocket.on('presence:online_users_snapshot', ({ onlineUsers: ids }) => {
  onlineUsers.clear();
  ids.forEach((id) => onlineUsers.add(id));
  rerender();
});

presenceSocket.on('user:presence_changed', ({ userId, status }) => {
  if (status === 'online') onlineUsers.add(userId);
  else onlineUsers.delete(userId);
  rerender();
});
```

> Legacy docs mentioning `user:status` are outdated for this backend version.

---

## 12. Error Handling

### Common HTTP errors

| Code | Meaning | Typical causes |
|---|---|---|
| 400 | Bad Request | Validation errors, invalid ObjectId, unsupported file, empty content |
| 401 | Unauthorized | Missing/invalid JWT, revoked session |
| 403 | Forbidden | Not participant, role not allowed, no valid appointment pair |
| 404 | Not Found | User/conversation/message not found |

### Socket errors

- `connect_error`: token missing/invalid/revoked, CORS, wrong URL/namespace
- `disconnect`: network/server shutdown/manual disconnect

### Token expiry strategy

1. If REST returns `401`, attempt refresh flow in app auth layer
2. Reconnect sockets with new access token
3. Re-request presence snapshot (`presence:get_online_users`)
4. Rejoin active conversation rooms (`chat:join`)

---

## 13. Quick Start Example (minimal)

```js
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3070/api/v1';
const SOCKET_BASE = 'http://localhost:3070';
const token = localStorage.getItem('accessToken');

const chatSocket = io(`${SOCKET_BASE}/chat`, { auth: { token } });
const presenceSocket = io(SOCKET_BASE, { auth: { token } });

const state = {
  onlineUsers: new Set(),
  conversationId: null,
  messages: [],
};

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
        ? JSON.stringify(options.body)
        : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function startConversation(otherUserId) {
  const res = await api('/chat/conversations', {
    method: 'POST',
    body: { otherUserId },
  });
  state.conversationId = res.data.conversation.id;
  chatSocket.emit('chat:join', { conversationId: state.conversationId });
}

async function loadMessages() {
  const res = await api(`/chat/conversations/${state.conversationId}/messages?page=1&limit=50`);
  state.messages = res.data;
}

async function sendMessage(content) {
  await api(`/chat/conversations/${state.conversationId}/messages`, {
    method: 'POST',
    body: { content },
  });
}

// Presence snapshot + realtime
presenceSocket.on('connect', () => {
  presenceSocket.emit('presence:get_online_users');
});
presenceSocket.on('presence:online_users_snapshot', ({ onlineUsers }) => {
  state.onlineUsers = new Set(onlineUsers);
});
presenceSocket.on('user:presence_changed', ({ userId, status }) => {
  if (status === 'online') state.onlineUsers.add(userId);
  else state.onlineUsers.delete(userId);
});

// Realtime chat events
chatSocket.on('chat:message', ({ message }) => {
  if (message.conversationId === state.conversationId) {
    state.messages.push(message);
  }
});
chatSocket.on('chat:delivered', ({ messageId, deliveredAt }) => {
  const msg = state.messages.find((m) => m.id === messageId);
  if (msg) {
    msg.status = 'delivered';
    msg.deliveredAt = deliveredAt;
  }
});
chatSocket.on('chat:read', ({ messageId, readAt }) => {
  const msg = state.messages.find((m) => m.id === messageId);
  if (msg) {
    msg.status = 'read';
    msg.readAt = readAt;
  }
});
chatSocket.on('chat:typing', ({ conversationId, userId }) => {
  if (conversationId === state.conversationId) {
    console.log('typing:', userId);
  }
});
chatSocket.on('chat:stop_typing', ({ conversationId, userId }) => {
  if (conversationId === state.conversationId) {
    console.log('stopped typing:', userId);
  }
});
```

---

## 14. Environment Variables / Frontend Config

Minimum frontend configuration:

| Key | Example | Notes |
|---|---|---|
| `VITE_API_BASE_URL` (or equivalent) | `http://localhost:3070/api/v1` | REST base |
| `VITE_SOCKET_BASE_URL` | `http://localhost:3070` | Root socket (presence) |
| `VITE_CHAT_SOCKET_NAMESPACE` | `/chat` | Chat namespace |
| `ACCESS_TOKEN_STORAGE_KEY` | `accessToken` | Where your app stores JWT |

### Derived URLs in code

- REST chat list: `${API_BASE_URL}/chat/conversations`
- Chat socket URL: `${VITE_SOCKET_BASE_URL}${VITE_CHAT_SOCKET_NAMESPACE}`
- Presence socket URL: `${VITE_SOCKET_BASE_URL}`

