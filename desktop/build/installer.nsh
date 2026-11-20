; ESTIMO Admin - NSIS hooks for the electron-builder installer.
;
; An upgrade has to replace ESTIMO Admin.exe, and Windows locks that file while
; the app runs. This asks Windows whether the process exists (never a write probe,
; which antivirus scans can make fail even when nothing is running), closes it,
; and only complains if it genuinely refuses to exit.

!include "LogicLib.nsh"

!define ESTIMO_APP_EXE "ESTIMO Admin.exe"

!ifdef BUILD_UNINSTALLER

Function un.estimoEnsureAppClosed
un.estimoRetry:
  nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}"'
  Pop $0
  ${if} $0 == 0
    Sleep 1200
    nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}" /F'
    Pop $0
    Sleep 600
    nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}"'
    Pop $0
    ${if} $0 == 0
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "ESTIMO Admin is still running.$\r$\n$\r$\nClose it, then click Retry to continue." IDRETRY un.estimoRetry
      Quit
    ${endif}
  ${endif}
FunctionEnd

!macro customUnInit
  Call un.estimoEnsureAppClosed
!macroend

!else

; taskkill returns 0 when the process was found (and closed), 128 when it is not
; running at all - so its exit code is a reliable "is the app open?" answer.
!macro estimoStopApp _FOUND
  nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}"'
  Pop $0
  ${if} $0 == 0
    StrCpy ${_FOUND} "yes"
    Sleep 1200
    nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}" /F'
    Pop $0
    Sleep 600
  ${else}
    StrCpy ${_FOUND} "no"
  ${endif}
!macroend

Function estimoEnsureAppClosed
  !insertmacro estimoStopApp $R2
  ${if} $R2 == "no"
    Return
  ${endif}

  StrCpy $R1 0
estimoRetry:
  nsExec::Exec 'taskkill /IM "${ESTIMO_APP_EXE}"'
  Pop $0
  ${if} $0 != 0
    Return
  ${endif}

  ${if} ${Silent}
    IntOp $R1 $R1 + 1
    ${if} $R1 < 12
      Sleep 700
      Goto estimoRetry
    ${endif}
    Quit
  ${else}
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "ESTIMO Admin is still running.$\r$\n$\r$\nClose it, then click Retry to continue." IDRETRY estimoRetry
    Quit
  ${endif}
FunctionEnd

!macro customCheckAppRunning
  Call estimoEnsureAppClosed
!macroend

!endif
