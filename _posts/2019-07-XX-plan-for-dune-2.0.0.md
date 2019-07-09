---
layout: blog
title: Plans for Dune 2.0.0
author: dimenix
tags: [ocaml, dune, jbuilder]
picture: /assets/imgs/dune-2.0.0.png
discuss: https://discuss.ocaml.org/t/plan-for-dune-2
---

The dune team is currently planning the 2.0.0 release of Dune and we
wanted to share our plans for it. As always, we put a lot of effort
into backward compatibility and we expect that the 2.0.0 release will
be barely noticeable for existing users, just as the renaming from
Jbuilder to Dune was.

However, in order to keep the project modern and prepare it for the
future, we are planning to do a couple of changes in Dune 2.0.0. So we
invite all Dune users to read this post in order to understand the
changes and how these changes could affect them. If you do not have
time to read this whole post, you can read the [quick
summary](#quick-summary) instead.

At a high level, we encourage everyone to switch to the Dune 2 binary
for local development as soon as it is released. However, if you care
a lot about compatibility with older OCaml compilers, we advise that
you keep the `(lang dune ...)` line in your `dune-project` as `(lang
dune 1.x)`. This will forbid you access to the Dune 2 features and
will ensure that your project is compatible with Dune >= 1.x.

On our side, we will make sure to add a lot of cool new features in
Dune 2 to convince all users to switch to it entirely :)

## Quick summary

- Dune 2.0.0 will be 99% backward compatible with Dune 1.x
- Jbuilder and Dune 2.0.0 will be co-installable
- a `dune-project` file will now be necessary to mark the root of a
  project
- a few default behaviors will change in dune 2.0.0 but will not
  affect existing released packages
- dune 2.0.0 will require OCaml 4.08 to build, however it still be
  able to build projects using older compilers and will be installable
  in older opam switches
- `dune.configurator` will now be released as `dune-configurator`,
  however the name `dune.configurator` will still exist for backward
  compatibility reason

## Dropping official support for Jbuilder

The main motivation for bumping the major version number is dropping
the support for jbuilder, as announced in previous posts:

- https://discuss.ocaml.org/t/dune-1-0-0-is-coming-soon-what-about-jbuilder-projects/2237
- https://dune.build/blog/second-step-deprecation/

This means that starting from Dune 2.0.0, the `dune` binary will no
longer be guaranteed to understand projects with `jbuild` files. We
originally planned that Dune 2 would fail hard when seeing a `jbuild`
file and would install a dummy `jbuilder` binary that would
systematically fail on startup.

However, given the large number of projects that haven't switched from
Jbuilder to Dune yet, we decided to adapt our plans. First of all,
Dune 2 will not install a dummy `jbuilder` binary. In fact, it will
not install a `jbuilder` binary at all. This means that Dune 2 and
Jbuilder will be co-installable. In particular, in opam it will be
possible to install packages using Jbuilder alongside packages using
Dune 2.

Additionally, Dune will still be able to understand Jbuilder projects
to some extent. More precisely, it will use the same code as `dune
upgrade` to convert `jbuild` files to `dune` files on the fly. This is
not enough to provide full compatibility with `jbuilder` when
installed via opam. However, it will be enough for when a Jbuilder
project is vendored inside a Dune project.

With this plan, the Dune 2 release should be smooth for users and
Jbuilder backward compatibility will not get in the way of new Dune
developments.

But really, we strongly encourage everybody maintaining a package
still using `jbuilder` to release a new version using `dune` :)
Upgrading from `jbuilder` to `dune` is extremely easy and automated as
desribed in [this post](https://dune.build/blog/second-step-deprecation/).

### Note for Mono-reposiotry users

While Dune will still be able to understand Jbuilder projects vendored
inside Dune ones, it will now require the presence of a `dune-project`
to mark the root of such projects. Up to now, the presence of at least
one `<package>.opam` file was enough to mark the root of a project
inside a bigger workspace. Marking the root of projects inside
workspaces is important as otherwise private libraries of vendored
projects will be globally visible and might clash with private
libraries of other vendored projects.

Since older projects are likely to not have such a file, you should
add one when vendoring a Jbuilder project inside a Dune one. This
`dune-project` file can simply contain `(lang dune 1.0)`.

## 99% backward compatibility with Dune 1.x

When Dune sees `(lang dune x.y)` in a `dune-project` file, it adapts
itself to behave as the `x.y` versoin of Dune. This is how we provide
full backward compatibility in Dune.

This means that Dune 2.0.0 will not break anything. Projects currently
using `(lang dune 1.x)` will build with continue to build with all
versions of Dune from 1.x onwards.

There is one exception I can think of to this rule: currently if you
have a file that is both generated by a rule and present in the source
tree, this is a warning with older versions of the dune
language. However, making this a warning rather than an hard error is
costly and requires maintainig a complex piece of code in Dune.  As a
result, for this particular case we will make it an error in Dune 2.x,
which means that projects relying on it not build with Dune 2.x. FTR,
the way to fix this is to add a `(mode promote)` or `(mode fallback)`
field to the relevant stanza so that Dune knows what your intent is.

Appart from that, things that currently trigger a warning will
continue to trigger a warning when using `(lang dune 1.x)`, however
they'll become hard errors when using `(lang dune 2.x)`. We will also
change a few defaults behaviors in Dune 2.x.

You can think of the `(lang dune x.y)` line in `dune-project` files as
follow: while working on a project, you should use the latest version
possible in your context. This will gives you access to the most
recent features of Dune and will give you the most up-to-date commonly
accepted defaults.

When not working on a project, this line is a way to remember which
version of Dune was used the last time you worked on the project so
that future version of Dune can continue to understand it without you
taking any action.

## dune.configurator will now be dune-configurator

We want to make Dune a pure binary so that it is easier to distribute.
For this reason, the `dune.configurator` library will now be
distributed as a separate `dune-configurator` package in opam. The
`dune.configurator` name will still exist for backward compatibility
reason, however you should use the name `dune-configurator` rather
than `dune.configurator` in new code.

At least the first release of the `dune-configurator` package will be
compatible with Dune 1, so projects that want to keep compatibility
with Dune 1 can depend on `dune-configurator`.

## Requiring a recent version of OCaml to build

At the moment, Dune can build projects using all versions of OCaml
since 4.02.3 and can also built itself using all versions of OCaml
since 4.02.3. More precisely, Dune is aware of all past OCaml bugs and
can work around them when building projects using an old compiler, and
the code of Dune itself is compatible with older compiler.

This makes Dune an easy dependency for authors who want their project
to be compatible with older OCaml version. However, making Dune itself
compatible with older compilers is a heavy constraint on the
development of Dune. First, it means that we need to do increase our
testing with each new compiler release and secondly it means that we
cannot use new features of the language. The second constraint is
particularly annoying given that Dune is actively developed and its
code base could definitely benefit from the new language features.

For this reason, starting from version 2.0.0 Dune will require a
recent version of OCaml to build itself. Dune 2.0.0 will require
4.08.0, when 4.09.0 is released we will immediately start using its
new features and so on. But more importantly, we will immediatly start
using multicore when it becomes available, since Dune is a project
that is likely to benefit from it.

However, we will continue to support building projects using Dune with
older compiler. For instance, it will still be possible to build Dune
using OCaml 4.08.0 and use the resulting binary to build projects with
OCaml 4.02.3. In particular, we will rely on this fact to make Dune
2.0.0 available in older opam switches. However, installing Dune 2 in
an older opam switch might be slightly slower, depending on which
method we use to make this possible.