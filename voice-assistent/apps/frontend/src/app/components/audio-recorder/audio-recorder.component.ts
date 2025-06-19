import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgForOf, NgIf }                        from '@angular/common';
import { HttpClient }                           from '@angular/common/http';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  templateUrl: './audio-recorder.component.html',
  imports: [
    NgIf,
    NgForOf
  ],
  styleUrls: ['./audio-recorder.component.scss']
})
export class AudioRecorderComponent implements OnInit {
  // Массив для хранения частей аудиофайла
  private audioChunks: Blob[] = [];

  // Объект для записи аудио
  private mediaRecorder!: MediaRecorder;

  // Флаг, указывающий на то, ведется ли запись
  isRecording = false;

  rawText: string = '';
  formattedText: string = '';
  followUpQuestions: string[] = [];

  // Тестовые пользователи, id должны совпадать с seed
  users = [
    { id: 'user-1', email: 'user1@example.com' },
    { id: 'user-2', email: 'user2@example.com' },
    { id: 'user-3', email: 'user3@example.com' },
    { id: 'user-4', email: 'user4@example.com' },
    { id: 'user-5', email: 'user5@example.com' },
  ];

  selectedUserId = this.users[0].id; // по умолчанию первый пользователь
  private chapterKey = 'prologue';  // жестко задаём главу


  constructor(private cdr: ChangeDetectorRef, private http: HttpClient,) {
  }

  onUserChange(event: Event) {
    const selectEl = event.target as HTMLSelectElement;
    this.selectedUserId = selectEl.value;
    this.loadUserProgress(this.chapterKey);
  }

  ngOnInit() {
    this.loadUserProgress(this.chapterKey);
  }

  // Метод для загрузки прогресса выбранного пользователя с сервера
  loadUserProgress(chapterKey: string): void {
    if (!this.selectedUserId) return;

    const url = `http://localhost:3000/chapter-progress/${this.selectedUserId}/${chapterKey}`;

    this.http.get<any>(url).subscribe({
      next: data => {
        this.rawText = data?.rawText || '';
        this.formattedText = data?.formatted || '';
        this.followUpQuestions = data?.followUpQuestions || [];

        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Error loading user progress:', err);
      }
    });
  }

  // Метод для начала записи аудио
  startRecording(): void {
    // Получение доступа к микрофону пользователя
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // Очистка массива с частями аудио перед новой записью
      this.audioChunks = [];

      // Инициализация MediaRecorder с указанным потоком и типом MIME
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      // Обработчик для записи данных при каждом событии dataavailable
      this.mediaRecorder.ondataavailable = event => {
        this.audioChunks.push(event.data); // Добавление данных в массив
      };

      // Обработчик завершения записи
      this.mediaRecorder.onstop = () => {
        // Создание объекта Blob из записанных данных
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

        // Отправка файла на сервер
        this.sendToServer(audioBlob);
      };

      // Начало записи
      this.mediaRecorder.start();
      this.isRecording = true; // Установка флага записи в true
    }).catch(err => {
      // Обработка ошибок при получении доступа к микрофону
      console.error('Ошибка при получении микрофона:', err);
    });
  }

  // Метод для остановки записи
  stopRecording(): void {
    if (this.isRecording) {
      // Остановка записи
      this.mediaRecorder.stop();
      this.isRecording = false; // Установка флага записи в false
    }
  }

  sendToServer(blob: Blob): void {
    if (!this.selectedUserId) {
      console.error('User ID not selected');
      return;
    }

    const formData = new FormData();
    formData.append('audio', blob, 'recording.webm');
    formData.append('userId', this.selectedUserId);

    this.http.post<any>('http://localhost:3000/transcribe', formData).subscribe({
      next: data => {
        this.rawText = data.raw || '';
        this.formattedText = data.formatted || '';
        this.followUpQuestions = data.followUpQuestions || [];

        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Ошибка отправки:', err);
      }
    });
  }
}
