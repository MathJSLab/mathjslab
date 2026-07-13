# Householder Reflectors in MathJSLab

This document describes the **design contract and guarantees** of the
Householder-related routines `larfg` and `larf` as implemented in the MathJSLab
engine.  
It is intended as _internal technical documentation_ for maintainers and
contributors, aligned with LAPACK semantics.

---

## 1. Mathematical object

MathJSLab follows the LAPACK convention for Householder reflectors.

A Householder reflector is represented implicitly as:

```
H = I - tau * v * vᴴ
```

where:

- `v` is a **column vector** (complex or real)
- `tau` is a scalar
- `vᴴ` denotes the conjugate transpose of `v`

In the complex case, `H` is **unitary**. In the real case, it is
**orthogonal**.

The reflector is **never formed explicitly** during normal algorithms. It is
applied via rank-1 updates.

---

## 2. Contract of `larfg`

Signature:

```ts
larfg(
  side: 'L' | 'R',
  A: MultiArray,
  dim: number,
  k: number
): { tau, v, phi, alpha }
```

### 2.1 Purpose

`larfg` constructs a Householder reflector that annihilates the trailing
components of a vector extracted from a matrix `A`.

The reflector is designed so that applying it to the extracted vector produces
a vector whose only nonzero component is the first one.

---

### 2.2 Vector extraction rule

Regardless of `side`, `larfg` **always works with a column vector internally**.

- If `side === 'L'`:
    - The vector `x` is extracted from column `k`:
        - `x = A[k : k+dim, k]`

- If `side === 'R'`:
    - The vector `x` is extracted from row `k`:
        - `x = A[k, k : k+dim]`

In both cases, `x` is treated as a column vector of length `dim - k`.

---

### 2.3 Guarantees

`larfg` returns values satisfying the following contract:

1. The reflector defined by `(tau, v)` satisfies:

```
(I - tau * v * vᴴ) * x = [ alpha, 0, 0, ... ]ᵀ
```

2. The vector `v` satisfies:
    - `v[0] = 1`
    - Remaining entries are normalized according to LAPACK conventions

3. `alpha` is the resulting leading value after annihilation.

4. `phi` is a **phase factor** extracted from the leading element of `x`.

---

### 2.4 Role of `phi`

The value `phi` is **not part of the core LAPACK reflector contract**, but is
explicitly exposed in MathJSLab.

It exists to:

- Preserve numerical continuity in complex factorizations
- Allow deterministic phase conventions
- Support correct reconstruction in algorithms such as `QR` and `LQ`

Algorithms consuming `larfg` may store and later reapply `phi` explicitly
(e.g., via phase normalization steps).

---

### 2.5 Non-guarantees

`larfg` does **not** guarantee:

- That `v` represents a dense vector usable outside `larf`
- Any symmetry between left and right applications
- Any specific dense-matrix interpretation beyond its annihilation property

---

## 3. Contract of `larf`

Signature:

```ts
larf(
  side: 'L' | 'R',
  C: MultiArray,
  v: ComplexType[],
  tau: ComplexType,
  i0: number,
  j0: number
): void
```

---

### 3.1 Purpose

`larf` applies a previously generated Householder reflector **implicitly** to a
matrix block.

The reflector is applied without explicitly forming `H`.

---

### 3.2 Operation

Let:

```
H = I - tau * v * vᴴ
```

Then:

- If `side === 'L'`:

```
C := H * C
```

- If `side === 'R'`:

```
C := C * H
```

The application affects only the submatrix of `C` starting at offsets
`(i0, j0)`.

---

### 3.3 Guarantees

`larf` guarantees:

- Correct application of the reflector defined by `(tau, v)`
- Correct handling of offsets `(i0, j0)`
- Early exit if `tau == 0`

---

### 3.4 Non-guarantees

`larf` explicitly does **not** guarantee:

- That right-application is the computational conjugate-transpose of
  left-application
- That the operation is equivalent to a dense rank-1 update computed externally
- Any symmetry between `larf('L')` and `larf('R')`

Such properties may hold numerically in many cases, but they are **not part of
the contract** and must not be relied upon by tests or algorithms.

---

## 4. Relationship between `larfg` and `larf`

The intended usage pattern is:

1. Extract `(tau, v)` using `larfg`
2. Apply the reflector using `larf`
3. Store `(tau, v)` for later reconstruction (e.g., building `Q`)

Correctness must be assessed **at the algorithmic level**, not via dense
equivalence assumptions.

---

## 5. Implications for testing

Valid tests for `larfg` and `larf` include:

- Annihilation of trailing components
- Unitarity / orthogonality of the implied reflector
- Preservation of Frobenius norm
- Correct behavior inside higher-level algorithms (`gelq2`, `orglq`, `geqrf`,
  etc.)

Invalid tests include:

- Assuming left/right symmetry at the dense-matrix level
- Comparing against explicitly constructed rank-1 updates outside the reflector
  context

---

## 6. Design philosophy

MathJSLab prioritizes:

- LAPACK semantic compatibility
- Numerical robustness
- Algorithmic correctness over algebraic symmetry

This document defines the **authoritative contract** for Householder operations
in the engine.
