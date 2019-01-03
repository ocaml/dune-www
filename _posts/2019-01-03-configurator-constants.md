---
layout: blog
title: How configurator reads C constants
tags: configurator
author: etiennemillon
---

Dune comes with a library to query OS-specific information, called
[`configurator`][configurator-doc]. It is able to evaluate C expressions and
turn them into OCaml value. Surprisingly, it even works when compiling for a
different architecture. How can it do that?

## A CD-ROM problem

Let's take an old school example: suppose we want to eject a CD-ROM drive. On
Linux, the way to do that is to open the device file such as `/dev/cdrom` and to
call `ioctl(fd, CDROMEJECT, 0)` on it. The `CDROMEJECT` part is a constant
defined in `<linux/cdrom.h>`.

To do the same in OCaml, it is possible to define a C function that calls
`ioctl` directly. Or this can be done directly using [ctypes], but we need to
know the value of the `CDROMEJECT` constant; `configurator` can be used to do
that.

## Enter `configurator`

How to use `configurator` in a dune project is a bit out of scope for this
article, but at the core is a function `C_define.import` that can read the value
of some C expressions, including macros.

The following program uses `configurator` to fetch and display the value of the
`CDROMEJECT` constant.

```ocaml
let () =
  let open Configurator.V1 in
  main ~name:"c_test" (fun t ->
      let result =
        C_define.import t ~includes:["linux/cdrom.h"] [("CDROMEJECT", Int)]
      in
      match result with
      | [(_, Int n)] -> Printf.printf "%d\n" n
      | _ -> assert false )
```

So, how does it work?

## An almost correct solution

It is certainly necessary to generate and compile some C to do this. A first
version is to generate a short C program such as the following one.

```c
#include <stdio.h>
#include <linux/cdrom.h>

int main(void)
{
	printf("%d\n", CDROMEJECT);
	return 0;
}
```

By running this program and parsing the output, configurator can get the
correct value.

Except that dune supports cross-compilation: [when compiling an unikernel for an
ESP32 CPU][esp32], it could be handy to have the value of constants such as
`ESP_ERR_WIFI_PASSWORD` that are only available using a foreign toolchain. But
it is not possible to run ESP32 binaries on the host system.

## A better solution

Since it is necessary to use a C compiler, but not to run a program, the
solution is looking at the compiled code:

- generate a C file containing the expressions to extract
- build it using the target C compiler
- parse the resulting binary

This is what `configurator` does. Since parsing compiled code is difficult (and
not all targets use the same binary format), the values are stored in constant
strings, between known markers.

Here is the generated C file. Note that unlike in the previous attempt, this is
not a complete executable, just a file to be built with `-c`.

```c
#include <stdio.h>
#include <linux/cdrom.h>

#define D0(x) ('0'+(x/1         )%10)
#define D1(x) ('0'+(x/10        )%10), D0(x)
#define D2(x) ('0'+(x/100       )%10), D1(x)
#define D3(x) ('0'+(x/1000      )%10), D2(x)
#define D4(x) ('0'+(x/10000     )%10), D3(x)
#define D5(x) ('0'+(x/100000    )%10), D4(x)
#define D6(x) ('0'+(x/1000000   )%10), D5(x)
#define D7(x) ('0'+(x/10000000  )%10), D6(x)
#define D8(x) ('0'+(x/100000000 )%10), D7(x)
#define D9(x) ('0'+(x/1000000000)%10), D8(x)

const char s0[] = {
  'B', 'E', 'G', 'I', 'N', '-', '0', '-',
  D9((CDROMEJECT)),
  '-', 'E', 'N', 'D'
};
```

The `Dn(x)` macros seem daunting at first, but remember that we need a string
constant, so it is necessary to convert the integer value to a list of
characters. The comma operator ensures that the result will look like `'1', '2',
'3', '4'` which will be inserted in the array initializer.

After compiling this file, the string is visible directly in the binary:

```
00000000: 7f45 4c46 0201 0100 0000 0000 0000 0000  .ELF............
00000010: 0100 3e00 0100 0000 0000 0000 0000 0000  ..>.............
00000020: 0000 0000 0000 0000 a801 0000 0000 0000  ................
00000030: 0000 0000 4000 0000 0000 4000 0a00 0900  ....@.....@.....
00000040: 4245 4749 4e2d 302d 3030 3030 3032 3132  BEGIN-0-00000212
00000050: 3537 2d45 4e44 0047 4343 3a20 2844 6562  57-END.GCC: (Deb
00000060: 6961 6e20 382e 322e 302d 3133 2920 382e  ian 8.2.0-13) 8.
00000070: 322e 3000 0000 0000 0000 0000 0000 0000  2.0.............
00000080: 0000 0000 0000 0000 0000 0000 0000 0000  ................
00000090: 0100 0000 0400 f1ff 0000 0000 0000 0000  ................
```

It is even possible to parse it using plain Unix tools.

```
% strings x.o | grep BEGIN
BEGIN-0-0000021257-END
```

The actual `configurator` library will parse it using a very simple
lexer. It uses the number just after `BEGIN` (`-0-` above) to distinguish
between the different constants that have been requested.

It also supports more types of bindings, such as strings. In this case, the
string is directly inserted between `BEGIN-0-` and `-END`.

## Conclusion

Binary file formats can seem tricky to parse, but for some cases this is the
correct solution. In the context of dune when it is not always possible to
execute the output binaries, this is the correct solution to extract information
from the target system.

As far as I know, this technique has been borrowed from [ctypes][ctypes] where
[it had been implemented by @whitequark][ctypes-pr]. Thanks!

[configurator-doc]: https://dune.readthedocs.io/en/latest/configurator.html
[ctypes]: https://github.com/ocamllabs/ocaml-ctypes/
[ctypes-pr]: https://github.com/ocamllabs/ocaml-ctypes/pull/383
[esp32]: https://www.lortex.org/esp32/
