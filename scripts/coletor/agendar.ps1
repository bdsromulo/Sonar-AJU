# Agenda a coleta quinzenal do Sonar Caju como Tarefa Agendada do Windows.
# Rode UMA vez no PowerShell (não precisa admin):  ./scripts/coletor/agendar.ps1
# Para remover:  Unregister-ScheduledTask -TaskName "SonarCaju-Coleta" -Confirm:$false

$ErrorActionPreference = "Stop"
$projeto = (Resolve-Path "$PSScriptRoot\..\..").Path
$npm = (Get-Command npm).Source

# Roda "npm run coletar" na pasta do projeto. Dias 1 e 15 de cada mês, 09:00.
$acao = New-ScheduledTaskAction -Execute "cmd.exe" `
  -Argument "/c cd /d `"$projeto`" && `"$npm`" run coletar >> `"$projeto\scripts\coletor\coleta.log`" 2>&1"

$gatilho1 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 9am
# (quinzenal aproximado: toda segunda; ajuste como preferir no Agendador de Tarefas)

$config = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd `
  -ExecutionTimeLimit (New-TimeSpan -Hours 4)

Register-ScheduledTask -TaskName "SonarCaju-Coleta" -Action $acao -Trigger $gatilho1 `
  -Settings $config -Description "Coleta quinzenal de precos do Sonar Caju" -Force

Write-Host "OK — tarefa 'SonarCaju-Coleta' agendada (segundas 09:00). Log em scripts/coletor/coleta.log"
Write-Host "O commit do observations.json continua manual: rode 'git add/commit/push' apos revisar."
