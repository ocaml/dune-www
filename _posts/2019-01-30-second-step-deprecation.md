---
layout: blog
title: Second stage of the Jbuilder deprecation
author: dimenix
tags: [ocaml, dune, jbuilder]
picture: /assets/imgs/jbuilder-deprecated.png
discuss: https://discuss.ocaml.org/t/second-stage-of-the-jbuilder-deprecation
---

As [planned][migration], we are now entering the second stage of the
Jbuilder deprecation. This means that the `jbuilder` binary still
exists and work as before however it prints a warning on every
startup. Additionally, `jbuild` files are still accepted but both
`jbuilder` and `dune` display a warning when encountering them. This
behavior is now in the development version of dune and will be part of
the upcoming 1.7.0 release.

The support for the `jbuilder` binary and `jbuild` files will be
discontinued in July 2019. If you haven't switch your project to
dune already, now is a good time to do it.

To do that, you can either follow the [migration's guide][migration],
or use the newly added `dune upgrade` command that does it for you.

Using the automatic upgrader
----------------------------

The automatic upgrader is a new feature in dune 1.7.0. It automatically
convert your project from jbuilder to dune. Using it is as simple as
running the following command at the root of your project:

```
$ dune upgrade
```

Note that this command also work on workspaces composed of several
projects. In this case, all projects in the workspace are converted.

The upgrader crawls the workspace and automatically convert every
`jbuild` and `jbuild-ignore` files it encounter to a `dune` file. It
also creates `dune-project` files wherever appropriate. Note that the
`dune` files are all pretty-printed, so the layout of your original
`jbuild` will not be preserved.

Additionally, `dune upgrade` also edits your `<package>.opam` files as
follow:

- it updates the build instruction with the recommended calls to `dune`
- it updates the dependencies on `jbuilder` by dependencies on `dune`

Note that this is not a simple replacement of the word `jbuilder` by
`dune`. In particular, the build instruction are replaced by the
recommended ones. This is because in the early days of jbuilder, there
were no recommended opam build instructions, and as a result some
projects might still not be using the most appropriate
instructions. You should review the edits performed by the upgrader to
make sure you are happy with them.

For the record, the recommended opam build instructions are the
following ones:

```
build: [
  ["dune" "subst"] {pinned}
  ["dune" "build" "-p" name "-j" jobs]
  ["dune" "runtest" "-p" name "-j" jobs] {with-test}
  ["dune" "build" "@doc" "-p" name "-j" jobs] {with-doc}
]
```

Interaction with git
--------------------

The upgrader detects when it is running inside a git repository. In
such cases, it issues git commands in such a way that running `git
diff` just after `dune upgrade` will show you exactly what changed. If
you do not like the result or notice a problem with the automatic
upgrade, running `git reset --hard` will undo all the edits and remove
the newly created `dune` and `dune-project` files.

It is a good idea to run `dune build` before and after the upgrade to
make sure everything works as expected.

[migration]: https://dune.readthedocs.io/en/latest/migration.html
