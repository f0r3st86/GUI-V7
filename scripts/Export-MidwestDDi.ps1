<#
.SYNOPSIS
  Read-only export of the MidwestDDi database via the existing ODBC DSN.

  Runs on any machine that has the 'sqlDueDiligence' DSN configured (the
  same one Access and the Architecture workbook use). Windows auth — no
  credentials needed. Issues SELECT statements only; writes nothing to
  the database.

.USAGE
  Right-click > Run with PowerShell, or from a terminal:

    powershell -ExecutionPolicy Bypass -File .\Export-MidwestDDi.ps1

  Output: a timestamped folder on your Desktop containing
    _inventory.csv     - every table/view with row & column counts
    _schema.csv        - every column: table, name, data type, length,
                         precision, nullability (the authoritative DDL info)
    <table>.csv        - full data for each table in $TablesToExport

  CAUTION: the output contains production data (borrower PII). Keep it
  off shared drives and out of git. Upload to the Claude session directly.
#>

$ErrorActionPreference = 'Stop'

# ---- Configuration ----------------------------------------------------
$Dsn = 'sqlDueDiligence'
$Database = 'MidwestDDi'

# Tables to export in full (priority order from docs/INTERFACE-ALIGNMENT-PLAN.md
# Phase 4). Comment out any you don't want.
$TablesToExport = @(
  'tblBorrowers',
  'tblBorrowerLookup',
  'tblPayHistory',
  'tblProjections',
  'tblSSBid',
  'tblSSObligor',
  'tblcomments',
  'tblBPO',
  'tblLiens',
  'tblPools',
  'tblProjects',
  'tblInvestors'
)
# -----------------------------------------------------------------------

$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$outDir = Join-Path ([Environment]::GetFolderPath('Desktop')) "MidwestDDi-export-$stamp"
New-Item -ItemType Directory -Path $outDir | Out-Null

$conn = New-Object System.Data.Odbc.OdbcConnection("DSN=$Dsn;DATABASE=$Database")
try {
  $conn.Open()
} catch {
  $msg = $_.Exception.Message
  if ($msg -match 'Data source name not found' -and [Environment]::Is64BitProcess) {
    # The DSN likely lives in the 32-bit ODBC registry (Access is often
    # 32-bit). Relaunch this script under 32-bit PowerShell, which sees it.
    Write-Host 'DSN not visible to 64-bit PowerShell - retrying in 32-bit...'
    $ps32 = "$env:WINDIR\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"
    & $ps32 -ExecutionPolicy Bypass -File $PSCommandPath
    exit $LASTEXITCODE
  }
  Write-Error @"
Could not connect: $msg

Checklist:
  1. Are you on the office network or VPN?
  2. Does Access open the linked tables on THIS machine right now?
     (If Access works, the DSN and your permissions are fine.)
  3. Check the DSN name: Start > 'ODBC Data Sources' (try BOTH the
     64-bit and 32-bit apps) > System DSN tab > look for '$Dsn'.
"@
  exit 1
}
Write-Host "Connected to $Database via DSN $Dsn"

function Export-Query {
  param([string]$Sql, [string]$Path)
  $cmd = $conn.CreateCommand()
  $cmd.CommandText = $Sql
  $cmd.CommandTimeout = 300
  $adapter = New-Object System.Data.Odbc.OdbcDataAdapter($cmd)
  $table = New-Object System.Data.DataTable
  [void]$adapter.Fill($table)
  $table | Export-Csv -Path $Path -NoTypeInformation -Encoding UTF8
  return $table.Rows.Count
}

# 1. Full object inventory with row counts
Write-Host 'Exporting object inventory...'
$inventorySql = @"
SELECT t.TABLE_SCHEMA, t.TABLE_NAME, t.TABLE_TYPE,
       (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
         WHERE c.TABLE_NAME = t.TABLE_NAME AND c.TABLE_SCHEMA = t.TABLE_SCHEMA) AS ColumnCount,
       ISNULL(p.rows, -1) AS ApproxRows
FROM INFORMATION_SCHEMA.TABLES t
LEFT JOIN sys.tables st ON st.name = t.TABLE_NAME
LEFT JOIN sys.partitions p ON p.object_id = st.object_id AND p.index_id IN (0,1)
ORDER BY t.TABLE_TYPE, t.TABLE_NAME
"@
$n = Export-Query $inventorySql (Join-Path $outDir '_inventory.csv')
Write-Host "  _inventory.csv ($n objects)"

# 2. Authoritative column schema for every object
Write-Host 'Exporting column schema...'
$schemaSql = @"
SELECT TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE,
       CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE,
       IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
ORDER BY TABLE_NAME, ORDINAL_POSITION
"@
$n = Export-Query $schemaSql (Join-Path $outDir '_schema.csv')
Write-Host "  _schema.csv ($n columns)"

# 3. Full data for the priority tables
foreach ($tbl in $TablesToExport) {
  try {
    Write-Host "Exporting $tbl..."
    $n = Export-Query "SELECT * FROM [dbo].[$tbl]" (Join-Path $outDir "$tbl.csv")
    Write-Host "  $tbl.csv ($n rows)"
  } catch {
    Write-Warning "  Skipped $tbl : $($_.Exception.Message)"
  }
}

$conn.Close()
Write-Host ''
Write-Host "Done. Output: $outDir"
Write-Host 'Zip the folder and upload it to the Claude session.'
