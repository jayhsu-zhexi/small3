param(
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '../assets/number-bakery-spelling')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$words = @('one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten')
$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)

# Never replace reviewed recordings; use a new output directory for another take.
foreach ($word in $words) {
    $target = Join-Path $outputPath "$word.wav"
    if (Test-Path -LiteralPath $target) { throw "Recording already exists: $target" }
}
[System.IO.Directory]::CreateDirectory($outputPath) | Out-Null

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $synth.SelectVoice('Microsoft Zira Desktop')
    $synth.Rate = -1
    $format = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(
        22050,
        [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
        [System.Speech.AudioFormat.AudioChannel]::Mono
    )
    foreach ($word in $words) {
        $prompt = New-Object System.Speech.Synthesis.PromptBuilder(
            [System.Globalization.CultureInfo]::GetCultureInfo('en-US')
        )
        $prompt.AppendText($word)
        $prompt.AppendBreak([TimeSpan]::FromMilliseconds(450))
        $letters = $word.ToUpperInvariant().ToCharArray()
        for ($i = 0; $i -lt $letters.Length; $i++) {
            $prompt.AppendTextWithHint([string]$letters[$i], [System.Speech.Synthesis.SayAs]::SpellOut)
            $pause = if ($i -eq $letters.Length - 1) { 450 } else { 300 }
            $prompt.AppendBreak([TimeSpan]::FromMilliseconds($pause))
        }
        $prompt.AppendText($word)
        $target = Join-Path $outputPath "$word.wav"
        $synth.SetOutputToWaveFile($target, $format)
        $synth.Speak($prompt)
        $synth.SetOutputToNull()
        Write-Output "$word -> $($letters -join ' -> ') -> $word"
    }
} finally {
    $synth.Dispose()
}
