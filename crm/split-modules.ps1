$root = "C:/Users/kopga/Desktop/Website"
$src = Join-Path $root "crm/app.js"
$lines = Get-Content -Path $src

function Write-Chunk {
  param(
    [int]$Start,
    [int]$End,
    [string]$RelativePath
  )

  $segment = $lines[($Start - 1)..($End - 1)] -join [Environment]::NewLine
  $segment = $segment.TrimEnd() + [Environment]::NewLine
  $full = Join-Path $root $RelativePath
  $dir = Split-Path $full
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  Set-Content -Path $full -Value $segment -Encoding UTF8
}

Write-Chunk -Start 1 -End 619 -RelativePath "crm/js/core/i18n.js"
Write-Chunk -Start 620 -End 663 -RelativePath "crm/js/core/state.js"
Write-Chunk -Start 673 -End 1390 -RelativePath "crm/js/core/bootstrap.js"
Write-Chunk -Start 1391 -End 1493 -RelativePath "crm/js/modules/clients/filters.js"
Write-Chunk -Start 1494 -End 1647 -RelativePath "crm/js/modules/clients/table.js"
Write-Chunk -Start 1648 -End 1830 -RelativePath "crm/js/modules/clients/modal.js"
Write-Chunk -Start 1831 -End 1905 -RelativePath "crm/js/modules/settings/profile.js"
Write-Chunk -Start 1906 -End 1972 -RelativePath "crm/js/modules/settings/index.js"
Write-Chunk -Start 1973 -End 2528 -RelativePath "crm/js/modules/sales/index.js"
Write-Chunk -Start 2529 -End 3298 -RelativePath "crm/js/modules/warehouse/index.js"
Write-Chunk -Start 3299 -End 3406 -RelativePath "crm/js/modules/settings/managers.js"
Write-Chunk -Start 3407 -End 3457 -RelativePath "crm/js/modules/settings/stores.js"
Write-Chunk -Start 3458 -End 4012 -RelativePath "crm/js/core/api.js"
Write-Chunk -Start 4014 -End 4221 -RelativePath "crm/js/core/utils.js"

Set-Content -Path (Join-Path $root "crm/js/modules/clients/index.js") -Value "// clients module orchestrator`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/integrations/index.js") -Value "// integrations module placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/hr/index.js") -Value "// hr module placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/price-label/index.js") -Value "// price-label module placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/notifications/index.js") -Value "// notifications module placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/sales/receipt.js") -Value "// sales receipt helpers placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/warehouse/incoming.js") -Value "// warehouse incoming helpers placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/modules/warehouse/stock.js") -Value "// warehouse stock helpers placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/core/dom.js") -Value "// dom helpers placeholder`n" -Encoding UTF8
Set-Content -Path (Join-Path $root "crm/js/core/storage.js") -Value "// storage helpers placeholder`n" -Encoding UTF8

$main = @"
init().catch((err) => {
  document.body.classList.remove("booting");
  const authView = document.getElementById("authView");
  const appView = document.getElementById("appView");
  if (authView) authView.classList.remove("hidden");
  if (appView) appView.classList.add("hidden");
  console.error("CRM init failed:", err);
});
"@

Set-Content -Path (Join-Path $root "crm/js/main.js") -Value $main -Encoding UTF8
