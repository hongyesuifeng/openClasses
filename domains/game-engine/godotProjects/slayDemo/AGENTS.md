# slayDemo Agent Rules

## Test Before Delivery

After every feature or module development task, run the project unit test suite before delivery.

Required command from the repository root:

```bash
cd client/slay-demo
godot --headless --path . res://tests/test_runner.tscn
```

If Godot is not available on `PATH` in WSL, use the Windows console binary as documented in `client/slay-demo/tests/README.md`.

Delivery is complete only when the test run exits with code `0` and includes:

```text
All tests passed.
```

If tests fail, fix the failing behavior and rerun the suite. If the local environment cannot run Godot tests, report that clearly and ask the user to run the command manually before accepting delivery.
