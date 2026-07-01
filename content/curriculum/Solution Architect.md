
# Solutions Architect — Mobile Interview Prep

A complete question bank for a **Solutions Architect (Mobile)** role. Order of priority: **Flutter → Android → iOS → React Native → Cross-cutting architecture.**

Every answer is written in **simple terms** with the "why it matters" called out, so you can explain it confidently in an interview, not just recite it.

> How to use this: read the **short answer** out loud first (that's your interview reply), then the **deeper notes** are there so you can handle follow-up "why / how" questions.

---


# 1. Flutter (Primary)

## 1.1 Fundamentals & Internals

### Q: What is Flutter and why pick it over native?

**Short answer:** Flutter is a UI toolkit from Google that builds compiled apps for mobile, web, and desktop from one Dart codebase. It does not use the platform's native UI widgets — it draws every pixel itself using its own rendering engine (Skia / Impeller). You pick it for one codebase, fast development, and pixel-identical UI across platforms.

**Deeper notes:**

- Native gives best raw performance and platform feel; Flutter gives speed of delivery + consistency.
- Because Flutter draws its own pixels, your app looks the **same** on every device — good for branded UIs, can be a downside if you want 100% platform-native feel.

### Q: Explain Flutter's architecture layers.

**Short answer:** Three layers — **Framework** (Dart: widgets, material, rendering), **Engine** (C++: Skia/Impeller rendering, Dart runtime, text layout), and **Embedder** (platform-specific glue that hosts Flutter inside Android/iOS/web).

**Why it matters:** As an architect you should know that your Dart code → talks to the engine → which draws to a canvas the OS gives it. This explains why Flutter doesn't "feel" like a webview and why platform channels exist.

### Q: Widget, Element, RenderObject — what are the three trees?

**Short answer:** Flutter keeps **three parallel trees**:

- **Widget tree** — the blueprint. Immutable, cheap, rebuilt often. Describes _what_ the UI should look like.
- **Element tree** — the live instance. Holds state and the link between a widget and its render object. Persists across rebuilds.
- **RenderObject tree** — does the actual layout, painting, and hit-testing (the heavy work).

**Why it matters:** When you call `setState`, Flutter rebuilds **widgets** (cheap), then **reconciles** against elements, and only updates render objects that actually changed. This is why Flutter is fast even though you "rebuild" a lot.

### Q: What's the difference between StatelessWidget and StatefulWidget?

**Short answer:** `StatelessWidget` never changes once built (e.g. an icon, a label). `StatefulWidget` holds mutable state in a separate `State` object that survives rebuilds and can call `setState()` to trigger a UI update.

**Follow-up trap:** _Why is state in a separate object?_ Because the widget itself is immutable and thrown away on every rebuild — the `State` object lives on the **element tree**, so it persists.

### Q: Walk through the State lifecycle.

**Short answer:** `createState()` → `initState()` (one-time setup) → `didChangeDependencies()` → `build()` → (on rebuild) `didUpdateWidget()` → `setState()` triggers `build()` again → `deactivate()` → `dispose()` (clean up controllers, streams, listeners).

**Architect tip:** Memory leaks usually come from **not disposing** controllers/streams in `dispose()`. Always pair `initState` allocations with `dispose` cleanup.

### Q: What does `const` do for a widget and why care?

**Short answer:** A `const` widget is created once at compile time and reused. During rebuilds, Flutter can skip rebuilding it entirely because it's the _same instance_. Sprinkling `const` is one of the cheapest performance wins.

### Q: What is the `BuildContext`?

**Short answer:** It's a handle to a widget's location in the element tree. You use it to look _up_ the tree for things like `Theme.of(context)`, `MediaQuery.of(context)`, or to find an inherited provider. It is **not** the widget itself — it's "where am I in the tree."

### Q: Explain `InheritedWidget`.

**Short answer:** A widget that lets descendants efficiently read shared data without passing it through every constructor ("prop drilling"). When its data changes, only the widgets that _depend_ on it rebuild. Most state-management libraries (Provider, Riverpod) are built on top of this.

---

## 1.2 Dart Language Deep Dive

### Q: How does async work in Dart? Explain the event loop.

**Short answer:** Dart is single-threaded with an **event loop**. Code runs on the main isolate; async work (`Future`, `await`) doesn't create threads — it schedules callbacks. The loop has two queues: **microtasks** (run first, e.g. completed Futures) and **events** (I/O, timers, gestures). The loop drains all microtasks, then takes one event, repeat.

**Why it matters:** Heavy CPU work on the main isolate **blocks the UI** even with `async`, because async ≠ parallel. For real parallelism you need isolates.

### Q: Future vs Stream?

**Short answer:** A `Future` is **one** value that arrives later (an API call). A `Stream` is **many** values over time (websocket messages, sensor data, button clicks). You `await` a Future; you `listen` to a Stream (or `await for`).

### Q: What are Isolates and when do you use them?

**Short answer:** Isolates are Dart's way to do real parallel work. Each isolate has its **own memory** — they don't share state, they pass messages. Use them for heavy CPU tasks (parsing a huge JSON, image processing, encryption) so the UI stays at 60fps. `compute()` is the easy helper for one-off heavy functions.

**Architect framing:** "No shared memory" avoids whole classes of race-condition bugs, but means you serialize data to pass it. For frequent communication, the cost of messaging can outweigh the benefit.

### Q: Explain null safety.

**Short answer:** Dart distinguishes nullable (`String?`) from non-nullable (`String`) types at compile time, so a whole category of null-pointer crashes is caught before the app runs. `?`, `!`, `??`, and `late` are the main tools.

### Q: `async`/`await` vs `.then()`?

**Short answer:** Same thing under the hood; `await` just reads top-to-bottom like normal code, so it's easier to follow and to wrap in try/catch. `.then()` is fine for simple chains but gets messy with branching.

---

## 1.3 State Management (very common architect question)

### Q: Compare the main state-management options.

**Short answer:**

|Approach|What it is|Best for|
|---|---|---|
|**setState**|Built-in, local widget state|Tiny, local UI state|
|**Provider**|InheritedWidget wrapper, simple DI + state|Small/medium apps|
|**Riverpod**|Provider's successor; compile-safe, no BuildContext needed, testable|Most new apps; my default|
|**BLoC / Cubit**|Events → states via streams; strict separation|Large teams, complex flows, predictable state|
|**GetX**|All-in-one (state + routing + DI)|Fast prototyping; less favored at scale|
|**MobX**|Reactive observables|Teams who like reactive style|

**Architect answer:** "There's no single 'best' — I choose based on team size, app complexity, and testability needs. For a large enterprise app with complex flows I lean BLoC/Riverpod for predictability and testability; for a smaller app, Provider/Riverpod keeps things lean."

### Q: Explain BLoC pattern in simple terms.

**Short answer:** UI sends **Events** in, BLoC processes them and emits **States** out. The UI just rebuilds based on the current state. Business logic lives entirely outside widgets, which makes it testable and reusable. **Cubit** is the lighter version — you call methods directly instead of dispatching events.

**Flow:** `UI → Event → BLoC → (logic) → State → UI rebuilds`

### Q: Why is Riverpod considered an upgrade over Provider?

**Short answer:** It removes Provider's main pain points — it doesn't need `BuildContext` to read state, it catches errors at **compile time** instead of runtime (no more `ProviderNotFoundException`), supports multiple providers of the same type, and is far easier to test in isolation.

---

## 1.4 Navigation, DI, Project Structure

### Q: Navigator 1.0 vs 2.0 (and go_router)?

**Short answer:** Navigator 1.0 is the simple imperative stack (`push`/`pop`) — great for straightforward apps. Navigator 2.0 is declarative — the navigation stack is driven by app state, which is needed for deep linking, web URLs, and complex flows. In practice almost everyone uses **go_router**, which wraps 2.0 in a clean, declarative, URL-based API.

### Q: How do you do Dependency Injection in Flutter?

**Short answer:** Commonly with **get_it** (a service locator) often paired with **injectable** (code-gen) to register repositories, services, and use-cases. Riverpod can also act as DI. The goal: classes ask for dependencies instead of creating them, so you can swap real implementations for mocks in tests.

### Q: How would you structure a large Flutter project?

**Short answer:** **Feature-first + Clean Architecture layers.**

```
lib/
  core/            # shared utils, theme, network, DI
  features/
    auth/
      data/        # models, data sources, repository impls
      domain/      # entities, repository interfaces, use-cases
      presentation/# widgets, screens, state (bloc/riverpod)
    orders/
      data/ domain/ presentation/
```

**Why:** Each feature is self-contained and team members can work in parallel without stepping on each other. Layers enforce that UI depends on domain, not the other way around — easy to test and swap implementations.

### Q: What is Clean Architecture here?

**Short answer:** Split code into **Presentation** (UI + state), **Domain** (pure business logic, use-cases, entities — no Flutter imports), and **Data** (APIs, DB, repositories). Dependencies point **inward**: data and presentation depend on domain; domain depends on nothing. This makes business logic framework-agnostic and unit-testable.

---

## 1.5 Performance (architects get grilled here)

### Q: How do you diagnose and fix jank (dropped frames)?

**Short answer:** Jank = a frame took longer than ~16ms (at 60fps). Tools: **Flutter DevTools** performance overlay, the timeline, and "rebuild counts." Common fixes:

- Add `const` constructors to stop unnecessary rebuilds.
- Use `RepaintBoundary` to isolate expensive painting.
- Move heavy computation off the UI isolate (`compute`/isolates).
- Use `ListView.builder` (lazy) instead of building all children up front.
- Avoid rebuilding large subtrees on `setState` — push state down to the smallest widget.
- Cache images, use `cacheWidth/cacheHeight` to decode at display size.

### Q: What is `RepaintBoundary`?

**Short answer:** It tells Flutter "treat this subtree as its own layer." When something inside repaints (e.g. an animation), the rest of the screen doesn't have to repaint with it. Use it around things that animate independently.

### Q: Skia vs Impeller?

**Short answer:** Skia was the original renderer. **Impeller** is the newer engine (default on iOS, rolling out on Android) that pre-compiles shaders to kill the "first-run animation stutter" (shader jank) that Skia suffered from. As an architect, Impeller matters because it gives more predictable frame times.

### Q: How do you reduce app size?

**Short answer:** Build split-per-ABI APKs or use App Bundles, enable `--split-debug-info` and obfuscation, remove unused assets/fonts, compress images, tree-shake icons (default), and audit heavy packages. Check with `flutter build apk --analyze-size`.

---

## 1.6 Data, Offline-First & Networking

### Q: Local storage options in Flutter?

**Short answer:**

- **shared_preferences** — tiny key/value (settings, flags).
- **Hive / Isar** — fast NoSQL local DB, great for objects, offline caches.
- **Drift (SQLite)** — relational, type-safe SQL, complex queries/relations.
- **flutter_secure_storage** — encrypted storage for tokens/secrets (Keychain/Keystore backed).

Choose by data shape: key/value → prefs; objects/cache → Hive/Isar; relational/complex queries → Drift.

### Q: Design an offline-first architecture. (high-value answer)

**Short answer:** The app should work fully offline and sync when back online. Pattern:

1. **Local DB is the source of truth** for the UI — UI always reads/writes locally first, so it's instant and works offline.
2. **Outbox / queue:** every change (create/update/delete) is written to a local queue with a **client-generated unique ID** and a status flag (`pending`/`synced`).
3. **Background sync:** a service worker / `WorkManager` / connectivity listener flushes the queue when online.
4. **Idempotency:** each request carries its **client-generated unique ID** so the server can reject duplicates if a request is retried after a flaky reconnection — the same operation applied twice has no extra effect.
5. **Conflict resolution:** decide a strategy up front — last-write-wins (timestamps), server-wins, or merge. Document it.

**Why idempotency matters:** On reconnect, the client may resend a request it isn't sure went through. If each payload has a unique client ID, the server can deduplicate and you avoid double-creating records.

### Q: Networking — Dio vs http?

**Short answer:** `http` is the basic client. **Dio** is the production choice: interceptors (attach auth tokens, refresh, logging), timeouts, retries, cancellation, file upload/download progress, and error handling in one place. Pair with **retrofit** for type-safe API definitions via code-gen.

### Q: How do you handle token refresh cleanly?

**Short answer:** A Dio **interceptor** catches 401s, pauses outgoing requests, calls the refresh endpoint once, updates the stored token, and retries the failed requests. Storing tokens in `flutter_secure_storage` keeps them encrypted at rest.

### Q: What is Shorebird / code push in Flutter?

**Short answer:** Flutter is compiled, so you normally can't change code without a store update. **Shorebird** lets you push **Dart code patches** over the air to fix bugs without resubmitting to the stores. (You can build a custom equivalent: ship signed patches, verify with a hash like SHA-256, check silently in the background, and roll out to QA first before full release.) Note: native code and assets still require a store update.

---

## 1.7 Native Integration & Multi-platform

### Q: What are Platform Channels?

**Short answer:** The bridge between Dart and native code (Kotlin/Swift) for things Flutter doesn't cover (a specific SDK, Bluetooth quirk, etc.). Three types:

- **MethodChannel** — call a native method, get a result back (request/response).
- **EventChannel** — stream continuous data from native to Dart (sensors, location).
- **BasicMessageChannel** — pass arbitrary messages both ways.

For high-performance, low-overhead native calls there's also **FFI** (call C directly) and the newer **Pigeon** (type-safe codegen for channels).

### Q: How does Flutter support web/desktop, and what changes architecturally?

**Short answer:** Same Dart code, different embedders. Architecturally you must guard **platform-specific code** (no `dart:io` on web), handle different input (mouse/keyboard), responsive layouts, and different storage/networking constraints. Keep platform-specific bits behind interfaces so the core logic stays shared.

### Q: How do flavors / build environments work?

**Short answer:** Flavors let one codebase produce dev/staging/prod builds with different API URLs, app icons, bundle IDs, and Firebase configs. Set up via Android product flavors + iOS schemes, and a `--dart-define` / config file for environment values. Keeps secrets and environments cleanly separated.

---

## 1.8 Testing & CI/CD

### Q: What are the test types in Flutter?

**Short answer:**

- **Unit tests** — pure logic (use-cases, blocs) with mocked dependencies.
- **Widget tests** — render a widget in a test harness, tap/scroll, assert UI.
- **Integration tests** — drive the full app on a device/emulator end-to-end.

Test pyramid: many unit, fewer widget, fewest (but critical) integration.

### Q: Outline a Flutter CI/CD pipeline.

**Short answer:** On push → `flutter analyze` + `dart format --set-exit-if-changed` → run unit/widget tests → build artifacts (APK/AAB/IPA) per flavor → upload to **Firebase App Distribution / TestFlight** for QA → on tag/approval, release to Play Store/App Store (Fastlane). Tools: GitHub Actions / Codemagic / Bitrise.

---

# 2. Android (Native)

## 2.1 Fundamentals

### Q: Explain the Activity lifecycle.

**Short answer:** `onCreate` → `onStart` → `onResume` (visible & interactive) → `onPause` → `onStop` → `onDestroy`. Save state in `onSaveInstanceState` because the OS can kill your activity anytime (rotation, low memory). `onResume`/`onPause` are where you start/stop things tied to visibility (camera, sensors).

### Q: Activity vs Fragment?

**Short answer:** An Activity is a full screen/entry point with its own window. A Fragment is a reusable, modular piece of UI that lives inside an activity and has its own lifecycle. Fragments enable single-Activity architecture and adaptable layouts (phone vs tablet).

### Q: What causes an ANR and how do you prevent it?

**Short answer:** **Application Not Responding** happens when the **main (UI) thread** is blocked ~5 seconds (e.g. doing network/DB work on it). Prevent it by moving heavy work to background threads — **coroutines**, `WorkManager`, or executors — and keeping the main thread for UI only.

## 2.2 Modern Android (Jetpack, Compose, Kotlin)

### Q: What is Jetpack and which components matter?

**Short answer:** Jetpack is Google's set of libraries that solve common problems the recommended way:

- **ViewModel** — holds UI state, survives config changes (rotation).
- **LiveData / StateFlow** — observable data the UI reacts to.
- **Room** — SQLite ORM, compile-checked queries.
- **WorkManager** — guaranteed deferrable background work (sync, upload).
- **Navigation** — handles fragment/screen navigation + deep links.
- **DataStore** — modern replacement for SharedPreferences.

### Q: Kotlin Coroutines & Flow — simple explanation?

**Short answer:** Coroutines are lightweight "pausable functions" for async work without callback hell — `suspend` functions run on background dispatchers and resume on the main thread when done. **Flow** is the async stream equivalent (many values over time), like Dart's Stream. **StateFlow** holds a current value (good for UI state).

### Q: What is Jetpack Compose?

**Short answer:** Android's modern **declarative** UI toolkit (like Flutter's widget approach) — you describe UI as functions of state, and it recomposes when state changes. Replaces XML layouts. Conceptually very similar to Flutter, which makes the mental model transfer easy.

### Q: Recommended Android architecture?

**Short answer:** **MVVM** (or **MVI** for stricter unidirectional flow) + Clean layering: UI → ViewModel (exposes StateFlow) → Repository (single source of truth) → data sources (Room + Remote). DI via **Hilt** (Dagger built simpler).

### Q: How do you handle background work?

**Short answer:** Pick by need: **Coroutines** for in-app async, **WorkManager** for guaranteed/deferrable work that must survive app death (sync, periodic upload), **Foreground Service** for ongoing user-visible work (music, navigation). Modern Android heavily restricts background work for battery, so respect Doze/limits.

### Q: Android security essentials?

**Short answer:** Store secrets in the **Android Keystore**, encrypt local data, use **EncryptedSharedPreferences**, enable **R8/ProGuard** for obfuscation + shrinking, use **certificate pinning** for network, and never hardcode keys in the APK.

---

# 3. iOS (Native)

## 3.1 Fundamentals

### Q: UIViewController lifecycle?

**Short answer:** `viewDidLoad` (one-time setup) → `viewWillAppear` → `viewDidAppear` (visible) → `viewWillDisappear` → `viewDidDisappear`. Do one-time setup in `viewDidLoad`; start/stop visibility-bound work in the appear/disappear pairs.

### Q: UIKit vs SwiftUI?

**Short answer:** UIKit is the mature, imperative framework (you mutate views). **SwiftUI** is the modern **declarative** one (UI as a function of state, like Flutter/Compose). New apps lean SwiftUI; many production apps mix both because UIKit is more battle-tested for complex/custom UI.

### Q: Explain ARC and retain cycles.

**Short answer:** **ARC** (Automatic Reference Counting) frees objects when nothing references them. A **retain cycle** happens when two objects strongly reference each other (e.g. a closure capturing `self`), so neither is ever freed → **memory leak**. Fix with `weak`/`unowned` references (e.g. `[weak self]` in closures).

## 3.2 Concurrency & Architecture

### Q: GCD vs async/await vs Combine?

**Short answer:**

- **GCD** (Grand Central Dispatch) — classic queues/threads for background work.
- **async/await** — modern structured concurrency, reads top-to-bottom (like Dart).
- **Combine** — Apple's reactive streams framework (like RxSwift/Flutter Streams) for chaining events.

### Q: iOS architecture patterns?

**Short answer:** **MVC** (Apple's default, can become "Massive View Controller"), **MVVM** (adds a view model to slim the controller), **VIPER** (very modular, more boilerplate), and **TCA** (The Composable Architecture — Redux-style, very testable). Choose by team and complexity.

### Q: Persistence on iOS?

**Short answer:** **UserDefaults** (small settings), **Keychain** (secure tokens/credentials — encrypted), **Core Data / SwiftData** (object graph + relational), **SQLite/GRDB** (direct SQL), and the file system for blobs.

### Q: iOS security essentials?

**Short answer:** Store secrets in **Keychain**, enable **App Transport Security** (HTTPS only), use the **Secure Enclave** + biometrics (Face ID/Touch ID) for sensitive auth, and certificate pinning for critical APIs.

---

# 4. React Native

## 4.1 Architecture

### Q: How does React Native work (old architecture)?

**Short answer:** Your JS runs in a JS engine; native UI runs on the native side; they talk over an asynchronous **Bridge** that serializes messages (JSON). JS describes UI, native renders real platform views. The Bridge is the historic bottleneck — too much traffic causes lag.

### Q: What is the New Architecture (Fabric, TurboModules, JSI)?

**Short answer:**

- **JSI (JavaScript Interface)** — lets JS call native **directly** (synchronously, no JSON bridge), removing the bottleneck.
- **Fabric** — the new rendering system built on JSI, faster and more consistent UI updates.
- **TurboModules** — native modules loaded lazily and called directly via JSI.
- **Hermes** — the optimized JS engine (faster startup, smaller memory).

**Architect framing:** The New Architecture closes much of the performance gap with native/Flutter by eliminating the async bridge.

### Q: State management in RN?

**Short answer:** **Context** (small/simple), **Redux / Redux Toolkit** (large predictable state), **Zustand** (lightweight, popular), **Recoil/Jotai** (atomic). Same trade-offs as Flutter: complexity vs boilerplate.

### Q: Navigation in RN?

**Short answer:** **React Navigation** is the standard (stack, tab, drawer navigators, deep linking). `react-native-screens` makes it use native screen primitives for better performance.

### Q: RN performance tips?

**Short answer:** Use **Hermes**, use **FlatList** (with `keyExtractor`, `getItemLayout`, windowing) instead of mapping arrays, memoize with `React.memo`/`useMemo`/`useCallback`, avoid heavy work in render, use **MMKV** instead of AsyncStorage for fast storage, and enable the New Architecture.

### Q: Offline storage in RN?

**Short answer:** **AsyncStorage** (basic key/value), **MMKV** (fast key/value), **WatermelonDB / SQLite / Realm** (relational/offline-first at scale). Same offline-first principles as Flutter apply.

---

# 5. Cross-Cutting Architecture (Architect-level)

### Q: How do you choose between Flutter, native, and React Native for a project?

**Short answer:** It's a decision framework, not a favorite:

- **Native (Kotlin/Swift)** — when you need max performance, deep platform features, tight OS integration, or platform-specific UX (AR, heavy graphics, complex camera).
- **Flutter** — fastest delivery of a consistent, branded UI across platforms; strong for one team owning all platforms; good performance via compiled code.
- **React Native** — when the team is JS/React-heavy, you want web/code sharing, and a huge npm ecosystem.

Decide using: team skills, time-to-market, performance needs, platform-feature depth, long-term maintenance, and hiring market.

### Q: Design an offline-first sync system (platform-agnostic).

**Short answer:** Same as the Flutter section but framed generally:

1. Local DB = source of truth → instant, offline-capable UI.
2. Each mutation gets a **client-generated unique ID** + status flag, written to an outbox queue.
3. Background sync flushes the queue on reconnect (WorkManager / BGTask / service worker).
4. **Idempotent writes:** server dedupes by the client ID so retries after a flaky connection don't create duplicates.
5. Explicit **conflict-resolution** policy (last-write-wins / server-wins / merge), documented and tested.

### Q: Mobile security — what's your checklist? (OWASP Mobile Top 10 mindset)

**Short answer:**

- **Secure storage:** tokens in Keychain/Keystore (never plain prefs); encrypt sensitive local data.
- **Network:** HTTPS only + certificate pinning; never trust the network.
- **Auth:** short-lived access tokens + refresh; biometric unlock for sensitive actions.
- **Code:** obfuscation (R8/ProGuard, Dart obfuscation), no secrets in the binary, jailbreak/root detection for high-risk apps.
- **API:** validate server-side, rate-limit, never rely on client checks for security.

### Q: How do you handle authentication on mobile?

**Short answer:** **OAuth2 / OIDC** with short-lived access tokens + refresh tokens. Store tokens in secure storage. Refresh transparently via an interceptor. Add biometric (Face ID/fingerprint) for re-auth on sensitive actions. For enterprise, an identity provider (e.g. Keycloak/Auth0) issues and validates tokens.

### Q: Push notification architecture?

**Short answer:** App registers with **FCM (Android)** / **APNs (iOS)** → gets a device token → sends it to your backend → backend stores it per user/device → backend sends notifications via FCM/APNs. Handle token refresh, topic/segment targeting, and silent (data) pushes for background sync.

### Q: How do you monitor a production mobile app?

**Short answer:** **Crash reporting** (Crashlytics/Sentry), **performance monitoring** (frame rates, ANR, startup time), **analytics** (user flows), **remote logging**, and **feature flags / remote config** to toggle features and do staged rollouts. Watch crash-free-users %, ANR rate, and startup time as headline metrics.

### Q: Caching strategy on mobile?

**Short answer:** Layered: in-memory cache (fast, volatile) → local DB/disk cache (survives restarts) → network. Use cache-then-network for freshness with instant display, set TTLs, and invalidate on writes. For images, use a caching library (cached_network_image / Glide / SDWebImage).

### Q: How do you design a white-label / multi-tenant mobile app?

**Short answer:** One codebase, many brands via **flavors/schemes**: externalize theme (colors, logos, fonts), config (API base URL, feature flags), and assets per tenant. Build pipeline produces per-tenant artifacts. Keep tenant config server-driven where possible so you don't rebuild for small changes.

### Q: App distribution & release strategy?

**Short answer:** Internal → QA via **Firebase App Distribution / TestFlight**; beta via Play **internal/closed tracks** & TestFlight groups; production via **staged rollout** (5% → 20% → 100%) so you can halt on a spike in crashes. Pair with feature flags so risky features can be turned off without a new build.

### Q: How do you keep startup time low?

**Short answer:** Defer non-critical work (lazy-init services, don't block first frame on network), reduce initial bundle/asset size, use a lightweight splash, precompute/cache on first run, and measure cold/warm/hot start. On RN use Hermes; on Flutter watch shader compilation (Impeller helps).

---

# 6. Behavioural / Decision-making

These are the "architect, not just developer" questions. Use the **STAR** format (Situation, Task, Action, Result).

### Q: Tell me about a hard technical trade-off you made.

**Framing:** Pick something real (e.g. offline-first complexity vs delivery time). Explain the options, the constraints (team, deadline, scale), your decision, and the measurable outcome.

### Q: How do you decide on a tech stack for a new mobile project?

**Framing:** Walk the decision framework from 5.1 — team skills, time-to-market, performance, platform depth, maintenance, hiring. Show you weigh **business** factors, not just technical ones.

### Q: A junior wants to add a heavy state-management library to a small screen. What do you do?

**Framing:** Mentor, don't override. Ask what problem it solves; if local state suffices, explain YAGNI and complexity cost; if it's a pattern for consistency, weigh team-wide value. Decisions should match problem size.

### Q: How do you handle a production-down incident?

**Framing:** Triage (assess impact via crash dashboards) → mitigate fast (feature flag off / code push / rollback / staged-rollout halt) → root-cause → fix → postmortem (blameless, add monitoring/tests so it can't recur).

### Q: How do you keep a large mobile team productive?

**Framing:** Clear modular architecture (feature-first so teams don't collide), shared conventions + linting, strong CI/CD, code review standards, documentation, and design-system/component reuse.

---

## Quick "rapid-fire" cheats

- **60fps** = ~16ms per frame budget.
- **const widgets** = free performance.
- **Isolates** = real parallelism in Dart (no shared memory, message passing).
- **Idempotency key** = client-generated unique ID → safe retries, no duplicates.
- **Local DB as source of truth** = offline-first foundation.
- **Secure storage** = Keychain (iOS) / Keystore (Android) for tokens.
- **New RN Architecture** = JSI + Fabric + TurboModules + Hermes → no async bridge.
- **Impeller** = precompiled shaders → no first-run animation jank.
- **WorkManager / BGTasks** = guaranteed background work that survives app death.
- **Staged rollout + feature flags** = safe releases.

---

_Prep tip: For each section, be ready to draw a quick diagram on a whiteboard — the three trees (Flutter), the offline-sync flow, and the RN new architecture are the three most commonly asked to sketch._

---

# PART II — Expanded & Additional Coverage

> These fill the gaps most commonly probed in a Solutions Architect screen. Same format: **short answer** = your spoken reply, **deeper notes** = for follow-ups.

---

## 7. Flutter — Additional Must-Knows

### Q: Explain Flutter's layout model. (very commonly asked — be ready to say the rule)

**Short answer:** The golden rule: **"Constraints go down, sizes go up, parent sets position."** A parent passes **constraints** (min/max width & height) down to a child. The child picks its **size** within those constraints and passes it back up. The parent then **positions** the child. This single pass is why Flutter layout is fast.

**Deeper notes:** A widget can't know its own size without its parent's constraints — that's why `MediaQuery`/`LayoutBuilder` exist when you need the available space. `BoxConstraints` carries minWidth/maxWidth/minHeight/maxHeight. "Unbounded constraints" errors happen when a widget that wants infinite size (like a `Column` of `ListView`) is placed where height is unbounded — fix with `Expanded`/`Flexible`/a fixed height.

### Q: What are Keys and when do you actually need them?

**Short answer:** Keys preserve **identity** of widgets across rebuilds so Flutter matches the right element to the right widget. You usually don't need them — until you reorder/add/remove items in a list of **stateful** widgets, or move a stateful widget around the tree. Then without keys, state attaches to the wrong item.

- **ValueKey** — identity from a value (e.g. an item id).
- **ObjectKey** — identity from an object instance.
- **UniqueKey** — always unique (forces a fresh element every build).
- **GlobalKey** — unique app-wide; lets you access a widget's state/context from elsewhere (use sparingly — it's expensive).

### Q: Implicit vs explicit animations?

**Short answer:** **Implicit** (`AnimatedContainer`, `AnimatedOpacity`, `TweenAnimationBuilder`) — you change a value, Flutter animates to it automatically. Easy, great for simple transitions. **Explicit** (`AnimationController` + `Tween` + `AnimatedBuilder`) — you control the animation directly: start/stop/reverse/repeat, multiple animations in sync. Use for complex/coordinated motion. `Hero` animates a shared element between two screens.

**Architect tip:** `AnimationController` needs a `TickerProvider` (`SingleTickerProviderStateMixin`) and **must be disposed** — classic leak source.

### Q: What are Slivers?

**Short answer:** Slivers are scrollable areas with custom scroll effects. `CustomScrollView` + slivers (`SliverAppBar`, `SliverList`, `SliverGrid`) let you build things like a collapsing header that shrinks as you scroll, mixing lists/grids/headers in one smooth scroll. Regular `ListView` is a sliver under the hood.

### Q: FutureBuilder vs StreamBuilder?

**Short answer:** Widgets that rebuild based on async data. **FutureBuilder** rebuilds when a `Future` completes (one-shot — an API call). **StreamBuilder** rebuilds on every new `Stream` value (live updates). Both give you a `snapshot` with connection state, data, and error so you can show loading/error/data UI.

**Gotcha:** Don't create the future/stream inside `build()` — it re-runs on every rebuild. Create it in `initState` or via a provider.

### Q: ChangeNotifier / ValueNotifier — what are they?

**Short answer:** Lightweight built-in reactivity. `ChangeNotifier` holds state and calls `notifyListeners()` when it changes; UI listening via `ListenableBuilder`/Provider rebuilds. `ValueNotifier<T>` is a single-value version used with `ValueListenableBuilder`. Good for simple state without a full library.

### Q: Dart 3 features worth knowing (records, patterns, sealed classes)?

**Short answer:**

- **Records** — bundle multiple values without a class: `(int, String) pair = (1, 'a');` and return multiple values from a function.
- **Pattern matching / destructuring** — `switch` on shapes, destructure records/lists in one line. Cleaner than nested ifs.
- **Sealed classes** — a fixed set of subtypes; the compiler forces you to handle **every** case in a switch (exhaustiveness). Perfect for modeling states (Loading/Success/Error) safely.

**Why it matters:** Sealed classes + exhaustive switch is the modern, type-safe way to model UI state — no forgotten cases.

### Q: Equatable / Freezed — why use them?

**Short answer:** By default Dart compares objects by reference, so two "equal" state objects look different and cause needless rebuilds. **Equatable** gives value equality with less boilerplate. **Freezed** code-generates immutable classes with `copyWith`, value equality, and union/sealed types — heavily used with BLoC for state classes.

### Q: How does error handling work app-wide?

**Short answer:** Catch synchronous Flutter errors via `FlutterError.onError`, and async/uncaught errors by running the app inside `runZonedGuarded`. Forward both to your crash reporter (Crashlytics/Sentry). For per-call errors, wrap in try/catch (with `await`) and surface friendly UI. The **Either/Result** pattern (e.g. `dartz`) is common in Clean Architecture to return success-or-failure without throwing.

### Q: JIT vs AOT — debug vs release builds?

**Short answer:** In **debug** Flutter uses **JIT** (Just-In-Time) compilation → enables **hot reload** but slower runtime. In **release** it uses **AOT** (Ahead-Of-Time) → compiled to native machine code, fast, no hot reload. Always profile/measure performance in **release/profile** mode, never debug.

### Q: Hot reload vs hot restart?

**Short answer:** **Hot reload** injects changed code and keeps app state (fast, for UI tweaks). **Hot restart** rebuilds the app from scratch, losing state (when you change `main`, global state, or initializers).

### Q: How is memory managed in Dart? (garbage collection)

**Short answer:** Dart uses a **generational garbage collector** — short-lived objects (most widgets) are collected cheaply and frequently; long-lived ones are promoted. You still cause leaks by holding references: undisposed controllers/streams, global caches that grow unbounded, or closures capturing large objects. Rule: dispose what you create.

### Q: Gestures — how does touch handling work?

**Short answer:** `GestureDetector` wraps a widget and reports taps/drags/scales. When multiple widgets could handle a touch, Flutter runs a **gesture arena** — competitors "bid," and one wins (e.g. a tap vs a scroll). For custom hit-testing you drop to `Listener` (raw pointer events).

### Q: Accessibility in Flutter?

**Short answer:** Wrap meaningful UI in `Semantics` (labels, hints, roles) so screen readers (TalkBack/VoiceOver) work. Use sufficient color contrast, scalable text (respect `textScaleFactor`), and large enough tap targets (48dp). Test with the **Accessibility Inspector** / semantics debugger.

### Q: Internationalization (i18n / l10n)?

**Short answer:** Use the `intl` package + Flutter's `gen_l10n`: put strings in ARB files per language, generate localization classes, and reference `AppLocalizations.of(context)`. Handle plurals, date/number formats, and **RTL** (right-to-left) layouts (`Directionality`). Keep strings out of code from day one.

### Q: Responsive & adaptive design?

**Short answer:** **Responsive** = layout adjusts to size (`LayoutBuilder`, `MediaQuery`, `Flexible`/`Expanded`, breakpoints). **Adaptive** = behavior/widgets adjust to platform (Material on Android, Cupertino on iOS; mouse vs touch). For phone/tablet/desktop, branch on width breakpoints and use `Wrap`/`GridView` that reflow.

### Q: Theming & Material 3?

**Short answer:** Centralize colors, typography, shapes in `ThemeData` (light + dark via `ThemeMode`). Material 3 uses a **seed color** to generate a full harmonized color scheme (`ColorScheme.fromSeed`). Access via `Theme.of(context)` so a single change re-themes the whole app.

---

## 8. Android — Additional Must-Knows

### Q: What are the four core app components?

**Short answer:**

- **Activity** — a screen / UI entry point.
- **Service** — long-running background work without UI (e.g. music, sync). Types: _started_, _bound_, _foreground_.
- **BroadcastReceiver** — responds to system/app-wide events (boot completed, connectivity change).
- **ContentProvider** — shares data between apps (e.g. contacts) via a uniform interface. All are declared in the **AndroidManifest**.

### Q: Explain Intents.

**Short answer:** An Intent is a "message" to do something. **Explicit** = target a specific component ("open this Activity"). **Implicit** = describe an action and let the system pick a handler ("share this text" → shows a chooser). **Intent filters** in the manifest declare what implicit intents your app can handle (e.g. open a URL → App Links).

### Q: How do runtime permissions work?

**Short answer:** Dangerous permissions (camera, location, contacts) must be requested **at runtime** with a rationale, not just declared in the manifest. The user can grant/deny/"only while using." Always handle denial gracefully and check before each use. Newer Android adds scoped/granular permissions (photos, approximate location).

### Q: Handler, Looper, MessageQueue?

**Short answer:** The classic threading model: the main thread has a **Looper** that loops over a **MessageQueue**; a **Handler** posts work onto that queue/thread. It's how you hop back to the UI thread from a background thread (modern code uses coroutines/`Dispatchers.Main` instead, but the concept underlies it).

### Q: How do you avoid memory leaks on Android?

**Short answer:** The big one: holding an **Activity `Context`** in something that outlives the activity (a static field, a singleton, a long-lived listener) keeps the whole screen in memory after it's destroyed. Use **application context** where appropriate, unregister listeners in `onStop`/`onDestroy`, and use **ViewModel** for data that should survive rotation instead of holding the activity.

### Q: APK vs AAB, and what is Gradle?

**Short answer:** **Gradle** is the build system (dependencies, flavors, build types, signing). **APK** is the installable package. **AAB (Android App Bundle)** is what you upload to Play; Google generates optimized APKs per device (smaller downloads). Use **build types** (debug/release) + **product flavors** (free/paid, dev/prod) to produce variants.

### Q: Deep links vs App Links?

**Short answer:** **Deep links** open a specific screen from a URI (can be claimed by multiple apps → chooser). **App Links** are verified (you host a `assetlinks.json`) so `https://yourdomain.com/...` opens your app directly with no chooser. Configure via intent filters + verification.

### Q: Process death & state restoration?

**Short answer:** Android can kill your app's process in the background anytime. On return, the system recreates it. Save UI state in **`SavedStateHandle`** (via ViewModel) / `onSaveInstanceState` so the user lands where they left off. Don't assume your objects survive.

---

## 9. iOS — Additional Must-Knows

### Q: Explain the iOS app lifecycle and app states.

**Short answer:** States: **Not running → Inactive → Active → Background → Suspended.** `AppDelegate` handles app-level events (launch, push registration); **`SceneDelegate`** (iOS 13+) handles UI scene lifecycle (multiple windows). Do setup on launch, pause work on background, and finish/save quickly because the OS can **suspend** you fast.

### Q: Value types vs reference types (struct vs class)? (very common)

**Short answer:** **Structs/enums are value types** — copied on assignment, no shared state, thread-safer; Swift favors them (e.g. `String`, `Array`, SwiftUI views). **Classes are reference types** — shared by reference, support inheritance, managed by ARC. Rule of thumb: prefer **structs** unless you need identity, inheritance, or shared mutable state.

### Q: Optionals — what and why?

**Short answer:** An `Optional` (`String?`) may hold a value or `nil`, making "no value" explicit and compiler-checked (like Dart null safety). Unwrap safely with `if let`/`guard let`/`??`; avoid force-unwrap `!` which crashes if nil.

### Q: Delegates & protocols?

**Short answer:** A **protocol** is a contract (a set of methods). The **delegate pattern** lets one object hand off responsibility to another that conforms to a protocol (e.g. a table view asks its delegate "how many rows?"). It's the core iOS communication pattern alongside closures and notifications.

### Q: SwiftUI property wrappers — `@State`, `@Binding`, `@StateObject`, `@ObservedObject`, `@EnvironmentObject`?

**Short answer:**

- **@State** — local, simple, value-type state owned by a view.
- **@Binding** — a two-way reference to state owned by a parent.
- **@StateObject** — the view **owns** a reference-type observable (created once).
- **@ObservedObject** — the view **uses** an observable owned elsewhere.
- **@EnvironmentObject** — shared object injected down the view tree (like Provider/InheritedWidget).

### Q: Codable?

**Short answer:** Swift's built-in JSON (de)serialization — conform a type to `Codable` and `JSONEncoder/Decoder` handle the rest. Equivalent to model serialization in Dart (`fromJson/toJson`).

### Q: Code signing, certificates & provisioning profiles? (the painful one)

**Short answer:** iOS apps must be **signed** to run on devices/ship. You need: a **signing certificate** (proves who you are), an **App ID**, and a **provisioning profile** (ties certificate + App ID + devices + capabilities together). **Fastlane match** stores/syncs these across the team to avoid the classic "works on my machine" signing chaos.

### Q: CocoaPods vs Swift Package Manager?

**Short answer:** Both manage dependencies. **CocoaPods** is older, ubiquitous, Ruby-based. **SPM** is Apple's native, built into Xcode, increasingly the default for new projects. Many apps use both during transition.

### Q: Background execution on iOS?

**Short answer:** iOS is strict. Use **background modes** (audio, location, VoIP), **BGTaskScheduler** (`BGAppRefreshTask` for short refreshes, `BGProcessingTask` for longer maintenance), and **silent push** to trigger background fetch. You get limited, OS-scheduled time — design sync to be quick and resumable.

---

## 10. React Native — Additional Must-Knows

### Q: Explain React reconciliation / Virtual DOM in RN terms.

**Short answer:** React keeps a lightweight tree of your UI in memory. On a state change it builds a new tree, **diffs** it against the old one, and applies only the minimal changes to the actual native views. Keys help it match list items correctly (same idea as Flutter keys).

### Q: Core hooks — quick rundown?

**Short answer:**

- **useState** — local state.
- **useEffect** — side effects (fetch, subscriptions) with a dependency array; return a cleanup function.
- **useRef** — mutable value/handle that doesn't trigger re-render.
- **useMemo / useCallback** — cache a computed value / function identity to avoid needless re-renders.
- **useContext** — read context.
- **Custom hooks** — extract reusable stateful logic.

### Q: Expo vs bare workflow?

**Short answer:** **Expo** gives a managed toolchain (build, OTA updates, many native modules preconfigured) — fastest to start, less native fiddling. **Bare** gives full native access for custom native code/SDKs Expo doesn't cover. Modern Expo (dev clients, config plugins) blurs the line, so the old "you'll outgrow Expo" advice is less true now.

### Q: What is Metro? And CodePush?

**Short answer:** **Metro** is RN's JavaScript bundler (turns your JS into a bundle the app loads). **CodePush** (App Center / now alternatives) pushes JS/asset updates over the air without a store release — like Shorebird for Flutter, but native code still needs a store update.

### Q: Styling & layout in RN?

**Short answer:** `StyleSheet.create` with a **Flexbox** layout engine (defaults differ from web: `flexDirection: 'column'`). No CSS files — styles are JS objects. Responsive via `Dimensions`/`useWindowDimensions` and percentage/flex values.

### Q: How do you write a native module?

**Short answer:** When JS needs platform capability RN doesn't expose, you write native code (Kotlin/Swift) and expose methods to JS. Old arch: a bridge module. New arch: a **TurboModule** (typed spec via Codegen, called directly through JSI). You then call it from JS like any function.

### Q: Platform-specific code in RN?

**Short answer:** `Platform.OS === 'ios'` checks, `Platform.select({...})`, or separate `Component.ios.js` / `Component.android.js` files that Metro picks automatically. Keep platform branches small and isolated.

---

## 11. Design Patterns & Principles (architect staple)

### Q: Which design patterns come up most in mobile?

**Short answer:**

- **Singleton** — one shared instance (a logger, DB). Careful: global state hurts testability.
- **Factory** — create objects without exposing construction logic.
- **Repository** — abstract data sources (API + cache) behind one interface; UI doesn't know where data comes from.
- **Observer** — subscribers react to changes (Streams, LiveData, Combine, listeners).
- **Strategy** — swap interchangeable behaviors at runtime (e.g. different sync policies).
- **Adapter** — make incompatible interfaces work together (wrap a 3rd-party SDK).
- **Dependency Injection** — provide dependencies from outside for testability.

### Q: Explain SOLID simply.

**Short answer:**

- **S** — Single Responsibility: a class does one thing.
- **O** — Open/Closed: extend behavior without modifying existing code.
- **L** — Liskov Substitution: subtypes must work wherever the base type is expected.
- **I** — Interface Segregation: many small focused interfaces beat one fat one.
- **D** — Dependency Inversion: depend on abstractions, not concrete classes (the backbone of Clean Architecture).

### Q: DRY / KISS / YAGNI?

**Short answer:** **DRY** (don't repeat yourself), **KISS** (keep it simple), **YAGNI** (you aren't gonna need it — don't build for imagined futures). As an architect you balance these against over-engineering: abstract when there's real, repeated need.

---

## 12. API Design & Backend-for-Mobile

### Q: REST vs GraphQL for a mobile app?

**Short answer:** **REST** — simple, cacheable, fixed endpoints; can over-/under-fetch (multiple round trips). **GraphQL** — client asks for exactly the fields it needs in one request; great for varied screens and slow networks, but adds server complexity and caching is harder. Choose by data shape and how varied your screens' needs are.

### Q: How do you design APIs that are mobile-friendly?

**Short answer:** Minimize payload (mobile networks are slow/metered), support **pagination** (cursor-based preferred over offset for stability), allow **partial responses/field selection**, use **compression** (gzip/brotli), design **idempotent** writes (client IDs), version the API (`/v1/`), and return clear error codes. Batch where possible to cut round trips.

### Q: Real-time data — options?

**Short answer:** **WebSockets** (full-duplex, chat/live updates), **Server-Sent Events** (one-way server→client), **MQTT** (lightweight, IoT/low-bandwidth), or **polling** (simplest, wasteful). For presence/typing/feeds use WebSockets or a managed service (Firebase, Pusher, Ably).

### Q: API versioning strategy?

**Short answer:** Version explicitly (URL `/v2/`, or header) so old app versions on users' phones keep working — **you can't force everyone to update**. Maintain backward compatibility, deprecate gradually, and use feature flags + a "minimum supported version" gate to force-upgrade only when truly necessary.

---

## 13. Release Engineering & DevOps for Mobile

### Q: How do you handle app versioning?

**Short answer:** **Semantic version** (user-facing `1.4.2`) + an ever-incrementing **build number** (stores require it to go up). Tie releases to git tags. Keep a **minimum-supported-version** check so you can force critical updates.

### Q: Walk through code signing across platforms.

**Short answer:** **Android** — sign the AAB with an **upload key**; Play uses **Play App Signing** to manage the real signing key. **iOS** — certificates + provisioning profiles (see iOS section), managed with Fastlane match. Automate signing in CI with secrets, never commit keys.

### Q: What does a mature mobile CI/CD pipeline include?

**Short answer:** Lint + format → unit/widget tests → build per flavor/platform → static analysis/security scan → sign → distribute to QA (Firebase App Distribution/TestFlight) → on approval, staged store rollout. **Fastlane** automates build/sign/upload/screenshots/changelogs. Tools: GitHub Actions, Bitrise, Codemagic.

### Q: How do you do safe releases?

**Short answer:** **Staged/phased rollout** (Play %; App Store phased release) + **feature flags / remote config** to dark-launch and kill features without a new build + **crash monitoring** with alerts to halt a bad rollout. Keep the ability to **rollback** (or push a code-push fix for JS/Dart).

### Q: Store submission gotchas?

**Short answer:** Apple review is stricter (privacy nutrition labels, ATT prompt for tracking, no private APIs, guideline compliance). Both need privacy policy, data-safety/privacy declarations, correct permissions usage strings (iOS `Info.plist` purpose strings). Budget time for **review delays and rejections**.

---

## 14. Quality: Testing, Accessibility, i18n (cross-platform)

### Q: What's your cross-platform testing strategy?

**Short answer:** The **test pyramid**: lots of fast **unit** tests (logic), fewer **integration/widget/component** tests, a small set of **end-to-end/UI** tests on real devices. Add **contract tests** for APIs, **golden/snapshot tests** for UI regressions, and run on a **device farm** (Firebase Test Lab/BrowserStack) for fragmentation coverage.

### Q: Accessibility — why should an architect care, and what's the baseline?

**Short answer:** It's legal (ADA/EN 301 549), expands your market, and improves UX for everyone. Baseline: screen-reader labels, sufficient **color contrast (4.5:1)**, scalable fonts, large tap targets (44–48dp), focus order, and no color-only signaling. Bake it into the design system, not as an afterthought.

### Q: Internationalization at architecture level?

**Short answer:** Externalize **all** strings from day one, support plurals/gender, locale-aware dates/numbers/currency, **RTL** layouts, and dynamic text sizing. Decoupling content from code lets you add languages without code changes — a per-locale resource pipeline.

---

## 15. System Design Scenarios (whiteboard practice)

> SA interviews love these. For each: clarify requirements → sketch components → call out data flow, offline, scale, and trade-offs. Below is the skeleton answer for each.

### Q: Design a chat / messaging app (like WhatsApp).

**Short answer:** Client uses a **local DB as source of truth** (messages stored locally, UI reads from it). Outgoing messages get a **client-generated ID + "sending" status**, written locally, then sent over a **WebSocket**; server acks → mark "sent/delivered/read." Offline messages queue and flush on reconnect (**idempotent** by client ID → no duplicates). Use **push notifications** for messages while the app is closed, pagination for history, and end-to-end encryption for privacy. Sync read receipts/typing over the socket.

### Q: Design an offline-first notes / field-data app (your wheelhouse).

**Short answer:** Local DB is authoritative; every create/update/delete goes to an **outbox queue** with a unique client ID and a `pending/synced` flag. A background worker (WorkManager/BGTask/service worker) flushes when online. Server **deduplicates by client ID** (idempotent writes) and routes each payload to the right collection/table by type. **Conflict policy** chosen up front (last-write-wins via timestamps, or merge). Show sync status in the UI. This is exactly the 400-ship pattern: unified sync endpoint, per-record client `_id`, duplicates auto-rejected on reconnect.

### Q: Design an infinite social feed (like Instagram).

**Short answer:** **Cursor-based pagination** (stable as new items arrive), an **in-memory + disk cache** so scroll-back is instant, image caching with on-the-fly resizing/CDN, prefetch the next page before the user hits the bottom, and lazy lists (`ListView.builder`/`FlatList` windowing) so memory stays flat. Optimistic UI for likes; reconcile with server.

### Q: Design a ride-sharing / live-tracking app (like Uber).

**Short answer:** Continuous location via background location + battery-aware sampling, **real-time** driver position over WebSocket/MQTT, map rendering with marker animation, server-side matching, and graceful degradation on poor networks (buffer + interpolate positions). Push for trip events. Throttle/aggregate location updates to save battery and bandwidth.

### Q: Design image upload at scale (photo capture + AI analysis).

**Short answer:** Capture → compress/resize on-device → enqueue locally → background upload with **resumable/chunked** transfer and retry/backoff → store in object storage (S3) → backend kicks off processing (e.g. an AI vision model for condition/defect analysis) async → notify client when results are ready. Idempotent by upload ID so retries don't duplicate. Works offline: queue now, upload when connected.

### Q: How would you approach any system-design question? (the meta-answer)

**Short answer:** 1) **Clarify** scope, scale, offline needs, platforms. 2) **Define data model & API.** 3) **Sketch components** (client layers, sync, backend, storage, push). 4) **Walk a request** end-to-end including the **offline/failure path**. 5) **Call out trade-offs** (consistency vs availability, battery vs freshness, complexity vs time). 6) **Mention monitoring & rollout.** Always volunteer the trade-offs — that's what separates an architect from a coder.

## Payments — In Depth

> The single most-tested domain for fintech/banking SA roles. Understand the **flow**, the **failure modes**, and **how money stays correct**.

### 16.1 Core vocabulary (say these precisely)

- **Authorization (auth):** the bank confirms funds exist and **holds** them. No money moves yet.
- **Capture:** you actually **collect** the held funds (can be immediate or later, e.g. on shipment).
- **Settlement:** the gateway/bank actually transfers money to your account (batched, T+1/T+2).
- **Void / Reversal:** cancel an authorization **before** capture (no money moved).
- **Refund:** return money **after** capture (money moves back).
- **Chargeback:** customer disputes a charge with **their** bank; bank pulls funds back from you.
- **Idempotency key:** a unique ID per payment attempt so retries don't double-charge.
- **Tokenization:** replacing card data with a non-sensitive token.
- **PSP / Gateway:** the payment service provider (Stripe, Razorpay, Adyen) that talks to banks/networks.
- **Acquirer:** your (merchant's) bank. **Issuer:** the customer's bank. **Network:** Visa/Mastercard/RuPay.

### 16.2 Card payment — the full flow (be ready to draw this)

**Short answer:** Customer enters card → it's tokenized on the gateway (never your server) → your backend asks the gateway to **authorize** → gateway routes through network → **issuer** approves/declines (maybe via **3D Secure**) → funds **held** → later **capture** → nightly **settlement** → money lands in your account. Your server is updated by a **webhook**, not by trusting the app.

**The path of a transaction:**

```
Mobile app (gateway SDK collects card → token)
   │  (token + amount + idempotency key)
   ▼
Your backend  ──create payment──►  Payment Gateway / PSP
                                       │
                                       ▼
                                  Card Network (Visa/MC/RuPay)
                                       │
                                       ▼
                                  Issuing Bank  ──(3DS? OTP/biometric)──► Customer
                                       │ approve/decline
                                       ▼
                              Auth result + funds HELD
   ◄────────── webhook (payment.authorized) ───────────
Your backend updates order to "paid" (source of truth)
   │  later
   ▼
Capture ──► Settlement (T+1/T+2 batch) ──► money in merchant account
```

**Deeper notes:**

- The **mobile app never sends raw card data to your server.** Use the gateway's SDK/SDK-hosted fields so card data goes straight to the PSP → keeps you out of PCI scope.
- The app may show "processing" but **must not** mark the order paid itself. Confirmation comes from your backend after the **webhook**.

### 16.3 UPI flow (India — know this cold for Indian fintech)

**Short answer:** UPI moves money **directly bank-to-bank** in real time using a **VPA** (Virtual Payment Address like `name@bank`) — no card data involved. Two models: **Collect** (merchant requests, user approves in their UPI app) and **Intent/Push** (app deep-links into the user's UPI app pre-filled; user enters UPI PIN). NPCI routes it; the user authorizes with their **UPI PIN**; you get a callback + webhook.

**Intent flow on mobile (most common for apps):**

```
User taps "Pay with UPI"
   ▼
Your app builds a UPI intent (payee VPA, amount, txn ref, note)
   ▼
OS opens the user's UPI app (GPay/PhonePe/Paytm) via deep link
   ▼
User confirms + enters UPI PIN  ──► NPCI ──► payer bank → payee bank
   ▼
UPI app returns to your app with a (UNTRUSTED) status
   ▼
Your backend confirms via PSP webhook / status API  ← source of truth
```

**Deeper notes / gotchas:**

- The status your app receives back from the UPI app is **not trustworthy** (user can fake/cancel) — always confirm server-side via webhook or a status-check API.
- **Idempotency** via your unique transaction reference prevents double-processing if the user retries.
- UPI is **push-based and irreversible-ish** — refunds are a separate transaction, not a reversal.
- Other rails to mention: **cards, netbanking, wallets, UPI AutoPay (mandates/recurring), EMI.**

### 16.4 Idempotency & double-charge prevention (critical, often the whole question)

**Short answer:** The client generates a **unique idempotency key** for each payment attempt and sends it with the request. The server stores `key → result`. If the same key arrives again (retry after timeout/flaky network), the server returns the **original result** instead of charging again. Most gateways accept an `Idempotency-Key` header natively.

**Why it matters:** Mobile networks drop. The app times out, retries, but the **first request may have actually succeeded**. Without idempotency you double-charge — a serious, trust-destroying bug.

**Deeper notes:**

- Key lifecycle: create payment intent **once** server-side, return its ID, then all "confirm" calls reference that ID.
- Store keys with a TTL; combine with a **state machine** (`created → authorized → captured → failed/refunded`) so an attempt can't illegally skip states.

### 16.5 3D Secure / Strong Customer Authentication (SCA)

**Short answer:** 3DS adds a bank-side verification step (OTP, biometric in the bank's app) during a card payment. It proves the real cardholder is present and **shifts fraud liability** from the merchant to the issuer. SCA (EU/PSD2) mandates two factors: something you **know** (PIN), **have** (phone), or **are** (biometric).

**Mobile angle:** 3DS may open a webview/redirect or an in-SDK challenge; design the payment screen to handle the challenge round-trip and return cleanly.

### 16.6 Tokenization & PCI-DSS

**Short answer:** **PCI-DSS** is the card-data security standard. The cheapest way to comply is to **never touch raw card data** — let the gateway's SDK collect it and give you back a **token** you store/charge later. This shrinks your "PCI scope" dramatically (you handle tokens, not PANs).

**Deeper notes:**

- **Network tokenization** (card-on-file as a network token) is now required in places like India (RBI) — merchants can't store raw card numbers; they store tokens issued by the network.
- Saved cards = store the token + last4 + brand for display only.

### 16.7 Webhooks & async confirmation

**Short answer:** Payments are **asynchronous** — the final result can arrive seconds later (3DS, bank processing). The reliable confirmation is a **webhook** from the gateway to your backend (`payment.captured`, `payment.failed`). Your backend updates the order; the app **polls your backend** or gets a push, rather than trusting the gateway's redirect result.

**Webhook must-dos:**

- **Verify the signature** (HMAC) so attackers can't forge "payment succeeded."
- **Idempotent handling** — the same webhook can be delivered multiple times.
- **Respond fast (2xx), process async** — queue the work; don't block the webhook.
- Have a **fallback poll** (status API) in case a webhook is missed.

### 16.8 The ledger — how money stays correct

**Short answer:** Use **double-entry bookkeeping**: every money movement creates **two entries that sum to zero** (a debit and a credit). You never "set balance = X"; balance is the **sum of immutable ledger entries**. This makes the system auditable and self-checking.

**Example — user pays ₹500 for an order:**

```
Entry 1:  User wallet      -500  (debit)
Entry 2:  Merchant payable +500  (credit)
                            -----
Sum:                          0   ✔ always balances
```

**Deeper notes:**

- Ledger entries are **append-only and immutable** — corrections are new compensating entries, never edits.
- Balances are **derived** (or cached as a running total updated transactionally with the entry).
- This is how you survive audits, reconcile with the bank, and explain any number.

### 16.9 Reconciliation

**Short answer:** Daily, you compare **your ledger** against the **gateway/bank settlement report** to catch mismatches (a payment the gateway shows but you don't, fees, failed settlements). Anything that doesn't match goes to an **exceptions queue** for manual/automated resolution. Reconciliation is what catches the bugs idempotency missed.

### 16.10 Refunds, reversals, chargebacks

**Short answer:**

- **Void/Reversal** — undo an auth **before capture**; no money moved.
- **Refund** — return **captured** money; it's a new transaction (full or partial), often T+ several days to hit the customer.
- **Chargeback** — customer disputes via their bank; you must submit evidence; if you lose you forfeit the amount + a fee. Track a **dispute lifecycle** and reduce them via 3DS, good descriptors, and fraud checks.

### 16.11 Failure handling & retries (mobile reality)

**Short answer:** Treat every payment call as possibly-lost. Use **idempotency keys**, **exponential backoff with jitter** on retries, a **timeout + status-check** (don't assume failure on timeout — _query_ the real status), and a clear **state machine** so the UI never shows "failed" for a payment that actually succeeded. Always reconcile.

**The classic bug to mention:** app times out → shows "failed" → user retries → **double charge**. Prevented by idempotency + status check before retry.

### 16.12 Recurring payments / mandates

**Short answer:** For subscriptions/auto-pay, you set up a **mandate** (UPI AutoPay, card-on-file with network token, eNACH for bank debit) — a pre-authorized permission to charge later. Each charge is still idempotent and confirmed by webhook. Handle **mandate expiry, insufficient funds, and dunning** (retry + notify).

### 16.13 Mobile-specific payment design

**Short answer:** Use the **gateway's mobile SDK** (handles card fields, 3DS challenge, UPI app-switching, Apple Pay/Google Pay). Design for **app-switch round trips** (UPI/3DS leave and return to your app — handle resume), show **honest pending states**, persist the **payment intent locally** so a killed app can resume/verify, and **never store card data** on device. Confirm final status from your backend.


---

## 1. The mental model for any system design

**In one line:** Clarify → model the data → sketch components → walk one request including the failure path → state the trade-offs.

**Explain it like I'm new:** Don't start drawing boxes. First ask "what are we building, for how many users, what must never break?" Then draw the path a single action takes through the system, _including what happens when the network dies mid-way_. Interviewers care more about the failure path than the happy path.

**The five money/correctness ideas that show up in almost every domain:**

|Idea|Plain meaning|One-line analogy|
|---|---|---|
|**Idempotency**|Doing the same thing twice has the same effect as once|A claim ticket — show it twice, still get one coat|
|**Ledger (double-entry)**|Every value change is two balanced lines you only ever _add_|A notebook you write in, never erase|
|**Strong vs eventual consistency**|"Correct right now" vs "correct soon"|Bank balance (now) vs social feed (soon is fine)|
|**State machine**|An item can only move through allowed states|A board game — you can't skip squares|
|**Reconciliation**|Compare your records vs the other side's, fix mismatches|Balancing your bank passbook against the statement|

**The closing line that signals "architect":** _"Money needs strong consistency, idempotency, and a ledger; feeds and catalogs can be eventually consistent. The trade-off is always correctness vs availability/latency."_

---

## 2. Banking

### Q: Design a mobile banking app (accounts, transfers, statements).

**In one line:** Security and **correctness** come before features; the **ledger** is the truth, and **balances are strongly consistent**.

**Explain it like I'm new:** A banking app's job isn't to look nice — it's to _never_ show the wrong balance and _never_ lose or duplicate money. So we design backwards from "the number must always be right and provable," and we lock the phone down because it's holding the keys to someone's money.

**How it actually works (layers):**

```
Hardened mobile app  (biometric unlock, no secrets at rest, cert pinning, root/jailbreak detection)
        │  short-lived token; re-auth for risky actions
        ▼
API gateway / auth  (strong auth, rate limits, SCA for transfers)
        ▼
Services  (Accounts │ Transfers │ Statements │ Notifications)
        ▼
Double-entry LEDGER  (source of truth)  +  append-only AUDIT LOG
        ▼
Core banking / settlement
```

**The pieces, simply:**

- **Hardened client:** treat the phone as hostile. No card/PINs stored, encrypt anything local, pin the certificate (so a fake server can't impersonate you), detect rooted/jailbroken devices, biometric unlock, block screenshots on sensitive screens.
- **Strong auth + SCA:** logging in is one thing; _moving money_ needs an extra check (biometric/OTP) — that's **Strong Customer Authentication**.
- **Ledger as truth:** you never store "balance = 5000" as a number you edit. Balance is the **sum of immutable entries**. To prove any number, you replay the entries.
- **Audit log:** append-only record of who did what, when. You can never delete financial history.
- **Consistency split:** the **balance must be correct _now_** (strong consistency). The **statement list/feed can lag a second** (eventual consistency) — that's fine and cheaper.

**What an architect calls out:**

- **Read-your-own-writes:** the instant after a transfer, the user _must_ see the new balance — even if the system uses read replicas that lag. Fix: route that read to the primary, or update a transactionally-consistent cache as part of the transfer.
- **A transfer is atomic:** debit one account and credit the other **together or not at all**. Within one DB it's a transaction; across services/banks it's a **saga** (do step, and if a later step fails, run a _compensating_ reversal).
- **Idempotency on every transfer** so a retry after a timeout doesn't send money twice.
- **Offline:** show **read-only** cached balance/statements, clearly labelled "as of 3:42pm." **Never** allow moving money offline — you can't verify funds or run fraud checks without the server.
- **Compliance:** KYC at signup, audit everything, **data residency** (RBI requires Indian users' data stored in India), encryption at rest + in transit.

### Q: How do you guarantee a transfer is never lost _or_ duplicated?

**In one line:** Idempotency key (no duplicate) + atomic two-leg ledger write (no partial) + a state machine + reconciliation (catches the rest).

**Explain it like I'm new:** Four nets stacked under the tightrope. The **idempotency key** is a unique ID for _this_ transfer attempt — if the app retries, the server sees the same key and says "already done, here's the original result" instead of charging again. The **atomic write** means both halves (take from A, give to B) happen together. The **state machine** stops a transfer from skipping steps (`initiated → debited → credited → completed`). **Reconciliation** is the nightly check against the core banking system that catches anything that still slipped through.

**What an architect calls out:** For cross-bank/cross-service transfers you can't have one big transaction, so you use a **saga**: each step is reversible, and if step 3 fails you fire compensating reversals for steps 1–2. Always reconcile — it's the safety net that finds the bug the other nets missed.

---

## 3. Fintech

### Q: Design a digital wallet (load money, pay, P2P transfer).

**In one line:** Wallet balance is **ledger-derived**, every move is **two balanced entries**, and everything is idempotent, audited, and KYC-gated.

**Explain it like I'm new:** A wallet is a mini-bank. Same rule: never edit a "balance" field — record entries and add them up. Putting money in = you capture a real payment, then credit the wallet (two entries). Paying a shop = debit your wallet, credit the shop. Sending a friend money = debit you, credit them, **at the same time**.

**How it actually works:**

- **Load money:** real payment (card/UPI/netbanking) → on **webhook confirmation** → credit wallet ledger. (Don't credit on the app's say-so; wait for the gateway webhook.)
- **Pay / P2P:** debit + credit as one atomic operation, idempotent by a transaction ID.
- **Balance:** sum of entries (often cached as a running total updated _in the same transaction_ as the entry).

**What an architect calls out:**

- **KYC tiers:** a minimum-KYC wallet has low limits and no withdrawal; full-KYC unlocks higher limits + cash-out (RBI rules).
- **AML monitoring:** watch for suspicious patterns (lots of small transfers = "structuring", high velocity) and report.
- **Float management:** the actual customer money sits in an **escrow/nodal bank account**; your ledger must always match that pool. Reconcile daily.

### Q: Design a lending / BNPL app.

**In one line:** KYC → credit decision → offer → e-sign → **idempotent disbursement** → mandate-based repayment → collections, all heavily audited.

**Explain it like I'm new:** The app decides if it's safe to lend (pulls credit history + other signals), shows an offer, gets a digital signature, **pays the money out once** (never twice — that's a huge bug), then auto-collects EMIs each month using a pre-approved "mandate," and chases missed payments politely (dunning).

**How it actually works:** Onboarding (KYC) → **decisioning** (credit-bureau pull + alternate data + risk model) → loan offer → e-sign agreement → **disbursement** (payout to bank/UPI, idempotent) → **repayment schedule** with **mandate/eNACH auto-debit** → **collections/dunning** on misses (retry + notify). The **ledger tracks principal, interest, and fees separately**.

**What an architect calls out:** Disbursement must be idempotent (a retry must never pay twice). Auto-debit fails often (insufficient funds) → build retry-with-notification. Keep a clean **amortization ledger** and do **regulatory reporting**. Consent and audit are everything in lending.

### Q: Design an investment / brokerage app.

**In one line:** Real-time market data + idempotent, state-machined orders + honest pending/settlement states.

**Explain it like I'm new:** Prices stream in live (over a websocket, but throttled so the phone battery survives). When the user buys, that **order** moves through fixed states (`placed → partially filled → filled → settled` / `cancelled`), and you must show honest "pending" states because real settlement takes a day or two (T+1). The display of holdings can lag slightly, but the **order and cash must be exact**.

**What an architect calls out:** Orders are idempotent and state-machined (no skipping/duplicating). Display (portfolio) can be eventually consistent; **money and order status cannot**. KYC + demat account linkage required.

---

## 4. Quick Commerce

### Q: Design a 10-minute grocery app (Blinkit / Zepto style).

**In one line:** It's **hyperlocal** — you're served by the nearest **dark store**, inventory is **per-store and live**, and the whole experience races a clock.

**Explain it like I'm new:** Unlike Amazon (one big warehouse, ships in days), quick commerce has tiny local "dark stores" (mini warehouses) near you. The app figures out _which store_ serves your location, shows _only that store's_ stock (which changes minute to minute), and once you order, a picker packs it and a rider brings it — with you watching a live map.

**How it actually works:**

```
App (your location)
   ▼
Store-locator  → maps you to nearest dark store
   ▼
Catalog/Inventory svc (per dark store, LIVE stock, short cache TTL)
   ▼
Cart (optimistic UI)
   ▼
Checkout → RESERVE inventory (lock for a few minutes) → prevents overselling
   ▼
Payment
   ▼
Order svc (state machine: placed → packing → out-for-delivery → delivered)
   ▼
Fulfilment: assign picker + rider
   ▼
Live tracking (WebSocket/push: rider location, ETA, status)
```

**What an architect calls out (trade-offs):**

- **Overselling vs conversion:** reserve stock at checkout and **hold it with a short timeout**. Reserve too early → you starve other shoppers of stock; too late → two people buy the last item. A short, released-on-abandon lock is the balance.
- **Inventory is store-local and atomic:** decrement with a single atomic operation, not read-then-write.
- **ETA is dynamic:** compute server-side from store load + rider availability + traffic, and **push updates** as they change.
- **Caching:** cache the catalog hard (it rarely changes) but keep **availability** on a short TTL or real-time signal (it changes constantly).
- **Out-of-stock UX:** fail gracefully, suggest substitutes.
- **Offline:** browsing a cached catalog is fine; **placing an order needs connectivity** (you need live stock + payment).

### Q: How do you stop two people buying the last item?

**In one line:** One atomic, conditional decrement — not a read-then-write.

**Explain it like I'm new:** If you "check stock, then subtract" in two steps, two phones can both pass the check before either subtracts → both succeed → you oversold. Instead do it in **one** step: "subtract 1 **only if** at least 1 is left." The database guarantees only one wins.

**How:** `UPDATE inventory SET qty = qty - 1 WHERE item_id = ? AND qty >= 1;` — if it affects 0 rows, it's sold out. Hold the reservation with a TTL and release on abandon.

---

## 5. Offline-First

### Q: Design a robust offline-first app (the field-data-collection pattern).

**In one line:** The **local database is the source of truth** for the UI; changes queue in an **outbox** and sync later; the **server is idempotent** so retries never duplicate.

**Explain it like I'm new:** Imagine a field worker in a remote area with no internet. The app must work _fully_ anyway. So the phone's own database is the "real" data the screen reads and writes — instant, no waiting. Every change also drops a note in an **outbox** (a to-send list). When the internet comes back, a background worker mails the outbox to the server. Because each note has a **unique ID**, if it gets sent twice (flaky reconnection), the server just ignores the duplicate.

**How it actually works:**

```
UI ──read/write──► Local DB (source of truth) ──► instant, works offline
                        │ every change
                        ▼
                  Outbox queue (client_id, type, payload, status: pending/synced/failed)
                        │ when online
                        ▼
            Background sync ──POST(client_id)──► Server
                        ▲                            │  idempotent: dedupe by client_id,
                        └──────── ack / conflict ◄───┘  route to right collection by type
```

**What an architect calls out:**

- **Idempotent writes:** the server dedupes by the **client-generated ID**, so the same operation applied twice is harmless. _(This is exactly the 400-ship pattern: each report carries its type + a unique client-generated `_id`; duplicate POSTs on reconnect are auto-rejected; the backend routes each payload to the correct collection by type.)_
- **Conflict resolution — pick one and document it:** last-write-wins (timestamps/vector clocks), server-wins, or field-level merge / CRDTs for collaborative editing.
- **Show sync status** (pending / syncing / failed) so users trust it.
- **Order & partial failures:** sync parents before children; track status **per item**, not all-or-nothing.
- **Save bandwidth:** delta sync (only changes), compression, batching.
- **Know the limits:** you **cannot** do payments, live-stock checks, or auth issuance offline — queue what's safe, block what isn't.

### Q: When do you _not_ go offline-first?

**In one line:** When correctness depends on the server right now — money, inventory, fraud checks.

**Explain it like I'm new:** Offline-first is perfect for data the user _owns_ and you can reconcile later (notes, forms, field reports). It's wrong for things where being out of date is dangerous — you can't let someone "spend money" or "buy the last item" offline, because you can't verify it. There, offline = **read-only view**; writes wait for a connection.

---

## 6. Loyalty & Rewards Platform

> This is a rich domain: it's **part fintech** (points behave like money), **part e-commerce** (physical rewards), **part SaaS** (white-label, multi-tenant), and serves **two very different audiences** (B2B and B2C) at once.

### 6.1 The big idea

**In one line:** Points are a **currency you issue**, so treat them like money — a **points ledger**, idempotent earning, and careful redemption — but with two extra twists: **points expire**, and **points are a liability on your balance sheet**.

**Explain it like I'm new:** A loyalty program is basically a mini-economy you run. You print your own money ("points"/"coins"), customers earn it by doing things (buying, referring), and spend it on rewards (vouchers, products, discounts). Because it's money-like, all the banking rules apply: never edit a balance, always use a ledger, make earning idempotent. The two new headaches: points **expire** (so the maths is time-based), and every unspent point is **money you owe** (a liability you must account for).

**Core entities:**

- **Member** — the person earning/spending (B2C consumer, or B2B dealer/employee).
- **Points/coins** — the loyalty currency (per program).
- **Earn rules** — how points are granted (₹100 spent = 10 points; refer a friend = 500).
- **Tiers** — Silver/Gold/Platinum, with better benefits higher up.
- **Rewards catalog** — what points buy: vouchers, physical products, experiences, cashback.
- **Campaigns** — time-boxed bonuses (2x points this weekend).
- **Tenant** — the brand running its own program on your platform (for white-label).

### 6.2 The points ledger (the heart of it)

**In one line:** Every point movement is an **immutable ledger entry**; balance = sum of entries; expiry is handled with **buckets**.

**Explain it like I'm new:** Just like the bank example — you don't store "Riya has 1,200 points" as a number you overwrite. You record entries: "+100 earned (order #5, expires 31-Dec)", "−50 redeemed (voucher V9)", "−20 expired". Add them up = the balance. The clever bit is **expiry**: points earned in March might expire in March next year, so you track points in **dated buckets** and spend the **oldest first (FIFO)** so the soonest-to-expire get used.

**How it actually works:**

- Entry types: `EARN`, `REDEEM`, `EXPIRE`, `ADJUST` (manual correction), `REVERSE` (e.g. order returned).
- **FIFO expiry:** each EARN has an expiry date; redemptions consume oldest-first; a scheduled job writes `EXPIRE` entries when buckets lapse.
- **Balance** is derived (or a running total updated transactionally with each entry).

**What an architect calls out:**

- **Idempotent earning:** the same purchase event must never grant points twice → dedupe by event/transaction ID. (Retries and duplicate webhooks are common.)
- **Points liability:** finance needs to know total outstanding points (= money owed). Your ledger is the single source for that report.
- **Never trust the client** for balances or "I earned this" — earn server-side from a verified event.

### 6.3 Earn flow

**In one line:** Verified event → rules engine → idempotent ledger credit → notify member.

**Explain it like I'm new:** Something happens (a purchase, a referral, app install). The platform checks "does any earn rule apply, any campaign multiplier active?", calculates the points, and **credits the ledger once** (even if the event arrives twice). Often this is slightly delayed (e.g. points confirm after the return window), so you may "pend" points first, then "confirm."

**How it actually works:**

```
Source event (purchase webhook / action)  ──(unique event_id)──►
   Rules engine  (which rule? campaign multiplier? tier bonus?)
        ▼
   Compute points  → PENDING earn (optional hold during return window)
        ▼
   On confirm → EARN ledger entry (idempotent by event_id)
        ▼
   Update tier progress + notify member
```

**Architect notes:** Pending vs confirmed points (so returns don't claw back already-spent points). Rules engine should be **config-driven per tenant**, not hard-coded.

### 6.4 Burn / redemption — overview

**In one line:** Redeeming = **atomically deduct points + issue the reward**; if reward issuance fails, the points must not be lost.

**Explain it like I'm new:** Spending points must be all-or-nothing: you can't take the points and fail to give the reward, or give the reward and forget to take the points. So it's a small **transaction/saga**: reserve points → issue reward → confirm (deduct). If issuing the reward fails, you **release the reserved points**.

Redemption types: **vouchers**, **physical products**, **discounts/cashback**, **third-party gift cards**. The two that need real detail are vouchers and physical products.

### 6.5 Vouchers flow (in detail)

**In one line:** A voucher is a **secure, single-use code with a lifecycle**; issuing one is an atomic "spend points → get code", and using one must be **double-spend-proof**.

**Explain it like I'm new:** A voucher is like a gift card: a unique code worth something. When a member redeems points for it, you must (a) take the points and (b) hand over a valid, unguessable code — together. Later, when they _use_ the voucher (at checkout, at a store), you must make sure it can't be used twice.

**Voucher lifecycle (a state machine):**

```
CREATED ─► ISSUED/RESERVED ─► ACTIVE ─► REDEEMED (used)
                                   └────► EXPIRED / CANCELLED
```

**How it actually works:**

1. **Generation:** either pre-generate a **pool** of codes (fast issue, good for third-party gift cards bought in bulk) or **generate on-demand**. Codes must be **unique and not guessable** (random, not sequential).
2. **Issue (redeem points):** atomically → reserve points → assign a voucher to the member → deduct points. If assignment fails, release the points.
3. **Use / validation:** at the point of use, **lock the code and check state** so two simultaneous uses can't both succeed (idempotency + atomic state change `ACTIVE → REDEEMED`).
4. **Third-party vouchers** (Amazon, etc.): integrate with a voucher aggregator's API (e.g. provider issues the real code); handle their failures, timeouts, and **reconcile** your issued vouchers against theirs.
5. **Expiry & cancellation:** scheduled job expires old vouchers; cancellations may refund points (a `REVERSE` ledger entry).

**Architect notes:**

- **Double-spend prevention** = the voucher equivalent of overselling: single atomic state transition, never read-then-write.
- **Reconciliation** with third-party providers (you think you issued 1,000, they show 998 → investigate).
- **Security:** codes are secrets — rate-limit validation attempts, don't leak which codes exist.

### 6.6 Physical product redemption (in detail)

**In one line:** It's e-commerce **paid in points** (or points + cash): catalog with stock → order → deduct points → fulfilment → shipping → returns re-credit points.

**Explain it like I'm new:** Same as buying a product online, except the "currency" is points. So you reuse all the e-commerce machinery — a catalog with stock, an order that moves through states, a warehouse/3PL that ships it — but the "payment" step is a points deduction (sometimes points + a little cash to top up).

**How it actually works:**

```
Rewards catalog (point-price + stock)
   ▼
Member redeems → RESERVE stock + RESERVE points
   ▼
Create order (state machine: placed → packed → shipped → delivered)
   ▼
On confirm → DEDUCT points (ledger) ; on failure → release both reservations
   ▼
Fulfilment (own warehouse or 3PL) → shipping + tracking
   ▼
Returns/cancellation → re-credit points (REVERSE entry) + restock
```

**Architect notes:**

- **Reserve stock + points together**, release both on failure (saga). Don't deduct points for an item you can't ship.
- **Mixed payment (points + cash):** the cash part goes through the normal payment flow (with idempotency, webhook confirmation) and must succeed _together_ with the points deduction.
- **Tax/GST & invoicing:** in India, reward redemptions can carry tax/GST implications — model this, especially for higher-value B2B rewards.
- **Inventory consistency:** atomic decrement, same as quick commerce.
- **Returns:** define the policy — re-credit points (and what if those points had already expired?). Edge cases matter here.

### 6.7 White-label / multi-tenant (one platform, many brands)

**In one line:** One codebase serves many brands; each brand ("tenant") gets **isolated data, its own config/branding/rules/catalog**, on **shared infrastructure**, with tenant identity enforced **server-side**.

**Explain it like I'm new:** "White-label" means you build the loyalty engine once, and many different companies run _their own_ branded program on top of it — their logo, their colours, their earn rules, their rewards. To them it looks like _their_ app. The platform's hardest job is **keeping tenants completely separated** so Brand A can never see Brand B's members or points.

**The isolation choices (data):**

|Model|What it is|Trade-off|
|---|---|---|
|**Row-level (shared DB)**|One DB, every table has `tenant_id`, filtered on every query|Cheapest/scales to many tenants; **one bug = data leak**, so isolation must be enforced centrally|
|**Schema-per-tenant**|One DB, separate schema per tenant|More isolation, more ops overhead|
|**DB-per-tenant**|Separate database per tenant|Strongest isolation; expensive; for big/regulated tenants|

**What gets configured per tenant (not hard-coded):**

- **Branding/theming** — logo, colours, fonts (drives the white-label UI).
- **Earn & burn rules** — rates, multipliers, expiry policy (a **config-driven rules engine**).
- **Tiers & benefits** — each brand defines its own.
- **Catalog** — tenant-specific rewards.
- **Auth & domains** — each brand's users, possibly its own subdomain/app.

**What an architect calls out (the senior points):**

- **Tenant isolation enforced server-side, never from the client.** The tenant is derived from the **authenticated token**, not a value the app sends — a client must never be able to ask for another tenant's data. _(This mirrors the multi-tenant loyalty work: strict tenant isolation via server-side auth tokens, a constrained/parameterised query layer, and a read-only DB user on a read replica so even a bug can't write or cross tenants.)_
- **Centralised query guard:** put the `tenant_id` filter in one place (a base repository / row-level security), so no individual query can forget it.
- **"Noisy neighbour":** one big tenant shouldn't slow others → rate-limit per tenant, consider isolating heavy tenants.
- **Config over code:** every brand difference is data/config, so onboarding a new brand is a setup task, not a code change.

### 6.8 B2B and B2C in the same domain

**In one line:** Same engine, **different personas and earn mechanics** — B2C rewards _individual consumers_ for purchases/actions; B2B rewards _businesses/channel partners/employees_ for volume — so you model program _types_, not just users.

**Explain it like I'm new:** The platform serves two worlds:

- **B2C (consumer loyalty):** the end shopper earns points on their own purchases and redeems for vouchers/products. Lots of users, small individual values, app-driven.
- **B2B (channel/partner or employee loyalty):** the "member" is a **dealer, distributor, retailer, or employee**. They earn for **sales volume, hitting slabs/targets, or scanning product QR codes**, and redeem for **higher-value rewards** (often with GST/invoicing). Fewer users, bigger values, more rules.

**The personas to design for:**

- **Platform admin** (you) — runs the whole platform, onboards tenants.
- **Tenant/brand admin** (B2B SaaS customer) — configures _their_ program, catalog, campaigns; views analytics. _(This is itself a B2B relationship: the brand is your customer.)_
- **B2B member** — dealer/distributor/employee earning on volume.
- **B2C member** — end consumer earning on personal purchases.

**What differs between B2B and B2C (and what stays shared):**

|Aspect|B2C|B2B|
|---|---|---|
|Member|Individual consumer|Business / dealer / employee|
|Earn basis|Personal purchase, referral, app action|Sales volume, target slabs, QR-scan on product|
|Volume/value|Many users, low value each|Fewer users, high value each|
|Redemption|Vouchers, small products, cashback|High-value products, bulk, often **GST invoice** needed|
|Approval|Mostly automatic|May need **approval workflows / hierarchy** (distributor → dealer)|
|**Shared core**|**Points ledger, earn engine, voucher/product fulfilment, multi-tenant isolation, audit** — all the same||

**What an architect calls out:**

- Model a **"program type"** (B2C vs B2B) as configuration on top of the _same_ ledger + earn/burn engine — don't fork the platform.
- B2B adds **hierarchy** (a distributor's points roll up; dealers sit under them) and **approval workflows**.
- B2B redemptions often need **tax/GST handling and invoices**; B2C usually doesn't.
- Watch **fraud differently**: B2C fraud = fake referrals/self-dealing; B2B fraud = inflated/fake sales claims → need verification (invoice/QR validation).

### 6.9 Cross-cutting: fraud, reconciliation, scale

**In one line:** Guard against gaming, reconcile points like money, and remember reads (catalog/balance display) dwarf writes.

- **Fraud / gaming:** velocity limits, dedupe events, verify B2B sales claims (QR/invoice), watch self-referral rings. Points are money — people _will_ try to game them.
- **Reconciliation:** reconcile issued vouchers vs third-party provider, points liability vs finance, redemptions vs fulfilment. Mismatches → exceptions queue.
- **Consistency model:** **balances/redemptions need strong consistency** (don't let someone spend points they don't have or spend twice). **Catalog and tier displays can be eventually consistent.**
- **Scale:** reads >> writes (everyone checks balance/catalog; fewer redeem) → cache the catalog and tier rules, keep the ledger authoritative for balances.
- **Notifications:** earning, expiry warnings ("500 points expire in 7 days" — drives engagement), redemption confirmations.

### Q: The 60-second loyalty platform pitch (say this)

"Points are a currency we issue, so the core is a **double-entry points ledger** with **idempotent earning** and **atomic redemption** — same discipline as money, plus **FIFO expiry** and a **points-liability** view for finance. On top sits a **config-driven rules engine** so each **tenant** (white-label brand) defines its own earn rates, tiers, and catalog, with **tenant isolation enforced server-side from the auth token**, never the client. Rewards fan out to **vouchers** (secure single-use codes, double-spend-proof, reconciled with providers) and **physical products** (e-commerce paid in points, stock + points reserved together). The **same engine serves B2C** (consumers earning on purchases) **and B2B** (dealers/employees earning on sales volume, with hierarchy, approvals, and GST) — it's a program-_type_ config, not a fork. Balances and redemptions are strongly consistent; catalog and tiers can be eventual. And I'd end on the trade-off: correctness and isolation first, performance via caching reads."

---

## 7. One-page recap / cheats

- **Money/points = strong consistency + idempotency + double-entry ledger.** Feeds/catalogs = eventual is fine.
- **Idempotency key** = claim ticket; same key → same result, no double action.
- **Ledger** = append-only notebook; balance is the _sum_, never an edited field.
- **State machine** = items can't skip allowed states (transfer, order, voucher, loan).
- **Reconciliation** = balance your records against the other side; the final safety net.
- **Atomic conditional update** beats read-then-write (stops overselling / double-spend).
- **Saga + compensation** = multi-step distributed "transaction" with reversals.
- **Read-your-own-writes** = after a write, the user must see it now (route to primary).
- **Offline-first** = local DB is truth + outbox + idempotent server dedupe by client ID; never for money/stock.
- **Loyalty:** points behave like money **+ expiry (FIFO buckets) + liability**.
- **Vouchers:** secure single-use code, lifecycle state machine, double-spend-proof, reconcile with provider.
- **Physical rewards:** e-commerce paid in points; reserve stock + points together; returns = REVERSE entry.
- **White-label/multi-tenant:** shared engine, isolated data, **tenant from the auth token (server-side), never the client**; config over code.
- **B2B vs B2C:** same core engine; B2B = volume-based earn, hierarchy, approvals, GST, high value; B2C = purchase/referral, automatic, high volume/low value.
- **Always end on the trade-off.**

## 7. Security, Compliance & Audit (cross-domain)

### Q: Security checklist for a banking/fintech mobile app?

**Short answer:**

- **At rest:** no sensitive data in plain prefs; tokens in **Keychain/Keystore**; encrypt local DB; **never store card PANs** (tokens only).
- **In transit:** TLS + **certificate pinning**.
- **Auth:** short-lived access + refresh tokens, **biometric re-auth** for sensitive actions, **device binding**, SCA.
- **App hardening:** code obfuscation, **root/jailbreak detection**, anti-tampering, screenshot/screen-recording blocks on sensitive screens, disable clipboard for OTP/card fields.
- **Server-side is truth:** never trust client-reported payment/balance state.
- **Idempotency + audit log + reconciliation** for correctness.

### Q: What compliance must an architect bake in?

**Short answer:** **KYC/AML** (verify identity, screen, monitor), **PCI-DSS** (card data handling — stay out of scope via tokenization), **data residency** (RBI: store payment data in India), **consent + data privacy** (DPDP Act / GDPR), **immutable audit logs** of every financial action, and **regulatory reporting**. Design these in from day one — they're not bolt-ons.

### Q: Why is an immutable audit log non-negotiable?

**Short answer:** Financial systems must prove **what happened, when, and who did it** — for disputes, audits, and regulators. The log is **append-only**; you never edit or delete history. Combined with the **double-entry ledger**, every number in the system is fully traceable.

---

## 8. The Meta-Answer for Any Domain System-Design Question

**Short answer — your repeatable framework:**

1. **Clarify:** scope, scale (users/TPS), platforms, offline needs, compliance.
2. **Data model + API:** entities, the key flows, REST/GraphQL, pagination.
3. **Sketch components:** client layers → API gateway → services → data/ledger → events/webhooks → push.
4. **Walk one request end-to-end**, including the **failure/offline path**.
5. **Correctness:** idempotency, consistency model (strong for money, eventual for feeds), ledger, reconciliation.
6. **Non-functionals:** security, compliance/audit, monitoring, scaling, cost.
7. **End on trade-offs** — consistency vs availability, battery vs freshness, offline vs correctness, complexity vs time-to-market.

> Saying _"money needs strong consistency, idempotency, and a double-entry ledger; feeds can be eventually consistent"_ in the first two minutes signals you think like an architect, not a coder.

---

## 16.  Rapid-Fire Cheats 

- Layout rule: **constraints down, sizes up, parent sets position.**
- Keys: only needed when reordering/moving **stateful** widgets.
- **JIT** (debug, hot reload) vs **AOT** (release, fast) — profile in release.
- **Sealed class + exhaustive switch** = type-safe UI state.
- Android 4 components: **Activity, Service, BroadcastReceiver, ContentProvider.**
- **Context leak** = holding an Activity context past its life → leak.
- **Struct (value, preferred)** vs **class (reference)** in Swift.
- **SceneDelegate** = UI lifecycle (iOS 13+); **AppDelegate** = app lifecycle.
- **Cursor pagination** > offset for live feeds.
- **REST** = simple/cacheable; **GraphQL** = exact fields, fewer round trips.
- **Idempotent writes (client ID)** = the heart of safe offline sync.
- **Staged rollout + feature flags + crash alerts** = safe shipping.
- **SOLID's "D"** (depend on abstractions) = backbone of Clean Architecture.
- **System design: always end on trade-offs.**

**(payments)**

- **Never trust the client for payment status** — server + gateway webhook is the source of truth.
- **Idempotency key per payment attempt** = no double charge on retry.
- **Tokenization** = store a token, never the raw card (PCI scope shrinks).
- **PCI-DSS**: don't let card data touch your servers — use the gateway's SDK/iframe.
- **3D Secure / SCA** = bank-side extra auth (OTP/biometric) → shifts fraud liability.
- **UPI** = real-time bank-to-bank push/pull via VPA; no card data at all.
- **Authorization ≠ Capture**: auth holds funds, capture actually moves them.
- **Webhook + reconciliation** = how you confirm async payments reliably.
- **Double-entry ledger** = every money movement is two balanced entries; never mutate balances directly.
- **Money = integers (minor units/paise)**, never floats.
- **Refund ≠ reversal**: reversal cancels an un-captured auth; refund returns captured money.
- **Chargeback** = customer disputes via their bank; you may lose the money + a fee.

**(banking / fintech)**

- **Strong Customer Authentication (SCA)** = two of: knowledge, possession, inherence.
- **KYC/AML** = verify identity + screen for money laundering before onboarding.
- **Audit log = append-only, immutable**; you can never delete financial history.
- **Idempotency + ledger + reconciliation** = the holy trinity of correctness.
- **Eventual consistency is fine for feeds, NOT for balances** — money needs strong consistency.
- **Read your own writes**: after a transfer, the user must see the new balance immediately.
- Banking offline: **read-only cache OK, money-moving offline = almost never.**

**(quick commerce)**

- **Hyperlocal** = serving radius from a dark store; inventory is per-store, not global.
- **Inventory reservation/locking** at add-to-cart or checkout to prevent overselling.
- **Real-time ETA + live order tracking** over WebSocket/push.
- **Surge & dynamic availability**: items/slots change by minute — cache with short TTL.
- **Optimistic UI for cart**, server is truth at checkout.

**(architecture / scale)**

- **CAP**: under a network partition you pick Consistency **or** Availability.
- **Strong vs eventual consistency** = correctness vs availability/latency trade-off.
- **Idempotency** turns "at-least-once" delivery into "effectively-once."
- **Outbox pattern** = reliably publish events with your DB transaction (no lost events).
- **Saga** = manage a multi-step distributed transaction with compensating actions.
- **CQRS** = separate write model from read model when they scale differently.
- **Circuit breaker** = stop hammering a failing dependency; fail fast, recover gracefully.
- **Backpressure / rate limiting** = protect services from overload.
- **Dead-letter queue** = park messages that keep failing, for later inspection.