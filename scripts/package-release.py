from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
root=Path.cwd()
with ZipFile(root/'public/downloads/learning-space-android-source.zip','w',ZIP_DEFLATED) as z:
 for p in (root/'android-companion').rglob('*'):
  if p.is_file() and not any(a in {'.build','.gradle','build','.DS_Store'} for a in p.relative_to(root/'android-companion').parts) and p.suffix!='.keystore':
   z.write(p,Path('learning-space-android')/p.relative_to(root/'android-companion'))
with ZipFile(root/'public/downloads/learning-space-lan.zip','w',ZIP_DEFLATED) as z:
 z.write(root/'.local-tools/server.mjs','learning-space-lan/server.mjs')
 z.write(root/'offline/COMPUTER_SETUP.md','learning-space-lan/README.md')
 for p in (root/'.offline-dist').rglob('*'):
  if p.is_file():z.write(p,Path('learning-space-lan/www')/p.relative_to(root/'.offline-dist'))
 z.write(root/'public/downloads/learning-space-android.apk','learning-space-lan/www/downloads/learning-space-android.apk')
 z.write(root/'public/downloads/learning-space-mac-time.zip','learning-space-lan/www/downloads/learning-space-mac-time.zip')
print('Android source and portable computer setup packaged.')
