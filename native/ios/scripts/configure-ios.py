"""Configure the generated Capacitor template, preserving project defaults."""
from pathlib import Path
import json, plistlib, shutil, subprocess
import xml.etree.ElementTree as ET
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

app = info.parent
scene = app / 'SceneDelegate.swift'
scene_text = scene.read_text()
root_controller = 'window?.rootViewController = CAPBridgeViewController()'
if scene_text.count(root_controller) != 1:
    raise RuntimeError('Capacitor root controller not found in SceneDelegate')
scene.write_text(scene_text.replace(root_controller, 'window?.rootViewController = DLMBridgeViewController()'))

storyboard = app / 'Base.lproj/Main.storyboard'
document = ET.parse(storyboard)
controller = document.find(".//viewController[@customClass='CAPBridgeViewController']")
if controller is None:
    raise RuntimeError('Capacitor bridge controller not found in storyboard')
controller.set('customClass', 'DLMBridgeViewController')
controller.set('customModule', 'App')
controller.set('customModuleProvider', 'target')
document.write(storyboard, encoding='utf-8', xml_declaration=True)

shutil.copyfile(root / 'scripts/QRPDF.swift', app / 'QRPDF.swift')
project = app.parent / 'App.xcodeproj/project.pbxproj'
project_text = project.read_text()
file_id = 'D1A400000000000000000001'
build_id = 'D1A400000000000000000002'
additions = {
    '/* Begin PBXBuildFile section */': f'\t\t{build_id} /* QRPDF.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {file_id}; }};',
    '/* Begin PBXFileReference section */': f'\t\t{file_id} /* QRPDF.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = QRPDF.swift; sourceTree = "<group>"; }};',
}
for anchor, line in additions.items():
    if project_text.count(anchor) != 1:
        raise RuntimeError(f'Unexpected Xcode project structure: {anchor}')
    project_text = project_text.replace(anchor, anchor + '\n' + line)
for existing, entry in [('AppDelegate.swift', f'{file_id} /* QRPDF.swift */'),
                        ('AppDelegate.swift in Sources', f'{build_id} /* QRPDF.swift in Sources */')]:
    anchor = next(line for line in project_text.splitlines() if line.strip().endswith(f'/* {existing} */,'))
    indent = anchor[:len(anchor) - len(anchor.lstrip())]
    project_text = project_text.replace(anchor, anchor + '\n' + indent + entry + ',')
project.write_text(project_text)

icons=root/'ios/App/App/Assets.xcassets/AppIcon.appiconset'
icons.mkdir(parents=True,exist_ok=True)
# Existing RGB icon, no generated artwork and no transparency.
subprocess.run(['sips','-z','1024','1024',str(root/'www/icon-512.png'),'--out',str(icons/'AppIcon-1024.png')],check=True)
(icons/'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon-1024.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}},indent=2))
print('Configured Italian camera/photo permission text and existing app icon.')
