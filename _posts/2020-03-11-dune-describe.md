---
layout: blog
title: Introducing dune describe
author: dimenix
tags: [ocaml, dune]
picture: /assets/imgs/dune-describe.png
discuss: https://discuss.ocaml.org/t/introducing-dune-describe
---

Dune 2.4.0 has a new `describe` command for extracting various
information about a dune project or workspace in a stable and machine
readable format. The goal is to allow third-party applications such as
the trustworthy refactoring tool [rotor][rotor] to understand the
topology of a dune workspace, locate various compilation artifacts and
other things.

At the time of writing this post, the query language accepted by this
command and its output are not yet stabilised. We plan to stabilise it
once someone wants to release a application that relies on `dune
describe`.

In the future, we also plan to add a nice human readable output
allowing users to quickly understand what a dune project is about and
what it has to offer.

[rotor]: https://trustworthy-refactoring.gitlab.io/refactorer/

Usage
-----


    $ dune describe [--lang VERSION] [--format FORMAT] WHAT-TO-DESCRIBE

Passing `--lang x.y` requests that dune behaves the same way as
version `x.y` of the `dune` binary, no matter its current
version. More precisely, the two promises we make are:

- that `WHAT-TO-DESCRIBE` will be parsed in the same way as the
  version `x.y` of the `dune` binary
- the output of this command will be the same as the version `x.y` of the
  `dune` binary

Right now, the only version you can pass to `--lang` is 0.1. The "0."
suffix means that the behavior is not yet stabilised and might change
without notice in future minor releases or even bugfix releases of
Dune. Once either rotor or another project is ready to make a stable
release of a tool relying of `dune describe`, we'll stabilise this
output. So if you plan on using this feature, please let us know!

If you intend to parse the output of `dune describe` programmatically,
then you should also pass `--format csexp`. This will cause `dune` to
print the result as a [S-expression in canonical
form][csexp-wiki]. You can then use the [csexp library][csexp-lib] to
parse the output and use something like [ppx_sexp_conv][ppx_sexp_conv]
to parse the result without hassle.

[csexp-wiki]: https://en.wikipedia.org/wiki/Canonical_S-expressions
[csexp-lib]: https://github.com/diml/csexp
[ppx_sexp_conv]: https://github.com/janestreet/ppx_sexp_conv

Example
-------

```ocaml
# #require "csexp";;
# #require "ppx_sexp_conv";;
# #require "base";;
# open Base;;
# module Csexp = Csexp.Make(Sexp);;
module Csexp :
  sig
    val parse_string : string -> (Sexp.t, int * string) result
    val parse_string_many : string -> (Sexp.t list, int * string) result
    val input : in_channel -> (Sexp.t, string) result
    val input_opt : in_channel -> (Sexp.t option, string) result
    val input_many : in_channel -> (Sexp.t list, string) result
    val serialised_length : Sexp.t -> int
    val to_string : Sexp.t -> string
    val to_buffer : Buffer.t -> Sexp.t -> unit
    val to_channel : out_channel -> Sexp.t -> unit
  end
# type item = Library of library
  and library =
    { name : string
    ; uid : uid
    ; requires : uid list
    ; source_dir : string
    ; modules : module_ list
    }
  and uid = string
  and module_ =
    { name : string
    ; impl : string option
    ; intf : string option
    ; cmt : string option
    ; cmti : string option
    }
  [@@deriving of_sexp];;
type item = Library of library
and library = {
  name : string;
  uid : uid;
  requires : uid list;
  source_dir : string;
  modules : module_ list;
}
and uid = string
and module_ = {
  name : string;
  impl : string option;
  intf : string option;
  cmt : string option;
  cmti : string option;
}
val item_of_sexp : Sexp.t -> item = <fun>
val library_of_sexp : Sexp.t -> library = <fun>
val uid_of_sexp : Sexp.t -> uid = <fun>
val module__of_sexp : Sexp.t -> module_ = <fun>
# Stdlib.Sys.command "dune describe --format csexp > /tmp/x";;
- : int = 0
# match Csexp.input (Stdlib.open_in "/tmp/x") with
  | Ok x -> [%of_sexp: item list] x
  | Error msg -> failwith msg;;
  - : item list =
[Library
  {name = "csexp"; uid = "2ac224c04fa61d226241d5394bcfc444"; requires = [];
   source_dir = "_build/default/src";
   modules =
    [{name = "Csexp"; impl = Some "_build/default/src/csexp.ml";
      intf = Some "_build/default/src/csexp.mli";
      cmt = Some "_build/default/src/.csexp.objs/byte/csexp.cmt";
      cmti = Some "_build/default/src/.csexp.objs/byte/csexp.cmti"}]};
 Library
  {name = "csexp_tests"; uid = "cae2600322b2b8a67c297c353294d54d";
   requires =
    ["2ac224c04fa61d226241d5394bcfc444"; "a09aff04d7aac4201a8d17178505dc41";
     "c31eace71b8050d2eaf1b2ac88be5a21"; "0004486e60e09317002ea3fc0f012c04";
     "d785d8082259c31f19b0c9350988438d"];
   source_dir = "_build/default/test";
   modules =
    [{name = "Test"; impl = Some "_build/default/test/test.ml";
      intf = None;
      cmt =
       Some
        "_build/default/test/.csexp_tests.objs/byte/csexp_tests__Test.cmt";
      cmti = None};
     {name = "Csexp_tests";
      impl = Some "_build/default/test/csexp_tests.ml-gen";
      intf = None;
      cmt =
       Some
        "_build/default/test/.csexp_tests.objs/byte/csexp_tests.cmt";
      cmti = None}]}]
```
