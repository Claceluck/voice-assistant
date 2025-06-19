from pathlib import Path
import subprocess, json, sys

BASE       = Path(__file__).parent
EVAL_SCRIPT = BASE / 'eval_lq.py'
EXAMPLES    = BASE / 'input_examples.json'

def run_single(orig: str, proc: str, ref: str) -> dict:
    proc_py = subprocess.Popen(
        [sys.executable, str(EVAL_SCRIPT)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    payload = {'original_text': orig, 'processed_text': proc, 'reference_style': ref}
    out, err = proc_py.communicate(json.dumps(payload, ensure_ascii=False))
    if proc_py.returncode != 0:
        print(err, file=sys.stderr)
        raise RuntimeError("eval_lq.py failed")
    return json.loads(out)

def main():
    examples = json.load(open(EXAMPLES, encoding='utf-8'))
    header = f"{'ID':<3} {'G':>6} {'R':>6} {'S':>6} {'O':>6} {'LQ':>6}  Processed"
    print(header)
    print('-'*len(header))
    for ex in examples:
        orig = ex['original_text']
        proc = ex['processed_text']
        ref  = ex.get('reference_style', orig)
        m = run_single(orig, proc, ref)
        print(f"{ex['id']:<3} "
              f"{m['GrammarScore']:6.3f} "
              f"{m['ReadabilityScore']:6.3f} "
              f"{m['StyleConsistency']:6.3f} "
              f"{m['OriginalityScore']:6.3f} "
              f"{m['LQ_Score']:6.3f}  "
              f"{proc[:40]}...")

if __name__ == '__main__':
    main()
