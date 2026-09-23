"""Append standalone FALSE statements (no paired true sibling, pairId: null)
to statements.json. Used for the "completely false, plausible misconception"
content style — short, single-claim sentences, distinct from the paired
true/false-with-one-word-changed style used elsewhere in the bank.

Usage: python3 scripts/add_solo_false.py scripts/<batch>.py
The batch module must define a top-level ENTRIES list of
(category, statement, explanation) 3-tuples.
"""
import json
import sys
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATEMENTS_PATH = ROOT / "statements.json"


def load_batch(batch_path):
    spec = importlib.util.spec_from_file_location("batch_module", batch_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.ENTRIES


def main():
    if len(sys.argv) != 2:
        print("Usage: add_solo_false.py <path-to-batch-file>")
        sys.exit(1)

    batch_path = Path(sys.argv[1])
    entries = load_batch(batch_path)

    existing = json.loads(STATEMENTS_PATH.read_text())
    existing_texts = {s["statement"].strip().lower() for s in existing}
    max_id_num = max(int(s["id"][1:]) for s in existing)
    next_id = max_id_num + 1

    new_statements = []
    seen_in_batch = set()
    errors = []

    for i, (category, statement, explanation) in enumerate(entries):
        key = statement.strip().lower()
        if key in existing_texts:
            errors.append(f"Duplicate of existing statement (entry {i}): {statement!r}")
        if key in seen_in_batch:
            errors.append(f"Duplicate within batch (entry {i}): {statement!r}")
        seen_in_batch.add(key)

        new_statements.append({
            "id": f"s{next_id:04d}",
            "pairId": None,
            "category": category,
            "statement": statement,
            "isTrue": False,
            "explanation": explanation,
        })
        next_id += 1

    if errors:
        print(f"Found {len(errors)} problem(s):")
        for e in errors:
            print(" -", e)
        sys.exit(1)

    combined = existing + new_statements
    STATEMENTS_PATH.write_text(json.dumps(combined, ensure_ascii=False, indent=None))

    print(f"Added {len(entries)} standalone false statements.")
    print(f"Total statements now: {len(combined)}")
    true_count = sum(1 for s in combined if s["isTrue"])
    false_count = sum(1 for s in combined if not s["isTrue"])
    print(f"True: {true_count}  False: {false_count}")


if __name__ == "__main__":
    main()
