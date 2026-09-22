"""Append a batch of (category, true, false, explanation) pairs to statements.json.

Usage: python3 scripts/add_batch.py scripts/batch_002_pairs.py
The batch module must define a top-level PAIRS list of 4-tuples.
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
    return mod.PAIRS


def main():
    if len(sys.argv) != 2:
        print("Usage: add_batch.py <path-to-batch-file>")
        sys.exit(1)

    batch_path = Path(sys.argv[1])
    pairs = load_batch(batch_path)

    existing = json.loads(STATEMENTS_PATH.read_text())
    existing_texts = {s["statement"].strip().lower() for s in existing}
    max_id_num = max(int(s["id"][1:]) for s in existing)
    max_pair_id = max((s["pairId"] for s in existing if s["pairId"] is not None), default=0)

    next_id = max_id_num + 1
    next_pair_id = max_pair_id + 1

    new_statements = []
    seen_in_batch = set()
    errors = []

    for i, (category, true_stmt, false_stmt, explanation) in enumerate(pairs):
        for stmt in (true_stmt, false_stmt):
            key = stmt.strip().lower()
            if key in existing_texts:
                errors.append(f"Duplicate of existing statement (pair {i}): {stmt!r}")
            if key in seen_in_batch:
                errors.append(f"Duplicate within batch (pair {i}): {stmt!r}")
            seen_in_batch.add(key)

        pair_id = next_pair_id
        next_pair_id += 1

        for stmt, is_true in ((true_stmt, True), (false_stmt, False)):
            new_statements.append({
                "id": f"s{next_id:04d}",
                "pairId": pair_id,
                "category": category,
                "statement": stmt,
                "isTrue": is_true,
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

    print(f"Added {len(pairs)} pairs ({len(new_statements)} statements).")
    print(f"Total statements now: {len(combined)}")
    cats = {}
    for s in combined:
        cats[s["category"]] = cats.get(s["category"], 0) + 1
    print("Category counts:", cats)


if __name__ == "__main__":
    main()
