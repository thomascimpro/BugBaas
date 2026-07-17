$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "assets\buddy\kenney"
$downloads = Join-Path $target "downloads"
$licenses = Join-Path $target "licenses"

New-Item -ItemType Directory -Force -Path $downloads | Out-Null
New-Item -ItemType Directory -Force -Path $licenses | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $target "ui") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $target "emotes") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $target "actions") | Out-Null

$packs = @(
  @{
    Name = "ui-pack-adventure"
    Url = "https://kenney.nl/media/pages/assets/ui-pack-adventure/9a877376bc-1723597274/kenney_ui-pack-adventure.zip"
    File = "kenney_ui-pack-adventure.zip"
  },
  @{
    Name = "emotes-pack"
    Url = "https://kenney.nl/media/pages/assets/emotes-pack/d00a3dcb06-1677578798/kenney_emotes-pack.zip"
    File = "kenney_emotes-pack.zip"
  },
  @{
    Name = "board-game-icons"
    Url = "https://kenney.nl/media/pages/assets/board-game-icons/19cae04050-1721645690/kenney_board-game-icons.zip"
    File = "kenney_board-game-icons.zip"
  }
)

foreach ($pack in $packs) {
  $zipPath = Join-Path $downloads $pack.File
  if (!(Test-Path $zipPath)) {
    Write-Host "Downloading $($pack.Name)..."
    Invoke-WebRequest -Uri $pack.Url -OutFile $zipPath
  }

  $extractPath = Join-Path $downloads $pack.Name
  if (!(Test-Path $extractPath)) {
    Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
  }

  $license = Get-ChildItem -Path $extractPath -Recurse -File | Where-Object { $_.Name -match "license|licence|readme" } | Select-Object -First 1
  if ($license) {
    Copy-Item $license.FullName (Join-Path $licenses "$($pack.Name)-license.txt") -Force
  }
}

Write-Host "Kenney packs downloaded and extracted."
Write-Host "Next: manually pick final PNGs and rename them to the filenames in assets/buddy/kenney-plan.md."
Write-Host "The app currently uses safe built-in vector/XML assets until those final PNGs are selected."
