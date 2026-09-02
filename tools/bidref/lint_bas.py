#!/usr/bin/env python3
"""Static lint for the modBR_*.bas modules (no Access needed).

Checks the failure classes we have actually hit with generated VBA:
  * line-continuation runs (> 20 per statement) and over-long physical lines
  * odd quote counts on a physical line (after stripping a trailing comment)
  * Array(...)(i) inline indexing, dangling single-line Else, Dim shadowing a builtin
  * duplicate procedure names across modules
  * "=Proc()" event-property strings and call sites that resolve to no procedure
  * Type member access (x.Member) against the declared Type blocks
  * write statements that target anything but a local xtblBR_* table

Usage: python3 tools/bidref/lint_bas.py [access/modBR_*.bas ...]
Exit code 1 when a hard finding exists.
"""
import re
import sys
import glob
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FILES = sys.argv[1:] or sorted(glob.glob(os.path.join(ROOT, "access", "modBR_*.bas")))

BUILTINS = set("""
abs array asc atn cbool cbyte ccur cdate cdbl chr cint clng csng cstr cvar cverr choose cos createobject
date dateadd datediff datepart dateserial datevalue day dir doevents environ eof err error exp fix format
formatcurrency formatnumber formatpercent hex hour iif inputbox instr instrrev int isarray isdate isempty
iserror ismissing isnull isnumeric isobject join lbound lcase left len log ltrim mid minute month msgbox
now nz oct replace right rnd round rtrim second sgn sin space split sqr str strcomp strconv string
switch tan time timer trim typename ubound ucase val weekday year currentdb currentproject docmd forms
application screen access dbengine createproperty callbyname getobject filter strreverse monthname
weekdayname redim erase debug me createform createreport createcontrol createreportcontrol deletecontrol eval runcommand setoption getoption ctrue null true false empty nothing set let get new err dsum dcount
dlookup dmax dmin dfirst dlast davg sysCmd syscmd shell command isarray vartype partition mod and or not
xor eqv imp is like typeof addressof len lenb ltrim rtrim ubound lbound int fix rgb qbcolor
""".split())

KEYWORDS = set("""
if then else elseif end sub function property public private static dim as const for next to step each in
do loop while wend until select case exit goto on resume error with byval byref optional paramarray
integer long double single string variant boolean byte currency date object type enum declare lib alias
call return stop redim preserve erase let set new nothing true false null empty and or not xor mod is
like typeof me attribute option explicit compare database base text binary global friend implements
event raiseevent withevents addressof lset rset open close input output append print write line get put
seek lock unlock name kill chdir mkdir rmdir width spc tab defint deflng defdbl defstr defvar
""".split())

proc_re = re.compile(r"^\s*(?:Public|Private|Friend)?\s*(?:Static\s+)?(Sub|Function|Property\s+(?:Get|Let|Set))\s+([A-Za-z_]\w*)", re.I)
type_re = re.compile(r"^\s*(?:Public|Private)?\s*Type\s+([A-Za-z_]\w*)", re.I)
dim_re = re.compile(r"^\s*(?:Dim|Private|Public|Global|Static|Const|Public Const|Private Const)\s+(.*)$", re.I)
ident_re = re.compile(r"\b([A-Za-z_]\w*)\b")
member_re = re.compile(r"\b([A-Za-z_]\w*)\.([A-Za-z_]\w*)\b")
event_re = re.compile(r'"=([A-Za-z_]\w*)\(')
sql_write_re = re.compile(r"\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM|DROP\s+TABLE|CREATE\s+TABLE|ALTER\s+TABLE)\s+\[?([A-Za-z_][\w.]*)", re.I)


def strip_comment(line):
    """Remove a trailing ' comment that is outside string literals."""
    out = []
    inq = False
    for ch in line:
        if ch == '"':
            inq = not inq
        elif ch == "'" and not inq:
            break
        out.append(ch)
    return "".join(out)


def strip_strings(code):
    return re.sub(r'"(?:[^"]|"")*"', '""', code)


modules = {}
for f in FILES:
    with open(f, encoding="utf-8", errors="replace") as fh:
        modules[os.path.basename(f)] = fh.read().splitlines()

procs = {}          # name.lower() -> (module, kind, line)
types = {}          # TypeName.lower() -> set(members lower)
typed_vars = {}     # varname lower -> typename lower (module-level + local; best effort)
hard = []
soft = []

# Pass 1: declarations
for mod, lines in modules.items():
    cur_type = None
    for i, raw in enumerate(lines, 1):
        code = strip_comment(raw)
        m = type_re.match(code)
        if m and not re.search(r"\bEnd\s+Type\b", code, re.I):
            cur_type = m.group(1).lower()
            types.setdefault(cur_type, set())
            continue
        if re.match(r"^\s*End\s+Type\b", code, re.I):
            cur_type = None
            continue
        if cur_type:
            mm = re.match(r"^\s*([A-Za-z_]\w*)(?:\([^)]*\))?\s+As\s+", code, re.I)
            if mm:
                types[cur_type].add(mm.group(1).lower())
            continue
        m = proc_re.match(code)
        if m:
            name = m.group(2)
            key = name.lower()
            if key in procs and procs[key][0] != mod:
                hard.append((mod, i, f"duplicate procedure {name} (also in {procs[key][0]}:{procs[key][2]})"))
            procs[key] = (mod, m.group(1), i)
        d = dim_re.match(code)
        if d:
            for part in d.group(1).split(","):
                mm = re.match(r"\s*([A-Za-z_]\w*)(?:\([^)]*\))?\s+As\s+(?:New\s+)?([A-Za-z_][\w.]*)", part, re.I)
                if mm:
                    typed_vars[mm.group(1).lower()] = mm.group(2).lower()
                nm = re.match(r"\s*([A-Za-z_]\w*)", part)
                if nm and nm.group(1).lower() in {"exp", "log", "left", "right", "mid", "len", "format", "date", "time", "year",
                                                  "month", "day", "str", "val", "int", "fix", "abs", "sgn", "round", "split",
                                                  "join", "replace", "trim", "array", "filter", "choose", "switch", "timer"}:
                    soft.append((mod, i, f"Dim shadows builtin {nm.group(1)} (fine unless the procedure also calls it)"))
    # proc params also define typed vars
    for i, raw in enumerate(lines, 1):
        code = strip_comment(raw)
        if proc_re.match(code):
            for mm in re.finditer(r"([A-Za-z_]\w*)(?:\(\))?\s+As\s+([A-Za-z_][\w.]*)", code, re.I):
                typed_vars[mm.group(1).lower()] = mm.group(2).lower()

# Pass 2: line-level checks
for mod, lines in modules.items():
    cont = 0
    for i, raw in enumerate(lines, 1):
        if len(raw) > 900:
            hard.append((mod, i, f"physical line {len(raw)} chars"))
        code = strip_comment(raw)
        if code.rstrip().endswith("_"):
            cont += 1
            if cont > 20:
                hard.append((mod, i, f"{cont} continuations in one statement"))
        else:
            cont = 0
        if code.count('"') % 2 == 1:
            hard.append((mod, i, "odd number of double quotes"))
        nostr = strip_strings(code)
        if re.search(r"\bArray\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*\(", nostr):
            hard.append((mod, i, "Array(...)(i) inline indexing"))
        if re.search(r"\bThen\b.*\bElse\s*$", nostr, re.I) and not re.search(r"\bIf\b.*\bThen\s*$", nostr, re.I):
            hard.append((mod, i, "single-line If ... Else with nothing after Else"))
        if re.search(r"\bEnd\s+If\b", nostr, re.I) and re.search(r"\bIf\b.*\bThen\b.*\S.*\bEnd\s+If\b", nostr, re.I) and ":" not in nostr:
            soft.append((mod, i, "End If on a single-line If"))
        for m in event_re.finditer(code):
            nm = m.group(1).lower()
            if nm not in procs and nm not in BUILTINS and nm not in {"sum", "avg", "count", "min", "max", "first", "last"}:
                hard.append((mod, i, f'event string "={m.group(1)}()" resolves to no procedure'))
        for m in sql_write_re.finditer(code):
            tgt = m.group(2)
            if not re.match(r"xtblBR_", tgt, re.I) and not tgt.startswith("\" &"):
                soft.append((mod, i, f"write statement targets {tgt}"))
        # Type member check
        for m in member_re.finditer(nostr):
            var, mem = m.group(1).lower(), m.group(2).lower()
            tn = typed_vars.get(var)
            if tn in types and mem not in types[tn]:
                hard.append((mod, i, f"{m.group(1)}.{m.group(2)} — {tn} has no member {mem}"))

# Pass 3: unresolved call sites — identifiers followed by "(" that aren't procs/builtins/locals
local_names = set()
for members in types.values():
    local_names |= members
for mod, lines in modules.items():
    for raw in lines:
        code = strip_comment(raw)
        d = dim_re.match(code)
        if d:
            for part in d.group(1).split(","):
                nm = re.match(r"\s*([A-Za-z_]\w*)", part)
                if nm:
                    local_names.add(nm.group(1).lower())
        m = proc_re.match(code)
        if m:
            for mm in re.finditer(r"([A-Za-z_]\w*)(?:\(\))?\s+As\s+", code, re.I):
                local_names.add(mm.group(1).lower())
for mod, lines in modules.items():
    for i, raw in enumerate(lines, 1):
        code = strip_comment(raw)
        nostr = strip_strings(code)
        if proc_re.match(code) or dim_re.match(code) or re.match(r"^\s*Declare\b", code, re.I):
            continue
        for m in re.finditer(r"(?<![.\w])([A-Za-z_]\w*)\s*\(", nostr):
            nm = m.group(1).lower()
            if nm in procs or nm in BUILTINS or nm in KEYWORDS or nm in local_names or nm in types:
                continue
            soft.append((mod, i, f"unresolved call {m.group(1)}("))

for mod, i, msg in hard:
    print(f"HARD  {mod}:{i}: {msg}")
for mod, i, msg in soft:
    print(f"soft  {mod}:{i}: {msg}")
print(f"\n{len(modules)} modules, {len(procs)} procedures, {len(types)} types; {len(hard)} hard, {len(soft)} soft")
sys.exit(1 if hard else 0)
