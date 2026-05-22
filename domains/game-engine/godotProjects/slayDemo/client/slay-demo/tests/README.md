# SlayDemo V1 Tests

## Run All Tests

From `client/slay-demo/`:

```bash
godot --headless --path . res://tests/test_runner.tscn
```

If Godot is not on `PATH` in WSL, run the Windows console binary through PowerShell:

```bash
PROJECT_PATH="$(wslpath -w "$PWD")"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \
  "& 'C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe' --headless --path '$PROJECT_PATH' 'res://tests/test_runner.tscn'"
```

Expected success output:

```text
All tests passed.
```

## Run Scene Automation

This test boots the real `app_root.tscn`, presses the generated main menu start button, enters the generated battle scene, plays through the first combat through `BattleScene`, and verifies that the reward scene appears.

```bash
godot --headless --path . res://tests/integration/scene_runtime_test.tscn
```

Windows console binary from WSL:

```bash
PROJECT_PATH="$(wslpath -w "$PWD")"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \
  "& 'C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe' --headless --path '$PROJECT_PATH' 'res://tests/integration/scene_runtime_test.tscn'"
```

Expected success output:

```text
Scene runtime test passed.
```

## Test Layout

```text
tests/
├── framework/
│   └── test_context.gd
├── unit/
│   ├── data_loader_test.gd
│   ├── deck_runtime_test.gd
│   ├── battle_rules_test.gd
│   └── reward_service_test.gd
├── integration/
│   └── v1_flow_test.gd
├── test_runner.gd
└── test_runner.tscn
```

Use unit tests for isolated rules such as data loading, deck movement, damage, block, energy, and reward generation.

Use integration tests for run-level behavior such as:

```text
3 normal battles -> rewards -> boss -> result
```

To add a test:

1. Create a script in `tests/unit/` or `tests/integration/`.
2. Implement `name() -> String` and `run(ctx: Variant) -> void`.
3. Add the script to `TEST_SCRIPTS` in `tests/test_runner.gd`.
