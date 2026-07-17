$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "assets\Kenney assets"
$target = Join-Path $root "assets\buddy\kenney"
$extract = Join-Path $target "extracted"

$dirs = @(
  $extract,
  (Join-Path $target "ui"),
  (Join-Path $target "emotes"),
  (Join-Path $target "actions"),
  (Join-Path $target "pets"),
  (Join-Path $target "audio"),
  (Join-Path $target "licenses")
)
foreach ($dir in $dirs) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

function Expand-Pack($zipName, $folderName) {
  $zip = Join-Path $source $zipName
  if (!(Test-Path $zip)) { throw "Missing Kenney ZIP: $zip" }
  $out = Join-Path $extract $folderName
  if (!(Test-Path $out)) { Expand-Archive -Path $zip -DestinationPath $out -Force }
  return $out
}

function Copy-Asset($base, $relative, $destination) {
  $src = Join-Path $base $relative
  if (!(Test-Path $src)) { throw "Missing asset in pack: $relative" }
  Copy-Item $src $destination -Force
  Write-Host "Copied $relative -> $destination"
}

$uiPack = Expand-Pack "kenney_ui-pack (1).zip" "ui-pack"
$rpgPack = Expand-Pack "kenney_ui-pack-rpg-expansion.zip" "ui-pack-rpg-expansion"
$cubePets = Expand-Pack "kenney_cube-pets_1.0.zip" "cube-pets"
$animalPack = Expand-Pack "kenney_animal-pack-remastered.zip" "animal-pack-remastered"
$uiAudio = Expand-Pack "kenney_ui-audio (1).zip" "ui-audio"
$rpgAudio = Expand-Pack "kenney_rpg-audio.zip" "rpg-audio"
$interfaceAudio = Expand-Pack "kenney_interface-sounds (1).zip" "interface-sounds"

Copy-Asset $rpgPack "PNG\buttonLong_beige.png" (Join-Path $target "ui\buddy_button_primary.png")
Copy-Asset $rpgPack "PNG\barBack_horizontalMid.png" (Join-Path $target "ui\buddy_progress_back.png")
Copy-Asset $rpgPack "PNG\barGreen_horizontalMid.png" (Join-Path $target "ui\buddy_progress_fill.png")
Copy-Asset $uiPack "PNG\Green\Default\button_square_gradient.png" (Join-Path $target "ui\buddy_action_button.png")
Copy-Asset $uiPack "PNG\Green\Default\button_round_gradient.png" (Join-Path $target "ui\buddy_round_button.png")

Copy-Asset $cubePets "Previews\animal-bee.png" (Join-Path $target "pets\buddy_bee.png")
Copy-Asset $cubePets "Previews\animal-caterpillar.png" (Join-Path $target "pets\buddy_caterpillar.png")
Copy-Asset $animalPack "PNG\Round\frog.png" (Join-Path $target "emotes\buddy_happy.png")
Copy-Asset $animalPack "PNG\Round\sloth.png" (Join-Path $target "emotes\buddy_sleepy.png")
Copy-Asset $animalPack "PNG\Round\rabbit.png" (Join-Path $target "emotes\buddy_love.png")

Copy-Asset $uiAudio "Audio\click3.ogg" (Join-Path $target "audio\buddy_tap.ogg")
Copy-Asset $uiAudio "Audio\switch5.ogg" (Join-Path $target "audio\buddy_switch.ogg")
Copy-Asset $interfaceAudio "Audio\confirmation_001.ogg" (Join-Path $target "audio\buddy_success.ogg")
Copy-Asset $rpgAudio "Audio\bookOpen.ogg" (Join-Path $target "audio\buddy_adventure.ogg")

Get-ChildItem -Path $extract -Recurse -File | Where-Object { $_.Name -match "license|licence|readme" } | ForEach-Object {
  $safeName = $_.FullName.Replace($extract, "").TrimStart("\").Replace("\", "_")
  Copy-Item $_.FullName (Join-Path $target "licenses\$safeName") -Force
}

Write-Host "Kenney Buddy assets imported successfully."
