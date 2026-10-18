from pathlib import Path
from zipfile import ZipFile,ZIP_STORED
import subprocess,shutil,os,hashlib,urllib.request,platform
root=Path(__file__).resolve().parent
build=root/'.build';build.mkdir(exist_ok=True)
toolchain=build/'toolchain';toolchain.mkdir(exist_ok=True)
artifacts={
 'aapt2':('https://dl.google.com/dl/android/maven2/com/android/tools/build/aapt2/8.8.2-12006047/aapt2-8.8.2-12006047-osx.jar','ed4dce04469f10ded1ddd753322217efcb72b201d0744a28869a5aedb1bf2c7e'),
 'android':('https://repo.maven.apache.org/maven2/org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar','6be2218c6a53fe3c57bc22ebdc723edcb7270a8a6f187545708aa5c0ed813977'),
 'r8':('https://dl.google.com/dl/android/maven2/com/android/tools/r8/8.8.34/r8-8.8.34.jar','84f28f3934f983af27939460e6b7b5e617530bcf8d61d9f72bb035b6819ec900'),
 'apksig':('https://dl.google.com/dl/android/maven2/com/android/tools/build/apksig/8.8.2/apksig-8.8.2.jar','c070ed1394629d74641aa0906f60b2ffa1ee77e6366a1f93437f59717b1aeb89')}
if platform.system()!='Darwin':raise SystemExit('This lightweight builder uses macOS aapt2. For other hosts use the Gradle project.')
paths={}
for name,(url,checksum) in artifacts.items():
 path=toolchain/(name+'.jar');existing=Path('/tmp/learning-'+name+'.jar')
 if not path.exists():
  if existing.exists():shutil.copyfile(existing,path)
  else:print('Fetching '+name+' toolchain artifact…',flush=True);urllib.request.urlretrieve(url,path)
 if hashlib.sha256(path.read_bytes()).hexdigest()!=checksum:raise SystemExit('Toolchain checksum mismatch: '+name)
 paths[name]=path
aapt=build/'aapt2'
with ZipFile(paths['aapt2']) as z:aapt.write_bytes(z.read('aapt2'))
aapt.chmod(0o755)
def run(*cmd):subprocess.run([str(x) for x in cmd],check=True,cwd=root)
run(aapt,'compile','--dir',root/'res','-o',build/'resources.zip')
run(aapt,'link','-o',build/'unsigned.apk','--manifest',root/'AndroidManifest.xml','-I',paths['android'],'--java',build/'generated',build/'resources.zip','--auto-add-overlay')
classes=build/'classes';classes.mkdir(exist_ok=True)
sources=list((root/'src').rglob('*.java'))+list((build/'generated').rglob('*.java'))
run('javac','--release','8','-cp',paths['android'],'-d',classes,*sources)
jar=build/'classes.jar';run('jar','cf',jar,'-C',classes,'.')
run('java','-cp',paths['r8'],'com.android.tools.r8.D8','--min-api','26','--lib',paths['android'],'--output',build,jar)
with ZipFile(build/'unsigned.apk','a',ZIP_STORED) as z:
 z.write(build/'classes.dex','classes.dex')
 for asset in (root/'assets').rglob('*'):
  if asset.is_file():z.write(asset,'assets/'+str(asset.relative_to(root/'assets')))
keystore=build/'debug.keystore'
if not keystore.exists():run('keytool','-genkeypair','-alias','learning-debug','-keystore',keystore,'-storetype','PKCS12','-storepass','android','-keypass','android','-dname','CN=Learning Space Development','-keyalg','RSA','-keysize','2048','-validity','10000')
run('javac','-cp',paths['apksig'],'-d',build,root/'tools/SignApk.java')
output=root.parent/'public/downloads/learning-space-android.apk';output.parent.mkdir(parents=True,exist_ok=True)
run('java','-cp',str(build)+os.pathsep+str(paths['apksig']),'SignApk',keystore,build/'unsigned.apk',output)
run('javac','-cp',paths['apksig'],'-d',build,root/'tools/LearningApkVerify.java')
run('java','-cp',str(build)+os.pathsep+str(paths['apksig']),'LearningApkVerify',output)
checkpath=str(classes)+os.pathsep+str(paths['android'])
run('javac','-cp',checkpath,'-d',build,root/'tools/WidgetStoreCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'WidgetStoreCheck')
run('javac','-cp',checkpath,'-d',build,root/'tools/LocalLibraryCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'LocalLibraryCheck')
run('javac','-cp',str(build)+os.pathsep+checkpath,'-d',build,root/'tools/WidgetMetricsCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'WidgetMetricsCheck')
print('Signed APK: '+str(output))

run('javac','-cp',checkpath,'-d',build,root/'tools/StudyTimerCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'StudyTimerCheck')

run('javac','-cp',checkpath,'-d',build,root/'tools/YouTubeMetadataCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'com.learningspace.YouTubeMetadataCheck')

run('javac','-cp',checkpath,'-d',build,root/'tools/ShareDraftsCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'com.learningspace.ShareDraftsCheck')

run('javac','-cp',checkpath,'-d',build,root/'tools/UsageTimelineCheck.java')
run('java','-cp',str(build)+os.pathsep+checkpath,'UsageTimelineCheck')
