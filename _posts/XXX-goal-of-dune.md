---
layout: blog
title: The goal of Dune
author: jeremiedimino
tags: [ocaml, dune]
picture: /assets/imgs/the-goal-of-dune.png
discuss: https://discuss.ocaml.org/t/goal-of-dune
---

I have been asked a few times what is our goal with Dune, so I wanted
to answer this question once and for all.

The goal of the Dune project is to provide the best possible build
tool for the whole of the OCaml community, from individual developpers
who work on open source projects during their free time all the way to
larger companies such as Jane Street. And to the extent that is
reasonably possible, help provide the same feature for friend
communities such as Coq and possibly Reason/Bucklescript in the
future.

We haven't reached this goal yet and Dune still lacks in some areas in
order to be such a tool, but we are slowly working towards that goal.
On a practical level, there are a few boxes to check in order to reach
our goal. There are in fact a ton details to sort out, but at a
high-level a tool that works for everyone in the OCaml community
should at least:

1. have excelent backward compatibility properties
2. have a robust and scalable core
3. have very good support for the OCaml language
4. be extensible

At this point, we have done a good job at 1 and 3, we are working
towards 2 and are doing the preparatory work for 4. Once all these
boxes have been checked, we will consider that the Dune project will
be feature complete.

In the rest of this post, I will develop these points and give some
insights into our current and future focuses.

## Have excelent backward compatibility properties

In an open-source community, there will always be large groups of
people with enough resources to continously bring their projects up to
date as well as people who work on their free time and cannot provide
the same level of continuous support and updates.

From the point of view of Dune, we have to assume that a released
project with `dune` files is a piece of gold that will potentially
never change. So changing Dune in a way that it could no longer
understand a released project is by default a no-no.

Of cource, we can't give a 100% guarantee that Dune will always behave
exactly the same. That would be irrealistic and would prevent the
project from moving forward.  In order for us to provide good
stability properties, we have to make sure to properly delimit and
document the set of behaviors that users should relly on.

In a nutshell, the surface API of dune has to be small, high-level,
stable and documented. This ensures that users have a robust and
stable basis to build software on while making it possible for the
project to continue evolving and adapting to an ever changing world.

## Have a robust and scalable core

## Have very good support for the OCaml language

## Be extensible





