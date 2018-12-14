---
layout: blog
title: A new general computation model for Dune
author: Jeremie Dimino <jeremie@dimino.org>
tags: [ocaml, dune]
---

Dune is fast. However, if you try to use Dune to develop in a big
workspace such as the [OCaml platform repository][platform], you will
notice that on every run, even if there is nothing to rebuild `dune
build` will take a couple of seconds to provide an answer.

This might not seem like a big deal, however the bigger your workspace
is and the longer this time will be. Just imagine having a workspace
composed of all the open source OCaml software that exist out
there. With such a workspace, you could achieve massive refactorings
in one go, such as fixing historical mistake of the stdlib. For
instance, we could finally make `compare` return a proper `Ordering.t`
rather than an `int`.

On such a repository, it is likely that `dune build` would
systematically spend tens of seconds on every invocation. This is way
too long to wait for feedback. So what exactly is Dune doing during
all this time, and how can we speed things up? This post explains what
the issue is and how we are planning to solve it in Dune.

How Dune works
--------------

To understand where this time is spent, let's analyse how Dune works.
Roughly, you can see Dune as a system composed of two sub-systems
running concurrently: a build script generator and an executor. The
job of the build script generator is to read the user written
configuration files and analyse the environment in order to procude a
build script that can assemble the final application. The executor
reads the build script and schedule the execution of commands using as
much parallelism as possible. When possible, the executor will not
re-execute commands in order to speed up incremental builds.

In some tools, the distinction between the two is very clear. For
instance in systems using ninja, ninja is the executor and there is a
tool on top to interpret the user configuration and produce a build
script. In Dune however, we chose to have both sub-systems in the same
executable. This gives us better control of the overall system and
allows us to use feedback from the execution of commands in order to
produce more of the build script, enabling us to provide even more
advanced features to our users.

For small to medium sized projects, the generation of the build script
is so fast that the user cannot notice it. However, for bigger
workspaces, the generation of the build script can take quite a bit of
time.

This doesn't seem right at all; if there is one thing a build system
should be good at, it is avoiding recomputing the same thing over and
over. So why can't we do the same for the generation of the build
script? We could indeed go through an external command to generate the
build script, and this computation would effecitvely be cached by the
system. However, this is an absolutely terribe programming model. This
brings us to the new computation model we just merged in Dune, which
will allow to cache any kind of computations, not just the ones
performed by external commands.

Towards a generic computation model
-----------------------------------

When I first started writting Dune, there is one thing that bothered
me quite a lot: the execution of external commands was properly cached
by the system, however all the computations performed by the build
system itself while generating the build script were not. In some way,
these were second class computations. However, when you consider the
overall job being done by the build system, i.e. turning source files
into libraries and executables, the fact that some computations are
performed by the build system and some are performed by external tools
such as the compiler is just an implementation detail, so they should
just all be treated the same way.

It is this consideration that led to the new computation model at the
core of Dune. The main idea is to come up with a model that can
represent both running normal OCaml code or external commands and
share results at any points chosen by the developer.

It took some time to polish this model, develop it and and merge it
into Dune. To validate our ideas, we discussed them with Andrey
Mokhow, one of the author of the famous [Build system a la carte
paper](bs-a-la-carte). The initial implementation was written by Rudi
Horn and it is now fully merged into Dune.

Let's see what this model is about.

A general memoization system
----------------------------

When you think about it, a build system is nothing more that a system
that can memoize pure computations. Indeed, when all the dependencies
and targets of a command are fully specified, then we effectively get
a pure function in the mathemical sense. This is why it is safe to not
re-execute a command when none of its dependencies has changed.

The new computation model simply generalizes this idea to all
computations, not just exernal commands. At the core of Dune, we now
have a system that is able to memoize any OCaml functions, running an
exernal command being just one way to perform a computation. The
result of memoized functions can be reused immediately during a single
build, and can also be reused between different builds as long as it
is safe to do so, i.e. when none of the dependencies of the function
changed.

Finding the right API
---------------------

One limitation when using external commands is that once the command
is started there is no interaction between the build system and the
external process. So one has to effecively specify all the inputs and
outputs upfront. This is tedious, and in many cases we have to specify
a superset of what we think the inputs will be in order to be on the
safe side.

For internal computations, we have a bit more freedom. In particular,
instead of manually specifying all the inputs we can simply discover
them as the function is running.

In the end, here is a simplifed version of what the API looks like:

```ocaml
val memoize
  :  name:string
  -> doc:string
  -> 'a input_ops
  -> 'b output_ops
  -> ('a -> 'b Fiber.t)
  -> ('a -> 'b Fiber.t)
```

`input_ops` and `output_ops` provide operations that the memoization
system needs, such as hashing and equality functions. `Fiber.t` is the
concurrency monad we use inside Dune.

The first time the function returned by `memoize` is called, the
memoization system will execute the actual function and record all the
observations it makes, such as what files it reads or what other
memoized functions it calls. During subsequent builds, if the function
is called again with the same argument, the system will check whether
the previous observations are still valid, and if yes it will reuse
the previous result rather than execute the function again.

This gives a very powerful and easy to use tool to build system
developpers to share computations in a single build or between builds.

There are many ways to implement Dune's job on top of this
abstraction. We were recently brainstorming about this with other Dune
developpers and we have many ideas on how to proceed. I feel like just
as video game developers who need time to understand and fully exploit
the power of new video game systems, it will take us some time to
truly understand all the power of this new system and get the most
benefits out of it. Which means that it is a truly exciting time to be
hacking on Dune!

Going further: better debugging and profiling
---------------------------------------------

Memoized functions are not only used for sharing computations. These
functions are annotated with a name, documentation and ways to display
the inputs/outputs. This means that we can see precise stack traces,
which should be really useful for debugging. Such functions should
also be a good entry point for profiling reports, which should help
understand better where the time is spent in a given build and how we
can improve it.

Finally, Dune also provides access to these functions via the CLI,
which should be really nice for debugging:

```
$ dune compute <function> <arg>
<result>
```

All this should help improve the quality of Dune and continue to
improve the experience for users of Dune.

[platform]:      https://github.com/avsm/platform
[bs-a-la-carte]: https://www.microsoft.com/en-us/research/publication/build-systems-la-carte/
