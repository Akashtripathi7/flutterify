# TRACK 1 — Coding Logic & Data Manipulation (45 Days)

> **Rules of engagement:** This file contains *only* questions, exercises, scenarios, and assignments. No answers. No solutions. Hints are marked `💡 Hint:` and are optional — cover them on first pass, reveal only when stuck.
>
> **Daily ritual (1 hour):** (1) Read the day's topic prompts and answer aloud. (2) Dry-run before you run. (3) Predict output, *then* execute and compare. (4) Log every wrong prediction in an "error journal" — that journal is your real curriculum.
>
> **Progression:** Beginner → Intermediate → Advanced → Expert. Each day assumes the previous days.

---

## PHASE 0 — How to Think Like a Programmer (Days 1–7)

### Day 1 — Decomposition & Problem Restatement
**Concept prompts**
1. Restate this in your own words: "Print all even numbers from 1 to 100." What is the *input*, the *output*, and the *transformation* between them?
2. A problem says "find the largest number in a list." List every sub-step a CPU must perform — assume it can only look at one number at a time.
3. What is the difference between *what* a program should do and *how* it does it? Give two examples of each from your daily life.

**Decomposition drills** — break each into ≤5 numbered steps, in plain English, no code:
4. Make a cup of tea.
5. Find a contact named "Amit" in a phone book.
6. Decide whether a year is a leap year.
7. Count how many vowels are in a sentence.

**Interview warm-up**
8. Why is problem decomposition considered more valuable than memorizing syntax?

💡 Hint: For #2, think about what you must "remember" between looks.

---

### Day 2 — Tracing Variables & State
**Trace-the-state drills** — write the value of every variable after *each* line. No running code.
1.
```dart
var a = 5;
var b = 10;
a = b;
b = a;
// What are a and b now? Was the swap successful?
```
2.
```dart
var x = 2;
x = x + x;
x = x * x;
// value of x at each step?
```
3.
```dart
var p = 1, q = 2, r = 3;
var temp = p;
p = q; q = r; r = temp;
// final p, q, r?
```

**Conceptual**
4. What does "state" mean in a program? Why does the order of statements matter?
5. Draw a table with columns for each variable and one row per executed line. Apply it to #3.

**Output prediction**
6.
```dart
var count = 0;
count += 1;
count += count;
print(count);
```

💡 Hint: A swap that loses a value needs a third holder — ask why.

---

### Day 3 — Dry Running & Hand Execution
**Dry-run drills** — produce the exact printed output by hand:
1.
```dart
for (var i = 0; i < 3; i++) {
  print(i);
}
```
2.
```dart
var sum = 0;
for (var i = 1; i <= 4; i++) {
  sum = sum + i;
}
print(sum);
```
3.
```dart
var n = 5;
while (n > 0) {
  print(n);
  n--;
}
```
**Conceptual**
4. What is the loop's *exit condition* in each example above? When exactly is it checked?
5. In #3, what would print if you wrote `n -= 2` instead?

**Debugging (read only — find the bug, do not fix yet)**
6.
```dart
for (var i = 0; i <= 5; i++) {}
print(i); // why might this fail to compile?
```

---

### Day 4 — Predicting Output & Operator Precedence
**Output prediction**
1. `print(2 + 3 * 4);`
2. `print((2 + 3) * 4);`
3. `print(10 / 3);`  vs  `print(10 ~/ 3);`  vs  `print(10 % 3);`
4. `print(true && false || true);`
5. `print(5 > 3 == true);`
6. `print("a" + "b" + "c".toUpperCase());`

**Conceptual**
7. Order these by precedence: `%`, `+`, `*`, `()`. Where does unary `-` fit?
8. What is integer division and why does `~/` exist separately from `/` in Dart?

**Trap-spotting**
9. Why might `0.1 + 0.2 == 0.3` surprise you? (Predict the boolean, then test.)

💡 Hint: For #9, think about how decimals are stored in binary.

---

### Day 5 — Flowcharts & Control Flow
**Flowchart drills** — draw a flowchart (boxes + diamonds) for each, then label every branch:
1. Check if a number is positive, negative, or zero.
2. Grade a score: A (≥90), B (≥75), C (≥50), else Fail.
3. A login that allows 3 attempts then locks out.

**Conceptual**
4. What is the difference between a *sequence*, a *decision*, and a *loop* in flowchart terms?
5. Convert your flowchart from #2 into `if / else if / else` pseudocode (no Dart syntax required).

**Output prediction**
6.
```dart
var score = 75;
if (score >= 90) print("A");
else if (score >= 75) print("B");
else print("C");
```
7. What changes if every `else if` were an independent `if`?

---

### Day 6 — Algorithmic Thinking & Invariants
**Reasoning prompts**
1. To find the max of a list, what should `currentMax` be *before* you look at any element? Defend your choice.
2. What is a "loop invariant"? State the invariant for a running-sum loop.
3. Describe two different step-by-step methods to check if a word is a palindrome. Which uses less memory?

**Estimation**
4. If a list has 1,000 items and you compare every pair, roughly how many comparisons happen? What about 1,000,000 items?
5. Why do we care about how work *grows* with input size rather than raw speed?

**Decomposition**
6. Break "find the second-largest number in a list" into steps. What edge case appears when all numbers are equal?

💡 Hint: For #1, consider what value can never be "too big to beat."

---

### Day 7 — Phase 0 Consolidation
**Mixed dry-run**
1.
```dart
var a = 1, b = 1;
for (var i = 0; i < 5; i++) {
  var c = a + b;
  a = b;
  b = c;
}
print(b);
```
**Output prediction**
2.
```dart
var s = "";
for (var i = 1; i <= 3; i++) {
  s = s + i.toString();
}
print(s);
```
**Debugging (identify, don't fix)**
3.
```dart
var n = 10;
while (n > 0) {
  print(n);
} // what is wrong?
```
**Interview**
4. Walk an interviewer through how you'd approach an unfamiliar problem under time pressure. What are your first three moves?
5. Self-review: list the three most common mistakes from your error journal this week.

---

## PHASE 1 — Loops, Beginner to Expert (Days 8–15)

### Day 8 — `for` Loop Foundations
**Topics:** initialization, condition, increment; trace order of execution.
**Output prediction**
1. `for (var i = 0; i < 5; i++) print(i);`
2. `for (var i = 5; i > 0; i--) print(i);`
3. `for (var i = 0; i <= 10; i += 2) print(i);`
4. `for (var i = 1; i <= 5; i++) print(i * i);`

**Logic-building (write the loop yourself — no output here)**
5. Print numbers 1 to 50.
6. Print all multiples of 3 below 100.
7. Print numbers 100 down to 1.
8. Print the first 10 odd numbers.

**Edge cases**
9. What prints if the condition is false on the very first check?
10. What is the value of `i` *after* a `for` loop completes, and is it accessible?

---

### Day 9 — Counting, Summation, Tables
**Logic-building**
1. Count how many numbers between 1 and 200 are divisible by 7.
2. Sum all numbers from 1 to N (take N as input).
3. Sum only the even numbers from 1 to 100.
4. Print the multiplication table of a given number up to ×20.
5. Print tables of 2 through 5, each on its own block.

**Output prediction**
6.
```dart
var sum = 0;
for (var i = 1; i <= 5; i++) sum += i * 2;
print(sum);
```
**Interview**
7. Without a loop, how would you sum 1..N? Why might a closed-form formula beat a loop?
8. Where could integer overflow bite you in a summation loop on very large N?

---

### Day 10 — `while` & `do-while`
**Conceptual**
1. State the one situation where `do-while` behaves differently from `while`. Construct an input that exposes it.
2. Rewrite a counting `for` loop as a `while` loop on paper — what three pieces must you move where?

**Output prediction**
3.
```dart
var n = 1;
while (n <= 16) {
  print(n);
  n *= 2;
}
```
4.
```dart
var n = 0;
do {
  print(n);
  n++;
} while (n < 0);
```
**Logic-building**
5. Keep halving a number (integer division) until it reaches 0; count the steps.
6. Read numbers until a 0 is entered, then print their sum. (Simulate input with a list.)
7. Find the number of digits in an integer using a `while` loop.

**Edge cases**
8. What input makes #6 print 0? What if the *first* number is 0?

---

### Day 11 — `break`, `continue`, Labels, Infinite Loops
**Output prediction**
1.
```dart
for (var i = 1; i <= 10; i++) {
  if (i == 5) break;
  print(i);
}
```
2.
```dart
for (var i = 1; i <= 5; i++) {
  if (i % 2 == 0) continue;
  print(i);
}
```
3.
```dart
outer:
for (var i = 0; i < 3; i++) {
  for (var j = 0; j < 3; j++) {
    if (j == 1) continue outer;
    print('$i,$j');
  }
}
```
**Conceptual**
4. What is the difference between `break` and `continue` in one sentence each?
5. When does a labeled `break` earn its keep versus a flag variable?
6. Give three distinct ways to *accidentally* write an infinite loop.

**Logic-building**
7. Find the first number above 100 divisible by both 7 and 11; stop immediately when found.
8. Print pairs (i, j) for a 4×4 grid but skip the diagonal where i == j.

💡 Hint: For #3, predict which `print` lines are skipped before tracing.

---

### Day 12 — Nested Loops
**Output prediction**
1.
```dart
for (var i = 1; i <= 3; i++) {
  for (var j = 1; j <= 3; j++) {
    print('$i*$j=${i * j}');
  }
}
```
2. How many times does the inner body run if outer is 1..5 and inner is 1..i?

**Logic-building**
3. Print all multiplication tables 1..10 (nested).
4. Print every pair of distinct numbers from a list (no pair repeated).
5. Print all (i, j) where i + j == 10 and i ≤ j, for i,j in 1..9.

**Interview**
6. If outer runs N times and inner runs N times, how does total work grow with N? What if inner runs only i times?
7. Give a real example where a nested loop is unavoidable, and one where it can be removed.

---

### Day 13 — Number Manipulation: Digits & Reversal
**Logic-building**
1. Count the digits of an integer (no string conversion).
2. Sum the digits of an integer.
3. Reverse the digits of an integer (e.g., 1234 → 4321) using arithmetic only.
4. Check if a number is a palindrome (reads same reversed).
5. Find the largest digit in a number.

**Edge cases**
6. How does your reversal handle trailing zeros (e.g., 1200)? Negative numbers? Zero itself?

**Output prediction**
7.
```dart
var n = 9, count = 0;
while (n > 0) { n ~/= 10; count++; }
print(count);
```

💡 Hint: `% 10` peels the last digit; `~/ 10` drops it.

---

### Day 14 — Primes, Factors, Fibonacci
**Logic-building**
1. Check if a number is prime.
2. Print all primes from 2 to 100.
3. Print all factors of a number.
4. Print the prime factorization of a number.
5. Print the first N Fibonacci numbers.
6. Find whether a given number appears in the Fibonacci sequence.
7. Find the GCD of two numbers (Euclidean idea — derive the steps yourself).

**Optimization**
8. Your prime check loops to N. To what value can you stop instead, and why?
9. Fibonacci with a loop vs. with naive recursion — which repeats work, and how much?

**Interview**
10. Explain why 1 is not prime, and why 2 is the only even prime, as you would to a junior dev.

---

### Day 15 — Phase 1 Consolidation (Loop Mastery)
**Mixed output prediction**
1.
```dart
var r = 1;
for (var i = 1; i <= 5; i++) r *= i;
print(r);
```
2.
```dart
var i = 0;
while (true) {
  i++;
  if (i * i > 50) break;
}
print(i);
```
**Debugging (identify the flaw)**
3.
```dart
// Sum of first N natural numbers
var n = 5, sum = 0;
for (var i = 0; i < n; i++) sum += i;
print(sum); // why is this off by something?
```
**Business mini-scenario**
4. Given daily step counts for a week (list of 7), describe the loop logic to find the best day, the worst day, and the weekly average — no code, just steps.
**Interview**
5. Describe how you'd debug a loop that runs "one too many" or "one too few" times. What's an off-by-one error and how do you systematically catch it?

---

## PHASE 2 — Pattern Programming (Days 16–22)

> For all patterns: first dry-run a 3×3 / N=4 case by hand. Identify the relationship between row index, column index, and what is printed. **Write only the questions' logic — no solutions provided.**

### Day 16 — Square & Rectangle Patterns
1. Solid square of `*`, side N.
2. Hollow square of `*` (border only), side N.
3. Solid rectangle, R rows × C columns.
4. Rectangle filled with the row number on each line.
5. Rectangle filled with a continuously increasing counter (1,2,3,…).

**Reasoning**
6. For the hollow square, what condition on (row, col) decides star vs. space?

---

### Day 17 — Right & Left Triangles
1. Right-angled triangle of `*`, increasing 1..N per row.
2. Inverted right triangle, N..1 per row.
3. Left-aligned vs. right-aligned triangle — what differs in the spacing logic?
4. Right triangle of increasing numbers per row (1; 12; 123; …).
5. Right triangle where each row repeats the row number (1; 22; 333; …).

**Reasoning**
6. To right-align a triangle, how many leading spaces does row `i` need (rows counted from 1)?

---

### Day 18 — Number & Alphabet Patterns
1. Floyd's triangle (continuous numbers across rows).
2. Each row prints 1..i.
3. Each row prints i..1.
4. Pattern of alphabets: A; AB; ABC; … up to N rows.
5. Alphabet pattern where each row uses a single repeated letter (A; BB; CCC; …).
6. Triangle of odd numbers centered (1; 3 5; 7 9 11; …).

**Reasoning**
7. How do you convert a number 0–25 into the matching uppercase letter, and back?

💡 Hint: Letters map to character codes; look up how Dart converts an int to a character.

---

### Day 19 — Pyramids & Inverted Pyramids
1. Star pyramid (centered), N rows.
2. Inverted star pyramid.
3. Number pyramid (1; 121; 12321; …).
4. Pyramid where each row mirrors increasing then decreasing numbers.
5. Inverted number pyramid.

**Reasoning**
6. For a centered pyramid of N rows, derive the formula for spaces and stars in row `i`.

---

### Day 20 — Hollow Patterns
1. Hollow triangle (border stars only).
2. Hollow inverted triangle.
3. Hollow pyramid.
4. Hollow diamond.
5. Hollow rectangle with a diagonal line through it.

**Reasoning**
6. State the general rule: "print a star only when the position is on a boundary." Express "boundary" precisely for the hollow triangle.

---

### Day 21 — Diamonds, Butterfly, Pascal
1. Full diamond of stars.
2. Number diamond.
3. Butterfly pattern (filled).
4. Hollow butterfly pattern.
5. Pascal's triangle, N rows.
6. Pascal's triangle using only the previous row (no factorial/combination function).

**Reasoning**
7. How is each interior value of Pascal's triangle derived from the row above it?
8. Why does the butterfly split naturally into two mirror-image halves — top and bottom?

💡 Hint: Pascal value at (row, col) relates to the two values diagonally above it.

---

### Day 22 — Phase 2 Consolidation (Advanced Interview Patterns)
1. Number "hill" pattern: spaces, ascending numbers to the middle, then descending.
2. Concentric square pattern (outer ring 1, next ring 2, …) — value at (i, j) is its "ring distance" from the border.
3. Spiral of numbers 1..N² in an N×N grid (logic plan only; trace 4×4 by hand first).
4. ZigZag pattern across a grid.
5. Given any pattern an interviewer draws on a whiteboard, describe your *general method* for reverse-engineering the (row, col) → character rule.

**Interview**
6. Why are pattern questions still used in interviews? What do they actually test beyond loops?

---

## PHASE 3 — Data Manipulation (Days 23–32)

### Day 23 — Lists: Traversal, Search, Counting
1. Print every element of a list with its index.
2. Find whether a target value exists; report its first index.
3. Count how many elements satisfy a condition (e.g., > 50).
4. Count occurrences of a specific value.
5. Find the index of the maximum element.

**Output prediction**
6.
```dart
var nums = [3, 1, 4, 1, 5];
var c = 0;
for (var n in nums) if (n == 1) c++;
print(c);
```
**Edge cases**
7. What should each function above return for an *empty* list? Decide deliberately for each.

---

### Day 24 — Lists: Sum, Average, Max, Min
1. Sum and average of a list of numbers.
2. Max and min in a single pass (one loop, two trackers).
3. Find both the largest and second-largest in one pass.
4. Find the range (max − min) and the index of each extreme.
5. Running average as you traverse (print the average after each element).

**Edge cases**
6. Average of an empty list — what's the right behavior? Average with one element?
7. What breaks in #3 if the list has duplicates of the maximum?

**Interview**
8. Why is "single pass" valued over "sort then pick"? When would sorting still be the better call?

---

### Day 25 — Filtering, Mapping, Transformation
1. Produce a new list containing only the even numbers.
2. Produce a new list of each number squared.
3. From a list of names, produce a list of their lengths.
4. From prices, produce prices after a 10% discount.
5. Combine filter + map: squares of only the odd numbers.

**Conceptual**
6. What is the difference between *transforming* a list (new list) and *mutating* it (in place)? When is each appropriate?
7. Predict whether the original list changes in each of your solutions above.

---

### Day 26 — Sorting & Grouping
1. Sort a list of numbers ascending; then descending.
2. Sort a list of strings alphabetically, then by length.
3. Sort a list of objects (e.g., students) by score, then by name as a tiebreaker.
4. Group numbers into "even" and "odd" buckets.
5. Group words by their first letter.

**Conceptual**
6. What does a comparator return for "a comes before b", "after", and "equal"?
7. What is a *stable* sort, and why might tiebreaker order matter in a UI list?

**Interview**
8. If you sort by score descending then name ascending, in what order must you apply the comparisons? Why?

---

### Day 27 — Deduplication & Sets
1. Remove duplicates from a list, preserving first-seen order.
2. Find the intersection of two lists.
3. Find the union and the difference of two lists.
4. Detect if a list has any duplicates (return true/false) without building a full copy.
5. Find the first non-repeating element.

**Conceptual**
6. What property of a `Set` makes dedup natural? What does it *lose* compared to a `List`?
7. Why might "preserve order" force you to use a Set *plus* a List together?

**Output prediction**
8.
```dart
var s = {1, 2, 2, 3, 3, 3};
print(s.length);
```

---

### Day 28 — Maps: Counting & Frequency
1. Count frequency of each element in a list (build a Map).
2. Find the most frequent element.
3. Find the first element whose count reaches 2.
4. Count word frequencies in a sentence.
5. Invert a map (values become keys) — what problem arises with duplicate values?

**Output prediction**
6.
```dart
var m = <String, int>{};
for (var ch in "banana".split('')) {
  m[ch] = (m[ch] ?? 0) + 1;
}
print(m);
```
**Conceptual**
7. What does the `?? 0` idiom protect against, and why is it central to frequency counting?

---

### Day 29 — Nested Lists & Matrices
1. Sum every element of a 2D list (matrix).
2. Sum each row; sum each column.
3. Find the maximum in each row.
4. Transpose a matrix.
5. Flatten a nested list one level deep.

**Output prediction**
6.
```dart
var m = [[1, 2], [3, 4], [5, 6]];
var total = 0;
for (var row in m) for (var v in row) total += v;
print(total);
```
**Edge cases**
7. What if rows have different lengths (jagged)? How does that break column sums?

---

### Day 30 — Nested Maps & JSON-Shaped Data
> Use this sample shape for the day:
> ```dart
> var users = [
>   {"name": "Asha", "age": 30, "roles": ["admin", "editor"]},
>   {"name": "Ravi", "age": 25, "roles": ["viewer"]},
>   {"name": "Meera", "age": 35, "roles": ["editor"]},
> ];
> ```
1. Print every user's name and age.
2. Find the average age.
3. List all users who have the "editor" role.
4. Build a Map from role → list of user names with that role.
5. Find the oldest user.
6. Count how many distinct roles exist across all users.

**Conceptual**
7. When you read `users[0]["roles"]`, what is the type, and what could be null? How would you guard it?
8. Why is deeply nested untyped JSON a common source of runtime errors? What discipline reduces that?

---

### Day 31 — Analytics, Reports, Ranking, Pagination
> Sample: a list of sales records `{"product": String, "qty": int, "price": double, "region": String}`.
1. Total revenue (qty × price summed).
2. Revenue per region (grouped).
3. Top 3 products by revenue (ranking).
4. Average order value.
5. Produce a "report" map: total revenue, best region, best product, number of orders.
6. **Pagination:** given a page size of 10 and a page number, return the correct slice. Handle the last partial page and out-of-range pages.
7. **Ranking with ties:** assign rank numbers where equal revenues share a rank (1, 2, 2, 4 style).

**Interview**
8. Explain offset-based vs. cursor-based pagination conceptually. Which scales better for an infinite-scroll feed and why?

---

### Day 32 — Phase 3 Consolidation
**Debugging (identify, don't fix)**
1.
```dart
var nums = [10, 20, 30];
var avg = 0;
for (var n in nums) avg += n;
avg = avg / nums.length; // why does this line complain in Dart?
```
**Output prediction**
2.
```dart
var m = {"a": 1, "b": 2};
m["c"] = m["a"]! + m["b"]!;
print(m);
```
**Logic-building**
3. Merge two frequency maps into one combined count map.
4. Given a list of transactions (+credit / −debit), compute the running balance and flag the first time it goes negative.

**Interview**
5. Walk through how you'd choose between List, Set, and Map for a given task. Give one decisive question you'd ask yourself for each.

---

## PHASE 4 — Algorithmic Techniques (Days 33–40)

### Day 33 — Linear Scan Patterns & Single-Pass Tricks
1. Find max subarray *element*, then transition: find the max *running sum* seen so far (introduce the idea, no full Kadane yet).
2. Detect if a list is sorted ascending in one pass.
3. Count "descents" (positions where an element is smaller than the previous).
4. Find the longest run of equal consecutive elements.

**Conceptual**
5. What state must you carry across one pass to answer each of the above?

---

### Day 34 — Frequency Counting (Deep)
1. First unique character in a string.
2. Check if two strings are anagrams.
3. Find all elements appearing more than N/2 times.
4. Group anagrams together from a list of words.
5. Find the element that appears exactly once when all others appear twice.

**Interview**
6. Why does a frequency map turn many "nested loop" problems into single-pass problems? State the time/space trade-off you accept.

---

### Day 35 — Hashing Basics
1. Two-sum: find whether any two numbers add to a target (describe the map-based approach in steps, then implement).
2. Find the first duplicate in a stream of numbers.
3. Count pairs with a given difference.
4. Find the intersection of two lists in linear time.

**Conceptual**
5. What does a hash set give you that a sorted list does not? What does it cost?
6. When can hashing degrade, and why is "average case" the usual claim?

---

### Day 36 — Two Pointer
1. Reverse a list in place using two pointers.
2. Check palindrome using two pointers from both ends.
3. In a *sorted* list, find a pair summing to a target without a map.
4. Remove duplicates from a sorted list in place.
5. Merge two sorted lists into one sorted list.
6. Move all zeros to the end while keeping order of the rest.

**Conceptual**
7. Why does the sorted two-pointer two-sum work? What invariant lets you discard a whole side?

---

### Day 37 — Sliding Window
1. Maximum sum of any window of size K.
2. First window of size K whose sum exceeds a threshold.
3. Longest substring without repeating characters (variable window — plan the shrink logic).
4. Smallest window whose sum is ≥ a target (positive numbers).
5. Count windows of size K containing exactly M odd numbers.

**Conceptual**
6. What changes between a *fixed*-size and a *variable*-size window? What triggers the window to grow vs. shrink?

💡 Hint: A window keeps a running aggregate; adding the new element and removing the old one beats recomputing.

---

### Day 38 — Prefix Sum
1. Build a prefix-sum array; answer "sum from index i to j" in O(1).
2. Find a subarray with a given sum (positive numbers).
3. Count subarrays whose sum equals K (combine prefix sum with a frequency map).
4. Equilibrium index (left sum equals right sum).
5. Range update trick (add a value to a range cheaply) — describe the idea.

**Conceptual**
6. How does prefix sum trade *preprocessing* time for *query* speed? When is that worthwhile?

---

### Day 39 — Combining Techniques
1. Longest subarray with at most K distinct elements (window + frequency map).
2. Subarray sum equals K with negatives present (prefix sum + map — why does the map become necessary?).
3. Find duplicates within a window of size K (set + window).
4. Top-K frequent elements (frequency map + partial sort/heap idea).

**Interview**
5. Given a new problem, what signals tell you to reach for: two pointers? a window? a frequency map? prefix sum? Make a personal decision checklist.

---

### Day 40 — Phase 4 Consolidation
**Output prediction & dry-run**
1. Hand-trace a size-3 sliding window over `[2, 1, 5, 1, 3, 2]` computing each window sum.
2. Hand-build the prefix-sum array for `[3, -1, 4, 1, 5]`.

**Logic-building**
3. Given hourly temperature readings, find the longest stretch of strictly rising temperatures.
4. Given login timestamps, find the busiest 1-hour window.

**Interview**
5. Explain the difference between O(N), O(N log N), and O(N²) using a list of 1,000,000 elements. Which techniques from this phase achieve which?

---

## PHASE 5 — Real Business Problems & Consolidation (Days 41–45)

### Day 41 — Wallet & Banking Logic
1. Process a list of transactions (credits/debits) and compute the final balance; reject a debit that would overdraw and log it.
2. Compute the minimum balance maintained over a statement period.
3. Detect "suspicious" activity: ≥ 3 debits within any 10-minute window (sliding window over timestamps).
4. Produce a monthly statement grouped by category with subtotals.

**Edge cases**
5. Two transactions with identical timestamps; a zero-amount transaction; a debit exactly equal to the balance.

---

### Day 42 — E-commerce & Cart Logic
1. Compute a cart total with per-item quantity and price.
2. Apply tiered discounts (e.g., 5% over ₹1000, 10% over ₹5000) — which tier wins, and is it cumulative?
3. Apply a coupon (flat vs. percentage) and cap the maximum discount.
4. Split a cart into "in stock" and "backordered" using an inventory map.
5. Rank products by "popularity" (units sold) for a homepage rail.

**Interview**
6. Where do floating-point prices cause bugs in totals and tax? What discipline avoids rounding errors in money math?

---

### Day 43 — Inventory, POS & Rewards
1. Decrement stock as orders are processed; flag items that hit the reorder threshold.
2. POS: given a bill total and cash tendered, compute change using the fewest notes/coins from a given denomination list (greedy plan — note where greedy can fail).
3. Rewards: award points (e.g., 1 point per ₹100), then redeem points capped at a percentage of the bill.
4. Tiered loyalty: compute a customer's tier from rolling 12-month spend.

**Edge cases**
5. Out-of-stock mid-order; redeeming more points than available; a denomination set where greedy change-making is wrong.

---

### Day 44 — Reporting, Dashboards & Data Pipelines
1. From raw event logs, compute daily active counts.
2. Build a 7-day rolling average of a metric (window).
3. Detect anomalies: any day more than 2× the rolling average.
4. Produce a leaderboard with ranks, ties, and the requesting user's rank even if off-screen.
5. Paginate a 10,000-row report for an API response; include total pages and a "has next" flag.

**Interview**
6. How would you structure this so the heavy aggregation runs once and serves many UI queries cheaply?

---

### Day 45 — Final Capstone & Self-Assessment
**Capstone (logic plans only — no solutions provided):**
1. Design the data-processing logic for a "spend insights" screen: monthly totals, category breakdown, month-over-month change, top merchant, and an alert if spending rose > 20%.
2. Design the logic for an offline order queue that batches, deduplicates, and orders pending operations for later sync (ties back to your real PWA/offline work).

**Self-assessment**
3. Re-attempt 5 problems you failed earliest. Did your error journal entries stop recurring?
4. List the five techniques you now reach for instinctively.
5. Write three "explain it to a junior" answers: what is Big-O, what is an off-by-one error, and why frequency maps beat nested loops.

**Interview readiness checklist**
6. Can you take any of the 425 bank questions, restate it, decompose it, predict edge cases, and reason about complexity *before* writing code? If yes for 90%+, you are ready for Track 1's interview rounds.

---

*End of Track 1 roadmap. Numbered question banks (150 loops, 150 data manipulation, 50 debugging, 50 output prediction, 25 business problems) are in the separate Question Banks file.*
