import os
import csv
import random
import requests
from jiwer import wer              # Библиотека для расчёта WER
from pydub import AudioSegment     # Для конвертации аудио

# Пути к данным и настройка сервера
TSV_PATH = "cv-corpus-21.0-delta-2025-03-14/ru/validated.tsv"
CLIPS_FOLDER = "cv-corpus-21.0-delta-2025-03-14/ru/clips"
SERVER_URL = "http://localhost:3000/transcribe"
TMP_MP3 = "tmp_input.mp3"
TMP_WAV = "tmp_input.wav"
NUM_SAMPLES = 10  # Количество тестовых примеров

# Загрузка и фильтрация примеров из TSV-файла
def read_validated_samples(tsv_path, min_text_len=10):
    samples = []
    with open(tsv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            sentence = row["sentence"].strip()
            mp3_path = os.path.join(CLIPS_FOLDER, row["path"].strip())
            if os.path.isfile(mp3_path) and len(sentence.split()) >= min_text_len:
                samples.append({"text": sentence, "mp3": mp3_path})
    return samples

# Конвертация MP3 в WAV с нужными параметрами
def convert_to_wav(mp3_path, wav_path):
    audio = AudioSegment.from_file(mp3_path)
    audio = audio.set_channels(1).set_frame_rate(16000)
    audio.export(wav_path, format="wav")

# Отправка аудио на сервер и получение транскрипции
def send_to_server(wav_path):
    with open(wav_path, "rb") as f:
        files = {"audio": ("audio.wav", f, "audio/wav")}
        response = requests.post(SERVER_URL, files=files)
        response.raise_for_status()  # Генерирует исключение при ошибке 4xx/5xx
        return response.json().get("text", "").strip()

# Основная функция оценки
def main():
    print("📥 Загружаем примеры...")
    samples = read_validated_samples(TSV_PATH)
    print(f"✅ Найдено {len(samples)} подходящих примеров.")

    if not samples:
        print("❌ Нет примеров для теста.")
        return

    selected = random.sample(samples, min(NUM_SAMPLES, len(samples)))
    total_wer = 0
    tested = 0

    for i, sample in enumerate(selected):
        try:
            print(f"\n🔊 [{i+1}] {os.path.basename(sample['mp3'])}")
            convert_to_wav(sample["mp3"], TMP_WAV)
            recognized = send_to_server(TMP_WAV)

            ref = sample["text"]
            curr_wer = wer(ref, recognized)
            total_wer += curr_wer
            tested += 1

            print(f"📝 Ожидается:  {ref}")
            print(f"🤖 Распознано: {recognized}")
            print(f"📉 WER: {curr_wer:.2%}")

        except Exception as e:
            print(f"❌ Ошибка на примере: {e}")

    if tested:
        avg_wer = total_wer / tested
        print(f"\n📊 Средний WER по {tested} примерам: {avg_wer:.2%}")
    else:
        print("❌ Не удалось протестировать ни одного примера.")

    # Очистка временного файла
    if os.path.exists(TMP_WAV):
        os.remove(TMP_WAV)

if __name__ == "__main__":
    main()
