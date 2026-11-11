"""Select a real simulator device with an App Store supported display size."""
import json, subprocess
info=json.loads(subprocess.check_output(['xcrun','simctl','list','devices','available','--json']))
preferred=['iPhone 16 Pro','iPhone 15 Pro','iPhone 15','iPhone 14 Pro','iPhone 16']
for name in preferred:
    matches=[d for runtime, ds in info['devices'].items() if '.iOS-' in runtime for d in ds if d.get('isAvailable') and d['name']==name]
    if matches:
        d=matches[-1]
        if d['state']!='Booted': subprocess.run(['xcrun','simctl','boot',d['udid']],check=True,stdout=subprocess.DEVNULL)
        subprocess.run(['xcrun','simctl','bootstatus',d['udid'],'-b'],check=True,stdout=subprocess.DEVNULL,timeout=600)
        print(d['udid'])
        break
else: raise SystemExit('No supported Dynamic Island iPhone simulator found')
