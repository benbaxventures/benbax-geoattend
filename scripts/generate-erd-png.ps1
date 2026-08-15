Add-Type -AssemblyName System.Drawing

$output = Join-Path (Get-Location) "erd.png"

$tables = @(
  @{ Name = "institutions"; X = 1540; Y = 70; Fields = @(
    "id UUID PK", "name VARCHAR", "institution_code VARCHAR UK", "address TEXT", "city VARCHAR", "region VARCHAR",
    "latitude DECIMAL", "longitude DECIMAL", "geofence_radius INTEGER", "timezone VARCHAR", "logo_url TEXT",
    "qr_rotation_token VARCHAR", "qr_rotated_at TIMESTAMP", "created_at TIMESTAMP", "updated_at TIMESTAMP"
  )},
  @{ Name = "staff"; X = 100; Y = 520; Fields = @(
    "id UUID PK", "institution_id UUID FK", "staff_id VARCHAR", "first_name VARCHAR", "last_name VARCHAR",
    "email VARCHAR", "phone VARCHAR", "department VARCHAR", "position VARCHAR", "password_hash VARCHAR",
    "qr_code_data VARCHAR UK", "profile_photo_url TEXT", "role VARCHAR", "member_type VARCHAR",
    "google_id VARCHAR UK", "push_token TEXT", "is_active BOOLEAN", "created_at TIMESTAMP", "updated_at TIMESTAMP"
  )},
  @{ Name = "attendance_records"; X = 690; Y = 520; Fields = @(
    "id UUID PK", "staff_uuid UUID FK", "institution_id UUID FK", "check_in_time TIMESTAMP", "check_out_time TIMESTAMP",
    "check_in_latitude DECIMAL", "check_in_longitude DECIMAL", "check_out_latitude DECIMAL", "check_out_longitude DECIMAL",
    "check_in_method VARCHAR", "check_out_method VARCHAR", "device_id VARCHAR", "is_late BOOLEAN",
    "is_within_geofence BOOLEAN", "notes TEXT", "date DATE", "created_at TIMESTAMP"
  )},
  @{ Name = "attendance_rules"; X = 1280; Y = 600; Fields = @(
    "id UUID PK", "institution_id UUID FK", "member_type VARCHAR", "work_start_time TIME", "work_end_time TIME",
    "late_threshold_minutes INTEGER", "early_departure_minutes INTEGER", "working_days INTEGER[]",
    "created_at TIMESTAMP", "updated_at TIMESTAMP"
  )},
  @{ Name = "subscriptions"; X = 1870; Y = 610; Fields = @(
    "id UUID PK", "institution_id UUID FK", "plan_name VARCHAR", "status VARCHAR", "trial_start TIMESTAMP",
    "trial_end TIMESTAMP", "current_period_end TIMESTAMP", "payment_reference VARCHAR", "created_at TIMESTAMP",
    "updated_at TIMESTAMP"
  )},
  @{ Name = "audit_logs"; X = 2460; Y = 610; Fields = @(
    "id UUID PK", "institution_id UUID FK", "action VARCHAR", "entity_type VARCHAR", "entity_id VARCHAR",
    "details JSONB", "performed_by VARCHAR", "ip_address VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "leave_requests"; X = 100; Y = 1270; Fields = @(
    "id UUID PK", "staff_uuid UUID FK", "institution_id UUID FK", "leave_type VARCHAR", "start_date DATE", "end_date DATE",
    "reason TEXT", "status VARCHAR", "reviewed_by UUID FK", "reviewed_at TIMESTAMP", "review_note TEXT",
    "created_at TIMESTAMP", "updated_at TIMESTAMP"
  )},
  @{ Name = "device_logs"; X = 690; Y = 1230; Fields = @(
    "id UUID PK", "staff_uuid UUID FK", "device_id VARCHAR", "device_model VARCHAR", "os_version VARCHAR",
    "app_version VARCHAR", "action VARCHAR", "ip_address VARCHAR", "timestamp TIMESTAMP"
  )},
  @{ Name = "courses"; X = 1280; Y = 1240; Fields = @(
    "id UUID PK", "institution_id UUID FK", "code VARCHAR", "name VARCHAR", "department VARCHAR",
    "credit_hours INTEGER", "attendance_threshold INTEGER", "is_active BOOLEAN", "created_at TIMESTAMP",
    "updated_at TIMESTAMP"
  )},
  @{ Name = "fraud_events"; X = 2460; Y = 1140; Fields = @(
    "id UUID PK", "institution_id UUID FK", "staff_uuid UUID FK", "event_type VARCHAR", "details JSONB",
    "ip_address VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "course_lecturers"; X = 690; Y = 1650; Fields = @(
    "id UUID PK", "course_id UUID FK", "lecturer_id UUID FK", "created_at TIMESTAMP"
  )},
  @{ Name = "enrollments"; X = 1870; Y = 1570; Fields = @(
    "id UUID PK", "course_id UUID FK", "student_id UUID FK", "semester VARCHAR", "status VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "guardians"; X = 3050; Y = 1510; Fields = @(
    "id UUID PK", "student_id UUID FK", "name VARCHAR", "phone VARCHAR", "email VARCHAR", "relationship VARCHAR",
    "notify_on_absence BOOLEAN", "created_at TIMESTAMP"
  )},
  @{ Name = "overtime_records"; X = 100; Y = 1810; Fields = @(
    "id UUID PK", "staff_uuid UUID FK", "institution_id UUID FK", "date DATE", "overtime_minutes INTEGER",
    "reason VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "lecture_schedules"; X = 1280; Y = 1800; Fields = @(
    "id UUID PK", "course_id UUID FK", "institution_id UUID FK", "day_of_week INTEGER", "start_time TIME",
    "end_time TIME", "venue VARCHAR", "is_active BOOLEAN", "created_at TIMESTAMP"
  )},
  @{ Name = "lecture_instances"; X = 1870; Y = 2100; Fields = @(
    "id UUID PK", "schedule_id UUID FK", "course_id UUID FK", "institution_id UUID FK", "date DATE",
    "start_time TIME", "end_time TIME", "status VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "lecture_attendance"; X = 2460; Y = 2070; Fields = @(
    "id UUID PK", "lecture_instance_id UUID FK", "student_id UUID FK", "course_id UUID FK",
    "check_in_time TIMESTAMP", "is_late BOOLEAN", "is_within_geofence BOOLEAN", "method VARCHAR", "created_at TIMESTAMP"
  )},
  @{ Name = "geofence_events"; X = 690; Y = 2220; Fields = @(
    "id UUID PK", "institution_id UUID FK", "staff_uuid UUID FK", "event VARCHAR", "latitude DECIMAL",
    "longitude DECIMAL", "distance_m INTEGER", "radius_m INTEGER", "created_at TIMESTAMP", "resolved_at TIMESTAMP",
    "notes TEXT"
  )},
  @{ Name = "absence_notifications"; X = 3050; Y = 2100; Fields = @(
    "id UUID PK", "student_id UUID FK", "course_id UUID FK", "lecture_instance_id UUID FK", "guardian_id UUID FK",
    "notification_type VARCHAR", "channel VARCHAR", "message TEXT", "sent_at TIMESTAMP", "status VARCHAR"
  )}
)

$relationships = @(
  @("institutions","staff"), @("institutions","attendance_records"), @("institutions","attendance_rules"),
  @("institutions","subscriptions"), @("institutions","audit_logs"), @("institutions","courses"),
  @("institutions","leave_requests"), @("institutions","overtime_records"), @("institutions","fraud_events"),
  @("institutions","lecture_schedules"), @("institutions","lecture_instances"), @("institutions","geofence_events"),
  @("staff","attendance_records"), @("staff","device_logs"), @("staff","leave_requests"), @("staff","overtime_records"),
  @("staff","fraud_events"), @("staff","course_lecturers"), @("staff","enrollments"), @("staff","guardians"),
  @("staff","lecture_attendance"), @("staff","absence_notifications"), @("staff","geofence_events"),
  @("courses","course_lecturers"), @("courses","enrollments"), @("courses","lecture_schedules"),
  @("courses","lecture_instances"), @("courses","lecture_attendance"), @("courses","absence_notifications"),
  @("lecture_schedules","lecture_instances"), @("lecture_instances","lecture_attendance"),
  @("lecture_instances","absence_notifications"), @("guardians","absence_notifications")
)

$width = 3650
$height = 2800
$boxWidth = 500
$headerHeight = 44
$rowHeight = 28
$margin = 16

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$background = [System.Drawing.Color]::FromArgb(248, 250, 252)
$ink = [System.Drawing.Color]::FromArgb(15, 23, 42)
$muted = [System.Drawing.Color]::FromArgb(71, 85, 105)
$lineColor = [System.Drawing.Color]::FromArgb(124, 58, 237)
$headerFill = [System.Drawing.Color]::FromArgb(30, 41, 59)
$tableFill = [System.Drawing.Color]::FromArgb(255, 255, 255)
$border = [System.Drawing.Color]::FromArgb(148, 163, 184)
$pkColor = [System.Drawing.Color]::FromArgb(22, 101, 52)
$fkColor = [System.Drawing.Color]::FromArgb(29, 78, 216)

$graphics.Clear($background)

$titleFont = New-Object System.Drawing.Font "Segoe UI", 30, ([System.Drawing.FontStyle]::Bold)
$subtitleFont = New-Object System.Drawing.Font "Segoe UI", 15
$headerFont = New-Object System.Drawing.Font "Segoe UI", 15, ([System.Drawing.FontStyle]::Bold)
$fieldFont = New-Object System.Drawing.Font "Segoe UI", 12
$fieldBoldFont = New-Object System.Drawing.Font "Segoe UI", 12, ([System.Drawing.FontStyle]::Bold)

$graphics.DrawString("Geofence Attendance App ERD", $titleFont, (New-Object System.Drawing.SolidBrush $ink), 100, 34)
$graphics.DrawString("Derived from backend/src/migrations/run.js and backend/src/migrations/003_courses_lectures.sql", $subtitleFont, (New-Object System.Drawing.SolidBrush $muted), 102, 82)

$tableMap = @{}
foreach ($table in $tables) {
  $heightForTable = $headerHeight + ($table.Fields.Count * $rowHeight) + 14
  $tableMap[$table.Name] = @{
    X = [int]$table.X
    Y = [int]$table.Y
    W = $boxWidth
    H = $heightForTable
  }
}

function Get-Center($rect) {
  return New-Object System.Drawing.PointF (($rect.X + ($rect.W / 2)), ($rect.Y + ($rect.H / 2)))
}

$linePen = New-Object System.Drawing.Pen $lineColor, 2.4
$linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round

foreach ($rel in $relationships) {
  $a = $tableMap[$rel[0]]
  $b = $tableMap[$rel[1]]
  $ca = Get-Center $a
  $cb = Get-Center $b
  $graphics.DrawLine($linePen, $ca, $cb)
}

$headerBrush = New-Object System.Drawing.SolidBrush $headerFill
$tableBrush = New-Object System.Drawing.SolidBrush $tableFill
$inkBrush = New-Object System.Drawing.SolidBrush $ink
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$mutedBrush = New-Object System.Drawing.SolidBrush $muted
$pkBrush = New-Object System.Drawing.SolidBrush $pkColor
$fkBrush = New-Object System.Drawing.SolidBrush $fkColor
$borderPen = New-Object System.Drawing.Pen $border, 1.6
$rowPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(226, 232, 240)), 1

foreach ($table in $tables) {
  $rect = $tableMap[$table.Name]
  $bodyRect = New-Object System.Drawing.Rectangle $rect.X, $rect.Y, $rect.W, $rect.H
  $headerRect = New-Object System.Drawing.Rectangle $rect.X, $rect.Y, $rect.W, $headerHeight

  $graphics.FillRectangle($tableBrush, $bodyRect)
  $graphics.FillRectangle($headerBrush, $headerRect)
  $graphics.DrawRectangle($borderPen, $bodyRect)
  $graphics.DrawString($table.Name, $headerFont, $whiteBrush, ($rect.X + $margin), ($rect.Y + 9))

  $y = $rect.Y + $headerHeight + 8
  foreach ($field in $table.Fields) {
    $graphics.DrawLine($rowPen, $rect.X, ($y - 5), ($rect.X + $rect.W), ($y - 5))
    $parts = $field -split " "
    $fieldName = $parts[0]
    $typeText = ($parts | Select-Object -Skip 1) -join " "
    $graphics.DrawString($fieldName, $fieldBoldFont, $inkBrush, ($rect.X + $margin), $y)
    $graphics.DrawString($typeText, $fieldFont, $mutedBrush, ($rect.X + 245), $y)
    if ($field -match "\bPK\b") {
      $graphics.DrawString("PK", $fieldBoldFont, $pkBrush, ($rect.X + $rect.W - 62), $y)
    } elseif ($field -match "\bFK\b") {
      $graphics.DrawString("FK", $fieldBoldFont, $fkBrush, ($rect.X + $rect.W - 62), $y)
    } elseif ($field -match "\bUK\b") {
      $graphics.DrawString("UK", $fieldBoldFont, $fkBrush, ($rect.X + $rect.W - 62), $y)
    }
    $y += $rowHeight
  }
}

$legendY = 2650
$graphics.FillRectangle($tableBrush, (New-Object System.Drawing.Rectangle 100, $legendY, 1260, 80))
$graphics.DrawRectangle($borderPen, (New-Object System.Drawing.Rectangle 100, $legendY, 1260, 80))
$graphics.DrawString("Notation: PK = primary key, FK = foreign key, UK = unique key. Lines indicate one-to-many relationships from referenced table to dependent table.", $subtitleFont, $inkBrush, 124, ($legendY + 26))

$bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Generated $output"
