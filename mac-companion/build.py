from pathlib import Path
import subprocess,plistlib,zipfile,tempfile
root=Path(__file__).resolve().parent
out=Path(tempfile.mkdtemp(prefix='learning-mac-build-'))
app=out/'Learning Space Time.app'
(app/'Contents/MacOS').mkdir(parents=True)
for arch in ['arm64','x86_64']:
 subprocess.run(['swiftc','-swift-version','5','-O','-target',arch+'-apple-macos15.0',str(root/'Tracker.swift'),'-o',str(out/arch)],check=True)
subprocess.run(['lipo','-create',str(out/'arm64'),str(out/'x86_64'),'-output',str(app/'Contents/MacOS/LearningSpaceTime')],check=True)
(app/'Contents/Info.plist').write_bytes(plistlib.dumps({'CFBundleIdentifier':'com.learningspace.time','CFBundleName':'Learning Space Time','CFBundleExecutable':'LearningSpaceTime','CFBundlePackageType':'APPL','CFBundleShortVersionString':'0.14.0','CFBundleVersion':'1','LSUIElement':True,'LSMinimumSystemVersion':'15.0'}))
subprocess.run(['codesign','--force','--sign','-',str(app)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
destination=root.parent/'public/downloads' if (root.parent/'public/downloads').is_dir() else root/'dist'
destination.mkdir(parents=True,exist_ok=True)
output=destination/'learning-space-mac-time.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
 for p in app.rglob('*'):
  if p.is_file():archive.write(p,p.relative_to(out))
 archive.write(root/'README.md','README.md')
 archive.write(root/'Tracker.swift','Source/Tracker.swift')
 archive.write(root/'build.py','Source/build.py')
print('Universal Mac companion built and signature checked: '+str(output))
