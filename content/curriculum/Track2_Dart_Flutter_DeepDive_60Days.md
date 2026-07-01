# TRACK 2 — Dart + Flutter Deep Dive (60 Days)

> **Rules:** Questions, scenarios, and assignments only. No answers, no solutions. `💡 Hint:` lines are optional nudges. The goal is for you to *reason your way* to understanding Flutter so well it feels like you built it.
>
> **Daily ritual (1–2 hrs):** (1) Study the day's topic from docs/source. (2) Answer the interview questions *aloud, as in a real panel*. (3) Do the debugging/scenario task. (4) For internals days, sketch the relevant tree or pipeline from memory.
>
> **Progression:** Beginner → Intermediate → Advanced → Senior → Staff.

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
5. Code reads `widget.user!.name` and crashes only in production. What sequence of events produces that, and what's the safe rewrite pattern?

**Interview**
6. (Senior) Explain how null safety interacts with generics — what is `T extends Object` vs `T extends Object?`?

---

### Day 4 — Collections: List, Set, Map (Internals-aware)
**Theory**
1. What backs a Dart `List` — and what is the cost of insertion at the front vs. the end?
2. How does a `Map` find a key? What does a key's `hashCode`/`==` contract require, and what breaks if you violate it?
3. When is a `Set` the right structure, and what does element identity depend on?
4. What is the difference between a growable list and a fixed-length list?

**Scenario**
5. You use a custom class as a Map key but lookups always miss. What did you forget to override, and why does that matter?

**Interview**
6. (Intermediate) Spread operator, collection-if, collection-for: rewrite an imperative list-building loop using all three.

---

### Day 5 — Classes, Constructors, Encapsulation
**Theory**
1. Explain default, named, factory, and `const` constructors. When must you reach for a factory?
2. What does an initializer list do that the constructor body cannot?
3. How does Dart enforce encapsulation without `private` keywords? What is library-level privacy?
4. What are getters and setters, and when do they beat plain fields?

**Scenario**
5. You want a class that sometimes returns a cached instance instead of a new one. Which constructor enables that, and why?

**Interview**
6. (Senior) Why are `const` constructors important for Flutter widget performance specifically?

---

### Day 6 — Inheritance, Abstract, Interfaces
**Theory**
1. Distinguish `extends`, `implements`, and `with`. What does each pull in?
2. Every Dart class defines an implicit interface — what does that let you do without an `interface` keyword?
3. When is an abstract class the right tool versus an interface-only contract?
4. What is `super`, and in what order do constructors run up the chain?

**Scenario**
5. You `implements SomeClass` and only get errors about unimplemented members. Why didn't you inherit its behavior?

**Interview**
6. (Intermediate) Composition over inheritance — give a Flutter example where composition is clearly the better design.

---

### Day 7 — Mixins & Polymorphism
**Theory**
1. What problem do mixins solve that single inheritance cannot?
2. What does `on` restrict in a mixin declaration, and why would you use it?
3. Explain mixin linearization: if two mixins define the same method, which wins?
4. What is polymorphism, and how do dynamic dispatch and `@override` enable it?

**Scenario**
5. You apply `with TickerProviderStateMixin` — what does it require of the class it's mixed into, and why?

**Interview**
6. (Senior) Walk through method resolution order for `class C extends A with M1, M2`.

---

### Day 8 — Generics
**Theory**
1. Why do generics exist? What would `List<dynamic>` cost you that `List<int>` saves?
2. Explain bounded type parameters (`<T extends Comparable>`). When are they necessary?
3. What is covariance/contravariance in Dart's type system, and where does it bite (e.g., `List<Cat>` as `List<Animal>`)?
4. Are Dart generics reified or erased? Why does the answer matter at runtime (`is T` checks)?

**Scenario**
5. You write a generic `Repository<T>` but need to construct a `T` inside it. Why is that hard, and what patterns work around it?

**Interview**
6. (Senior) Design a type-safe generic `Result<S, E>` for success/error. What constraints would you place?

---

### Day 9 — Extensions, Enums, Records, Patterns, Sealed Classes
**Theory**
1. What can an extension add to a type, and what can it *not* (e.g., state, override)?
2. Enhanced enums: what new powers do Dart enums have over plain constants?
3. What are records, and how do they differ from a class or a tuple? When do they shine?
4. Pattern matching and destructuring — rewrite a chain of `if`/type-checks as a `switch` with patterns.
5. What are sealed classes and exhaustiveness checking? Why are they ideal for modeling UI state?

**Interview**
6. (Senior) How do sealed classes + pattern matching replace a manually-maintained "type" field on a state object?

---

### Day 10 — Phase A Consolidation
**Output prediction**
1.
```dart
class A { String who() => 'A'; }
mixin M on A { String who() => 'M->${super.who()}'; }
class B extends A with M {}
void main() => print(B().who());
```
2.
```dart
const a = [1, 2, 3];
const b = [1, 2, 3];
print(identical(a, b));
```
**Debugging**
3. A class used as a Set member allows duplicates that look identical. Diagnose the contract violation.

**Interview gauntlet (rapid fire)**
4. `final` vs `const`; `==` vs `identical`; `factory` vs generative; mixin vs interface; record vs class — one crisp sentence each.
5. (Staff) Critique this statement: "Dart is just Java with null safety." Where is it wrong?

---

## PHASE B — Async, Concurrency & Dart Internals (Days 11–18)

### Day 11 — Futures
**Theory**
1. What is a `Future`, and what are its three states?
2. Difference between `then`, `await`, and `whenComplete`. When does each run?
3. What does `Future.value` vs `Future.delayed(Duration.zero)` schedule differently?
4. How do you run futures in parallel and collect all results? What about "first to finish"?

**Output prediction**
5.
```dart
void main() {
  print('A');
  Future(() => print('B'));
  Future.microtask(() => print('C'));
  print('D');
}
```
**Interview**
6. (Intermediate) Error handling: how do you catch an error from an awaited future vs. a `.then` chain?

---

### Day 12 — The Event Loop, Microtask & Event Queues
**Theory**
1. Draw the event loop: where do the microtask queue and the event queue sit, and which drains first?
2. What kinds of work land in the microtask queue vs. the event queue?
3. Why can a flood of microtasks starve the event queue (and the UI)?
4. Dart is single-threaded per isolate — how does it achieve concurrency without threads?

**Output prediction**
5.
```dart
void main() {
  Future(() => print(1));
  Future.microtask(() => print(2));
  Future(() => print(3)).then((_) => print(4));
  Future.microtask(() => print(5));
  print(6);
}
```
**Interview**
6. (Senior) Explain exactly why `await` does not block the thread. What does it actually do to the function?

💡 Hint: An `async` function is rewritten into a state machine that yields at each `await`.

---

### Day 13 — Streams (Deep)
**Theory**
1. Single-subscription vs. broadcast streams — when must you use each?
2. What is backpressure, and how do `pause`/`resume`/`listen` relate to it?
3. Difference between `async*` (generators) and a `StreamController`.
4. What does `await for` do, and how does it differ from `listen`?
5. Hot vs. cold streams — map this onto Dart's stream types.

**Scenario**
6. A broadcast stream listener leaks memory after a screen closes. What did you forget, and where should it live in a widget's lifecycle?

**Interview**
7. (Senior) Explain how `StreamTransformer` works and give a real use (e.g., debounce).

---

### Day 14 — async/await Internals & Error Propagation
**Theory**
1. How is an `async` function compiled? Where are its "suspension points"?
2. What is `Zone`, and how does `runZonedGuarded` catch errors that `try/catch` misses?
3. Why can an unawaited future swallow an exception silently? How do you detect that?
4. What is the difference between synchronous and asynchronous exceptions in terms of where they can be caught?

**Debugging**
5. An error thrown inside a `Future` callback crashes the app despite a surrounding `try/catch`. Explain why and where the catch must actually go.

**Interview**
6. (Staff) Design an error-handling strategy for an app where any uncaught async error must be logged to crash reporting but never crash the UI.

---

### Day 15 — Isolates & compute()
**Theory**
1. Why can't isolates share memory? What does message passing cost?
2. When is `compute()` the right tool, and what are its limitations?
3. What is a `SendPort`/`ReceivePort`, and how do you set up two-way communication?
4. What kinds of work belong on an isolate vs. just an async gap?

**Scenario**
5. JSON parsing of a 10MB response janks the UI. Walk through moving it to an isolate — what data can and can't cross the boundary?

**Interview**
6. (Senior) Why doesn't moving an `await`ed network call to an isolate help, but moving the *parsing* does?

---

### Day 16 — Memory Management & Garbage Collection
**Theory**
1. Describe Dart's generational GC: young (scavenger) vs. old space. Why two generations?
2. What makes an object eligible for collection? What keeps it alive unintentionally?
3. What is a memory leak in a GC'd language, given there are no manual frees?
4. How do closures capture variables, and how can that extend an object's lifetime?

**Scenario**
5. A `StreamSubscription` / `AnimationController` / `Timer` not disposed — explain the leak chain for each.

**Interview**
6. (Staff) Explain how you'd find and prove a memory leak using DevTools' memory view: what signal confirms a leak vs. normal churn?

---

### Day 17 — JIT, AOT, Dart VM, Tree Shaking
**Theory**
1. What is JIT compilation and why is it used in debug/development (hot reload)?
2. What is AOT compilation and why is it used for release builds?
3. What does the Dart VM provide, and how does this differ between debug and release?
4. What is tree shaking, what enables it, and what defeats it (e.g., reflection, dynamic dispatch on `dynamic`)?

**Scenario**
5. Hot reload works for a UI tweak but *not* after you change a top-level `const` or a class hierarchy. Why?

**Interview**
6. (Senior) Explain the full debug→release pipeline difference for a Flutter app in terms of compilation strategy.

---

### Day 18 — Testing Fundamentals (Unit + Mocking)
**Theory**
1. What makes a "good" unit test — what should it isolate?
2. What is a mock vs. a stub vs. a fake vs. a spy?
3. How do you test asynchronous code (futures, streams) deterministically?
4. Why is dependency injection a prerequisite for testability?

**Scenario**
5. A class instantiates its own HTTP client internally. Why is it untestable, and how do you refactor for injection?

**Interview**
6. (Senior) How do you test time-dependent code (debounce, retry backoff) without real delays?

---

## PHASE C — Flutter Architecture & Internals (Days 19–30)

### Day 19 — What Flutter Is & Why It Exists
**Theory**
1. What does Flutter render *with*, and why doesn't it use native platform widgets (OEM views)?
2. Name the three architectural layers: Framework, Engine, Embedder. What lives in each?
3. What language is the Engine written in, and what does it expose to the Framework?
4. Why is "everything is a widget" both true and a simplification?

**Interview**
5. (Senior) Compare Flutter's rendering approach to React Native's bridge model. What are the trade-offs?
6. (Staff) Make the architectural case for, and against, choosing Flutter for a banking app with strict platform-fidelity requirements.

---

### Day 20 — App Startup: main() → runApp()
**Theory**
1. What happens between the OS launching the process and your `main()` running?
2. What does `WidgetsFlutterBinding.ensureInitialized()` actually initialize, and when must you call it?
3. What does `runApp()` do internally — what bindings and trees does it set up?
4. Trace the first frame: from `runApp` to pixels on screen, name the major steps.

**Scenario**
5. You call a plugin in `main()` before `ensureInitialized()` and it crashes. Explain precisely why.

**Interview**
6. (Senior) Walk an interviewer end-to-end through "what happens after main()" — aim for 2 minutes, no notes.

---

### Day 21 — The Three Trees: Widget, Element, RenderObject
**Theory**
1. Why do three trees exist instead of one? What distinct job does each tree do?
2. A Widget is immutable and "cheap." What does that imply about how often it's recreated?
3. What is an Element, and why is it the "long-lived" tree?
4. What does a RenderObject own that a Widget and Element do not?

**Diagram task**
5. Sketch all three trees for `Center(child: Text('Hi'))`. Label which nodes are configuration, which hold state/lifecycle, which do layout/paint.

**Interview**
6. (Senior) "Widgets are blueprints, Elements are the building, RenderObjects are the construction crew." Critique and refine that analogy.

---

### Day 22 — Element Lifecycle & Reconciliation
**Theory**
1. When the Widget tree rebuilds, how does Flutter decide whether to *update* an existing Element or *recreate* it?
2. What roles do `runtimeType` and `key` play in `Widget.canUpdate`?
3. What is the difference between `mount`, `update`, `deactivate`, `unmount` for an Element?
4. Why does moving a stateful widget in a list lose its state without a key?

**Scenario**
5. Two list items swap their state unexpectedly on reorder. Diagnose using keys and reconciliation.

**Interview**
6. (Staff) Explain exactly when a `GlobalKey` is justified and the cost of overusing it.

---

### Day 23 — Keys (Deep)
**Theory**
1. `ValueKey`, `ObjectKey`, `UniqueKey`, `GlobalKey` — purpose and cost of each.
2. Why do keys matter only at the *same level* of the tree, among siblings?
3. What does a `GlobalKey` let you do that local keys can't, and why is it expensive?

**Output prediction / scenario**
4. A list of stateful counters reorders and counters appear to "stick" to the wrong items. With no keys vs. `ValueKey(id)` — predict behavior for each.

**Interview**
5. (Senior) When does adding a key *fix* a bug vs. *cause* one?

---

### Day 24 — StatelessWidget vs StatefulWidget & State Lifecycle
**Theory**
1. Why is `State` a separate object from the `StatefulWidget`? What survives a rebuild and what doesn't?
2. Full `State` lifecycle: `createState`, `initState`, `didChangeDependencies`, `build`, `didUpdateWidget`, `deactivate`, `dispose`. What goes in each?
3. Why must you not call `setState` in `build`, `dispose`, or a constructor?
4. What is `mounted`, and when must you check it?

**Debugging**
5. `setState() called after dispose()` in an async callback. Explain the race and the correct guard.

**Interview**
6. (Senior) Why does `didChangeDependencies` exist when `initState` already runs once?

---

### Day 25 — The Build Pipeline: Build → Layout → Paint → Composite → Rasterize
**Theory**
1. Define each phase and what it produces as output for the next.
2. What is `BuildOwner`, and what does it track (dirty elements)?
3. What is `PipelineOwner`, and what does it coordinate (dirty render objects)?
4. What is the Layer tree, and how does compositing differ from painting?
5. Where does the GPU enter — what is rasterization?

**Diagram task**
6. Draw the pipeline as a sequence, marking which phases run on the UI thread vs. the raster thread.

**Interview**
7. (Staff) A single `setState` triggers which phases, for which subtree, and why not the whole app?

---

### Day 26 — Constraints, Layout & RenderBox
**Theory**
1. Flutter's layout rule: "Constraints go down, sizes go up, parent sets position." Explain each clause.
2. What is a `BoxConstraints` (min/max width/height)? What's a "tight" vs. "loose" constraint?
3. Why can a widget say "I want to be 500px" and still end up 100px? Who wins?
4. What does `RenderBox.performLayout` do, and why is it called at most once per frame per object?

**Debugging**
5. "Unbounded height" / "RenderFlex overflowed" — what constraint violation causes each? Walk the constraint flow.
6. A `Column` inside a `Column` throws; an `Expanded` outside a `Flex` throws. Explain both via constraints.

**Interview**
7. (Senior) Why does putting a `ListView` inside a `Column` without bounds fail, and what are the correct fixes?

---

### Day 27 — RenderObject & Custom Layout
**Theory**
1. What's the difference between `RenderObjectWidget`, `RenderObject`, and the `Element` that links them?
2. What does `LeafRenderObjectWidget` vs `SingleChildRenderObjectWidget` vs `MultiChildRenderObjectWidget` imply?
3. When would you write a custom `RenderObject` instead of composing existing widgets?
4. What is `parentData`, and how does a parent store layout info on its children?

**Assignment (design only)**
5. Describe how you'd implement a custom layout that places children on a circle. Which methods do you override?

**Interview**
6. (Staff) Explain `MultiChildRenderObjectWidget` layout protocol for something like a custom `Flex`.

---

### Day 28 — Frame Scheduling: SchedulerBinding & vsync
**Theory**
1. What is `SchedulerBinding`, and what does it schedule?
2. What is vsync, and why do animations need a `TickerProvider`?
3. What is the difference between `scheduleFrame`, a frame callback, and a post-frame callback?
4. What is the 16ms budget (at 60Hz), and what must finish within it?

**Scenario**
5. You need to measure a widget's size *after* layout, then act on it. Which callback, and why not in `build`?

**Interview**
6. (Senior) Walk through what happens each frame from vsync signal to pixels, naming the bindings involved.

---

### Day 29 — InheritedWidget & Context Internals
**Theory**
1. How does `InheritedWidget` propagate data down the tree without passing it through every constructor?
2. What does `dependOnInheritedWidgetOfExactType` register, and what triggers a dependent's rebuild?
3. What *is* `BuildContext` really — how does it relate to the Element tree?
4. Why is `of(context)` an O(1)-ish lookup and not a tree walk every time?

**Debugging**
5. "Could not find an ancestor X of context" — what does this tell you about *where* you called `of(context)`?

**Interview**
6. (Staff) Explain how `InheritedWidget` underpins Provider, Theme, MediaQuery, and Navigator.

---

### Day 30 — Phase C Consolidation
**Whiteboard challenges (verbal answers)**
1. From `runApp` to a rendered frame — full narration including all three trees and all pipeline phases.
2. A `setState` on a deep leaf — trace exactly what gets marked dirty and rebuilt, and what does not.
3. Explain why Flutter UIs are fast despite recreating widget objects constantly.

**Debugging**
4. App rebuilds the entire screen on every keystroke in a text field. Trace likely causes through the trees and propose where the rebuild boundary should be.

**Interview (Staff)**
5. Design a mental model you'd teach a new team member to reason about *any* Flutter rendering bug. What are the five questions they should always ask?

---

## PHASE D — State Management (Days 31–38)

### Day 31 — setState & Lifting State Up
**Theory**
1. What exactly does `setState` do beyond "rerun build"? What does it mark dirty?
2. What are the limits of `setState` — at what app size/shape does it stop scaling?
3. What is "lifting state up," and what problem (prop drilling) does it create?

**Scenario**
4. Three sibling widgets need shared state. Walk through the `setState`-only approach and identify its pain points.

**Interview**
5. (Intermediate) When is `setState` genuinely the *right* answer and reaching for a library is over-engineering?

---

### Day 32 — InheritedWidget / InheritedModel by Hand
**Theory**
1. Build a counter shared via a hand-written `InheritedWidget`. What's the boilerplate, and what does it buy you?
2. What does `InheritedModel` add over `InheritedWidget` (aspect-based rebuilds)?
3. Why do most state libraries ultimately sit on top of `InheritedWidget`?

**Interview**
4. (Senior) Explain rebuild granularity: why does a naive `InheritedWidget` rebuild *all* dependents, and how do you avoid over-rebuilding?

---

### Day 33 — Provider
**Theory**
1. `Provider`, `ChangeNotifierProvider`, `MultiProvider`, `ProxyProvider`, `Consumer`, `Selector` — purpose of each.
2. What does `context.watch` vs `context.read` vs `context.select` do, and which triggers rebuilds?
3. How does `ChangeNotifier.notifyListeners` propagate, and what does `Selector` optimize?

**Debugging**
4. A `Consumer` rebuilds too often. Walk through `Selector`/`select` as the fix and what to select on.
5. "Tried to listen to a value exposed with provider, from outside of the widget tree" — diagnose.

**Interview**
6. (Senior) Trade-offs of Provider for a 200-screen app — where does it strain?

---

### Day 34 — Riverpod
**Theory**
1. How does Riverpod remove Provider's dependence on `BuildContext` and the tree?
2. Provider types: `Provider`, `StateProvider`, `FutureProvider`, `StreamProvider`, `NotifierProvider`, `AsyncNotifierProvider` — when each?
3. What is `ref`, and how do `ref.watch`, `ref.read`, `ref.listen` differ?
4. What is provider auto-disposal, and what is `family`?

**Scenario**
5. Two providers depend on each other and you need to invalidate one when the other changes. Design it.

**Interview**
6. (Staff) Compare Riverpod's compile-time safety story with Provider's runtime errors. What classes of bug disappear?

---

### Day 35 — BLoC & Cubit
**Theory**
1. What problem does BLoC's events-in / states-out model solve? Why streams?
2. Cubit vs. BLoC — what do you give up and gain by dropping events?
3. What is `BlocBuilder` vs `BlocListener` vs `BlocConsumer`? When is each correct?
4. What is `buildWhen` / `listenWhen`, and how do they control rebuilds?

**Scenario**
5. Model a login flow (idle → loading → success/failure) as a BLoC. Define events and states. Use a sealed class for state and justify why.

**Interview**
6. (Senior) How do you test a BLoC in isolation? What does `bloc_test`'s expect-states pattern verify?

---

### Day 36 — GetX & Redux
**Theory**
1. GetX bundles state, routing, and DI. What are the criticisms of that coupling?
2. How does `Obx`/`GetBuilder` achieve reactivity, and what's the hidden cost?
3. Redux: store, actions, reducers, middleware — map each to a responsibility.
4. Why did Redux's strict unidirectional flow appeal to large teams, and why is it heavy for small apps?

**Interview**
5. (Senior) Given a 5-person team shipping fast vs. a 50-person team needing strict conventions — argue which of {Provider, Riverpod, BLoC, GetX, Redux} fits each and why.

---

### Day 37 — Choosing & Migrating State Management
**Scenario-based**
1. You inherit an app using `setState` everywhere with deeply nested prop drilling. Plan an incremental migration to Riverpod without a big-bang rewrite.
2. A screen mixes BLoC for server state and `setState` for ephemeral UI state (e.g., a toggle). Is mixing acceptable? Defend a rule for what state lives where.
3. Define "ephemeral state" vs. "app state" vs. "server cache state." Which tool handles each best?

**Interview**
4. (Staff) Design a state-management *convention* document for a 40-engineer org. What rules prevent chaos?

---

### Day 38 — Phase D Consolidation
**Comparison gauntlet**
1. For each of {setState, InheritedWidget, Provider, Riverpod, BLoC, Cubit, GetX, Redux}: one-line "use when," one-line "avoid when."
2. Rebuild granularity: rank these by how surgically they can rebuild a single widget. Justify the ranking.
3. Testability: rank the same list by ease of unit-testing business logic.

**Scenario**
4. A list screen rebuilds every row when one row's data changes. For your chosen library, show *where* the rebuild boundary should sit.

**Interview (Staff)**
5. "Which state management is best?" Reframe this question the way a senior engineer should answer it in an interview.

---

## PHASE E — Performance, Rendering Deep & Animations (Days 39–46)

### Day 39 — Frame Budget, FPS, Jank
**Theory**
1. Derive the per-frame budgets at 60, 90, and 120 FPS. What thread must finish within each?
2. What is jank, precisely? Distinguish UI-thread jank from raster-thread jank.
3. What are the common *causes* of jank (build, layout, paint, shader compilation, large images)?
4. What is shader compilation jank, and what mitigates it?

**Interview**
5. (Senior) A scroll stutters only on first run, then is smooth. What's your top hypothesis and why?

---

### Day 40 — Diagnosing with DevTools
**Theory / hands-on prompts**
1. What does the Performance/Timeline view show, and how do you read a flame chart for a janky frame?
2. What does "raster" vs "UI" track tell you about *which* thread is the bottleneck?
3. How does the Memory view distinguish a leak from normal allocation churn?
4. What does the CPU profiler reveal that the timeline doesn't?
5. What does the Network view help you find (oversized payloads, waterfalls)?

**Scenario**
6. Frames take 30ms, all on the UI thread, spiking in `build`. Walk your DevTools investigation step by step.

**Interview**
7. (Staff) Describe a repeatable performance-triage checklist you'd standardize across a team.

---

### Day 41 — Reducing Rebuilds & const Discipline
**Theory**
1. How does `const` on a widget prevent rebuilds, and why is it free at runtime?
2. What does `RepaintBoundary` do, and when does it *help* vs. *hurt*?
3. Why does extracting a subtree into its own widget reduce rebuild scope better than a helper method?
4. What is the cost of rebuilding vs. relayout vs. repaint — rank them.

**Debugging**
5. A whole page rebuilds when a single animated value changes. Identify three techniques to scope the rebuild.

**Interview**
6. (Senior) Why is "use `const` constructors" repeated advice, and what concretely does the framework skip because of it?

---

### Day 42 — Lists, Slivers & Lazy Rendering
**Theory**
1. `ListView` vs `ListView.builder` — what's the difference in element creation?
2. What is a Sliver, and how does `CustomScrollView` compose slivers?
3. How do `SliverList`, `SliverGrid`, `SliverAppBar`, `SliverPersistentHeader` work together?
4. What is viewport-based lazy building, and why does it matter for a 10,000-item feed?

**Scenario**
5. A long chat list rebuilds and janks on new messages. Walk through `builder`, item extent, keys, and caching strategies.

**Interview**
6. (Staff) Design the scroll architecture for an Instagram-like feed with mixed media and sticky headers using slivers.

---

### Day 43 — CustomPainter & Layer Tree
**Theory**
1. When is `CustomPainter` the right tool over composing widgets?
2. What does `shouldRepaint` control, and what's the cost of getting it wrong?
3. What is the Layer tree, and how do `RepaintBoundary`s create new layers?
4. How does caching a painted layer reduce raster work?

**Assignment (design only)**
5. Describe painting a live waveform/spark-line that updates 30×/second without janking. What do you cache, what do you repaint?

**Interview**
6. (Senior) Explain how compositing layers lets Flutter avoid repainting static content during animation.

---

### Day 44 — Animations: Implicit, Explicit, Hero, Physics
**Theory**
1. Implicit (`AnimatedFoo`) vs. explicit (`AnimationController`) — when each?
2. Lifecycle of an `AnimationController` — why must it be disposed, and what provides its vsync?
3. What is a `Tween`, a `Curve`, and an `AnimatedBuilder`'s role in scoping rebuilds?
4. How do `Hero` animations coordinate across route transitions?
5. What is a physics-based (spring) animation, and when does it feel better than a curve?

**Debugging**
6. An animation stutters and a "ticker was active when disposed" error appears. Diagnose lifecycle handling.

**Interview**
7. (Staff) Design a complex coordinated animation (shared element + staggered list) and identify the controllers and builders involved.

---

### Day 45 — Memory, CPU & GPU Bottlenecks
**Theory**
1. Image memory: why can a few large images blow your memory budget, and what does `cacheWidth`/resizing fix?
2. What CPU work commonly leaks onto the UI thread (JSON parse, crypto, heavy compute)? Where should it go?
3. What GPU/raster-thread work causes jank (overdraw, expensive shaders, large layers)?
4. How do you measure and reduce overdraw?

**Scenario**
5. Memory climbs steadily on a gallery screen and is never reclaimed. Trace the likely leak (image cache, controllers, listeners).

**Interview**
6. (Staff) Build a performance budget for an app: targets for frame time, memory ceiling, startup time, jank rate. How do you enforce them in CI?

---

### Day 46 — Phase E Consolidation
**Triage scenarios**
1. Cold-start is slow. List every contributor from process launch to first interactive frame, and how to measure each.
2. Scroll janks only on low-end Android. What changes in your hypotheses vs. a flagship device?
3. App uses 400MB RAM on a photo feed. Build the reduction plan.

**Interview (Staff)**
4. You're asked to cut p95 frame time by 40% on a legacy screen. Describe your method, instrumentation, and how you'd prove the win.

---

## PHASE F — Networking, Storage, Architecture, Testing, Security (Days 47–52)

### Day 47 — Networking: HTTP, Dio, Interceptors, Retry, Pagination, WebSockets, SSE
**Theory**
1. `http` package vs `Dio` — what does Dio add (interceptors, cancel tokens, transformers)?
2. How do interceptors enable cross-cutting concerns (auth headers, logging, refresh)?
3. REST CRUD in depth: what do **GET, POST, PUT, PATCH, DELETE** each mean, and how do you map them to create/read/update/delete? Which are **idempotent** and which are **safe**, and why does that matter for retries on a flaky mobile network? PUT vs PATCH — full replace vs partial update. Which status codes should the client handle (200/201/204/400/401/403/404/409/422/429/5xx) and how should the UI react to each?
4. Consuming a REST API on mobile end-to-end: sending a JSON body + headers, `fromJson`/`toJson` model (de)serialization, handling null/optional fields, timeouts, cancellation, and mapping HTTP errors to friendly UI states (loading / empty / error / retry).
5. Design a retry strategy with exponential backoff and jitter — what must you *not* retry (non-idempotent writes without an idempotency key)?
6. Multipart upload and streamed download — what differs from a normal request?
7. WebSockets vs. SSE vs. long-polling vs. MQTT — when each, and what are reconnection concerns?
8. **Real-time data — the key things to consider (checklist):** connection lifecycle (connect/disconnect on app foreground/background), **auto-reconnect with exponential backoff + jitter**, **heartbeats/ping-pong** to detect dead sockets, **auth on the socket** (passing/refreshing the token, re-auth on reconnect), **message ordering** and **dedup** (sequence numbers / message IDs), **backpressure** when messages arrive faster than the UI can handle (buffer/throttle/debounce/coalesce), **offline buffering** and replay on reconnect (resume from last-seen cursor), **battery & bandwidth** (throttle/aggregate updates, close sockets when backgrounded), and **UI performance** (don't rebuild the whole list per message). Walk through each.
9. Offset vs. cursor pagination at the network layer — failure modes of each.

**Debugging**
10. A token-refresh interceptor causes infinite refresh loops. Diagnose and design the guard.
11. A live screen using a WebSocket leaks memory / keeps a zombie connection after you navigate away. Diagnose the subscription/lifecycle bug and the fix.

**Interview**
12. (Staff) Design a resilient API client layer: timeouts, retries, refresh, cancellation, error mapping. Draw the responsibilities.
13. (Staff) Design a resilient real-time layer for a live feed (chat / live scores / order tracking): transport choice, reconnection + resume, ordering/dedup, backpressure, offline, and battery — end to end.

---

### Day 48 — Local Storage: SharedPreferences, Hive, Isar, SQLite, Drift
**Theory**
1. Match each store to its right use: key-value, object box, relational. Where does each break down?
2. SharedPreferences limits — why is it wrong for large or structured data?
3. Hive vs. Isar — indexing, queries, performance, migration story.
4. SQLite (raw) vs. Drift (typed, reactive) — what does Drift's codegen buy you?
5. How do you do schema migrations safely without losing user data?

**Scenario**
6. You must store 50,000 records with fast filtered queries and reactive UI updates. Choose and justify a store; outline the schema.

**Interview**
7. (Senior) Reactive local DB → UI: how do you stream query results so the UI updates on write?

---

### Day 49 — Offline-First: Sync, Cache Invalidation, Conflict Resolution
> Ties directly to your real offline-PWA / IndexedDB experience — translate those patterns to Flutter.
**Theory**
1. Design an offline-first write path: optimistic update, local queue, background sync, server reconciliation.
2. Cache invalidation strategies: TTL, ETag/If-None-Match, manual bust, stale-while-revalidate — when each?
3. Conflict resolution: last-write-wins vs. version vectors vs. server-authoritative merge. Trade-offs?
4. How do you represent "pending / synced / failed" per record in the UI?

**Scenario**
5. Two devices edit the same record offline, then both sync. Design the conflict outcome and the user experience.

**Interview**
6. (Staff) Design the full sync engine for a field-data-collection app used with no connectivity for hours. Cover idempotency, ordering, retries, and partial failures.

---

### Day 50 — Architecture Patterns: MVC, MVP, MVVM, Clean, Modular, Enterprise
**Theory**
1. MVC vs. MVP vs. MVVM — what moves where, and which fits Flutter's reactive model best?
2. Clean Architecture layers (entities, use cases, interface adapters, frameworks) — map each to Flutter folders.
3. What is the dependency rule, and why must inner layers not know about outer ones?
4. Feature-first vs. layer-first folder structure — trade-offs at scale.
5. What is a use-case/interactor, and when is it over-engineering?

**Scenario**
6. A repository, a data source, and a use case all seem to do "fetch the user." Define each one's single responsibility crisply.

**Interview**
7. (Staff) Design the module boundaries and DI for a 30-feature super-app. How do features stay independent and testable?

---

### Day 51 — Dependency Injection & Modularization
**Theory**
1. Compare DI approaches: constructor injection, `get_it` service locator, Riverpod providers, `injectable` codegen.
2. Service locator vs. true DI — what testability difference?
3. How do you scope dependencies (singleton vs. per-feature vs. per-request)?
4. How do you split an app into packages/modules, and what enforces boundaries (no cyclic deps)?
5. Mono repo and melos

**Interview**
5. (Senior) Why is "the widget creates its own dependencies" an anti-pattern, and what does injection unlock for tests?

---

### Day 52 — Testing Pyramid & Security
**Testing theory**
1. Unit vs. widget vs. integration vs. golden tests — what does each catch that the others miss?
2. How do you write a widget test that pumps frames, finds widgets, and verifies state?
3. What is golden (screenshot) testing good and bad at?
4. How do you mock network/DB in tests and keep them fast and deterministic?

**Security theory**
5. Secure storage (Keychain/Keystore) vs. SharedPreferences — what must never go in the latter?
6. Token handling: access vs. refresh, where to store, rotation, and logout invalidation.
7. SSL/certificate pinning — how it works, what attack (MITM / man-in-the-middle) it stops, and its operational risk (rotation).
8. Code obfuscation and `--obfuscate` — what it protects and its limits.
9. API security from the client side: what can the client *not* be trusted to enforce?

**Cryptography (explain simply, with the "why")**
10. **Symmetric vs. asymmetric encryption** — what's the difference in plain terms? What is **AES** (symmetric) and **RSA** (asymmetric), when is each used, and why is AES used for bulk data while RSA is used to exchange keys / sign? What are key sizes and why do they matter?
11. **Encryption vs. hashing vs. encoding** — how are they different and when do you use each? What is a hash (e.g. SHA-256), what makes it one-way, and why do you salt+hash passwords instead of encrypting them?
12. **Encryption at rest vs. in transit** on mobile: what does TLS/HTTPS actually do (handshake, symmetric session key via asymmetric exchange), and how do you encrypt local data at rest (AES via Keychain/Keystore-backed keys)? Walk the full path of a secured request.
13. **Digital signatures & integrity**: how do you verify a downloaded payload or an OTA code patch wasn't tampered with (hashing + asymmetric signature)? Why sign, not just encrypt?
14. **Anti–reverse-engineering & app hardening**: what can an attacker do by decompiling your APK/IPA, and what's your layered defense — code obfuscation, no secrets in the binary, string/asset encryption, certificate pinning, **root/jailbreak detection**, anti-tampering/integrity checks (Play Integrity / DeviceCheck), disabling debuggers, and moving trust to the server? What are the limits (the client can never be fully trusted)?

**Interview**
15. (Staff) Threat-model a fintech app's client: list the top 5 client-side risks and your mitigations.
16. (Staff) Walk end-to-end encryption for a chat/payment flow: key generation, key exchange (asymmetric), message encryption (symmetric), forward secrecy, and where keys live on-device — in simple terms.

---

## PHASE G — Native Android & iOS for Flutter (Days 53–57)

### Day 53 — Android Essentials
**Theory**
1. Activity lifecycle (`onCreate`→`onDestroy`) — how does Flutter sit inside a single `FlutterActivity`?
2. What is the `Application` class, and when does Flutter engine init happen?
3. Intents, broadcast receivers, services, foreground services, `WorkManager` — what is each for, and which back Flutter plugins?
4. Deep links vs. App Links — verification, and how Flutter routes them.

**Scenario**
5. A push notification must do background work even if the app is killed. Which Android primitive, and how does it reach Flutter code?

**Interview**
6. (Senior) Explain the Android side of background execution limits and how they affect a Flutter sync feature.

---

### Day 54 — Android Build System
**Theory**
1. APK vs. AAB — what does AAB enable (dynamic delivery, smaller installs)?
2. What does Gradle do, and what are build types vs. flavors?
3. What lives in the `AndroidManifest`, and what permissions/intent-filters matter for Flutter?
4. What is R8/ProGuard, and how can shrinking break reflection-based plugins?

**Scenario**
5. A release build crashes where debug doesn't, with a "missing class" at runtime. Trace to shrinking/keep-rules.

**Interview**
6. (Senior) Walk the full Android release build pipeline for a Flutter app.

---

### Day 55 — iOS Essentials & Build
**Theory**
1. iOS app lifecycle states (active, inactive, background, suspended) — how does Flutter respond to each?
2. `AppDelegate` vs. `SceneDelegate` — what changed and what does Flutter use?
3. Universal Links vs. custom URL schemes — setup and verification.
4. Push notifications on iOS: APNs, entitlements, and how tokens flow to your server.
5. `Info.plist` — which keys matter (permissions, URL types, background modes)?
6. CocoaPods and the Xcode build system — what does `pod install` do for Flutter plugins?

**Scenario**
7. A plugin works on Android but the iOS build fails at the pod step. Walk the diagnosis.

**Interview**
8. (Senior) Explain iOS background execution constraints and how they shape a Flutter background-sync design.

---

### Day 56 — Platform Channels (Internals)
**Theory**
1. `MethodChannel`, `EventChannel`, `BasicMessageChannel` — purpose and message direction of each.
2. How are messages serialized across the boundary, and which thread do platform handlers run on?
3. What is the cost of channel calls, and why is chatty channel usage a perf risk?
4. How do you return a stream of native events to Dart (sensor data, connectivity)?

**Assignment (design only)**
5. Design a plugin exposing a native battery-level read (one-shot) and battery-state changes (stream). Which channel for each, and what's the contract?

**Interview**
6. (Staff) How would you keep heavy native work off the platform-channel thread to avoid blocking, and how do you handle errors across the boundary?

---

### Day 57 — Phase G Consolidation
**Cross-platform scenarios**
1. A feature needs camera + secure on-device ML inference. What's native, what's Flutter, and how do they communicate?
2. Deep link → specific screen with auth gating, cold start and warm start. Trace both Android and iOS paths.

**Interview (Staff)**
3. You must add a native SDK that has no Flutter plugin. Walk through wrapping it for both platforms with a clean Dart API.

---

## PHASE H — Enterprise, CI/CD & System Design (Days 58–60)

### Day 58 — Enterprise Delivery: CI/CD, Flags, Monitoring
**Theory**
1. Compare CI/CD options: GitHub Actions, Codemagic, Bitrise, Fastlane — what does each handle?
2. Design a pipeline: lint → test → build (flavors) → sign → distribute (Firebase) → store deploy. What gates each stage?
3. Feature flags & staged rollout — how do you ship dark, then ramp, then kill-switch?
4. Crash monitoring & analytics — what do you instrument, and how do you map a crash to a release?
5. Release management for millions of users — phased rollout, rollback, forced-update strategy.

**Scenario**
6. A release spikes crashes for 2% of users on one OS version. Walk your detection-to-rollback playbook.

**Interview**
7. (Staff) Design the full release process for a large org with weekly releases across two stores.

---

### Day 59 — System Design Drills (App-by-App)
> For **each** app below, produce: Functional Requirements, Non-Functional Requirements (scale, latency, offline), high-level Architecture (layers, state, data flow), Offline Support, Scalability, Security, and Performance plan. Questions only — design verbally/on paper.

1. **WhatsApp** — real-time messaging, delivery/read receipts, offline queue, E2E encryption boundaries on the client, media handling, multi-device.
2. **Instagram** — infinite media feed, prefetch, image/video caching, stories, optimistic likes, scroll performance with slivers.
3. **Uber** — live location streaming, map rendering performance, trip state machine, surge/ETA updates, offline resilience during a ride.
4. **Swiggy / Zomato** — restaurant browse, cart, live order tracking, address/location, payment flow, peak-load behavior.
5. **POS App** — offline-first sales, receipt printing (native), inventory decrement, end-of-day reconciliation, hardware integrations.
6. **Wallet App** — balance integrity, transaction ledger, idempotent payments, secure storage, biometric auth, fraud signals.
7. **Rewards App** — points accrual/redemption, tiers, eventual consistency with backend, offline display of cached balances.
8. **E-commerce App** — catalog, search/filter, cart, checkout, order history, returns, A/B-tested UI via flags.
9. **Banking App** — strict security, SSL pinning, session/timeout, audit, regulatory constraints, graceful degradation offline.
10. **Stock-broking / Trading App** — real-time streaming quotes and charts (thousands of ticking symbols), a low-latency order flow with a strict **order state machine** (placed → open → partially filled → filled → cancelled/rejected) and **idempotent** order placement, portfolio/holdings and P&L, an order book / watchlist, wallet + funds, KYC/demat linkage, and honest **pending/settlement** states (T+1/T+2). Cover: how you stream and render fast-updating prices **without jank** (throttle/coalesce ticks, isolate parsing, repaint boundaries), why the **order & cash must be strongly consistent** while the portfolio display can lag slightly (eventual), reconnection/replay of the price feed, security (pinning, biometric re-auth for orders, no secrets on device), regulatory audit trail, and peak-load behavior at market open.
11. **Fintech / Payments App** — link accounts, load money, P2P transfer, bill pay: double-entry ledger, idempotent transfers, KYC tiers, AML monitoring, escrow/float reconciliation, and secure storage — where's the hardest correctness problem?

**For each, also answer:**
12. Which state management and why? Where is the rebuild-cost hotspot? What's the single hardest scaling problem and your mitigation?

---

### Day 60 — Final Capstone & Mock Panel
**Capstone design (questions only)**
1. Design an AI-powered mobile assistant app: a chat-style UI backed by an LLM, with streaming token-by-token responses, conversation history, tool/function calling (e.g. the model triggers app actions), offline draft queue, rate/cost limits, and safety guardrails. Produce the full system design using everything from Phases A–H (rendering/streaming UI, state, sync, caching, security, monitoring).
2. Defend every major decision: how you stream and render partial AI responses without jank, prompt/response caching to cut cost, retries/idempotency for AI calls, on-device vs server inference trade-offs, guardrails/PII handling, observability of token usage, and CI/CD.

**Mock panel (simulate a real senior/staff loop)**
3. Round 1 — Dart & async internals: pick 8 questions from the Dart bank and answer under time pressure.
4. Round 2 — Flutter internals & rendering: narrate the full pipeline and answer 5 rendering scenarios.
5. Round 3 — State & architecture: defend a state-management choice and a Clean Architecture module boundary.
6. Round 4 — Performance: live-debug a janky-screen scenario end to end.
7. Round 5 — System design: full app design with requirements, trade-offs, and scaling.

**AI & automation system design**
9. Design an AI content-generation feature inside a mobile app (e.g. summarize/rewrite/generate): request queue, streaming output, per-user token budgets, caching identical prompts, graceful fallback when the model is rate-limited or down, and how you'd A/B test model/prompt versions.
10. Design an automation/workflow engine for a mobile app: user-defined triggers → conditions → actions (like "if X happens, do Y"), running reliably in the background with retries, idempotency, offline queueing, and observability. Cover how rules are stored, evaluated, and versioned.
11. Design a RAG-style "chat with your data" feature: on-device vs server embeddings, vector search, keeping context within token limits, citing sources, streaming answers, and caching to control cost.

**Self-assessment**
8. For each of the ten question banks (separate file), can you answer 80%+ at Senior level and reason through the Staff-level ones? Mark gaps and schedule a second pass on the weakest two phases.

---

*End of Track 2 roadmap. The ten interview question banks (Dart, Flutter, Internals, Performance, Architecture, State Management, Android, iOS, System Design, Debugging) are in the separate Question Banks file, organized by difficulty: Beginner → Intermediate → Advanced → Senior → Staff.*
