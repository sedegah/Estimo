; Overrides the "app is running" gate, which false-positives on some machines
; (the setup window itself matches the product name). Closing the app before an
; upgrade is still good practice, but the installer no longer blocks on it.
!macro customCheckAppRunning
!macroend
