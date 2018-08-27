---
layout: base
---
<div class="section">

Dune is a build system for OCaml projects.
Using it, you can build executables, libraries, run tests, and much more.

<div class="flex-grid">
<div class="col text-container">
#### Dune knows OCaml and its ecosystem
Dune has rules that precisely capture how the OCaml toolchain works.
It is able to interoperate with most of the existing tools like OPAM, merlin,
reason, and `js_of_ocaml`.

#### Dune is fast
Dune works hard to do things once and in parallel, so both cold and incremental
builds are way faster than traditional build systems.

#### Dune is widely used
Dune is used in both large projects and small libraries.
About 30% of OPAM packages are built using Dune.
</div>

<div class="col code-container">
#### `dune`
```scheme
(executable
 (name hello_world)
 (libraries lwt.unix))
```

#### `hello_world.ml`
```ocaml
Lwt_main.run (Lwt_io.printf "Hello, world!\n")
```

#### Your shell
```
$ dune build hello_world.exe
$ ./_build/default/hello_world.exe
Hello, world!
```
</div>
</div>
</div>
