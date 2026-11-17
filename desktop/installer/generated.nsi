; ESTIMO Admin — installation wizard.
; Written directly in NSIS so there is no "close the running app" gate at all:
; the app is installed into the user's own profile and the wizard only offers
; welcome, licence, destination, install and finish pages.

Unicode true
!include "MUI2.nsh"
!include "FileFunc.nsh"

!define APP_NAME "ESTIMO Admin"
!define APP_EXE "ESTIMO Admin.exe"
!define APP_VERSION "1.1.6"
!define PUBLISHER "ESTIMO"
!define APP_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ESTIMOAdmin"

!define SOURCE_DIR "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\release\\win-unpacked"
!define OUTPUT_FILE "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\release\\ESTIMO-Admin-Setup-1.1.6.exe"
!define LICENSE_FILE "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\build\\LICENSE.txt"
!define ICON_FILE "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\build\\icon.ico"
!define HEADER_BMP "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\build\\installerHeader.bmp"
!define SIDEBAR_BMP "C:\\Users\\kimat\\Desktop\\ESTIMO\\desktop\\build\\installerSidebar.bmp"

Name "${APP_NAME}"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\ESTIMO Admin"
InstallDirRegKey HKCU "${APP_KEY}" "InstallLocation"
RequestExecutionLevel user
BrandingText "ESTIMO"
SetCompressor /SOLID lzma

VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "ESTIMO Admin - catalogue and price console"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "LegalCopyright" "${PUBLISHER}"

!define MUI_ABORTWARNING
!define MUI_ICON "${ICON_FILE}"
!define MUI_UNICON "${ICON_FILE}"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "${HEADER_BMP}"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${SIDEBAR_BMP}"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${SIDEBAR_BMP}"
!define MUI_WELCOMEPAGE_TITLE "ESTIMO Admin"
!define MUI_WELCOMEPAGE_TEXT "This wizard installs the ESTIMO Admin console: the app that maintains material prices and the catalogue used by every ESTIMO estimate.$\r$\n$\r$\nYou can change the installation folder on the next pages. Nothing else on your computer is modified."
!define MUI_LICENSEPAGE_TEXT_TOP "Please read the following before installing ESTIMO Admin."
!define MUI_DIRECTORYPAGE_TEXT_TOP "ESTIMO Admin will be installed in the folder below. Choose another folder if you prefer."
!define MUI_FINISHPAGE_TITLE "ESTIMO Admin is ready"
!define MUI_FINISHPAGE_TEXT "The console is installed. Sign in with your ESTIMO admin account to edit prices and materials.$\r$\n$\r$\nPublished prices appear on the ESTIMO website within a minute."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Open ESTIMO Admin now"
!define MUI_FINISHPAGE_LINK "ESTIMO support"
!define MUI_FINISHPAGE_LINK_LOCATION "mailto:hello@estimo.app"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "${LICENSE_FILE}"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "ESTIMO Admin" SecMain
  SectionIn RO
  SetOutPath "$INSTDIR"
  File /r "${SOURCE_DIR}\*.*"

  CreateDirectory "$SMPROGRAMS\ESTIMO"
  CreateShortcut "$SMPROGRAMS\ESTIMO\ESTIMO Admin.lnk" "$INSTDIR\${APP_EXE}"
  CreateShortcut "$DESKTOP\ESTIMO Admin.lnk" "$INSTDIR\${APP_EXE}"

  WriteUninstaller "$INSTDIR\Uninstall ESTIMO Admin.exe"

  WriteRegStr HKCU "${APP_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "${APP_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "${APP_KEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKCU "${APP_KEY}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
  WriteRegStr HKCU "${APP_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${APP_KEY}" "UninstallString" "$\"$INSTDIR\Uninstall ESTIMO Admin.exe$\""
  WriteRegStr HKCU "${APP_KEY}" "QuietUninstallString" "$\"$INSTDIR\Uninstall ESTIMO Admin.exe$\" /S"
  WriteRegDWORD HKCU "${APP_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${APP_KEY}" "NoRepair" 1

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKCU "${APP_KEY}" "EstimatedSize" "$0"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\ESTIMO Admin.lnk"
  Delete "$SMPROGRAMS\ESTIMO\ESTIMO Admin.lnk"
  RMDir "$SMPROGRAMS\ESTIMO"
  DeleteRegKey HKCU "${APP_KEY}"
  RMDir /r "$INSTDIR"
SectionEnd
