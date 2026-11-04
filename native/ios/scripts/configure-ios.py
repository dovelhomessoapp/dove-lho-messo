"""Configure the generated Capacitor template, preserving project defaults."""
from pathlib import Path
import json, plistlib, subprocess
root=Path(__file__).resolve().parents[1]
info=root/'ios/App/App/Info.plist'
with info.open('rb') as f: data=plistlib.load(f)
data.update({
 'CFBundleDisplayName':'Dove l’ho messo?',
 'NSCameraUsageDescription':'La fotocamera serve per fotografare oggetti e posizioni e leggere QR e codici a barre.',
 'NSPhotoLibraryUsageDescription':'Puoi scegliere una foto per gli oggetti, i libri e le posizioni della tua casa.',
 'ITSAppUsesNonExemptEncryption':False,
})
with info.open('wb') as f: plistlib.dump(data,f)
icons=root/'ios/App/App/Assets.xcassets/AppIcon.appiconset'
icons.mkdir(parents=True,exist_ok=True)
# Existing RGB icon, no generated artwork and no transparency.
subprocess.run(['sips','-z','1024','1024',str(root/'www/icon-512.png'),'--out',str(icons/'AppIcon-1024.png')],check=True)
(icons/'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon-1024.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2))
print('Configured Italian camera/photo permission text and existing app icon.')
