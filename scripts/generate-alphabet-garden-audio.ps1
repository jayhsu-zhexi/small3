param([string]$OutputDirectory = (Join-Path $PSScriptRoot '../assets/alphabet-garden-audio'))

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$directory = [IO.Path]::GetFullPath($OutputDirectory)
$letters = 'abcdefghijklmnopqrstuvwxyz'.ToCharArray()
foreach ($letter in $letters) {
    if (Test-Path -LiteralPath (Join-Path $directory "$letter.wav")) {
        throw "Choose an empty directory to keep existing recordings: $directory"
    }
}
[IO.Directory]::CreateDirectory($directory) | Out-Null
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $voice.SelectVoice('Microsoft Zira Desktop')
    $voice.Rate = -1
    $english = [Globalization.CultureInfo]::GetCultureInfo('en-US')
    $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
        22050, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
        [System.Speech.AudioFormat.AudioChannel]::Mono
    )
    foreach ($letter in $letters) {
        $prompt = New-Object System.Speech.Synthesis.PromptBuilder($english)
        $prompt.AppendTextWithHint(([string]$letter).ToUpperInvariant(), [System.Speech.Synthesis.SayAs]::SpellOut)
        $voice.SetOutputToWaveFile((Join-Path $directory "$letter.wav"), $format)
        $voice.Speak($prompt)
        $voice.SetOutputToNull()
    }
} finally {
    $voice.Dispose()
}
