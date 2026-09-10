# Graph Report -   (2026-04-15)

## Corpus Check
- 98 files · ~51,673 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 264 nodes · 217 edges · 83 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]

## God Nodes (most connected - your core abstractions)
1. `sendEmail()` - 6 edges
2. `sendSMS()` - 6 edges
3. `getSubscriptionPayload()` - 5 edges
4. `MainActivity` - 5 edges
5. `requireActiveSubscription()` - 4 edges
6. `detectAbsences()` - 4 edges
7. `HomeScreen()` - 4 edges
8. `ProfileScreen()` - 4 edges
9. `syncQueue()` - 4 edges
10. `useTheme()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `getSubscriptionPayload()` --calls--> `ensureTrialSubscription()`  [INFERRED]
  backend\src\controllers\authController.js → backend\src\services\subscriptionService.js
- `getSubscriptionPayload()` --calls--> `getCurrentSubscription()`  [INFERRED]
  backend\src\controllers\authController.js → backend\src\services\subscriptionService.js
- `getSubscriptionPayload()` --calls--> `buildSubscriptionSnapshot()`  [INFERRED]
  backend\src\controllers\authController.js → backend\src\services\subscriptionService.js
- `requireActiveSubscription()` --calls--> `ensureTrialSubscription()`  [INFERRED]
  backend\src\middleware\subscription.js → backend\src\services\subscriptionService.js
- `requireActiveSubscription()` --calls--> `getCurrentSubscription()`  [INFERRED]
  backend\src\middleware\subscription.js → backend\src\services\subscriptionService.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (15): getTransporter(), sendAbsenceAlert(), sendAutoSuspendNotice(), sendDailySummary(), sendEmail(), sendWeeklySummary(), autoSuspendInactive(), detectAbsences() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (10): cancelLeave(), checkIn(), checkOut(), getMyLeaves(), getProfile(), googleLogin(), login(), postGeofenceEvent() (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.0
Nodes (8): App(), MainTabs(), HomeScreen(), useI18n(), LoginScreen(), ProfileScreen(), useTheme(), useToast()

### Community 4 - "Community 4"
Cohesion: 0.0
Nodes (8): getSubscriptionPayload(), getSubscriptionPayloadSafe(), requireActiveSubscription(), buildSubscriptionSnapshot(), ensureTrialSubscription(), getCurrentSubscription(), getInstitutionByCode(), normalizeInstitutionCode()

### Community 5 - "Community 5"
Cohesion: 0.0
Nodes (1): MainApplication

### Community 6 - "Community 6"
Cohesion: 0.0
Nodes (1): MainActivity

### Community 7 - "Community 7"
Cohesion: 0.0
Nodes (2): register(), registerValidSW()

### Community 8 - "Community 8"
Cohesion: 0.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 0.0
Nodes (0): 

### Community 10 - "Community 10"
Cohesion: 0.0
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 0.0
Nodes (3): calculateDistance(), isWithinGeofence(), toRadians()

### Community 12 - "Community 12"
Cohesion: 0.0
Nodes (0): 

### Community 13 - "Community 13"
Cohesion: 0.0
Nodes (2): getCurrentLocation(), requestLocationPermission()

### Community 14 - "Community 14"
Cohesion: 0.0
Nodes (4): Admin Authentication Setup Guide, Geofence - Geofenced Attendance Management System, Graph Report - .  (2026-04-15), Mobile App Local Development Setup

### Community 15 - "Community 15"
Cohesion: 0.0
Nodes (2): Sidebar(), useIsMobile()

### Community 16 - "Community 16"
Cohesion: 0.0
Nodes (2): Dashboard(), useIsMobile()

### Community 17 - "Community 17"
Cohesion: 0.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 0.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 0.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 0.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 0.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 0.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 0.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 0.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 0.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 0.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 0.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 0.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 0.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 0.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 0.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 0.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 0.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 0.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 0.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 0.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 0.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 0.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 0.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 0.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 0.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 0.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 0.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 0.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 0.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 0.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 0.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 0.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 0.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 0.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 0.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 0.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 0.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 0.0
Nodes (0): 

### Community 62 - "Community 62"
Cohesion: 0.0
Nodes (0): 

### Community 63 - "Community 63"
Cohesion: 0.0
Nodes (0): 

### Community 64 - "Community 64"
Cohesion: 0.0
Nodes (0): 

### Community 65 - "Community 65"
Cohesion: 0.0
Nodes (0): 

### Community 66 - "Community 66"
Cohesion: 0.0
Nodes (0): 

### Community 67 - "Community 67"
Cohesion: 0.0
Nodes (0): 

### Community 68 - "Community 68"
Cohesion: 0.0
Nodes (0): 

### Community 69 - "Community 69"
Cohesion: 0.0
Nodes (0): 

### Community 70 - "Community 70"
Cohesion: 0.0
Nodes (0): 

### Community 71 - "Community 71"
Cohesion: 0.0
Nodes (0): 

### Community 72 - "Community 72"
Cohesion: 0.0
Nodes (0): 

### Community 73 - "Community 73"
Cohesion: 0.0
Nodes (0): 

### Community 74 - "Community 74"
Cohesion: 0.0
Nodes (0): 

### Community 75 - "Community 75"
Cohesion: 0.0
Nodes (0): 

### Community 76 - "Community 76"
Cohesion: 0.0
Nodes (0): 

### Community 77 - "Community 77"
Cohesion: 0.0
Nodes (0): 

### Community 78 - "Community 78"
Cohesion: 0.0
Nodes (0): 

### Community 79 - "Community 79"
Cohesion: 0.0
Nodes (0): 

### Community 80 - "Community 80"
Cohesion: 0.0
Nodes (0): 

### Community 81 - "Community 81"
Cohesion: 0.0
Nodes (0): 

### Community 82 - "Community 82"
Cohesion: 0.0
Nodes (0): 

## Knowledge Gaps
- **1 isolated node(s):** `Graph Report - .  (2026-04-15)`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 20`** (2 nodes): `Analytics.js`, `Analytics()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `AttendanceMonitor.js`, `AttendanceMonitor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `AuditLog.js`, `AuditLog()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `Billing.js`, `Billing()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `CreateInstitution.js`, `CreateInstitution()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `GoogleCallback.js`, `GoogleCallback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `LeaveManagement.js`, `LeaveManagement()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `Login.js`, `Login()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `Reports.js`, `Reports()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `RequestLeave.js`, `RequestLeave()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `StaffForm.js`, `StaffForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `StaffManagement.js`, `StaffManagement()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `SuperAdminDashboard.js`, `SuperAdminDashboard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `logFraudEvent()`, `attendanceController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `geofenceController.js`, `getAdminsWithContacts()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `institutionController.js`, `generateInstitutionCode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `run.js`, `runMigration()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `seed.js`, `seed()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `pushNotificationService.js`, `sendExpoPushNotifications()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `AccountTypeScreen()`, `AccountTypeScreen.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `BillingNative()`, `BillingNative.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `HistoryScreen()`, `HistoryScreen.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `LeaveRequestScreen()`, `LeaveRequestScreen.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `QRScanScreen.js`, `QRScanScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (2 nodes): `RegisterScreen.js`, `RegisterScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `service-worker.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `index.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `prismaClient.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `database.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `analyticsController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `courseController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `leaveController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `lecturerController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `reportController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `staffController.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `analytics.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `attendance.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `auth.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `geofence.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `institution.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `leave.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `reports.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `staff.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 63`** (1 nodes): `icon-192.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 64`** (1 nodes): `icon-512.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 65`** (1 nodes): `ic_launcher.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (1 nodes): `ic_launcher_foreground.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 67`** (1 nodes): `ic_launcher_round.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 68`** (1 nodes): `ic_launcher.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 69`** (1 nodes): `ic_launcher_foreground.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 70`** (1 nodes): `ic_launcher_round.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (1 nodes): `ic_launcher.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 72`** (1 nodes): `ic_launcher_foreground.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 73`** (1 nodes): `ic_launcher_round.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 74`** (1 nodes): `ic_launcher.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 75`** (1 nodes): `ic_launcher_foreground.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 76`** (1 nodes): `ic_launcher_round.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 77`** (1 nodes): `ic_launcher.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 78`** (1 nodes): `ic_launcher_foreground.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 79`** (1 nodes): `ic_launcher_round.webp`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 80`** (1 nodes): `adaptive-icon.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (1 nodes): `icon.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (1 nodes): `splash.png`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
