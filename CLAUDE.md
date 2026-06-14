# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**fortune** — an AI-powered fortune telling (算命) web app. Users interact via chat to receive personalized readings from AI. Three fortune-telling skills: 八字命理 (Ba Zi), 星座运势 (Western Astrology), and 塔罗占卜 (Tarot).

**Tech stack**: Nuxt 3 (Vue 3 + Nitro server), TypeScript, Tailwind CSS, Pinia stores, OpenAI SDK as universal AI client.

## Commands

```bash
npm run dev        # Start dev server with hot-reload
npm run build      # Production build
npm run preview    # Preview production build locally
npm run generate   # Static site generation (SSG)
```

No test suite or linter is configured yet.

## Architecture

### Data Flow

```
User fills skill form → SkillStore holds context (isSkillReady = true)
  → User sends message → ChatStore tracks session
  → POST /api/fortune/chat { skillId, context, messages[], provider? }
  → Server resolves skill's system prompt template ({{placeholder}} → value)
  → AI provider (Qwen or DeepSeek via OpenAI-compatible API) streams tokens
  → Server pushes tokens via Nitro EventStream (SSE format: data: <token>\n\n)
  → Client parses SSE protocol, joins multi-line data: events with \n
  → ChatStore.appendToLastAssistantMessage() renders via MarkdownRenderer (marked)
```

### Component Resolution (Critical Config)

Nuxt 3 auto-imports components with directory-based prefixes by default (e.g., `LayoutAppSidebar` instead of `AppSidebar`). This project **disables prefixing** in [nuxt.config.ts](nuxt.config.ts):

```ts
components: {
  dirs: [{ path: '~/components', pathPrefix: false }],
},
```

All components resolve by their exact filename: `<AppSidebar>`, `<ChatContainer>`, `<BaseButton>`, etc. If you add new component directories, add them to this array. After adding directories, run `npx nuxt prepare` to regenerate types.

### AI Provider Abstraction

Both Qwen (DashScope) and DeepSeek expose OpenAI-compatible endpoints. The project uses the `openai` npm package as a unified client — switching providers changes only `baseURL` and `apiKey`. Provider configs live in [server/services/ai/provider.ts](server/services/ai/provider.ts). API keys are in `.env` (`QWEN_API_KEY`, `DEEPSEEK_API_KEY`), never sent to the client.

Default provider is `deepseek` (set in [stores/settings.store.ts](stores/settings.store.ts)). The model defaults are `deepseek-v4-pro` for DeepSeek and `qwen-plus` for Qwen.

### SSE Streaming Protocol (Critical for Streaming Changes)

**Server**: Nitro's `createEventStream(event)` sends each `push()` as a standard SSE event:
```
data: <token content>

```

If a token contains `\n`, the EventStream splits it into multiple `data:` lines within the same event, per the SSE spec. The `__DONE__` sentinel token marks stream completion.

**Client** ([composables/useChat.ts](composables/useChat.ts)): Parses the SSE byte stream, accumulating `data:` lines within each event and joining them with `\n`. An empty line signals the end of one SSE event — the accumulated content is then appended to the last assistant message. The `__DONE__` content triggers early return.

**Do NOT** use `.slice(0, -1)` or similar to "exclude placeholders" — the filter already handles empty assistant messages. An empty assistant message (content `''`) is added as a placeholder before the request; the filter `m => !(m.role === 'assistant' && m.content === '')` removes it from the messages array sent to the server.

### Skill System

Each fortune-telling type is a `SkillDefinition` object in [config/skills/](config/skills/). A skill defines:

- **`id`**: Must be a value from the `SkillId` union type in [types/skill.ts](types/skill.ts).
- **`systemPrompt`**: A template string with `{{placeholder}}` slots filled at runtime from user inputs.
- **`inputs`**: Array of form fields (date, select, text) the user must provide.
- **`inputComponent`**: Name of a Vue component in `components/skills/forms/` for custom input UI.
- **`maxTokens`**: Cap on AI response length.
- **`recommendedModel`**: Suggested model (currently informational; the store default is used).

All skills are registered in [config/skills/index.ts](config/skills/index.ts). **To add a new skill**: (1) create a `*.skill.ts` file with a `SkillDefinition` export, (2) import and add it to `skillRegistry` in `index.ts`, (3) add its ID to the `SkillId` union type in [types/skill.ts](types/skill.ts), and (4) create its form component in `components/skills/forms/`.

### Tarot Draw (Server-Side)

Card drawing happens server-side ([server/api/fortune/tarot-draw.post.ts](server/api/fortune/tarot-draw.post.ts)) for trustworthiness — randomness isn't client-controlled. The draw returns card data; the tarot skill's `{{drawnCards}}` placeholder is filled with formatted card descriptions, then the AI interprets them. Card data (22 Major Arcana) is in [server/utils/tarot.ts](server/utils/tarot.ts).

Supported spreads: `single` (1 card), `three-card` (past/present/future), `celtic-cross` (10 cards).

### Pinia Stores

- **`useSkillStore`** ([stores/skill.store.ts](stores/skill.store.ts)): Active skill ID, user-input context (`Record<string, string>`), `isSkillReady` flag. Controls whether the chat input is enabled (`canChat = activeSkillId && isSkillReady`). Non-persistent — resets on page reload.
- **`useChatStore`** ([stores/chat.store.ts](stores/chat.store.ts)): Chat sessions, messages, streaming state. The `appendToLastAssistantMessage(token)` action handles real-time SSE token display by appending to the last assistant message's content.
- **`useSettingsStore`** ([stores/settings.store.ts](stores/settings.store.ts)): Preferred AI provider (`deepseek` default) with model (`deepseek-v4-pro`). No persistence yet.

### Composables

- **`useChat`** ([composables/useChat.ts](composables/useChat.ts)): `sendMessage(text)` sends a message with full context, streams SSE response, parses the SSE protocol, and appends tokens. `stopGeneration()` aborts via AbortController.
- **`useChatPersistence`** ([composables/useChatPersistence.ts](composables/useChatPersistence.ts)): Saves/loads chat sessions to/from `localStorage` under key `fortune-chat-sessions`. Called on mount (load) and on every sessions change via deep watcher (save).

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/fortune/chat` | POST | Main AI chat — streams SSE tokens from Qwen/DeepSeek |
| `/api/fortune/tarot-draw` | POST | Server-side tarot card draw (no AI) |
| `/api/health` | GET | Health check |

Rate limiting (10 req/min per IP) is enforced on `/api/fortune/chat` via an in-memory limiter in [server/services/ai/rate-limiter.ts](server/services/ai/rate-limiter.ts). Expired entries are cleaned every 60 seconds.

### Layout

Single-page app at `/`. The default layout ([layouts/default.vue](layouts/default.vue)) is: left sidebar (skill selection + chat history) + top header (mobile hamburger) + main content area + footer. Sidebar hides on mobile via `lg:block hidden` and opens as a full-screen overlay drawer with `<Teleport>`.

### Component Overview

```
components/
├── chat/      ChatContainer, MessageList, MessageBubble, ChatInput, TypingIndicator, EmptyState
├── layout/    AppSidebar, SidebarContent, AppHeader, AppFooter
├── skills/    SkillSelector, SkillBadge, forms/{BaZiForm,AstrologyForm,TarotForm}, cards/TarotCard
└── ui/        BaseButton, BaseInput, BaseSelect, BaseModal, MarkdownRenderer
```

### Skill Form → Chat Flow

1. User selects skill in sidebar → `skillStore.activateSkill(id)` → `isSkillReady = false`
2. Form appears above chat area (because `showSkillForm = activeSkillId && !isSkillReady`)
3. User fills and submits form → `handleSkillSubmit` sets context keys and `isSkillReady = true`
4. Form disappears, chat input becomes enabled (`canChat = activeSkillId && isSkillReady`)
5. User sends message → `useChat.sendMessage()` → POST + SSE streaming

### Key Type Files

| File | Key exports |
|------|-------------|
| [types/skill.ts](types/skill.ts) | `SkillId` union, `SkillDefinition`, `SkillInputField` |
| [types/chat.ts](types/chat.ts) | `ChatMessage`, `ChatSession`, `ChatRequest`, `MessageRole` |
| [types/ai.ts](types/ai.ts) | `AIProvider`, `AIProviderConfig`, `TarotCard`, `DrawnCard` |
| [types/fortune.ts](types/fortune.ts) | `BaZiInput`, `AstrologyInput`, `TarotDrawResult`, `SkillContext` |

## Windows-Specific Notes

- Use `cmd.exe //c "rmdir /s /q <path>"` to remove directories when file locking prevents `rm -rf`.
- Chinese characters in paths work but appear URL-encoded in error stacks — this is cosmetic.
- The `#app-manifest` pre-transform warning in dev server logs is harmless and does not affect functionality.
