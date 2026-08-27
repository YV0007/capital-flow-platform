"""Helper for migrating a component to t('ru','en').

Usage from a driver script:
    from i18n_tool import migrate
    migrate('path/to/File.jsx', {'Фильтры': 'Filters', ...},
            import_from='../../lib/i18n.jsx')

Does three mechanical passes and then REPORTS what still needs a human:
  1. attr="РУС"        -> attr={t('РУС','ENG')}
  2. attr={'РУС'}      -> attr={t('РУС','ENG')}
  3. bare 'РУС' literal-> t('РУС','ENG')
JSX text nodes are NOT auto-wrapped — they are listed for manual handling,
because wrapping them wrong silently breaks layout.
"""
import re, sys, os

CYR = re.compile(r'[А-Яа-яЁё]')

def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

def migrate(path, table, import_from=None, hook='t', report=True):
    src = open(path, encoding='utf-8').read()
    out = src
    done = []

    # Pass 0 — JSX TEXT nodes. Run before the literal passes so a bare run of
    # Russian between tags becomes {t('ru','en')} rather than being missed.
    # Only exact, whole runs are touched; anything already inside quotes is
    # left for the literal passes below.
    for ru, en in table.items():
        if ("'" + ru.replace("'", "\\'") + "'") in out or ('"' + ru + '"') in out:
            continue
        call = "{" + f"{hook}('{esc(ru)}', '{esc(en)}')" + "}"
        if '>' + ru + '<' in out:
            out = out.replace('>' + ru + '<', '>' + call + '<')
            done.append(ru)
        elif re.search(r'(?m)^(\s*)' + re.escape(ru) + r'\s*$', out):
            out = re.sub(r'(?m)^(\s*)' + re.escape(ru) + r'\s*$', lambda m: m.group(1) + call, out)
            done.append(ru)

    handled = set(done)          # pass 0 already wrapped these — never re-wrap
    for ru, en in table.items():
        if ru in handled:
            continue
        ru_lit_s = "'" + ru.replace("'", "\\'") + "'"
        ru_lit_d = '"' + ru + '"'
        call = f"{hook}('{esc(ru)}', '{esc(en)}')"

        # Passes are tried IN ORDER and the first one that fires wins. Running
        # them all would re-wrap the literal this pass just created inside the
        # t(...) call — that is exactly how t(t(...)) happens.
        before = out
        out = re.sub(r'(\b[A-Za-z][\w-]*=)' + re.escape(ru_lit_d),
                     lambda m: m.group(1) + '{' + call + '}', out)
        if out == before:
            out = out.replace('={' + ru_lit_s + '}', '={' + call + '}')
        if out == before:
            out = out.replace(ru_lit_s, call)
        # Files that quote with " rather than ' (HoldingsTab and friends).
        if out == before:
            out = out.replace(ru_lit_d, call)
        if out != before:
            done.append(ru)

    # Never let a t(...) end up nested inside another t(...)
    assert f"{hook}({hook}(" not in out, 'nested call guard tripped'

    if import_from and 'lib/i18n' not in out:
        # Match COMPLETE import statements (they may span several lines) —
        # anchoring on `^import .*$` lands inside a multi-line import list.
        m = list(re.finditer(r'^import [^;]*?;$', out, re.M | re.S))
        if m:
            at = m[-1].end()
            out = out[:at] + f"\nimport {{ useT }} from '{import_from}';" + out[at:]

    open(path, 'w', encoding='utf-8').write(out)

    if report:
        # NOTE: hook insertion is deliberately NOT automated — locating a
        # component's body-opening brace by scanning is what produced
        # `<div style={\n const t = useT();{` once. The report tells you where
        # to add it; add it by hand or with an exact-match replace.
        missed = [ru for ru in table if ru not in done]
        # functions that now use t() but don't declare it
        needs = []
        for fm in re.finditer(r'^(?:export default )?function ([A-Z]\w*)\(', out, re.M):
            name = fm.group(1)
            nxt = re.search(r'^(?:export default )?function [A-Z]\w*\(', out[fm.end():], re.M)
            body = out[fm.end(): fm.end() + (nxt.start() if nxt else len(out))]
            if re.search(r'\bt\(\'', body) and 'const t = useT()' not in body:
                needs.append(name)
        leftover = [(i, l.strip()) for i, l in enumerate(out.split('\n'), 1)
                    if CYR.search(l) and not l.strip().startswith(('//', '*', '/*'))
                    and f"{hook}('" not in l]
        print(f"--- {os.path.basename(path)}")
        if missed:   print("  NOT FOUND:", missed)
        if needs:    print("  NEEDS HOOK:", needs)
        if leftover:
            print("  LEFTOVER RUSSIAN:")
            for i, l in leftover: print(f"    {i:4d}| {l[:120]}")
        if not (missed or needs or leftover): print("  clean")
