$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"
$dest = "d:\face_detection\models\"

$files = @(
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

foreach ($f in $files) {
    $url = $baseUrl + $f
    $out = $dest + $f
    Write-Host "Downloading $url to $out"
    Invoke-WebRequest -Uri $url -OutFile $out
}
Write-Host "Download Complete"
