$ErrorActionPreference = "Stop"

$root = "C:\Users\USER\Desktop\six20"
$stage = Join-Path $root "FRONTEND\components\live\LiveKitStage.tsx"
$page  = Join-Path $root "FRONTEND\app\live\page.tsx"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SIX20 LIVE V110 STAGE UPGRADE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (!(Test-Path $stage)) { throw "LiveKitStage.tsx not found: $stage" }
if (!(Test-Path $page))  { throw "LIVE page not found: $page" }

# ------------------------------------------------------------
# BACKUPS
# ------------------------------------------------------------

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

Copy-Item $stage "$stage.backup-$stamp" -Force
Copy-Item $page  "$page.backup-$stamp" -Force

Write-Host "Backups created." -ForegroundColor Green

# ------------------------------------------------------------
# LIVEKIT STAGE
# ------------------------------------------------------------

$s = Get-Content $stage -Raw

# Guest role support
$s = $s.Replace(
    '"creator" | "viewer" | null',
    '"creator" | "guest" | "viewer" | null'
)

# Replace single-camera selection with all camera tracks.
$cameraPattern = '(?s)  const localCamera =.*?  const screenTrack =.*?;'

$cameraReplacement = @'
  const stageCameraTracks = cameraTracks
    .filter((ref) => !!ref.participant)
    .slice(0, 12) as TrackReference[];

  const screenTrack =
    screenTracks.find(
      (ref) =>
        ref.participant.identity !== localId,
    ) as TrackReference | undefined;
'@

if ($s -notmatch $cameraPattern) {
    throw "Could not find the current single-camera selection block."
}

$s = [regex]::Replace(
    $s,
    $cameraPattern,
    $cameraReplacement,
    1
)

# Replace the main video renderer with a responsive 12-person grid.
$videoPattern = '(?s)      \{mainCamera \? \(.*?      \)\}'

$videoReplacement = @'
      {stageCameraTracks.length > 0 ? (
        <div
          className={
            "grid h-full w-full gap-1.5 bg-[#050509] p-1.5 " +
            (stageCameraTracks.length === 1
              ? "grid-cols-1"
              : stageCameraTracks.length === 2
                ? "grid-cols-2"
                : stageCameraTracks.length <= 4
                  ? "grid-cols-2"
                  : stageCameraTracks.length <= 6
                    ? "grid-cols-2 sm:grid-cols-3"
                    : stageCameraTracks.length <= 9
                      ? "grid-cols-3"
                      : "grid-cols-3 sm:grid-cols-4")
          }
        >
          {stageCameraTracks.map((trackRef, index) => {
            const participant = trackRef.participant;
            const isLocal = participant.identity === localId;
            const displayName =
              participant.name ||
              participant.identity.replace(/^user-/, "User");

            return (
              <div
                key={`${participant.identity}-${trackRef.source}-${index}`}
                className="relative min-h-0 overflow-hidden rounded-xl border border-white/10 bg-[#11111a]"
              >
                <VideoTrack
                  trackRef={trackRef}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-8">
                  <div className="flex items-center gap-1.5">
                    <span className="max-w-[75%] truncate text-[11px] font-black text-white">
                      {displayName}
                    </span>

                    {isLocal && (
                      <span className="rounded-full bg-violet-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                        HOST
                      </span>
                    )}
                  </div>
                </div>

                {!participant.isCameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#171322]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(168,85,247,0.35),transparent_35%),linear-gradient(135deg,#190b2e,#10102d,#05050d)]">
          <div className="text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-2xl font-black backdrop-blur">
              S20
            </div>

            <div className="text-lg font-black">
              {isCreator
                ? "Starting your camera..."
                : "Waiting for the stage"}
            </div>

            <div className="mt-2 text-sm text-white/45">
              {isCreator
                ? "Allow camera and microphone access."
                : "The host or guests will appear here."}
            </div>
          </div>
        </div>
      )}
'@

if ($s -notmatch $videoPattern) {
    throw "Could not find the current main camera renderer."
}

$s = [regex]::Replace(
    $s,
    $videoPattern,
    $videoReplacement,
    1
)

# Audience counter should count people other than the local participant.
$s = $s.Replace(
    'const connectedAudience = Math.max(',
    'const connectedStageParticipants = Math.min(stageCameraTracks.length, 12);' + "`r`n`r`n  const connectedAudience = Math.max("
)

# Approved guests must publish audio/video.
$s = $s.Replace(
    'audio={role === "creator"}',
    'audio={role === "creator" || role === "guest"}'
)

$s = $s.Replace(
    'video={role === "creator"}',
    'video={role === "creator" || role === "guest"}'
)

# Show stage participant count rather than only audience.
$s = $s.Replace(
    '{connectedAudience} connected',
    '{connectedStageParticipants} on stage'
)

# Guest should behave as an active participant on disconnect.
$s = $s.Replace(
    'if (!isCreator) {',
    'if (!isCreator) {'
)

Set-Content -Path $stage -Value $s -Encoding UTF8

Write-Host "LiveKitStage.tsx upgraded." -ForegroundColor Green

# ------------------------------------------------------------
# LIVE PAGE
# ------------------------------------------------------------

$p = Get-Content $page -Raw

$controlsPattern = '(?s)\{joined && !isHost && \(\s*<>.*?BATTLE.*?</button>\s*</>\s*\)\}'

$controlsReplacement = @'
{joined && !isHost && (
  <button
    type="button"
    onClick={() => setShowGiftBox(true)}
    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
  >
    <Gift className="h-4 w-4" />
    Gift Universe
  </button>
)}

{(joined || isHost) && (
  <>
    <button
      type="button"
      onClick={() => setShowPlay(true)}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
    >
      <Gamepad2 className="h-4 w-4" />
      PLAY
    </button>

    <button
      type="button"
      onClick={() => setShowPlay(true)}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
    >
      <Swords className="h-4 w-4" />
      BATTLE
    </button>
  </>
)}
'@

if ($p -notmatch $controlsPattern) {
    throw "Could not find the current Gift/PLAY/BATTLE controls."
}

$p = [regex]::Replace(
    $p,
    $controlsPattern,
    $controlsReplacement,
    1
)

Set-Content -Path $page -Value $p -Encoding UTF8

Write-Host "LIVE page controls upgraded." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " V110 UPGRADE APPLIED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next:"
Write-Host "1. cd FRONTEND"
Write-Host "2. npm run build"
Write-Host "3. If build passes, start frontend with npm run dev"