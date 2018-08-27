---
title: Examples
tagline: Dune files you can use for common cases
---

The following examples come from the [dune quickstart], where more explanations
can be found.

[dune quickstart]: https://dune.readthedocs.io/en/latest/quick-start.html

# Executable

This will build `hello_world.ml` into an executable as
`_build/default/hello_world.exe`.

```scheme
(executable
 (name hello_world)
 (libraries lwt.unix))
```

# Library

```scheme
(library
 (name mylib)
 (libraries re lwt))
```

The library will be composed of all the modules in the same directory. Outside
of the library, module ``Foo`` will be accessible as ``Mylib.Foo``, unless you
write an explicit ``mylib.ml`` file.

This library can be made available as an opam package if you replace `(name
mylib)` by `(public_name mylib)` and write a `mylib.opam` file.

# Tests

```scheme
(test
 (name my_test_program))
```

With this, the tests can be run using `dune runtest`.

It will run the test program (the main module is ``my_test_program.ml``) and
error if it exits with a nonzero code.

# Mix and match

A typical project will have several `dune` files referring to each other.

For example:

```
project
├── bin
│   ├── dune
│   └── mylib-demo.ml
├── lib
│   ├── dune
│   ├── mylib.ml
│   ├── mylib.mli
│   └── mylib.opam
└── test
    ├── dune
    └── test_mylib.ml
```

- `bin/dune` defines an executable depending on `mylib`
- `test/dune` defines a test executable depending on `mylib`

Note that the `bin`, `lib`, `test` directory names are not meaningful to dune.
