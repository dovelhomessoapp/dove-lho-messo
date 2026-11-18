"""Boot an available iPhone, install the unsigned simulator app and verify launch."""
import json
import os
from pathlib import Path
import subprocess
import time


def run(*args):
    return subprocess.check_output(args, text=True).strip()


root = Path(__file__).resolve().parents[1]
app = root / 'build/Build/Products/Debug-iphonesimulator/App.app'
if not app.is_dir():
    raise SystemExit('Simulator app bundle missing')
devices = json.loads(run('xcrun', 'simctl', 'list', 'devices', 'available', '--json'))
candidates = [(runtime, device) for runtime, group in devices['devices'].items()
              if '.iOS-' in runtime for device in group
              if device.get('isAvailable') and device['name'].startswith('iPhone')]
if not candidates:
    raise SystemExit('No available iPhone simulator runtime')
# Reuse the store screenshot device so only one iPhone needs its first boot.
udid = run('python3', str(root / 'scripts/store-simulator.py'))
runtime, device = next((runtime, device) for runtime, device in candidates
                       if device['udid'] == udid)
print('Simulator:', device['name'], runtime, flush=True)
subprocess.run(['xcrun', 'simctl', 'install', udid, str(app)], check=True)
bundle = 'it.dovelhomesso.casadolcecasa'
launch = run('xcrun', 'simctl', 'launch', udid, bundle)
print('Launched:', launch, flush=True)
# Allow WKWebView to load bundled resources before capturing review evidence.
time.sleep(12)
# launchctl's service list contains the app only while its process remains alive.
services = run('xcrun', 'simctl', 'spawn', udid, 'launchctl', 'list')
if not any(bundle in line and line.split()[0].isdigit() for line in services.splitlines()):
    raise SystemExit('App process did not remain running after launch')
out = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'dlm-ios-smoke'
out.mkdir(parents=True, exist_ok=True)
subprocess.run(['xcrun', 'simctl', 'io', udid, 'screenshot', str(out / 'iphone-launch.png')], check=True)
(out / 'result.txt').write_text(f'Device: {device["name"]}\nRuntime: {runtime}\nLaunch: {launch}\nApp process remained running after 12 seconds.\nNo login, cloud writes, signing or upload tested.\n')
print('PASS: native simulator installation and persistent process launch; screenshot captured.')
