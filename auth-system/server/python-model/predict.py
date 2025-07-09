import sys
import json
import librosa
import numpy as np

# 🎹 Chord Templates (12-note chroma vectors)
CHORD_TEMPLATES = {
    "C":    [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    "Cm":   [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],
    "D":    [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    "Dm":   [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
    "E":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
    "Em":   [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    "F":    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    "G":    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    "A":    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    "Am":   [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
    "B":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    "Bm":   [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
}

# 🧠 Match a chroma vector to a chord template
def match_chord(chroma_column):
    scores = {}
    for chord, template in CHORD_TEMPLATES.items():
        scores[chord] = np.dot(chroma_column, template)
    return max(scores, key=scores.get)

# 🎸 Extract chords using template matching (✅ Optimized)
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=22050)  # ✅ Faster sample rate
    hop = 2048  # ✅ Less frequent feature extraction
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr, hop_length=hop)

    chords = []
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        chord = match_chord(chroma[:, i])
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "stringIndex": int(start_time) % 6,
                    "correct": True
                })
            last_chord = chord
            start_time = t

    if last_chord is not None:
        chords.append({
            "chord": last_chord,
            "start": round(start_time, 2),
            "duration": round(times[-1] - start_time, 2),
            "stringIndex": int(start_time) % 6,
            "correct": True
        })

    return chords

# 🧠 Compare ideal vs practice chords and build summary
def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    total = len(practice)
    accuracy = round((correct_count / max(total, 1)) * 100, 2)
    level = "Beginner"
    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"

    stars = 1
    if accuracy >= 90:
        stars = 5
    elif accuracy >= 75:
        stars = 4
    elif accuracy >= 60:
        stars = 3
    elif accuracy >= 40:
        stars = 2

    mistakes = [f for f in feedback if not f["correct"]]
    missing = [{"chord": m["chord"], "time": m["start"]} for m in mistakes]

    # Auto-guidance
    if level == "Professional":
        guidance = "Excellent! You’re at a professional level. Keep refining your chord transitions."
        tariff = "🔥 You nailed it! 🎸"
    elif level == "Intermediate":
        guidance = "You're doing well. Focus on accuracy and tempo balance."
        tariff = "🚀 Solid progress! Push a little more for perfection."
    else:
        guidance = "You're at the Beginner level. Practice slow transitions, especially between F, C, and Am chords."
        tariff = "💪 Great start! Keep practicing daily and you'll hit Intermediate soon!"

    mic_summary = {
        "totalChords": total,
        "correctChords": correct_count,
        "mistakes": len(mistakes),
        "accuracy": accuracy,
        "level": level,
        "stars": stars,
        "missingChords": missing,
        "guidance": guidance,
        "tariff": tariff
    }

    return feedback, mic_summary

# 🚀 Entry point
if __name__ == "__main__":
    if len(sys.argv) == 2:
        ideal_audio = sys.argv[1]
        chords = extract_chords(ideal_audio)
        print(json.dumps({ "feedback": chords }))

    elif len(sys.argv) == 3:
        ideal_audio = sys.argv[1]
        practice_audio = sys.argv[2]

        ideal_chords = extract_chords(ideal_audio)
        practice_chords = extract_chords(practice_audio)

        feedback, mic_summary = compare_chords(ideal_chords, practice_chords)

        print(json.dumps({
            "feedback": feedback,
            "mic_summary": mic_summary
        }))

    else:
        print(json.dumps({ "error": "Invalid number of arguments" }))


'''import sys
import json
import librosa
import numpy as np

# 🎹 Chord Templates (12-note chroma vectors)
CHORD_TEMPLATES = {
    "C":    [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # C E G
    "Cm":   [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],  # C D# G
    "D":    [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],  # D F# A
    "Dm":   [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],  # D F A
    "E":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],  # E G# B
    "Em":   [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],  # E G B
    "F":    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],  # F A C
    "G":    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],  # G B D
    "A":    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],  # A C# E
    "Am":   [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # A C E
    "B":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],  # B D# F#
    "Bm":   [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],  # B D F#
}

# 🧠 Match a chroma vector to a chord template
def match_chord(chroma_column):
    scores = {}
    for chord, template in CHORD_TEMPLATES.items():
        scores[chord] = np.dot(chroma_column, template)
    return max(scores, key=scores.get)

# 🎸 Extract chords using template matching
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    chords = []
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr)
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        chord = match_chord(chroma[:, i])
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "stringIndex": int(start_time) % 6,
                    "correct": True
                })
            last_chord = chord
            start_time = t

    if last_chord is not None:
        chords.append({
            "chord": last_chord,
            "start": round(start_time, 2),
            "duration": round(times[-1] - start_time, 2),
            "stringIndex": int(start_time) % 6,
            "correct": True
        })

    return chords

# 🧠 Compare ideal vs practice chords and build summary
def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    total = len(practice)
    accuracy = round((correct_count / max(total, 1)) * 100, 2)
    level = "Beginner"
    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"

    stars = 1
    if accuracy >= 90:
        stars = 5
    elif accuracy >= 75:
        stars = 4
    elif accuracy >= 60:
        stars = 3
    elif accuracy >= 40:
        stars = 2

    # Find incorrect chords with time
    mistakes = [f for f in feedback if not f["correct"]]
    missing = [{"chord": m["chord"], "time": m["start"]} for m in mistakes]

    # Auto-guidance
    if level == "Professional":
        guidance = "Excellent! You’re at a professional level. Keep refining your chord transitions."
        tariff = "🔥 You nailed it! 🎸"
    elif level == "Intermediate":
        guidance = "You're doing well. Focus on accuracy and tempo balance."
        tariff = "🚀 Solid progress! Push a little more for perfection."
    else:
        guidance = "You're at the Beginner level. Practice slow transitions, especially between F, C, and Am chords."
        tariff = "💪 Great start! Keep practicing daily and you'll hit Intermediate soon!"

    mic_summary = {
        "totalChords": total,
        "correctChords": correct_count,
        "mistakes": len(mistakes),
        "accuracy": accuracy,
        "level": level,
        "stars": stars,
        "missingChords": missing,
        "guidance": guidance,
        "tariff": tariff
    }

    return feedback, mic_summary

# 🚀 Entry point
if __name__ == "__main__":
    if len(sys.argv) == 2:
        # Only ideal audio: extract chords
        ideal_audio = sys.argv[1]
        chords = extract_chords(ideal_audio)
        print(json.dumps({ "feedback": chords }))

    elif len(sys.argv) == 3:
        # Ideal vs practice audio: compare
        ideal_audio = sys.argv[1]
        practice_audio = sys.argv[2]

        ideal_chords = extract_chords(ideal_audio)
        practice_chords = extract_chords(practice_audio)

        feedback, mic_summary = compare_chords(ideal_chords, practice_chords)

        print(json.dumps({
            "feedback": feedback,
            "mic_summary": mic_summary
        }))

    else:
        print(json.dumps({ "error": "Invalid number of arguments" }))'''


''' ye code work 
import sys
import json
import librosa
import numpy as np

# 🎹 Chord Templates (12-note chroma vectors)
CHORD_TEMPLATES = {
    "C":    [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # C E G
    "Cm":   [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0],  # C D# G
    "D":    [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],  # D F# A
    "Dm":   [0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],  # D F A
    "E":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],  # E G# B
    "Em":   [0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0],  # E G B
    "F":    [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],  # F A C
    "G":    [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],  # G B D
    "A":    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],  # A C# E
    "Am":   [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],  # A C E
    "B":    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],  # B D# F#
    "Bm":   [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],  # B D F#
}

# 🧠 Match a chroma vector to a chord template
def match_chord(chroma_column):
    scores = {}
    for chord, template in CHORD_TEMPLATES.items():
        scores[chord] = np.dot(chroma_column, template)
    return max(scores, key=scores.get)

# 🎸 Extract chords using template matching
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    chords = []
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr)
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        chord = match_chord(chroma[:, i])
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "stringIndex": int(start_time) % 6,
                    "correct": True  # default True for ideal
                })
            last_chord = chord
            start_time = t

    # Add final chord
    if last_chord is not None:
        chords.append({
            "chord": last_chord,
            "start": round(start_time, 2),
            "duration": round(times[-1] - start_time, 2),
            "stringIndex": int(start_time) % 6,
            "correct": True
        })

    return chords

# 🧠 Compare ideal vs practice chords
def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    accuracy = round((correct_count / max(len(practice), 1)) * 100, 2)

    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"
    else:
        level = "Beginner"

    return feedback, accuracy, level

# 🚀 Entry point
if __name__ == "__main__":
    if len(sys.argv) == 2:
        # Ideal only
        ideal_audio = sys.argv[1]
        chords = extract_chords(ideal_audio)
        print(json.dumps({ "feedback": chords }))
    
    elif len(sys.argv) == 3:
        # Compare ideal vs practice
        ideal_audio = sys.argv[1]
        practice_audio = sys.argv[2]

        ideal_chords = extract_chords(ideal_audio)
        practice_chords = extract_chords(practice_audio)

        feedback, accuracy, level = compare_chords(ideal_chords, practice_chords)

        print(json.dumps({
            "feedback": feedback,
            "accuracy": accuracy,
            "level": level
        }))
    
    else:
        print(json.dumps({ "error": "Invalid number of arguments" }))
'''

'''' ye code note level ko detect kar ta hai not template and not acyual chords but match with note level 
import sys
import json
import librosa

# 🎸 Step 1: Chord Extraction from audio
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    chords = []
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr)
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        max_note = chroma[:, i].argmax()
        chord = librosa.midi_to_note(60 + max_note)
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "stringIndex": int(start_time) % 6,
                    "correct": True  # default True for ideal
                })
            last_chord = chord
            start_time = t

    return chords

# 🧠 Step 2: Comparison Logic
def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    accuracy = round((correct_count / max(len(practice), 1)) * 100, 2)

    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"
    else:
        level = "Beginner"

    return feedback, accuracy, level

# 🚀 Entry Point
if __name__ == "__main__":
    if len(sys.argv) == 2:
        # ✅ Only one file — extract ideal chords
        ideal_audio = sys.argv[1]
        chords = extract_chords(ideal_audio)
        print(json.dumps({ "feedback": chords }))
    
    elif len(sys.argv) == 3:
        # ✅ Both files — compare ideal vs practice
        ideal_audio = sys.argv[1]
        practice_audio = sys.argv[2]

        ideal_chords = extract_chords(ideal_audio)
        practice_chords = extract_chords(practice_audio)

        feedback, accuracy, level = compare_chords(ideal_chords, practice_chords)

        print(json.dumps({
            "feedback": feedback,
            "accuracy": accuracy,
            "level": level
        }))
    
    else:
        print(json.dumps({ "error": "Invalid number of arguments" }))'''


''' ye 100% ideal then user check playground and upload practice compare 
import sys
import json
import librosa

# 🎸 Step 1: Chord Extraction from audio
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    chords = []
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr)
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        max_note = chroma[:, i].argmax()
        chord = librosa.midi_to_note(60 + max_note)
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "stringIndex": int(start_time) % 6,
                    "correct": True  # default True for ideal
                })
            last_chord = chord
            start_time = t

    return chords

# 🧠 Step 2: Comparison Logic
def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    accuracy = round((correct_count / max(len(practice), 1)) * 100, 2)

    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"
    else:
        level = "Beginner"

    return feedback, accuracy, level

# 🚀 Entry Point
if __name__ == "__main__":
    if len(sys.argv) == 2:
        # ✅ Only one file — extract ideal chords
        ideal_audio = sys.argv[1]
        chords = extract_chords(ideal_audio)
        print(json.dumps({ "feedback": chords }))
    
    elif len(sys.argv) == 3:
        # ✅ Both files — compare ideal vs practice
        ideal_audio = sys.argv[1]
        practice_audio = sys.argv[2]

        ideal_chords = extract_chords(ideal_audio)
        practice_chords = extract_chords(practice_audio)

        feedback, accuracy, level = compare_chords(ideal_chords, practice_chords)

        print(json.dumps({
            "feedback": feedback,
            "accuracy": f"{accuracy}%",
            "level": level
        }))
    
    else:
        print(json.dumps({ "error": "Invalid number of arguments" }))'''


'''' ye code ideal or practies audio ka feedback de ta hai required both audio 
import librosa
import json

# Dummy: this should be replaced with real chord extraction logic
def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)

    chords = []
    step = 1.0  # analyze each second
    current = 0
    while current < duration:
        chords.append({
            "chord": "C" if int(current) % 2 == 0 else "G",
            "start": current,
            "duration": step,
            "stringIndex": int(current) % 6,
        })
        current += step
    return chords

def compare_chords(ideal, practice):
    feedback = []
    correct_count = 0

    for i, p_chord in enumerate(practice):
        match = i < len(ideal) and ideal[i]["chord"] == p_chord["chord"]
        if match:
            correct_count += 1
        feedback.append({
            **p_chord,
            "correct": match
        })

    accuracy = round((correct_count / max(len(practice), 1)) * 100, 2)

    if accuracy >= 85:
        level = "Professional"
    elif accuracy >= 60:
        level = "Intermediate"
    else:
        level = "Beginner"

    return feedback, accuracy, level

if __name__ == "__main__":
    import sys
    import os

    ideal_audio = sys.argv[1]
    practice_audio = sys.argv[2]

    ideal_chords = extract_chords(ideal_audio)
    practice_chords = extract_chords(practice_audio)

    feedback, accuracy, level = compare_chords(ideal_chords, practice_chords)

    result = {
        "feedback": feedback,
        "accuracy": accuracy,
        "level": level
    }

    print(json.dumps(result))
'''



''' ye code audio ka feed back de ta hai
 auth-system/python/predict.py
import sys
import json
import librosa

def extract_chords(audio_path):
    y, sr = librosa.load(audio_path, sr=None)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)

    chords = []
    times = librosa.frames_to_time(range(chroma.shape[1]), sr=sr)
    last_chord = None
    start_time = 0

    for i, t in enumerate(times):
        max_note = chroma[:, i].argmax()
        chord = librosa.midi_to_note(60 + max_note)
        if chord != last_chord:
            if last_chord is not None:
                chords.append({
                    "chord": last_chord,
                    "start": round(start_time, 2),
                    "duration": round(t - start_time, 2),
                    "correct": True
                })
            last_chord = chord
            start_time = t

    return chords

if __name__ == "__main__":
    audio_path = sys.argv[1]
    result = extract_chords(audio_path)
    print(json.dumps(result))
'''