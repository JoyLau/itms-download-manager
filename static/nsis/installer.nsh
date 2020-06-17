!macro customHeader

!macroend

!macro preInit

!macroend

!macro customInit
        # guid=9e6c4ae5-2c1e-5203-b5ae-b18601d901ed
        ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{9e6c4ae5-2c1e-5203-b5ae-b18601d901ed}" "UninstallString"
        ${If} $0 != ""
            MessageBox MB_ICONINFORMATION|MB_TOPMOST  "检测到系统中已安装了本程序，将卸载旧版本,安装新版本,请知晓." IDOK
            # ExecWait $0 $1
        ${EndIf}
!macroend

!macro customInstall

!macroend

!macro customInstallMode
  # set $isForceMachineInstall or $isForceCurrentInstall
  # to enforce one or the other modes.
  #set $isForceMachineInstall
!macroend