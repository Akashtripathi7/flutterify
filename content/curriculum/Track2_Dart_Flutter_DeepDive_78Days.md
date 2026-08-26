# TRACK 2 — Dart + Flutter Deep Dive (78 Days — Expanded Edition)

> **Rules:** Questions, scenarios, and assignments only. No answers, no solutions. `💡 Hint:` lines are optional nudges. The goal is for you to *reason your way* to understanding Flutter so well it feels like you built it.
>
> **Daily ritual (1–2 hrs):** (1) Study the day's topic from docs/source. (2) Answer the interview questions *aloud, as in a real panel*. (3) Do the debugging/scenario task. (4) For internals days, sketch the relevant tree or pipeline from memory.
>
> **Progression:** Beginner → Intermediate → Advanced → Senior → Staff
>
> **New in this edition (vs. 60-day plan):**
> - Phase A gets Dart 3 sealed classes, patterns, and collection drills (Day 10 expanded)
> - Phase C gets dedicated go_router + deep-link day (Day 22 new)
> - Phase D gets Accessibility day + Flavors/dart-define day (Days 34–35 new)
> - Phase E gets Impeller + app-size optimization day (Day 42 new)
> - Phase F gets dedicated Flutter Web day (Day 48 new)
> - Phase G gets Payment Integration day (Day 55 new)
> - Phase H is fully redesigned: proper System Design framework + domain scenario banks
>   - Fintech (20+ scenarios), F&B, MedTech, E-commerce (each a full day)
>   - Total: 78 days

---

## PHASE A — Dart Fundamentals & OOP (Days 1–10)

### Day 1 — Variables, Types, Type Inference
**Theory questions**
1. [ ] Distinguish `var`, `final`, `const`, and `late`. When is each the *correct* choice, not just a working one?
2. [ ] What is the difference between a compile-time constant and a runtime final? Give an example only one of them can express.
3. [ ] What is `dynamic`, and why is it dangerous? How does it differ from `Object?`?
4. [ ] Why does Dart infer types, and when should you annotate explicitly anyway?

**Scenario**
1. [ ] You see `late final x;` initialized later. What runtime error can this introduce, and when does it fire?

**Interview**
1. [ ] (Senior) Explain `const` canonicalization: why are two identical `const` objects the same instance?

---

### Day 2 — Operators, Functions, Parameters
**Theory**
1. [ ] Positional vs. named vs. optional vs. required-named parameters — write a function signature using all categories.
2. [ ] What does `=>` mean and what are its limits versus a block body?
3. [ ] Explain `??`, `??=`, `?.`, and `!`. For each, describe one bug it prevents and one it can hide.
4. [ ] What are first-class functions? Give a use where passing a function as an argument is cleaner than a callback interface.

**Scenario**
5. [ ] A function has a default parameter value that is mutable (e.g., a list). Why is that a footgun across calls?

**Interview**
6. [ ] (Intermediate) What's the difference between a function's *signature* and its *type*? Can two different functions share a type?

---

### Day 3 — Null Safety (Deep)
**Theory**
1. [ ] What problem does sound null safety solve that other approaches don't?
2. [ ] Explain the difference between `T`, `T?`, and how flow analysis "promotes" a nullable to non-nullable.
3. [ ] Why can a non-local nullable field *not* be promoted by a null check, while a local variable can?
4. [ ] What does the `!` operator actually compile to, and what runtime cost/risk does it carry?

**Debugging**
5. [ ] Code reads `widget.user!.name` and crashes only in production. What sequence of events produces that, and what's the safe rewrite pattern?

**Interview**
6. [ ] (Senior) Explain how null safety interacts with generics — what is `T extends Object` vs `T extends Object?`?

---

### Day 4 — Collections: List, Set, Map (Internals-aware)
**Theory**
1. [ ] What backs a Dart `List` — and what is the cost of insertion at the front vs. the end?
2. [ ] How does a `Map` find a key? What does a key's `hashCode`/`==` contract require, and what breaks if you violate it?
3. [ ] When is a `Set` the right structure, and what does element identity depend on?
4. [ ] What is the difference between a growable list and a fixed-length list?

**Scenario**
5. [ ] You use a custom class as a Map key but lookups always miss. What did you forget to override, and why does that matter?

**Interview**
6. [ ] (Intermediate) Spread operator, collection-if, collection-for: rewrite an imperative list-building loop using all three.

---

### Day 5 — Classes, Constructors, Encapsulation
**Theory**
1. [ ] Explain default, named, factory, and `const` constructors. When must you reach for a factory?
2. [ ] What does an initializer list do that the constructor body cannot?
3. [ ] How does Dart enforce encapsulation without `private` keywords? What is library-level privacy?
4. [ ] What are getters and setters, and when do they beat plain fields?

**Scenario**
5. [ ] You want a class that sometimes returns a cached instance instead of a new one. Which constructor enables that, and why?

**Interview**
6. [ ] (Senior) Why are `const` constructors important for Flutter widget performance specifically?

---

### Day 6 — Inheritance, Abstract, Interfaces
**Theory**
1. [ ] Distinguish `extends`, `implements`, and `with`. What does each pull in?
2. [ ] Every Dart class defines an implicit interface — what does that let you do without an `interface` keyword?
3. [ ] When is an abstract class the right tool versus an interface-only contract?
4. [ ] What is `super`, and in what order do constructors run up the chain?

**Scenario**
5. [ ] You `implements SomeClass` and only get errors about unimplemented members. Why didn't you inherit its behavior?

**Interview**
6. [ ] (Intermediate) Composition over inheritance — give a Flutter example where composition is clearly the better design.

---

### Day 7 — Mixins & Extension Methods
**Theory**
1. [ ] What can a mixin do that an abstract class cannot, and vice versa?
2. [ ] Why does mixin linearization matter, and what order does Dart resolve it in?
3. [ ] `on` clause in a mixin definition — what does it constrain?
4. [ ] Extension methods: how do they differ from monkey-patching? What are their limits (e.g., can they access private members)?

**Scenario**
5. [ ] You add an extension method `toSentenceCase()` on `String`. A later package also defines the same extension. How does Dart handle the conflict, and how do you resolve it?

**Interview**
6. [ ] (Senior) Why can a mixin not have a generative constructor? What does that imply about state?

---

### Day 8 — Generics, Typedefs, Type System
**Theory**
1. [ ] Why is Dart's type system "sound"? What guarantee does soundness give you at compile time?
2. [ ] What is type erasure, and does Dart have it? What is reified generics?
3. [ ] What is covariance and contravariance? Give a List example that violates type safety in an unsound system.
4. [ ] When would you write `typedef` instead of writing the function type inline?

**Scenario**
5. [ ] You write `List<Dog> dogs = <Animal>[];`. In a sound type system, what is wrong here? What is the safe equivalent?

**Interview**
6. [ ] (Staff) Explain how bounded generics (`T extends Comparable<T>`) are useful. Write a generic `max()` function using one.

---

### Day 9 — Async, Futures, Streams
**Theory**
1. [ ] How does Dart's event loop work? What is the microtask queue and why does it drain before the next event?
2. [ ] What is the difference between `async`/`await` and `.then()`/`.catchError()`? Is there a performance difference?
3. [ ] What is a `Completer`, and when would you actually need one?
4. [ ] Compare single-subscription vs. broadcast Streams. What happens if you listen to a single-subscription stream twice?

**Scenario**
5. [ ] A network call is started in `initState`. On a slow device, the widget is disposed before the future completes. What error appears, and how do you guard against it properly?

**Interview**
6. [ ] (Senior) What is the difference between `StreamTransformer`, `map`, and `where` on a Stream? Implement a rate-limiting transformer.

---

### Day 10 — Dart 3: Patterns, Records, Sealed Classes + Collection Drills
**Theory (Dart 3 features)**
1. [ ] What is a *record* in Dart 3? How does it differ from a class or a Map? When is it preferable?
2. [ ] What is *pattern matching*, and how does the `switch` expression use exhaustive matching differently from a statement?
3. [ ] What is a *sealed class*? What guarantee does the compiler give you when you switch on a sealed type?
4. [ ] What is a *destructuring pattern*? Give a record and an object example.
5. [ ] What is the `final` pattern? What is the `when` guard clause?

**Collection deep-dive**
6. [ ] Compare `Iterable.map`, `expand`, `fold`, `reduce`, `any`, `every`, `firstWhere`. For each, give a one-line scenario.
7. [ ] When would you use `LinkedHashMap` vs `HashMap` vs `SplayTreeMap`?
8. [ ] What is `UnmodifiableListView` and why does it not give you a deep-immutability guarantee?

**Scenario**
9. [ ] You have a sealed class `Result<T>` with `Success<T>` and `Failure` subtypes. Write a switch expression that exhaustively handles both and returns a widget (describe only — no solution expected).

**Interview**
10. [ ] (Staff) How do Dart 3 patterns interact with null safety — can you destructure a nullable record? What does the pattern `(int? a, int b)` mean in a switch case?

---

## PHASE B — Flutter Core: Widgets, Rendering & State (Days 11–21)

### Day 11 — Widget Tree, Element Tree, RenderObject Tree
**Theory**
1. [ ] Describe the three trees Flutter maintains. What lives in each, and why does Flutter separate them?
2. [ ] What does "inflating" a widget mean? What triggers the Element to call `build()`?
3. [ ] What is reconciliation in Flutter, and how does the element tree make it efficient?
4. [ ] When does an Element get reused versus discarded and replaced?

**Sketch task**
5. [ ] Draw the three-tree representation of: `Scaffold(body: Center(child: Text("Hi")))`. Label each node's type.

**Interview**
6. [ ] (Senior) Why is the widget being "immutable" critical to making the Element tree reconciliation correct and safe?

---

### Day 12 — StatelessWidget vs StatefulWidget
**Theory**
1. [ ] `build()` is called very frequently — what makes it safe and cheap to call repeatedly?
2. [ ] What is the lifecycle of a `StatefulWidget`? Enumerate every lifecycle method and when each fires.
3. [ ] Why is it wrong to store mutable application state directly on a widget (not its State)?
4. [ ] What is `didUpdateWidget`? Give a real scenario where you need it.

**Debugging**
5. [ ] A `StatefulWidget` receives a new value via its constructor but the UI doesn't update. Identify the likely cause and the correct pattern.

**Interview**
6. [ ] (Intermediate) When would you split one big `StatefulWidget` into smaller ones, and what performance benefit does that bring?

---

### Day 13 — Keys (GlobalKey, LocalKey, UniqueKey, ValueKey, ObjectKey)
**Theory**
1. [ ] What is the primary purpose of a Key in Flutter? Without keys, how does the framework match Elements across rebuilds?
2. [ ] When does a widget *need* a key, and when is adding one unnecessary (or even harmful)?
3. [ ] Explain the difference: `ValueKey`, `UniqueKey`, `ObjectKey`. Give a concrete use case for each.
4. [ ] What is a `GlobalKey`? What does it give you that a `LocalKey` cannot?
5. [ ] What is `GlobalKey`'s cost, and why should you avoid creating one in `build()`?

**Which-key-when cheat sheet**

| Scenario | Key to use | Why |
|---|---|---|
| Reorderable list of stateful items | `ValueKey(item.id)` | Stable identity so State survives reorder |
| Two same-type siblings with State (e.g., counters in a Row) | `ValueKey` or `UniqueKey` | Without a key the framework may swap their State |
| Preserve a widget's State while reparenting it in the tree | `GlobalKey` | Crosses tree positions; enables `currentState` access |
| Access a Form's fields programmatically | `GlobalKey<FormState>` | Lets you call `.validate()`, `.save()`, `.reset()` |
| Animated list item that gets removed and re-added | `UniqueKey` | Force new State each time |
| Stateless widgets in a list | No key needed | No State to preserve; reconciliation by type is fine |

**Scenario**
6. [ ] You have a `ListView` of card widgets, each holding a counter. When you remove the first card, all counters shift. Add the minimum change to fix this without restructuring the list.

**Interview**
7. [ ] (Staff) A `GlobalKey` is attached to a widget in tab A. The user switches to tab B, the tab A widget is offscreen and removed from the tree. What happens to the key's state? What is the safest architecture to avoid this problem?

---

### Day 14 — Layout: Constraints, Flex, Sliver
**Theory**
1. [ ] State the "constraints go down, sizes go up, parent positions child" rule. Why does it make rendering O(n)?
2. [ ] What is a tight vs. loose constraint? What is an unbounded constraint, and what widget imposes one?
3. [ ] Explain how `Flexible` and `Expanded` differ inside a `Row`/`Column`. What role does `flex` play?
4. [ ] What is the Sliver protocol? How does a `SliverList` differ from a `ListView`?

**Debugging**
5. [ ] `RenderFlex children have non-zero flex but incoming height constraints are unbounded` — what layout combination causes this, and what is the fix?

**Interview**
6. [ ] (Senior) Why can't you nest two scrollable widgets scrolling in the same direction without explicit size constraints? What is the correct pattern?

---

### Day 15 — Painting, Custom Paint, Canvas
**Theory**
1. [ ] What is the paint phase, and at what point in Flutter's pipeline does it run?
2. [ ] Why does `CustomPainter` have `shouldRepaint()`, and what is the cost of returning `true` always?
3. [ ] Difference between `Canvas.drawPath`, `drawRRect`, `drawImage`, and `drawParagraph` — which is cheapest, and why?
4. [ ] What is a `Picture` and `PictureRecorder`? Why does Flutter sometimes record paint commands before rasterizing?

**Scenario**
5. [ ] You're building a custom progress ring. List all the Canvas calls you'd need, in order, to draw a colored arc on top of a grey track.

**Interview**
6. [ ] (Staff) When would you use `RepaintBoundary`, and what is the risk of overusing it?

---

### Day 16 — Animations: Implicit, Explicit, Hero
**Theory**
1. [ ] Distinguish implicit (`AnimatedContainer`) vs. explicit (`AnimationController`) animations. When does each excel?
2. [ ] What is a `Tween`, a `Curve`, and an `Animation`? How do they compose?
3. [ ] What is `TickerProvider`, and why must you use `vsync`?
4. [ ] How does a `Hero` animation work across routes? What constraints does it impose on the matched widgets?

**Debugging**
5. [ ] An `AnimationController` is not disposed. What observable problem does this cause, and how do you find it in DevTools?

**Interview**
6. [ ] (Senior) What is `AnimatedBuilder` vs. `AnimatedWidget`? When would you choose each, and what rebuild scope does each produce?

---

### Day 17 — Gestures: Hit Testing, GestureArena, Pointer Events
**Theory**
1. [ ] Describe the Flutter gesture recognition pipeline: pointer down → hit test → arena → winner.
2. [ ] What is a gesture arena? What do "claim" and "reject" mean in it?
3. [ ] `GestureDetector` vs `Listener` vs `InkWell`: when do you need the raw pointer layer?
4. [ ] What is `HitTestBehavior.opaque` vs `translucent` vs `deferToChild`, and when does it matter?

**Scenario**
5. [ ] You nest a horizontal swipe gesture inside a vertical `PageView`. The swipe never fires. Why, and how do you resolve the arena conflict?

**Interview**
6. [ ] (Senior) What is `RawGestureDetector` and when do you need to write a custom `GestureRecognizer`?

---

### Day 18 — State Management: Provider & Riverpod
**Theory**
1. [ ] What problem does `InheritedWidget` solve, and how does `Provider` build on it?
2. [ ] What is the difference between `ChangeNotifierProvider`, `FutureProvider`, and `StreamProvider`?
3. [ ] In Riverpod, distinguish `Provider`, `StateProvider`, `NotifierProvider`, `AsyncNotifierProvider`. When do you use each?
4. [ ] What is `ref.watch` vs `ref.read` vs `ref.listen` in Riverpod? What happens if you use `ref.read` in `build()`?

**Scenario**
5. [ ] Your app has a shopping cart that is needed in 5 deeply nested screens. Walk through how you'd structure this in Riverpod — what type of provider, where it lives, how screens subscribe.

**Interview**
6. [ ] (Staff) Provider scoping: when would you use `ProviderScope.overrides` in tests, and why is that better than dependency injection via constructors for Flutter widget tests?

---

### Day 19 — State Management: BLoC / Cubit
**Theory**
1. [ ] What is the BLoC pattern's core idea? What problem does it solve over setState + callbacks?
2. [ ] Distinguish a `Bloc` (event-driven) from a `Cubit` (method-driven). When is a Cubit sufficient?
3. [ ] What is `BlocBuilder` vs `BlocListener` vs `BlocConsumer`? Each has a distinct job — what is it?
4. [ ] How does BLoC enforce unidirectional data flow?

**Debugging**
5. [ ] A `BlocBuilder` re-renders on every state emission even though the state value is identical. Why, and how do you prevent unnecessary rebuilds?

**Interview**
6. [ ] (Senior) How do you test a BLoC in isolation? What does `bloc_test` give you over plain unit tests?

---

### Day 20 — Streams, RxDart, Isolates
**Theory**
1. [ ] When does a Flutter app need a background isolate vs. just an async function?
2. [ ] What is `compute()`, and what is its limitation (what can and cannot cross the isolate boundary)?
3. [ ] How do you send data back from a long-running isolate? What is `ReceivePort` / `SendPort`?
4. [ ] What is RxDart? Name 3 operators it adds over the standard Stream API and describe each use case.

**Scenario**
5. [ ] You need to parse a 50MB JSON file without freezing the UI. Describe the isolate strategy end-to-end.

**Interview**
6. [ ] (Staff) What is `Isolate.run()` (Dart 2.19+)? How does it simplify the old `compute`/`Isolate.spawn` dance?

---

### Day 21 — Performance: Jank, DevTools, Profiling
**Theory**
1. [ ] What is jank, and what is the 16ms/8ms frame budget?
2. [ ] What is the difference between UI thread jank and GPU/raster thread jank? How do you tell them apart in DevTools?
3. [ ] Name 5 common causes of unnecessary rebuilds and how to find each.
4. [ ] What is `const` widget's role in the rendering pipeline? At what level does it short-circuit?

**Scenario**
5. [ ] DevTools shows a frame consistently taking 30ms on the raster thread but only 2ms on the UI thread. What types of operations are the likely culprits, and how do you investigate?

**Interview**
6. [ ] (Staff) When and how would you use `PerformanceOverlay`, `debugPrintRebuildDirtyWidgets`, and `Timeline.startSync` together to diagnose a production performance regression?

---

## PHASE C — Navigation, Data, Platform (Days 22–28)

### Day 22 — Navigation: go_router, Deep Links, URL Strategy *(NEW)*
**Theory**
1. [ ] What is `go_router`? What problem does it solve over `Navigator 1.0` (imperative push/pop)?
2. [ ] Explain `GoRouter`'s declarative route tree. How does it handle nested routes and shell routes?
3. [ ] What is a deep link? What must you configure on Android (`intent-filter`) and iOS (`universal links` / `custom scheme`) to receive one?
4. [ ] What is `go_router`'s `redirect` parameter, and how would you use it to implement a login gate?
5. [ ] What is URL strategy in Flutter Web? What is the difference between hash (`#/`) and path-based (`/`) URL routing?

**Scenario**
6. [ ] Your app receives the deep link `myapp://product/42?ref=promo`. Walk through how `go_router` parses path parameters and query parameters, and how you extract `productId=42` and `ref=promo` in the destination screen.

**Which-approach-when**

| Situation | Tool | Why |
|---|---|---|
| Simple linear navigation, no deep links | `Navigator.push` | Less boilerplate for trivial cases |
| Deep links + web URL support | `go_router` | Handles URL ↔ state mapping |
| Auth redirect guard | `go_router` redirect | Applied on every navigation attempt |
| Nested tab navigation | `ShellRoute` in go_router | Maintains bottom nav bar across routes |
| Back-button behavior customization | `PopScope` / `onPopInvoked` | New API replacing `WillPopScope` |

**Interview**
7. [ ] (Senior) How does `go_router` handle the Android back button vs. the iOS swipe-back gesture? What is `PopScope` and when do you need it?

---

### Day 23 — HTTP, Dio, REST, GraphQL
**Theory**
1. [ ] `http` package vs `Dio` — what does Dio add that justifies the dependency?
2. [ ] What is an interceptor? Give three real interceptors you'd add in a production app and what each does.
3. [ ] How do you handle token refresh with a 401 interceptor without triggering multiple simultaneous refreshes?
4. [ ] What is JSON serialization in Dart — `jsonDecode` vs code-generated models (`json_serializable`, `freezed`)? What are the trade-offs?

**Scenario**
5. [ ] Your API has paginated endpoints. Design a Dio-based repository that handles cursor-based pagination, caches pages, and exposes a Stream of results.

**Interview**
6. [ ] (Senior) How does GraphQL differ from REST in terms of over-fetching and under-fetching? When would you choose it for a mobile client?

---

### Day 24 — Local Storage: Hive, SQLite, SharedPreferences, Isar
**Theory**
1. [ ] Compare `SharedPreferences`, `Hive`, `Isar`, and `SQLite (sqflite)` on: query power, performance, type safety, and setup complexity.
2. [ ] What is a Hive box? How does Hive achieve speed without SQL?
3. [ ] When would Isar's indexed queries give you a meaningful advantage over Hive?
4. [ ] What data must *never* go into SharedPreferences (and why), and where should it go instead?

**Scenario**
5. [ ] You're building a note-taking app with offline-first sync. The user can create/edit/delete notes offline. Choose a local store, justify it, and describe how you'd mark records as pending-sync.

**Interview**
6. [ ] (Senior) Explain the Isar data model: collections, schemas, indexes. How does it handle schema migrations between app versions?

---

### Day 25 — Platform Channels & FFI
**Theory**
1. [ ] What is a platform channel, and what problem does it solve?
2. [ ] Explain the message codec: `StandardMessageCodec` vs `JSONMessageCodec`. What types can cross the channel natively?
3. [ ] What is `MethodChannel` vs `EventChannel` vs `BasicMessageChannel`? When do you use each?
4. [ ] What is Dart FFI? When would you use it instead of a platform channel?

**Scenario**
5. [ ] You need to call a native biometric authentication library. Walk through the Flutter side and the native side for both Android (Kotlin) and iOS (Swift) to expose a `authenticate() → Future<bool>` API.

**Interview**
6. [ ] (Staff) What is the thread model for platform channels? On which thread does the native handler run by default, and what happens if you do heavy work there?

---

### Day 26 — Push Notifications: FCM, APNs, Local Notifications
**Theory**
1. [ ] What is FCM? Explain the data flow: server → FCM → device for both foreground and background states.
2. [ ] What is APNs and how does FCM relay to it on iOS?
3. [ ] Distinguish notification message vs. data message in FCM. When does your code run in the background?
4. [ ] What is a notification channel (Android O+), and what happens if you don't set one?

**Scenario**
5. [ ] Your app must show a notification when the user receives a new chat message, even if the app is killed. Walk through the complete setup: permission request, FCM token registration, payload handling for all 3 app states (foreground/background/terminated).

**Interview**
6. [ ] (Senior) How do you handle FCM token refresh? What breaks if you only store the token at first launch?

---

### Day 27 — App Architecture: Clean / Feature-first
**Theory**
1. [ ] What are the layers in Clean Architecture? What dependency rule must always hold, and why?
2. [ ] Compare `feature-first` vs `layer-first` folder structures. When does each scale better?
3. [ ] What is a Repository? What is its interface's job, and why does it belong in the domain layer?
4. [ ] What is a UseCase / Interactor? When is it worth the boilerplate and when is it overkill?

**Scenario**
5. [ ] You have a `UserRepository` that fetches from REST and caches in Hive. Draw the dependency graph: which layer owns what, which direction imports flow, and what interface the data layer implements.

**Interview**
6. [ ] (Staff) How do you enforce architecture boundaries in a monorepo or large team? What tooling (lints, package structure) helps?

---

### Day 28 — Testing: Unit, Widget, Integration
**Theory**
1. [ ] Distinguish unit test, widget test, and integration test in Flutter. What does each verify?
2. [ ] What is `testWidgets`? What is `WidgetTester`, and why must you call `pump()` / `pumpAndSettle()`?
3. [ ] What is a `MockClient` and when do you use it versus a fake repository?
4. [ ] What is `flutter_test`'s `find` API — give 5 finder types and when each is appropriate.

**Scenario**
5. [ ] You want to test a BLoC-powered screen that calls an async repository method. Describe the full test: mock setup, pumping, state assertion, and finding widgets by text.

**Interview**
6. [ ] (Senior) Why is `pumpAndSettle` dangerous in tests that involve animations or streams? What is the safe alternative?

---

## PHASE D — Advanced Flutter: Internals, Theming, Accessibility (Days 29–40)

### Day 29 — Theme System: ColorScheme, TextTheme, Material 3
**Theory**
1. [ ] What is `ThemeData`? What is the difference between `ColorScheme` and individual color properties?
2. [ ] What does Material 3 change about theming compared to Material 2?
3. [ ] How do you implement a dark mode toggle that persists across restarts?
4. [ ] What is `Theme.of(context)` vs `Theme.of(context).colorScheme` — explain the lookup mechanism.

**Scenario**
5. [ ] A designer provides a brand color system with 10 semantic roles (primary, onPrimary, surface, error, etc.). Map this to a `ColorScheme` and show how widgets automatically pick up the right colors without per-widget overrides.

**Interview**
6. [ ] (Senior) Explain `ThemeExtension`. When would you add one, and how does it integrate with `copyWith` in `ThemeData`?

---

### Day 30 — Fonts, Assets, Localization
**Theory**
1. [ ] How do you register custom fonts in `pubspec.yaml`? What is a font weight fallback?
2. [ ] What is `flutter_localizations` and the `intl` package? What is `ARB` format?
3. [ ] What is plural/gender form handling in `intl`? Give an example message with plural variants.
4. [ ] How does Flutter pick the right locale? What fallback chain does it use?

**Scenario**
5. [ ] Your app supports Hindi and English. The designer provides variable fonts. Walk through font registration, locale detection, and testing with a device set to a locale your app doesn't directly support.

**Interview**
6. [ ] (Intermediate) What is a `Locale` vs a `LanguageTag`? Why does `Locale('zh')` behave differently from `Locale('zh', 'TW')`?

---

### Day 31 — Responsive & Adaptive Design
**Theory**
1. [ ] What is the difference between *responsive* (adjusts to size) and *adaptive* (different UI per platform) design?
2. [ ] What are Flutter's breakpoints? How do `LayoutBuilder` and `MediaQuery` help you respond to them?
3. [ ] What is `AdaptiveScaffold` from the `flutter_adaptive_scaffold` package?
4. [ ] How do you handle safe areas (`SafeArea`, `MediaQuery.padding`) for devices with notches and rounded corners?

**Scenario**
5. [ ] Your app must run on phone, tablet, and desktop. Describe the layout strategy for each form factor: what changes (navigation pattern, column count, text size), and what stays shared.

**Interview**
6. [ ] (Senior) What is `dart:ui`'s `FlutterView.physicalSize` vs `MediaQuery.size`? When can they disagree, and why does it matter for window-based layout?

---

### Day 32 — Slivers (Advanced)
**Theory**
1. [ ] What is the Sliver protocol? What does a `SliverConstraints` carry that a box constraint does not?
2. [ ] Explain `SliverAppBar`, `SliverList`, `SliverGrid`, `SliverPadding`, `SliverToBoxAdapter`. What is each for?
3. [ ] What is `SliverPersistentHeader`? What is the difference between pinned, floating, and snap?
4. [ ] What is a `CustomScrollView`? Why can't you put a `ListView` directly inside one?

**Scenario**
5. [ ] Build a feed screen with: (a) a collapsing header with the user avatar, (b) a pinned tab bar, (c) two tab bodies with independently scrollable lists. Map each part to its Sliver widget.

**Interview**
6. [ ] (Staff) Explain `SliverLayoutExtent`. When would you write a completely custom `RenderSliver`?

---

### Day 33 — Widget Testing: Timing, Finders, Golden Tests
**Theory**
1. [ ] What is a golden test? What does `matchesGoldenFile` verify, and what are its limitations on CI?
2. [ ] What is `fake_async` / `FakeAsync`? Why do you need it to test `Timer`-based logic?
3. [ ] What does `WidgetTester.runAsync` do, and when do you need it instead of plain `pump`?
4. [ ] How do you test a widget that uses a `StreamBuilder` connected to a real stream?

**Scenario**
5. [ ] You have a countdown timer widget that updates every second. Write a test plan (not the code) that verifies the correct display at t=0, t=3, t=10 without making the test take 10 real seconds.

**Interview**
6. [ ] (Senior) Why are golden tests brittle across platforms (Mac vs Linux CI)? What is the recommended mitigation strategy?

---

### Day 34 — Accessibility (a11y) *(NEW)*
**Theory**
1. [ ] What is the Flutter semantics tree? How does it relate to the widget tree?
2. [ ] What is `Semantics` widget? What properties (`label`, `hint`, `button`, `liveRegion`) do screen readers use?
3. [ ] What is `ExcludeSemantics` and `MergeSemantics`? When do you use each?
4. [ ] How do TalkBack (Android) and VoiceOver (iOS) discover Flutter content? What happens by default for custom-painted widgets?
5. [ ] What is the minimum tap-target size recommended by accessibility guidelines (WCAG 2.5.5)?

**Checklist scenario**
6. [ ] You have a custom card widget with: an icon (decorative), a product title, a price, and a "Buy" button. List every `Semantics` annotation needed so the screen reader gives a meaningful experience to a blind user.

**Interview**
7. [ ] (Senior) What is `SemanticsDebugger`? How would you use it in a QA pass before release to catch a11y issues without a real assistive device?

---

### Day 35 — Flavors, Environments, dart-define *(NEW)*
**Theory**
1. [ ] What is a Flutter flavor, and what problem does it solve over a single build?
2. [ ] How do you define flavors in Android (`productFlavors` in Gradle) and iOS (Xcode schemes/targets)?
3. [ ] What is `--dart-define` and `--dart-define-from-file`? How do you read a dart-define value at runtime?
4. [ ] What is the difference between compile-time constants (`dart-define`) and runtime environment variables? What can each access?
5. [ ] How do you manage different API base URLs, Firebase configs, and app icons per flavor?

**Scenario**
6. [ ] Your team needs three build flavors: `dev` (local API, debug icon), `staging` (staging API, orange icon), `prod` (production API, default icon). Walk through the complete setup on both platforms including separate `google-services.json` files.

**Interview**
7. [ ] (Staff) Why is embedding secrets in `--dart-define` not truly secure? What is the right approach for API keys that must not be in the client binary?

---

### Day 36 — App Lifecycle & Background Execution
**Theory**
1. [ ] Enumerate the Flutter `AppLifecycleState` values and what triggers each.
2. [ ] What is `WidgetsBindingObserver`? How do you use it to pause/resume app work?
3. [ ] What can you do in iOS background vs Android background? What are the platform limits?
4. [ ] What is `WorkManager` (Android) / `BackgroundTasks` (iOS), and how do you use them from Flutter?

**Scenario**
5. [ ] Your app syncs local data to the server. The user backgrounds the app before sync completes. Describe how you ensure the sync either finishes or is retried on next foreground, on both platforms.

**Interview**
6. [ ] (Senior) What happens to your `StreamSubscription`s and `AnimationController`s when the app goes to `paused`? What must you do?

---

### Day 37 — Dependency Injection: get_it + injectable
**Theory**
1. [ ] What problem does dependency injection solve in Flutter? Why is passing dependencies down the constructor tree painful?
2. [ ] What is `get_it`? What is a `ServiceLocator` pattern, and what are its downsides?
3. [ ] What does `injectable` add on top of `get_it`? How does code generation reduce boilerplate?
4. [ ] Compare `get_it` singleton vs `LazySingleton` vs `Factory`. When do you want each?

**Scenario**
5. [ ] In tests, you want to swap the real `ApiClient` for a mock. Describe how you do this with `get_it` without changing your feature code.

**Interview**
6. [ ] (Senior) What is the difference between service locator and constructor injection in terms of testability and coupling? When would a senior developer prefer one over the other?

---

### Day 38 — flutter_hooks and Signals (Modern State) *(REPLACES GetX day)*
**Theory**
1. [ ] What are `flutter_hooks`? What is a `Hook`, and how does it differ from a Flutter lifecycle method?
2. [ ] Name 5 built-in hooks (`useState`, `useEffect`, `useMemoized`, `useRef`, `useAnimationController`). What does each replace in a `StatefulWidget`?
3. [ ] What are Signals (from the `signals` package or similar)? How are they different from Streams and ChangeNotifier?
4. [ ] What is fine-grained reactivity? How does a Signal-based UI avoid full widget rebuilds?
5. [ ] What is the criticism of GetX, and why do many senior teams prefer Riverpod/BLoC/Signals over it?

**Scenario**
6. [ ] Rewrite a `StatefulWidget` that has an `AnimationController`, a `TextEditingController`, and a stream subscription — using `flutter_hooks`. Name each hook used and what lifecycle method it replaces.

**Interview**
7. [ ] (Staff) What is the "rules of hooks" concept (from React) and does it apply to `flutter_hooks`? What happens if you conditionally call a hook?

---

### Day 39 — Error Handling & Crashlytics
**Theory**
1. [ ] What is `FlutterError.onError`? What errors does it catch that `runZonedGuarded` does not, and vice versa?
2. [ ] What is `PlatformDispatcher.instance.onError`?
3. [ ] How do you set up Firebase Crashlytics to catch both Flutter and native crashes?
4. [ ] What is the difference between a fatal and non-fatal crash report? When do you use `recordError` vs `log`?

**Scenario**
5. [ ] Your app crashes in production but not in debug. DevTools shows it's an uncaught async error from a background isolate. Trace the error path and describe how you'd surface it to Crashlytics.

**Interview**
6. [ ] (Senior) How do you attach custom keys/logs to a crash report so that on-call engineers have enough context to debug without reproducing?

---

### Day 40 — CI/CD: GitHub Actions, Fastlane, Codemagic
**Theory**
1. [ ] What steps does a Flutter CI pipeline need? List them in order.
2. [ ] What is Fastlane? What do `gym`, `deliver`, and `supply` do?
3. [ ] What is code signing on iOS (certificates, provisioning profiles, entitlements)? Why does it break on CI?
4. [ ] How do you manage signing credentials securely in GitHub Actions (no plaintext secrets in repo)?

**Scenario**
5. [ ] Design a CI/CD pipeline that: runs tests on every PR, builds a staging APK on merge to `main`, and deploys to the Play Store internal track on a version tag.

**Interview**
6. [ ] (Staff) What is the difference between staged rollout (1% → 10% → 100%) and a feature flag? Can you use both together, and why would you?

---

## PHASE E — Performance, Optimization & Rendering (Days 41–43)

### Day 41 — Memory, Leaks, and Object Lifecycle
**Theory**
1. [ ] How does Dart's garbage collector work? What is the young generation, old generation, and why does GC spike cause jank?
2. [ ] What is a memory leak in Flutter? Give 3 common causes and how to detect each in DevTools.
3. [ ] What is `WeakReference` in Dart, and when would you use it?
4. [ ] Explain why images are a common source of excessive memory, and what `ResizeImage` / `cacheWidth` / `cacheHeight` do.

**Scenario**
5. [ ] DevTools Memory shows your app's heap growing 5MB every time the user opens and closes a heavy screen. Walk through your debugging process to identify the leak.

**Interview**
6. [ ] (Staff) What is the Flutter image cache (`PaintingBinding.instance.imageCache`)? What configuration levers do you have, and when should you tune them?

---

### Day 42 — Impeller, App Size, and Release Optimization *(NEW)*
**Theory**
1. [ ] What is Impeller? What problem does it solve over the old Skia-based renderer (shader compilation jank)?
2. [ ] How does Impeller pre-compile shaders? What is the developer-visible change in behavior?
3. [ ] Is Impeller available on Android and iOS today (Dart/Flutter 3.x)? What is the opt-in/opt-out mechanism?
4. [ ] What contributes to Flutter app size (Dart snapshot, engine, assets, plugins)?
5. [ ] What is `--split-debug-info`, `--obfuscate`, and deferred loading (`loadLibrary`)? How does each reduce release binary size?
6. [ ] What is tree-shaking in Flutter/Dart, and what can defeat it (e.g., `dart:mirrors`)?

**Scenario**
7. [ ] Your app's release AAB is 32MB. The PM wants it under 20MB. Walk through your investigation: what tools do you use (`flutter build --analyze-size`, size reports), and what categories of changes (assets, native libraries, code) give the biggest wins?

**Interview**
8. [ ] (Staff) What is app bundle (AAB) vs APK? How does Google Play use AABs to deliver device-specific splits, and why does this make the "install size" smaller than the AAB?

---

### Day 43 — Advanced Rendering: Compositing, Layers, Opacity
**Theory**
1. [ ] What is a compositing layer in Flutter? When does Flutter create a new one?
2. [ ] What does `Opacity` widget do at the layer level? Why is animating `Opacity` expensive, and what is the alternative?
3. [ ] What is `saveLayer` on the Canvas, and why does it trigger an offscreen render?
4. [ ] When does `RepaintBoundary` help, and when does it hurt (extra memory for the layer bitmap)?

**Scenario**
5. [ ] You have a list of 50 cards. Each card has a fade-in animation when it first appears. The timeline shows raster thread spikes. What rendering pattern is causing this, and how do you fix it?

**Interview**
6. [ ] (Staff) What is the "rasterization cache" and how does Flutter use it for static content? What is `Picture.toImage()` used for?

---

## PHASE F — Flutter Web & Cross-Platform (Days 44–50)

### Day 44 — Flutter Web: Architecture & Rendering Modes
**Theory**
1. [ ] What are Flutter Web's two rendering modes: CanvasKit and HTML renderer? When does each get used?
2. [ ] What is CanvasKit, and how does it bring Skia to the browser via WebAssembly?
3. [ ] What is Flutter Web's WASM compilation target (Flutter 3.22+)? How does it differ from the JS target?
4. [ ] What is the performance trade-off between HTML renderer (fast first load) and CanvasKit (pixel-perfect, heavier)?
5. [ ] What is a PWA? What files does Flutter Web generate (`manifest.json`, `service-worker.js`) to enable PWA installation?

**Interview**
6. [ ] (Staff) How do you choose between Flutter Web and a native web framework (React/Next.js) for a new project? What are the legitimate Flutter Web strengths and its honest weaknesses?

---

### Day 45 — Flutter Web: Platform APIs, Storage, SEO
**Theory**
1. [ ] What is the `dart:html` library? Why can't you import it in a cross-platform Flutter app targeting mobile too?
2. [ ] How do you write platform-conditional code (`kIsWeb`, conditional imports, `dart:io` vs `dart:html`)?
3. [ ] What is `web_storage_api` / `localStorage` on Flutter Web? How does it compare to `SharedPreferences` on mobile?
4. [ ] Flutter Web and SEO: why is Flutter Web inherently poor for SEO out of the box, and what workarounds exist (SSR proxy, prerendering, semantic HTML layer)?
5. [ ] What is the `url_launcher` behavior difference on Web vs mobile?

**Scenario**
6. [ ] You're building a Flutter app that must run on mobile AND web. You need to read/write files on mobile but use IndexedDB on web. Describe the platform-conditional architecture using conditional imports.

**Interview**
7. [ ] (Senior) What is the Flutter Web "accessibility tree"? How does Flutter Web expose semantics to screen readers, and what is different from mobile?

---

### Day 46 — Flutter Web: URL Routing, Navigation, Deployment
**Theory**
1. [ ] What is `usePathUrlStrategy()` and when must you call it?
2. [ ] How does `go_router` work on Flutter Web — what happens when the user pastes a deep URL into the browser address bar?
3. [ ] What is the 404 problem on Flutter Web with path-based routing, and how do you configure your hosting (Firebase Hosting, Vercel, Netlify) to handle it?
4. [ ] What is a Flutter Web "service worker" and how does it enable offline caching?
5. [ ] How do you deploy Flutter Web to Firebase Hosting? What is the `flutter build web --release` output?

**Scenario**
6. [ ] A user bookmarks `https://myapp.com/product/42` in your Flutter Web app. When they return and paste this URL, they get a 404. Describe the root cause and the fix at the hosting config level.

**Interview**
7. [ ] (Senior) How do you handle the browser back-button in a Flutter Web app with go_router? What is the difference between `router.pop()` and the browser's native back history?

---

### Day 47 — Flutter Desktop (macOS, Windows, Linux)
**Theory**
1. [ ] What platform APIs are available on Flutter Desktop that are not on mobile?
2. [ ] What is the Flutter Desktop window management API? What can you control (size, title bar, decorations)?
3. [ ] How do you handle keyboard shortcuts and menu bar on macOS Flutter apps?
4. [ ] What is the sandboxing concern for macOS App Store distribution of a Flutter app?

**Scenario**
5. [ ] Your Flutter mobile app needs to be shipped as a macOS desktop app. List 5 things that will break or need adaptation (layout, input, platform channels, file access, font rendering).

**Interview**
6. [ ] (Intermediate) When would you choose Flutter Desktop over Electron or a native app? What is the honest trade-off?

---

### Day 48 — Flutter Web: Performance Tuning *(NEW — deep web performance day)*
**Theory**
1. [ ] What is the Flutter Web initial load bottleneck? What is the size of the CanvasKit WASM file, and how do you reduce perceived load time?
2. [ ] What is `flutter_deferred_components` on Web? How does deferred loading (`loadLibrary`) work to split JS bundles?
3. [ ] What is the "white screen" problem on Flutter Web cold load, and what techniques mitigate it (loading indicator, skeleton, SSR shell)?
4. [ ] How do fonts affect Flutter Web performance? What is `FontLoader` and `cachedNetworkImage` behavior on Web vs mobile?
5. [ ] What is the `--web-renderer` flag? How do you choose per environment (dev HTML, prod CanvasKit)?
6. [ ] How do Web Vitals (LCP, CLS, FID/INP) apply to Flutter Web, and what can you realistically optimize?

**Scenario**
7. [ ] Your Flutter Web app's Lighthouse performance score is 38. The biggest issues are: 8MB initial JS, no above-fold content for 4 seconds, and CLS from font loading. Prioritize and describe fixes for each.

**Interview**
8. [ ] (Staff) What is Flutter Web's threading model? How does it compare to mobile (UI/raster/IO isolates) — does the web renderer use Web Workers, and what are the implications for jank?

---

### Day 49 — Packages: pub.dev, Monorepo, Plugin Architecture
**Theory**
1. [ ] What is the structure of a Flutter plugin package? What is the "federated plugin" pattern and why was it introduced?
2. [ ] What is the difference between a plugin (platform code) and a pure Dart package?
3. [ ] What is a monorepo in Flutter context? What tools help (`melos`, `flutter workspaces`)?
4. [ ] How does `pubspec.yaml` version resolution work (semantic versioning, `^`, `>=<`)?

**Scenario**
5. [ ] You're maintaining a plugin that wraps a native SDK. The SDK releases a breaking change. Walk through your upgrade path: versioning, migration guide, changelog, pub.dev publishing.

**Interview**
6. [ ] (Staff) What is a "path override" in `pubspec.yaml`, and when is it useful during plugin development? What must you clean up before publishing?

---

### Day 50 — Firebase Integration Deep Dive
**Theory**
1. [ ] What Firebase products are most commonly used in Flutter apps? For each, what problem does it solve?
2. [ ] What is Firebase App Check? What attacks does it prevent?
3. [ ] What is Firestore's security rules model? How do you write a rule that allows a user to read only their own documents?
4. [ ] What is Firebase Remote Config, and how does it enable A/B testing without an app release?

**Scenario**
5. [ ] Design a Firestore data model for a chat app with: users, 1-on-1 conversations, and messages. Write the security rules for: a user can read their own profile, can read conversations they're a member of, and can write messages only to conversations they belong to.

**Interview**
6. [ ] (Senior) What is Firestore's offline persistence? How does it handle conflicts when the device reconnects, and what are its limitations?

---

## PHASE G — Payments, Security & Fintech Integration (Days 51–58)

### Day 51 — Payment Fundamentals for Flutter Devs
**Theory**
1. [ ] What is a payment gateway vs a payment processor vs an acquirer? How does money flow from user → merchant?
2. [ ] What is Authorization vs Capture? When would you authorize without immediately capturing?
3. [ ] What is a refund vs a reversal? When is each appropriate?
4. [ ] What is a chargeback? What can a developer do to reduce chargeback risk?
5. [ ] What is PCI-DSS? What is "scope reduction" and how does tokenization help Flutter apps avoid handling raw card data?

**Interview**
6. [ ] (Senior) Why should a Flutter app **never** trust the payment result returned from its own API call — what is the correct confirmation mechanism, and what is a webhook?

---

### Day 52 — Card Payments: Razorpay, Stripe, 3D Secure
**Theory**
1. [ ] What is the Razorpay Flutter SDK flow end-to-end: order creation → checkout → webhook confirmation?
2. [ ] What is Stripe's PaymentIntent vs SetupIntent? When do you use each?
3. [ ] What is 3D Secure (3DS)? What is the liability shift it creates, and how does it appear in a Flutter UI?
4. [ ] What is tokenization in Stripe/Razorpay? What is a `PaymentMethod` token?
5. [ ] What is an idempotency key in payments, and why is it critical for retry logic?

**Scenario**
6. [ ] A user taps "Pay ₹999", the Razorpay sheet opens, the user completes payment, but your app crashes before you can call your backend to verify. On restart, how do you determine whether the payment succeeded or not?

**Interview**
7. [ ] (Staff) Walk through the complete Stripe card payment flow: client creates PaymentIntent server-side → Flutter confirms → 3DS challenge → webhook arrives. What does your Flutter app do at each step, and what is the server's role?

---

### Day 53 — UPI & India-Specific Payments
**Theory**
1. [ ] What is UPI? How does it differ from card payments at the protocol level (no card numbers, no CVV)?
2. [ ] What is a VPA (Virtual Payment Address)? What is a UPI deep link, and how does a Flutter app trigger the UPI intent?
3. [ ] What is Razorpay UPI intent flow vs collect flow? When do you use each?
4. [ ] What is NACH/e-NACH mandate? What use case does it solve (recurring payments)?
5. [ ] What are UPI payment limits (daily/per-transaction) and how should your UI handle them gracefully?

**Scenario**
6. [ ] You're building a subscription app. The user must set up an auto-debit mandate for ₹499/month. Walk through the mandate registration flow using Razorpay (or PhonePe) and what your backend must store to trigger future auto-debits.

**Interview**
7. [ ] (Senior) What is UPI Autopay (NACH via UPI)? How does it differ from a card-based subscription? What regulatory approval does it require?

---

### Day 54 — Wallets, Buy-Now-Pay-Later, Payouts
**Theory**
1. [ ] What is a prepaid payment instrument (PPI) wallet (Paytm, MobiKwik)? How does the balance storage and regulatory model differ from bank accounts?
2. [ ] What is a BNPL product at a technical level? What is the credit check, limit allocation, and repayment flow?
3. [ ] What is a payout API (Razorpay X, Cashfree Payouts)? When would a Flutter app trigger one (marketplace seller payouts, refunds to bank)?
4. [ ] What is Virtual Account? How does it enable automatic payment reconciliation?

**Scenario**
5. [ ] Your marketplace app needs to split a ₹1000 payment: ₹850 to the seller, ₹150 as platform fee. Walk through the split-payment / route API flow with a gateway that supports it (e.g., Razorpay Route).

**Interview**
6. [ ] (Staff) What is an escrow in a payment context? When does a marketplace legally need an escrow arrangement vs a simple split?

---

### Day 55 — Payment Integration: Architecture & Security *(NEW — complete implementation day)*
**Theory**
1. [ ] What is the correct layered architecture for payments in a Flutter app: what logic lives on the client, what must be on the server?
2. [ ] What is a payment ledger? Why do you maintain one even if the gateway has transaction history?
3. [ ] What is reconciliation in payments? Describe the daily batch job: what sources are compared, what mismatches look like, and what the resolution flow is.
4. [ ] How do you implement idempotent payment endpoints on your backend so a duplicate webhook doesn't credit the user twice?
5. [ ] What is certificate pinning for payment API calls, and how do you implement it in Flutter with Dio?

**Security checklist scenario**
6. [ ] You're building a Flutter fintech app. List all security measures for: (a) storing payment tokens, (b) the checkout screen, (c) API calls to your payment backend, (d) webhook handling on your server.

**Flutter-side implementation scenario**
7. [ ] Sketch the complete Flutter state machine for a payment flow: idle → loading (order creation) → checkout (SDK) → verifying → success/failure. What `State` or BLoC events correspond to each transition? What happens if the user presses back during `verifying`?

**Interview**
8. [ ] (Staff) Why is `double` wrong for storing money amounts, and what do you use instead? At what layer (Dart, Postgres, API serialization) must you enforce this?

---

### Day 56 — App Security: Keychain, Obfuscation, Root Detection
**Theory**
1. [ ] What is the Keychain (iOS) / Keystore (Android)? What should and should not be stored there?
2. [ ] What is certificate pinning? What is its failure mode (pin rotation), and how do you handle it gracefully?
3. [ ] What is code obfuscation (`--obfuscate` in Flutter)? Does it prevent reverse engineering, or just slow it down?
4. [ ] What is root/jailbreak detection? What signals do you check on each platform, and what is its cat-and-mouse nature?
5. [ ] What data must you never put in `SharedPreferences` (unencrypted) on a financial app?

**Scenario**
6. [ ] A security auditor flags that your app logs the JWT access token to the console in debug mode and that the token is stored in SharedPreferences. List every fix needed.

**Interview**
7. [ ] (Senior) What is SSL/TLS certificate pinning bypass, and why does a motivated attacker still use it? What is the defense-in-depth approach for a mobile fintech app?

---

### Day 57 — KYC, Authentication, Biometrics
**Theory**
1. [ ] What is KYC (Know Your Customer)? What documents/flows are typical in India (Aadhaar, PAN, V-KYC)?
2. [ ] What is `local_auth` Flutter package? What biometric types does it support, and what fallback must you handle?
3. [ ] What is biometric re-auth for sensitive actions? How does it differ from app login?
4. [ ] What is Strong Customer Authentication (SCA) — what two factors does it require?
5. [ ] What is device binding, and why do fintech apps use it?

**Scenario**
6. [ ] Your banking app shows account balance immediately on launch but requires biometric re-auth before showing the full transaction list or initiating a transfer. Implement this as a state machine: where is the auth state stored, when does it expire, and how is it re-requested?

**Interview**
7. [ ] (Staff) How does `local_auth` work under the hood on Android (BiometricPrompt API) vs iOS (LocalAuthentication framework)? What is the Flutter-native bridge doing?

---

### Day 58 — Analytics, A/B Testing, Feature Flags
**Theory**
1. [ ] What events should a Flutter fintech app track? Give 10 critical events with their properties.
2. [ ] What is Firebase Analytics vs Mixpanel vs Amplitude? What does each offer that the others don't?
3. [ ] What is an A/B test in a mobile app? How does Firebase Remote Config enable one?
4. [ ] What is a feature flag? How does it differ from a compile-time constant, and why is runtime toggling valuable for payments/fintech features?

**Scenario**
5. [ ] You want to test two checkout UX designs. 50% of users see Design A, 50% see Design B. You track conversion rate (payment completed / checkout opened). Describe the Firebase Remote Config + Analytics setup to run and measure this experiment.

**Interview**
6. [ ] (Senior) What is the difference between a "rollout" feature flag (gradually enable for % of users) and an A/B test flag (50/50 with a measured outcome)? When do you need each?

---

## PHASE H — System Design & Domain Scenarios (Days 59–78)

### Day 59 — System Design Framework for Flutter Engineers
**The framework (memorize and use for every design question)**

**Step 1 — Clarify (2 min)**
- Scope: what screens/flows are in scope?
- Scale: DAU, concurrent users, writes/reads per second
- Platforms: mobile only, web, desktop?
- Offline: fully offline, read-only, or always-connected?
- Compliance: PCI-DSS, HIPAA, RBI, DPDP?

**Step 2 — Data model + API (5 min)**
- Core entities and their relationships
- Key REST endpoints (or GraphQL queries/mutations)
- Pagination strategy (cursor vs offset)

**Step 3 — Component sketch (5 min)**
- Client layers (UI → ViewModel → Repository → Network/Cache)
- Backend services involved
- Data stores (DB, cache, queue)
- Event/webhook flows

**Step 4 — Walk one request end-to-end (5 min)**
- Happy path (full request flow)
- Failure path (network down, timeout, payment failure)
- Offline path (if applicable)

**Step 5 — Correctness (3 min)**
- Idempotency: where and how?
- Consistency model: strong (money), eventual (feeds)
- Ledger: is there money/points movement?
- Reconciliation: who runs it, how often?

**Step 6 — Non-functionals (3 min)**
- Security & compliance
- Monitoring & alerting
- Scaling bottlenecks
- Cost

**Step 7 — End on trade-offs (2 min)**
- Always close with a trade-off statement

**Practice questions**
1. [ ] Design a UPI payment screen for a wallet app. Walk all 7 steps.
2. [ ] Design a ride-hailing driver location tracking system. Focus on: real-time location updates, battery efficiency, and map rendering in Flutter.
3. [ ] Design an offline-first to-do app with sync. What is your conflict resolution strategy?

---

### Day 60 — Fintech System Design: Banking & Wallet
**Deep-dive questions**
1. [ ] Design a mobile banking home screen: balance, recent transactions, quick actions. What data is fetched eagerly vs lazily? What is cached and for how long?
2. [ ] Design the money transfer flow (NEFT/IMPS/UPI). What is your state machine from "amount entered" to "receipt shown"? Where does idempotency live?
3. [ ] Design the transaction history view for 3 years of data (potentially 10,000+ records). How do you paginate, search, filter, and handle offline?
4. [ ] How do you handle a failed payment where money was debited but the payee didn't receive it? Walk the user-facing flow and the backend reconciliation.
5. [ ] What is a statement PDF generation flow? Where does it run (client, server), and how do you handle large PDFs on low-memory devices?

**Scenario (pick one, answer aloud)**
6. [ ] "Design the architecture of a neobank app's Flutter client — focus on: auth, balance display, money transfer, statement download, and biometric lock."

---

### Day 61 — Fintech Scenario Bank I: 20 Must-Know Scenarios
> **Instructions:** For each scenario, answer: (1) what is the technical problem, (2) how you handle it in the Flutter client, (3) what the server must do, (4) what the user sees.

**Payment & Money Movement**
1. [ ] **Double-tap scenario:** User taps "Pay" twice quickly. Two payment requests fire. How do you prevent a double charge — at the UI level AND the API level?
2. [ ] **App crash mid-payment:** User is on the Razorpay sheet. App crashes (OOM). On restart, how do you determine if the payment succeeded?
3. [ ] **Network timeout during payment:** The payment API call times out after 30s. The payment may or may not have gone through. What do you show the user, and how do you verify status?
4. [ ] **Webhook delay:** Your server confirms payment via webhook, but it arrives 5 minutes late. Your Flutter app is showing a "pending" spinner. What is the polling strategy and when do you give up?
5. [ ] **Partial refund:** User paid ₹1000, wants ₹300 back. Walk the refund API call, ledger entries, and user confirmation flow.
6. [ ] **UPI app not installed:** User selects UPI, no UPI app is installed. How do you detect this before attempting the deep link? What fallback do you offer?
7. [ ] **Currency rounding:** You display ₹99.999 due to floating-point. How do you prevent this at every layer (storage, API, display)?
8. [ ] **Payment during poor connectivity:** User initiates a ₹5000 payment on 2G. The gateway call takes 45s. What is your timeout strategy, and do you let the user cancel?

**Auth & Security**
9. [ ] **Session expiry mid-transaction:** JWT expires while user is filling a transfer form. How do you silently refresh and resume, or handle gracefully if refresh fails?
10. [ ] **Biometric failure:** User's biometric fails 3 times. What fallback do you provide, and how do you prevent brute-force on the fallback (PIN)?
11. [ ] **Device compromise detected:** Your root/jailbreak check fires on launch. What is your response — block entirely, restrict features, or warn?
12. [ ] **Man-in-the-middle attempt:** Certificate pinning check fails. What do you show the user? Do you let them proceed?

**UI & State**
13. [ ] **Back button during payment:** User presses Android back while the payment SDK is open. What happens to the payment, and how do you prevent accidental cancellation?
14. [ ] **Slow KYC screen:** Video KYC takes 8 minutes. App is backgrounded by the user mid-session. How do you preserve state and resume?
15. [ ] **Multiple accounts:** User has 3 bank accounts linked. They switch accounts while a transfer is in draft. How do you handle the draft and the fee recalculation?
16. [ ] **Dark pattern prevention:** How do you ensure your app does NOT hide fees or use pre-checked boxes for subscriptions (RBI guidelines)?

**Data & Compliance**
17. [ ] **Audit log requirement:** RBI requires every financial action to be logged immutably. What do you log, where, and how do you prevent the log from being modified?
18. [ ] **Data residency:** RBI mandates payment data stays in India. How does this affect your choice of server, CDN, crash reporting SDK, and analytics?
19. [ ] **DPDP Act consent:** User must explicitly consent to data processing before onboarding. How do you build the consent capture flow so it is legally defensible?
20. [ ] **Fraud detection alert:** Your fraud system flags a transaction in real-time. What does your Flutter app show the user, and what is the step-up auth flow?

---

### Day 62 — Fintech Scenario Bank II: 10 Advanced Scenarios
1. [ ] **Loan disbursement flow:** Design the UI/UX for a personal loan offer → acceptance → KYC → disbursement to bank account. What APIs are called in sequence, and what are the failure recovery points?
2. [ ] **Investment portfolio display:** User has stocks, MFs, and FDs. Real-time prices for stocks, daily NAV for MFs, fixed returns for FDs. Design the data model and refresh strategy.
3. [ ] **FD premature withdrawal penalty:** User wants to break a Fixed Deposit early. Show the penalty calculation before confirmation. Where does this calculation run, and how do you prevent the user from seeing a stale penalty amount?
4. [ ] **SIP (Systematic Investment Plan):** User sets up a monthly ₹5000 SIP. Design the mandate registration, the monthly debit trigger, the failure retry, and the notification flow.
5. [ ] **GST invoice for B2B payment:** A business user makes a payment and needs a GST invoice. What fields are mandatory, and how do you generate and deliver the PDF?
6. [ ] **Multi-currency wallet:** User holds INR, USD, EUR. They send USD from India. What compliance checks apply (LRS limit ₹7L/year), and how do you show real-time FX rates?
7. [ ] **Credit score soft inquiry:** User taps "Check credit score." This must be a soft inquiry (not affecting score). How do you integrate with a bureau (CIBIL/Experian), what data do you send, and what do you store?
8. [ ] **Suspicious login alert:** User logs in from a new device/location. What step-up auth do you require, and what notification does the previously used device receive?
9. [ ] **Bank downtime:** NPCI/IMPS is down. User tries to send money. How do you detect this, communicate clearly, and queue the transaction for retry?
10. [ ] **Regulatory reporting (SRO/RBI):** Your app must generate a daily report of all transactions above ₹50,000. Design the data pipeline: what is extracted, when, how it's formatted, and who receives it.

---

### Day 63 — F&B (Food & Beverage) Domain Scenarios
**System Design**
1. [ ] Design the menu screen for a quick-commerce food app. Menu has 500+ items. How do you structure the data (categories, subcategories, modifiers), handle search, and cache for offline browsing?
2. [ ] Design the cart: items from multiple vendors in one order, each with different prep times. How do you model the cart, calculate ETA, and handle an item going out-of-stock after it's been added?
3. [ ] Design real-time order tracking: rider location updates every 5s. What is the pub/sub architecture, and how does the Flutter app show a live map without draining the battery?
4. [ ] Design the restaurant POS integration: an order placed in the app must reach the kitchen printer within 2 seconds. What is the push mechanism, and what is the fallback if the print fails?

**Scenario questions**
5. [ ] **Item sold out after checkout:** User completes payment, but the item is sold out in the 3 seconds between checkout and confirmation. What do you show, who handles the refund, and how fast?
6. [ ] **Modifier conflict:** User adds a pizza with "extra cheese" but the restaurant has disabled that modifier due to a shortage. The user's order is accepted but the modifier can't be fulfilled. What happens?
7. [ ] **Delivery address outside zone:** User's saved address is 200m outside the dark store's delivery radius. How does your app detect this before or during checkout?
8. [ ] **Surge pricing disclosure:** Delivery fee doubles during rain. RBI/consumer protection guidelines require clear disclosure before checkout. How do you build this UI compliantly?
9. [ ] **Subscription meal plan:** User subscribes to "lunch every weekday" for ₹3000/month. Design the subscription data model, the daily order auto-generation, the notification, and cancellation/pause flows.
10. [ ] **Group order:** 5 friends order together, one pays. Design the group order session: invitation, individual item selection, bill split, and single payment.

---

### Day 64 — MedTech Domain Scenarios
**System Design**
1. [ ] Design a doctor consultation app: user selects specialty → see available doctors → book slot → video call → prescription. What are the data entities, what are the real-time components, and what is the compliance scope?
2. [ ] Design a health record (PHR) viewer: FHIR-based records from multiple hospitals. How do you model FHIR resources in Dart, cache them locally, and handle the heterogeneous formats across providers?
3. [ ] Design a medication reminder system: user sets up multiple daily alarms. On Android, how do you ensure reminders fire even when the app is killed? What permissions are required (exact alarms, battery optimization)?
4. [ ] Design a wearable sync: user's smartwatch sends heart rate every 5 minutes. Flutter app must aggregate, display charts, and flag anomalies. What is the BLE integration architecture?

**Scenario questions**
5. [ ] **Prescription validity:** A doctor issues a digital prescription valid for 30 days. How do you model the validity, prevent re-dispensing after expiry, and display remaining days to the user?
6. [ ] **Emergency contact alert:** User's heart rate exceeds 150 bpm. The app must silently alert an emergency contact AND call an ambulance service API. How do you implement this in the background reliably?
7. [ ] **Data sensitivity:** A user's HIV status is in the health records. What encryption, access control, and audit logging do you apply beyond what you'd do for regular user data?
8. [ ] **Telemedicine connectivity:** Doctor-patient video call drops at 2 minutes. How do you handle reconnection, session resumption, and billing (charge only for connected time)?
9. [ ] **Drug interaction check:** User scans a new prescription. Before saving, your app checks against their existing medications for dangerous interactions. What API do you call, and what is the UI for a critical interaction warning?
10. [ ] **HIPAA / DPDP compliance for health data:** List 5 technical controls you'd apply specifically because the data is health-related (beyond standard financial compliance).

---

### Day 65 — E-commerce Domain Scenarios
**System Design**
1. [ ] Design a product listing page (PLP) for 1M+ SKUs. How do you handle search, filtering (price, brand, rating), sorting, and infinite scroll in Flutter?
2. [ ] Design the checkout flow: cart → address → delivery slot → payment → confirmation. What is the state machine, where does inventory reservation happen, and what is the failure recovery?
3. [ ] Design a wishlist + price-drop alert: user saves items, gets notified when price drops. What is the backend event (price update → alert trigger), and how does the Flutter app receive and display it?
4. [ ] Design the returns flow: user raises a return → pickup scheduled → item inspected → refund. What are the states, who can transition each, and how does the user track status?

**Scenario questions**
5. [ ] **Flash sale: 10,000 units, 500,000 requests in 60 seconds.** How does your Flutter app handle the queue/waiting-room UI? What does the backend do to prevent overselling?
6. [ ] **Cart abandonment recovery:** User adds items, leaves app, returns 2 hours later. How do you restore the cart (local storage vs server-side cart), and how do you handle a price change in the interim?
7. [ ] **Dynamic pricing:** Same product costs ₹500 for one user and ₹480 for another (personalized pricing). How do you fetch and cache the price without leaking personalized prices between users?
8. [ ] **COD (Cash on Delivery) flow:** No payment at checkout. How does your app model the order state, and what changes in the backend flow (no payment confirmation, delivery confirmation triggers invoicing)?
9. [ ] **Review & rating moderation:** User submits a 1-star review with a photo. How do you handle: content moderation, photo upload (size, format), spam prevention, and the author's ability to edit?
10. [ ] **Subscription box:** User subscribes to a monthly curated box. Design the selection flow (choose preferences), the curation engine trigger, and the surprise-reveal UX when the box ships.

---

### Day 66 — EdTech Domain Scenarios *(BONUS)*
**System Design**
1. [ ] Design a video course player: user watches a 2-hour lecture. How do you track watch progress (server-side, not just local), resume from where they left off, and handle seek + buffering on 2G?
2. [ ] Design a live class with 500 students: instructor video, student video (unmute on request), live quiz, Q&A. What is the WebRTC/RTMP architecture, and how does the Flutter client join as a viewer vs participant?
3. [ ] Design an offline course download: user downloads 5 lessons (each 300MB). Track download progress, resume interrupted downloads, and DRM-protect the content.

**Scenario questions**
4. [ ] **Certificate generation:** User completes a course and earns a certificate. How do you generate a tamper-proof PDF certificate, store it, and let the user share it as a LinkedIn credential?
5. [ ] **Adaptive learning:** App detects the user is struggling with a topic (fails 3 quizzes). How do you trigger an automatic review recommendation without making the UX feel punishing?
6. [ ] **Plagiarism detection for code assignments:** User submits code. Your system compares it against other submissions and known solutions. What does the Flutter submission flow look like, and how do results come back async?
7. [ ] **Doubt resolution queue:** Student posts a doubt. A teacher picks it up within 15 minutes SLA. How do you build the queue, assign doubts, and show SLA countdown to the student?
8. [ ] **Gamification & streaks:** User must study daily to maintain a streak. What data do you store, how do you handle timezone edge cases (user travels), and what notification do you send at 9 PM if streak is at risk?

---

### Day 67 — Ride-Hailing & Logistics Domain Scenarios *(BONUS)*
**System Design**
1. [ ] Design the driver matching system: user requests a ride, 10 nearby drivers are candidates. How does the Flutter app show "finding driver" state, and how does the backend select and notify a driver?
2. [ ] Design real-time location sharing: driver location updates every 3 seconds to the passenger's map. What is the WebSocket/Server-Sent Events architecture, and how do you handle reconnections?
3. [ ] Design dynamic surge pricing: demand spikes at 8 PM. How does the Flutter app show surge (1.8x), get user confirmation, and prevent the price from changing after the user taps "Confirm"?

**Scenario questions**
4. [ ] **Driver goes offline mid-trip:** Driver's phone dies. How does the system detect this, re-match the passenger, and handle billing for the partial trip?
5. [ ] **Wrong destination entered:** User enters wrong destination, driver is en-route. How does destination change work in terms of fare recalculation and driver consent?
6. [ ] **Payment dispute:** Passenger claims trip was 5 km but was charged for 12 km. How do you use the GPS trace (stored server-side) to adjudicate?
7. [ ] **Accessibility: wheelchair user:** User needs a wheelchair-accessible vehicle. How do you model this preference, filter the driver pool, and communicate it to the driver?

---

### Day 68 — Social & Content Platform Domain Scenarios *(BONUS)*
**System Design**
1. [ ] Design a social feed: user follows 500 people. How do you build the feed (push vs pull model), handle pagination, and cache it for instant load?
2. [ ] Design image/video upload: user posts a 4K video. What is the chunked upload flow, transcoding pipeline, and CDN delivery strategy?
3. [ ] Design end-to-end encrypted chat: messages must not be readable server-side. What key exchange protocol do you use, and how does the Flutter app store keys securely?

**Scenario questions**
4. [ ] **Content moderation at scale:** 10,000 posts/minute. How do you route posts through automated moderation, human review queue, and user appeal flow?
5. [ ] **Viral content: 1M views in 10 minutes.** Your Flutter app hits the API for comments. How do you prevent the comments endpoint from melting (caching, rate limiting, eventual consistency for count display)?
6. [ ] **User blocks another:** Block must be bidirectional and immediate. How do you propagate it to active sessions (WebSocket notification to remove blocked user's messages from feed)?

---

### Day 69 — Cross-Domain: Offline-First Design
**Theory**
1. [ ] What is the Offline-First principle? How does it differ from "works offline as a bonus"?
2. [ ] What is the Outbox pattern? How does it guarantee that writes made offline are eventually delivered to the server?
3. [ ] Conflict resolution strategies: last-write-wins, server-wins, field-level merge, CRDTs. When is each appropriate?
4. [ ] What can you NOT do offline — give 5 categories of operations that must block on connectivity.

**Scenario**
5. [ ] Design an offline-first survey app for field agents who work in areas with no connectivity. They collect 50-question surveys, sometimes offline for 3 days. Walk through: local storage choice, sync strategy, conflict handling, and what happens when two agents edit the same record offline.

**Interview**
6. [ ] (Staff) What is a CRDT (Conflict-free Replicated Data Type)? Give a Flutter app example where you'd genuinely need one (hint: collaborative editing, shared counters).

---

### Day 70 — Cross-Domain: Real-Time & WebSockets
**Theory**
1. [ ] What is a WebSocket? What does it give you over HTTP polling?
2. [ ] Compare WebSockets, Server-Sent Events (SSE), and long-polling. When does each make sense for a Flutter mobile app?
3. [ ] What is the reconnection strategy for WebSockets (exponential backoff, max retries)?
4. [ ] What is a pub/sub system (e.g., Firebase Realtime DB, Supabase Realtime, Ably, Pusher)?

**Scenario**
5. [ ] Your Flutter app has a live bidding screen. 200 users are viewing the same item. Every bid update must reach all viewers in <500ms. Design the architecture: what sends the bid event, what is the pub/sub infrastructure, how does the Flutter WebSocket client handle rapid updates without jank?

**Interview**
6. [ ] (Staff) What happens to your WebSocket connection when the app is backgrounded on iOS? What is the maximum background time, and what is the reconnection strategy when the app foregrounds?

---

### Day 71 — Cross-Domain: Caching Strategy
**Theory**
1. [ ] What is a cache hit vs miss? What is cache invalidation, and why is it called one of the hardest problems?
2. [ ] Compare caching strategies: cache-aside, read-through, write-through, write-behind. When does each apply?
3. [ ] What is a TTL (Time-To-Live)? How do you choose TTL for: user profile, product catalog, real-time stock price, and session token?
4. [ ] What is stale-while-revalidate, and how does it improve perceived performance on a Flutter app?

**Scenario**
5. [ ] Your app's home screen makes 6 API calls. On a slow network (400ms/request), the screen takes 2.4 seconds to load. Design a caching strategy that makes it load in <200ms on a repeat visit while keeping data fresh.

**Interview**
6. [ ] (Senior) What is a cache stampede (thundering herd)? How do you prevent it on a backend serving a Flutter app with 100k DAU?

---

### Day 72 — State Management at Scale: Architecture Review
**Theory**
1. [ ] What is the "single source of truth" principle? How does it apply to a Flutter app with a local DB, a server API, and in-memory state?
2. [ ] What is optimistic UI? When should you use it, and when should you not (what types of operations are unsafe to optimistically update)?
3. [ ] What is a "loading/error/data" (LED) state pattern? How do you model it with Riverpod's `AsyncValue` or BLoC states?
4. [ ] How do you handle cascading state: deleting a user triggers deleting all their posts, which triggers deleting all comments. How does your Flutter state reflect this atomically?

**Scenario**
5. [ ] A user edits their profile photo. Simultaneously, a background sync pulls the server's copy (which has an older photo). Walk through: optimistic update, background sync conflict, and final reconciliation — what the user sees at each step.

**Interview**
6. [ ] (Staff) What is "derived state"? Why should you compute it rather than store it, and what performance trap do you fall into if you compute it in `build()` without memoization?

---

### Day 73 — Monitoring, Alerting, and Observability
**Theory**
1. [ ] What is the difference between logging, metrics, and tracing? Give a Flutter app example of each.
2. [ ] What is a crash rate, and what is an acceptable threshold for a production app?
3. [ ] What are Apdex scores and how do they measure user satisfaction?
4. [ ] What is distributed tracing? How does a trace ID flow from the Flutter app → API → DB?

**Scenario**
5. [ ] After a release, crash rate goes from 0.1% to 2%. You need to identify: what version introduced it, what devices/OS versions are affected, and what the stack trace points to. Walk through your investigation using Crashlytics/Sentry.

**Interview**
6. [ ] (Staff) What is "alerting on symptoms, not causes"? Give a Flutter backend example where alerting on error rate (symptom) is better than alerting on CPU usage (cause).

---

### Day 74 — Interview Simulation: Full System Design
**Mock interviews — answer each as a 20-minute spoken response**

1. [ ] "Design Swiggy's order tracking feature — from order placed to delivery — with real-time rider location on a map."
2. [ ] "Design the payment flow for a UPI-based P2P transfer app (like GPay). Focus on correctness, idempotency, and failure handling."
3. [ ] "Design an offline-first Flutter app for hospital nurses to track patient vitals in areas with spotty WiFi."
4. [ ] "Design the Flutter client architecture for a neobank app — auth, home screen, transfers, and statements."
5. [ ] "Design a flash sale feature that sells 1000 limited-edition sneakers to 100,000 concurrent users."

**Debrief questions (for each)**
- What did you cover in the first 2 minutes?
- Did you end on a trade-off?
- Did you mention idempotency and consistency model?
- Did you address the mobile-specific constraints (offline, battery, background limits)?

---

### Day 75 — Interview Simulation: Flutter Deep Technical
**Mock panel questions — answer each in 3–5 minutes with examples**

1. [ ] "Walk me through what happens when Flutter calls `setState()`."
2. [ ] "You have 60fps jank on a list of 200 cards with images. How do you diagnose and fix it?"
3. [ ] "Explain the difference between a ValueKey, UniqueKey, and GlobalKey, and give a real use case where the wrong one breaks the app."
4. [ ] "How would you implement a debounced search input that calls an API and cancels in-flight requests?"
5. [ ] "Your Flutter web app loads slowly. Walk me through your performance investigation."
6. [ ] "Explain how go_router handles deep links vs Navigator 1.0."
7. [ ] "How do you test a BLoC that depends on a repository that calls an external API?"

---

### Day 76 — Behavioral & Leadership Questions
**Questions (answer with STAR format: Situation → Task → Action → Result)**

1. [ ] "Tell me about a time you had to make a technical decision with incomplete information. What did you do?"
2. [ ] "Describe a production incident you were involved in. What was your role, and what did you learn?"
3. [ ] "Tell me about a disagreement you had with a teammate about a technical approach. How did you resolve it?"
4. [ ] "Describe a time you proactively improved something — code quality, process, or team knowledge — that wasn't in your job spec."
5. [ ] "Tell me about the most complex feature you've shipped. What made it complex, and how did you manage the complexity?"

**For Senior/Staff level (add these)**
6. [ ] "How do you make architectural decisions that will still make sense in 2 years when the team has doubled?"
7. [ ] "Tell me about a time you had to push back on a PM's request. How did you communicate the technical risk?"
8. [ ] "How do you onboard a new developer to a large Flutter codebase? What's your approach?"

---

### Day 77 — Resume, Portfolio & What to Say
**Your narrative checklist**
1. [ ] Write a 2-sentence "Flutter engineer" positioning statement. Does it say what you build, for whom, and at what scale?
2. [ ] For each major project: can you articulate the problem, your technical decision, the trade-off you chose, and the result?
3. [ ] What is your "signature" Flutter strength? (Performance? Architecture? Payments? Cross-platform?) Can you prove it with an example?

**Talking about Flutterify in interviews**
4. [ ] How do you describe the AI-powered study companion concisely? Practice a 30-second version.
5. [ ] What technical decisions did you make in Flutterify (Supabase over Firebase, Gemini over GPT, global answer caching)? Can you defend each?
6. [ ] What would you do differently if you rebuilt Flutterify with a team of 5 and 10x the users?

**Common "trick" questions**
7. [ ] "What Flutter package do you NOT recommend and why?" (Tests whether you critically evaluate dependencies.)
8. [ ] "What is the biggest performance mistake Flutter developers make?" (Tests depth of knowledge.)
9. [ ] "What is missing from Flutter today that you wish existed?" (Tests ecosystem awareness.)

---

### Day 78 — Final Review: Cheat Sheet & Gap Check
**The master cheat sheet — verify you can answer each from memory**

**Dart**
- `const` vs `final` vs `late` — one-line distinction
- Null safety: flow analysis, `!`, `?`, promotion
- Dart 3: sealed class, record, pattern — one example each
- Async: event loop, microtask queue, isolate boundary

**Flutter Core**
- Three trees — what lives where
- Keys: which key for which scenario (see Day 13 table)
- Constraints rule: "constraints down, sizes up, parent positions"
- setState → Element → rebuild — the full chain
- Jank: UI thread vs raster thread — how to tell apart

**State Management**
- Riverpod: `watch` vs `read` vs `listen` — when each is safe
- BLoC: event → state → UI — unidirectional
- Hooks: 5 hooks and what lifecycle method each replaces

**Navigation**
- go_router: declarative tree, redirect, path params, query params
- Deep link: Android intent-filter, iOS universal link
- PopScope: replaces WillPopScope

**Flutter Web**
- CanvasKit vs HTML renderer trade-off
- PWA: service worker, manifest
- URL strategy: `usePathUrlStrategy()`
- SEO weakness and workaround

**Payments**
- Idempotency key — what it prevents
- Tokenization — what card data never touches your server
- 3DS — liability shift
- Webhook — the only source of truth for payment status
- Double-entry ledger — money in integers (paise)
- UPI — VPA, intent flow, no card data

**System Design**
- Framework: 7 steps (Clarify → Data model → Components → End-to-end → Correctness → Non-functionals → Trade-offs)
- Money = strong consistency + idempotency + ledger
- Feeds = eventual consistency is fine
- Offline: outbox + client-generated ID + conflict resolution
- Always end on trade-offs

**Domain quick hits**
- Fintech: double-charge → idempotency key at API; crash mid-pay → check status on restart; webhook delay → poll + timeout
- F&B: sold out after checkout → refund SLA; real-time location → WebSocket + map update throttling
- MedTech: health data = HIPAA/DPDP + encryption at rest + audit log; FHIR for health records
- E-commerce: flash sale → inventory reservation + queue; cart abandonment → server-side cart
- Ride-hailing: driver offline → re-match + partial billing; surge → confirm before locking price

**Gap check**
1. [ ] Can you explain Impeller to a non-Flutter engineer in 2 sentences?
2. [ ] Can you walk a payment flow end-to-end without notes?
3. [ ] Can you name 3 accessibility fixes for a custom widget?
4. [ ] Can you describe the go_router setup for a login-gated app in 1 minute?
5. [ ] Can you design the data model for a fintech ledger entry from memory?

---

*End of Track 2 — Dart + Flutter Deep Dive (78 Days)*
*Total: 78 days | Phases A–H | Questions: ~400+ | Scenarios: 80+ | Domains: Fintech, F&B, MedTech, E-commerce, EdTech, Ride-hailing, Social*
