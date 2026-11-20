; ESTIMO Admin - Inno Setup installer.
;
; Inno is used instead of NSIS because it installs per user without elevation,
; closes a running copy through the Windows restart manager instead of failing on
; a locked exe, and always writes a working uninstaller.
;
; Built by desktop/scripts/build-installer-inno.mjs:
;   ISCC.exe /DAppVersion=1.3.0 /DSourceDir=...\release\win-unpacked estimo-admin.iss

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif

#ifndef SourceDir
  #define SourceDir "..\release\win-unpacked"
#endif

#define AppName "ESTIMO Admin"
#define AppPublisher "ESTIMO"
#define AppExe "ESTIMO Admin.exe"

[Setup]
AppId={{7E2C1B4A-9F3D-4C58-9A61-2D8B5E7C4F10}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL=https://estimo-xi.vercel.app
DefaultDirName={autopf}\ESTIMO Admin
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
OutputDir=..\release
OutputBaseFilename=ESTIMO-Admin-Setup-{#AppVersion}
SetupIconFile=..\build\icon.ico
UninstallDisplayIcon={app}\{#AppExe}
UninstallDisplayName={#AppName}
VersionInfoVersion={#AppVersion}
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} - catalogue and price console
WizardStyle=modern
WizardImageFile=..\build\installerSidebar.bmp
WizardSmallImageFile=..\build\wizardSmall.bmp
WizardImageStretch=no
LicenseFile=..\build\LICENSE.txt
Compression=lzma2/max
SolidCompression=yes
CloseApplications=yes
RestartApplications=no
AllowNoIcons=yes
DisableWelcomePage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: checkedonce

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs restartreplace

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "Open {#AppName} now"; Flags: nowait postinstall skipifsilent
