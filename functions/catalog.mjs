// Fictional academic content for the Atlas demo. All names, grades, rooms and
// dates are invented. Text is stored as { ru, en } pairs so one payload serves
// both interface languages.

export const UNIVERSITY = {
  name: { ru: 'Университет «Аврора»', en: 'Aurora University' },
  short: { ru: 'Аврора', en: 'Aurora' },
};

const L = (ru, en) => ({ ru, en });

export const KIND_LABELS = {
  lecture: L('Лекция', 'Lecture'),
  seminar: L('Семинар', 'Seminar'),
  lab: L('Лабораторная', 'Lab'),
  practice: L('Практика', 'Practice'),
  pe: L('Физкультура', 'PE'),
  consult: L('Консультация', 'Consultation'),
  exam: L('Экзамен', 'Exam'),
};

export const DOC_CATALOG = [
  {
    code: 'enrollment',
    kind: 'certificate',
    icon: 'file-badge',
    title: L('Справка об обучении', 'Certificate of enrolment'),
    description: L('Подтверждает факт обучения в университете. Подходит для банка, визы и работы.', 'Confirms your enrolment. Accepted by banks, embassies and employers.'),
    eta: L('Готова за 1 рабочий день', 'Ready within 1 business day'),
    reviewMinutes: 45,
    readyMinutes: 120,
    popular: true,
    fields: ['copies', 'delivery', 'comment'],
  },
  {
    code: 'stipend',
    kind: 'certificate',
    icon: 'wallet',
    title: L('Справка для стипендии', 'Certificate for scholarship'),
    description: L('Для оформления социальной или академической стипендии.', 'For state and academic scholarship paperwork.'),
    eta: L('Готова за 1 рабочий день', 'Ready within 1 business day'),
    reviewMinutes: 45,
    readyMinutes: 150,
    popular: true,
    fields: ['copies', 'delivery', 'comment'],
  },
  {
    code: 'transcript',
    kind: 'certificate',
    icon: 'scroll',
    title: L('Академическая справка', 'Official transcript'),
    description: L('Полная выписка по всем изученным дисциплинам с печатью университета.', 'A full record of completed courses, stamped by the university.'),
    eta: L('Готова за 2 рабочих дня', 'Ready within 2 business days'),
    reviewMinutes: 60,
    readyMinutes: 240,
    fields: ['copies', 'delivery', 'comment'],
  },
  {
    code: 'gradebook',
    kind: 'certificate',
    icon: 'book-open',
    title: L('Выписка из зачётной книжки', 'Grade book extract'),
    description: L('Текущие оценки за семестр для работодателя или стажировки.', 'Current semester grades for employers and internships.'),
    eta: L('Готова за 1 рабочий день', 'Ready within 1 business day'),
    reviewMinutes: 45,
    readyMinutes: 120,
    fields: ['copies', 'delivery', 'comment'],
  },
  {
    code: 'military',
    kind: 'certificate',
    icon: 'shield',
    title: L('Справка для военкомата', 'Certificate for the draft office'),
    description: L('Подтверждение обучения для военного комиссариата.', 'Study confirmation for the local draft office.'),
    eta: L('Готова за 2 рабочих дня', 'Ready within 2 business days'),
    reviewMinutes: 60,
    readyMinutes: 240,
    fields: ['copies', 'delivery', 'comment'],
  },
  {
    code: 'session_extension',
    kind: 'statement',
    icon: 'calendar-clock',
    title: L('Продление сессии', 'Exam session extension'),
    description: L('Дополнительное время на сдачу зачётов и экзаменов по уважительной причине.', 'Extra time to finish exams for a documented reason.'),
    eta: L('Рассматривается 1–2 дня', 'Reviewed within 1–2 days'),
    reviewMinutes: 60,
    readyMinutes: 300,
    fields: ['comment', 'urgency'],
  },
  {
    code: 'retake',
    kind: 'statement',
    icon: 'refresh',
    title: L('Пересдача дисциплины', 'Retake application'),
    description: L('Запись на пересдачу экзамена или зачёта в деканате.', 'Sign up for an exam or pass/fail retake.'),
    eta: L('Рассматривается 1 день', 'Reviewed within 1 day'),
    reviewMinutes: 90,
    readyMinutes: 240,
    fields: ['comment', 'urgency'],
  },
  {
    code: 'transfer_group',
    kind: 'statement',
    icon: 'users',
    title: L('Перевод в другую группу', 'Group transfer'),
    description: L('Смена академической группы с сохранением программы обучения.', 'Move to another group within the same degree programme.'),
    eta: L('Рассматривается 3 дня', 'Reviewed within 3 days'),
    reviewMinutes: 120,
    readyMinutes: 480,
    fields: ['comment'],
  },
  {
    code: 'mathelp',
    kind: 'statement',
    icon: 'heart-handshake',
    title: L('Материальная помощь', 'Financial aid'),
    description: L('Заявление на единовременную выплату в трудной жизненной ситуации.', 'One-time payment application for difficult circumstances.'),
    eta: L('Рассматривается 5 дней', 'Reviewed within 5 days'),
    reviewMinutes: 180,
    readyMinutes: 720,
    fields: ['comment', 'urgency'],
  },
  {
    code: 'academic_leave',
    kind: 'statement',
    icon: 'pause-circle',
    title: L('Академический отпуск', 'Academic leave'),
    description: L('Оформление отпуска по медицинским или семейным обстоятельствам.', 'Leave for medical or family reasons.'),
    eta: L('Рассматривается 5 дней', 'Reviewed within 5 days'),
    reviewMinutes: 180,
    readyMinutes: 720,
    fields: ['comment'],
  },
];

const annaSchedule = [
  { weekday: 1, start: '09:30', end: '11:00', kind: 'lecture', title: L('Искусственный интеллект', 'Artificial Intelligence'), room: 'A-312', building: L('Корпус A', 'Building A'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev') },
  { weekday: 1, start: '11:20', end: '12:50', kind: 'lab', title: L('Распределённые системы', 'Distributed Systems'), room: 'B-210', building: L('Корпус B', 'Building B'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva') },
  { weekday: 1, start: '14:40', end: '16:10', kind: 'seminar', title: L('UX-исследования', 'UX Research'), room: 'C-105', building: L('Корпус C', 'Building C'), teacher: L('ст. преп. Н. О. Ким', 'Sr. Lecturer N. Kim') },
  { weekday: 2, start: '09:30', end: '11:00', kind: 'lecture', title: L('Распределённые системы', 'Distributed Systems'), room: 'A-208', building: L('Корпус A', 'Building A'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva') },
  { weekday: 2, start: '11:20', end: '12:50', kind: 'practice', title: L('Искусственный интеллект', 'Artificial Intelligence'), room: 'A-312', building: L('Корпус A', 'Building A'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev'), status: 'cancelled', note: L('Занятие отменено: преподаватель на конференции AI Summit. Материалы для самостоятельной работы — в LMS.', 'Class cancelled: the lecturer is at AI Summit. Self-study materials are in LMS.') },
  { weekday: 2, start: '14:40', end: '16:10', kind: 'seminar', title: L('Иностранный язык в профессиональной сфере', 'Professional English'), room: 'C-210', building: L('Корпус C', 'Building C'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown') },
  { weekday: 3, start: '11:20', end: '12:50', kind: 'lab', title: L('UX-исследования', 'UX Research'), room: 'A-401', building: L('Корпус A', 'Building A'), teacher: L('ст. преп. Н. О. Ким', 'Sr. Lecturer N. Kim'), status: 'moved', original: { start: '09:30', end: '11:00', room: 'A-301' }, note: L('Аудитория A-301 закрыта на ремонт. Занятие перенесено в A-401 и начинается позже.', 'Room A-301 is closed for repairs. The class moved to A-401 and starts later.') },
  { weekday: 3, start: '13:00', end: '14:30', kind: 'seminar', title: L('Научный семинар', 'Research Seminar'), room: 'B-118', building: L('Корпус B', 'Building B'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova') },
  { weekday: 3, start: '16:20', end: '17:50', kind: 'pe', title: L('Физическая культура', 'Physical Education'), room: 'Спортзал', building: L('Спорткомплекс', 'Sports Centre'), teacher: L('преп. С. И. Волков', 'Coach S. Volkov') },
  { weekday: 4, start: '09:30', end: '11:00', kind: 'seminar', title: L('Искусственный интеллект', 'Artificial Intelligence'), room: 'A-312', building: L('Корпус A', 'Building A'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev') },
  { weekday: 4, start: '11:20', end: '12:50', kind: 'consult', title: L('Курсовая работа', 'Course Project'), room: 'B-215', building: L('Корпус B', 'Building B'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova') },
  { weekday: 4, start: '14:40', end: '16:10', kind: 'lab', title: L('Распределённые системы', 'Distributed Systems'), room: 'B-210', building: L('Корпус B', 'Building B'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva') },
  { weekday: 4, start: '16:20', end: '17:50', kind: 'seminar', title: L('Разбор проекта с куратором', 'Project review with the curator'), room: 'B-215', building: L('Корпус B', 'Building B'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova'), status: 'added', note: L('Дополнительное занятие по итогам проектного практикума. Присутствие желательно.', 'Extra session on the project practicum. Attendance is recommended.') },
  { weekday: 5, start: '09:30', end: '11:00', kind: 'seminar', title: L('Иностранный язык в профессиональной сфере', 'Professional English'), room: 'C-210', building: L('Корпус C', 'Building C'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown') },
  { weekday: 5, start: '11:20', end: '12:50', kind: 'practice', title: L('UX-исследования', 'UX Research'), room: 'C-105', building: L('Корпус C', 'Building C'), teacher: L('ст. преп. Н. О. Кий', 'Sr. Lecturer N. Kim') },
  { weekday: 5, start: '14:40', end: '16:10', kind: 'lecture', title: L('Искусственный интеллект', 'Artificial Intelligence'), room: 'A-312', building: L('Корпус A', 'Building A'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev') },
];

const maximSchedule = [
  { weekday: 1, start: '10:00', end: '11:30', kind: 'lecture', title: L('Корпоративные финансы', 'Corporate Finance'), room: 'D-204', building: L('Корпус D', 'Building D'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva'), status: 'moved', original: { start: '09:30', end: '11:00', room: 'D-201' }, note: L('Занятие начинается на 30 минут позже: аудитория D-201 занята комиссией.', 'The class starts 30 minutes later: room D-201 is used by a committee.') },
  { weekday: 1, start: '12:00', end: '13:30', kind: 'seminar', title: L('Международная экономика', 'International Economics'), room: 'D-118', building: L('Корпус D', 'Building D'), teacher: L('доц. К. О. Нурланов', 'Assoc. Prof. K. Nurlanov') },
  { weekday: 1, start: '15:00', end: '16:30', kind: 'pe', title: L('Физическая культура', 'Physical Education'), room: 'Бассейн', building: L('Спорткомплекс', 'Sports Centre'), teacher: L('преп. И. А. Гринёва', 'Coach I. Grinyova') },
  { weekday: 2, start: '09:30', end: '11:00', kind: 'lecture', title: L('Корпоративные финансы', 'Corporate Finance'), room: 'D-204', building: L('Корпус D', 'Building D'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva') },
  { weekday: 2, start: '11:20', end: '12:50', kind: 'lab', title: L('Эконометрика', 'Econometrics'), room: 'D-310', building: L('Корпус D', 'Building D'), teacher: L('доц. В. С. Орлов', 'Assoc. Prof. V. Orlov') },
  { weekday: 2, start: '14:00', end: '15:30', kind: 'seminar', title: L('Аудит', 'Auditing'), room: 'D-118', building: L('Корпус D', 'Building D'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol') },
  { weekday: 3, start: '09:30', end: '11:00', kind: 'lecture', title: L('Международная экономика', 'International Economics'), room: 'D-204', building: L('Корпус D', 'Building D'), teacher: L('доц. К. О. Нурланов', 'Assoc. Prof. K. Nurlanov'), status: 'cancelled', note: L('Лекция перенесена на следующую неделю. Задание опубликовано в LMS.', 'The lecture is postponed to next week. The assignment is in LMS.') },
  { weekday: 3, start: '11:20', end: '12:50', kind: 'seminar', title: L('Аудит', 'Auditing'), room: 'D-118', building: L('Корпус D', 'Building D'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol') },
  { weekday: 4, start: '10:00', end: '11:30', kind: 'lecture', title: L('Эконометрика', 'Econometrics'), room: 'D-310', building: L('Корпус D', 'Building D'), teacher: L('доц. В. С. Орлов', 'Assoc. Prof. V. Orlov') },
  { weekday: 4, start: '12:00', end: '13:30', kind: 'practice', title: L('Корпоративные финансы', 'Corporate Finance'), room: 'D-310', building: L('Корпус D', 'Building D'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva') },
  { weekday: 4, start: '15:00', end: '16:30', kind: 'seminar', title: L('Бизнес-право', 'Business Law'), room: 'D-225', building: L('Корпус D', 'Building D'), teacher: L('доц. Р. А. Хакимов', 'Assoc. Prof. R. Khakimov') },
  { weekday: 5, start: '09:30', end: '11:00', kind: 'lab', title: L('Аудит', 'Auditing'), room: 'D-310', building: L('Корпус D', 'Building D'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol') },
  { weekday: 5, start: '11:20', end: '12:50', kind: 'seminar', title: L('Международная экономика', 'International Economics'), room: 'D-118', building: L('Корпус D', 'Building D'), teacher: L('доц. К. О. Нурланов', 'Assoc. Prof. K. Nurlanov') },
];

const annaCourses = [
  { semester: 1, code: 'MTH101', title: L('Математический анализ', 'Mathematical Analysis'), teacher: L('доц. И. В. Синицына', 'Assoc. Prof. I. Sinitsyna'), credits: 6, assessment: 'exam', grade: 5 },
  { semester: 1, code: 'CS101', title: L('Программирование на Python', 'Python Programming'), teacher: L('ст. преп. П. А. Волков', 'Sr. Lecturer P. Volkov'), credits: 5, assessment: 'exam', grade: 5 },
  { semester: 1, code: 'CS102', title: L('Введение в информатику', 'Introduction to Informatics'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva'), credits: 3, assessment: 'pass_fail', passed: true },
  { semester: 1, code: 'ENG101', title: L('Английский язык', 'English'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 1, code: 'HST101', title: L('История России', 'Russian History'), teacher: L('доц. Г. Н. Астахов', 'Assoc. Prof. G. Astakhov'), credits: 3, assessment: 'exam', grade: 4 },
  { semester: 1, code: 'PHY101', title: L('Физика', 'Physics'), teacher: L('доц. Л. Ю. Миронова', 'Assoc. Prof. L. Mironova'), credits: 4, assessment: 'exam', grade: 4 },

  { semester: 2, code: 'MTH202', title: L('Линейная алгебра и геометрия', 'Linear Algebra and Geometry'), teacher: L('доц. И. В. Синицына', 'Assoc. Prof. I. Sinitsyna'), credits: 5, assessment: 'exam', grade: 4 },
  { semester: 2, code: 'CS201', title: L('Алгоритмы и структуры данных', 'Algorithms and Data Structures'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev'), credits: 6, assessment: 'exam', grade: 5 },
  { semester: 2, code: 'MTH203', title: L('Дискретная математика', 'Discrete Mathematics'), teacher: L('доц. О. Д. Радченко', 'Assoc. Prof. O. Radchenko'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 2, code: 'ENG102', title: L('Английский язык', 'English'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown'), credits: 4, assessment: 'exam', grade: 5 },
  { semester: 2, code: 'PHL101', title: L('Философия', 'Philosophy'), teacher: L('доц. В. П. Заречный', 'Assoc. Prof. V. Zarechny'), credits: 3, assessment: 'pass_fail', passed: true },
  { semester: 2, code: 'CS202', title: L('Базы данных', 'Databases'), teacher: L('ст. преп. Н. О. Ким', 'Sr. Lecturer N. Kim'), credits: 5, assessment: 'exam', grade: 5 },

  { semester: 3, code: 'MTH301', title: L('Теория вероятностей и статистика', 'Probability and Statistics'), teacher: L('доц. О. Д. Радченко', 'Assoc. Prof. O. Radchenko'), credits: 5, assessment: 'exam', grade: 4 },
  { semester: 3, code: 'CS301', title: L('Объектно-ориентированное программирование', 'Object-Oriented Programming'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva'), credits: 5, assessment: 'exam', grade: 5 },
  { semester: 3, code: 'CS302', title: L('Компьютерные сети', 'Computer Networks'), teacher: L('ст. преп. Д. И. Громов', 'Sr. Lecturer D. Gromov'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 3, code: 'CS303', title: L('Веб-разработка', 'Web Development'), teacher: L('ст. преп. Н. О. Ким', 'Sr. Lecturer N. Kim'), credits: 5, assessment: 'exam', grade: 5 },
  { semester: 3, code: 'ECO301', title: L('Экономика ИТ', 'IT Economics'), teacher: L('доц. А. В. Полякова', 'Assoc. Prof. A. Polyakova'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 3, code: 'PE301', title: L('Физическая культура', 'Physical Education'), teacher: L('преп. С. И. Волков', 'Coach S. Volkov'), credits: 2, assessment: 'pass_fail', passed: true },

  { semester: 4, code: 'CS401', title: L('Машинное обучение', 'Machine Learning'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev'), credits: 6, assessment: 'exam', grade: 5, gradedAt: '2026-06-16' },
  { semester: 4, code: 'CS402', title: L('Операционные системы', 'Operating Systems'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva'), credits: 5, assessment: 'exam', grade: 4, gradedAt: '2026-06-11' },
  { semester: 4, code: 'CS403', title: L('Анализ данных на Python', 'Data Analysis in Python'), teacher: L('ст. преп. П. А. Волков', 'Sr. Lecturer P. Volkov'), credits: 5, assessment: 'exam', grade: 5, gradedAt: '2026-06-19' },
  { semester: 4, code: 'LAW401', title: L('Правоведение', 'Fundamentals of Law'), teacher: L('доц. Р. А. Хакимов', 'Assoc. Prof. R. Khakimov'), credits: 3, assessment: 'pass_fail', passed: true, gradedAt: '2026-06-04' },
  { semester: 4, code: 'CS404', title: L('Проектный практикум', 'Project Practicum'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova'), credits: 5, assessment: 'graded_pass', grade: 5, gradedAt: '2026-06-22' },
  { semester: 4, code: 'PE401', title: L('Физическая культура', 'Physical Education'), teacher: L('преп. С. И. Волков', 'Coach S. Volkov'), credits: 2, assessment: 'pass_fail', passed: true, gradedAt: '2026-05-28' },

  { semester: 5, code: 'AI501', title: L('Искусственный интеллект', 'Artificial Intelligence'), teacher: L('проф. А. Р. Гаджиев', 'Prof. A. Gadzhiev'), credits: 6, assessment: 'exam', points: 82 },
  { semester: 5, code: 'CS501', title: L('Распределённые системы', 'Distributed Systems'), teacher: L('доц. М. С. Лебедева', 'Assoc. Prof. M. Lebedeva'), credits: 5, assessment: 'exam', points: 88 },
  { semester: 5, code: 'UX501', title: L('UX-исследования', 'UX Research'), teacher: L('ст. преп. Н. О. Ким', 'Sr. Lecturer N. Kim'), credits: 4, assessment: 'graded_pass', points: 91 },
  { semester: 5, code: 'SEM501', title: L('Научный семинар', 'Research Seminar'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova'), credits: 2, assessment: 'pass_fail', points: 95 },
  { semester: 5, code: 'CW501', title: L('Курсовая работа', 'Course Project'), teacher: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova'), credits: 3, assessment: 'graded_pass', points: 86 },
  { semester: 5, code: 'ENG501', title: L('Иностранный язык в профессиональной сфере', 'Professional English'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown'), credits: 3, assessment: 'exam', points: 74 },
];

const maximCourses = [
  { semester: 1, code: 'ECO101', title: L('Микроэкономика', 'Microeconomics'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva'), credits: 6, assessment: 'exam', grade: 5 },
  { semester: 1, code: 'MTH101', title: L('Математический анализ', 'Mathematical Analysis'), teacher: L('доц. И. В. Синицына', 'Assoc. Prof. I. Sinitsyna'), credits: 6, assessment: 'exam', grade: 4 },
  { semester: 1, code: 'ENG101', title: L('Английский язык', 'English'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 1, code: 'HEC101', title: L('История экономических учений', 'History of Economic Thought'), teacher: L('доц. Г. Н. Астахов', 'Assoc. Prof. G. Astakhov'), credits: 3, assessment: 'pass_fail', passed: true },
  { semester: 1, code: 'CS101', title: L('Информатика', 'Informatics'), teacher: L('ст. преп. П. А. Волков', 'Sr. Lecturer P. Volkov'), credits: 4, assessment: 'exam', grade: 5 },

  { semester: 2, code: 'ECO201', title: L('Макроэкономика', 'Macroeconomics'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva'), credits: 6, assessment: 'exam', grade: 5 },
  { semester: 2, code: 'MTH202', title: L('Статистика', 'Statistics'), teacher: L('доц. О. Д. Радченко', 'Assoc. Prof. O. Radchenko'), credits: 5, assessment: 'exam', grade: 4 },
  { semester: 2, code: 'ACC201', title: L('Бухгалтерский учёт', 'Accounting'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 2, code: 'ENG201', title: L('Английский язык', 'English'), teacher: L('ст. преп. О. В. Браун', 'Sr. Lecturer O. Brown'), credits: 4, assessment: 'exam', grade: 5 },
  { semester: 2, code: 'MGT201', title: L('Менеджмент', 'Management'), teacher: L('доц. А. В. Полякова', 'Assoc. Prof. A. Polyakova'), credits: 4, assessment: 'exam', grade: 4 },
  { semester: 2, code: 'ECO202', title: L('Экономика предприятия', 'Business Economics'), teacher: L('доц. А. В. Полякова', 'Assoc. Prof. A. Polyakova'), credits: 3, assessment: 'pass_fail', passed: true },

  { semester: 3, code: 'FIN301', title: L('Финансовый анализ', 'Financial Analysis'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva'), credits: 5, assessment: 'exam', grade: 4, gradedAt: '2026-06-15' },
  { semester: 3, code: 'ECO301', title: L('Эконометрика', 'Econometrics'), teacher: L('доц. В. С. Орлов', 'Assoc. Prof. V. Orlov'), credits: 6, assessment: 'exam', grade: 5, gradedAt: '2026-06-10' },
  { semester: 3, code: 'FIN302', title: L('Деньги и кредит', 'Money and Credit'), teacher: L('доц. К. О. Нурланов', 'Assoc. Prof. K. Nurlanov'), credits: 4, assessment: 'exam', grade: 4, gradedAt: '2026-06-18' },
  { semester: 3, code: 'TAX301', title: L('Налоги и налогообложение', 'Taxation'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol'), credits: 5, assessment: 'exam', grade: 5, gradedAt: '2026-06-20' },
  { semester: 3, code: 'LAW301', title: L('Бизнес-право', 'Business Law'), teacher: L('доц. Р. А. Хакимов', 'Assoc. Prof. R. Khakimov'), credits: 3, assessment: 'pass_fail', passed: true, gradedAt: '2026-06-05' },
  { semester: 3, code: 'FIN303', title: L('Инвестиции', 'Investments'), teacher: L('доц. В. С. Орлов', 'Assoc. Prof. V. Orlov'), credits: 4, assessment: 'exam', grade: 4, gradedAt: '2026-06-23' },

  { semester: 4, code: 'FIN401', title: L('Корпоративные финансы', 'Corporate Finance'), teacher: L('проф. Т. П. Яковлева', 'Prof. T. Yakovleva'), credits: 6, assessment: 'exam', points: 79 },
  { semester: 4, code: 'ECO401', title: L('Международная экономика', 'International Economics'), teacher: L('доц. К. О. Нурланов', 'Assoc. Prof. K. Nurlanov'), credits: 5, assessment: 'exam', points: 83 },
  { semester: 4, code: 'AUD401', title: L('Аудит', 'Auditing'), teacher: L('ст. преп. Л. М. Сокол', 'Sr. Lecturer L. Sokol'), credits: 4, assessment: 'graded_pass', points: 92 },
  { semester: 4, code: 'LAW401', title: L('Бизнес-право', 'Business Law'), teacher: L('доц. Р. А. Хакимов', 'Assoc. Prof. R. Khakimov'), credits: 3, assessment: 'pass_fail', points: 90 },
  { semester: 4, code: 'ECO402', title: L('Эконометрика (практикум)', 'Econometrics Practicum'), teacher: L('доц. В. С. Орлов', 'Assoc. Prof. V. Orlov'), credits: 3, assessment: 'pass_fail', points: 81 },
];

export const STUDENTS = {
  'a.sokolova': {
    id: '11111111-1111-4111-8111-111111111111',
    login: 'a.sokolova',
    password: 'Aurora#2026',
    hue: 158,
    rank: { position: 6, total: 26 },
    creditsTotal: 240,
    profile: {
      fullName: L('Соколова Анна Дмитриевна', 'Anna Sokolova'),
      shortName: L('Анна Соколова', 'Anna Sokolova'),
      faculty: L('Факультет цифровых технологий', 'Faculty of Digital Technologies'),
      program: L('Прикладная информатика', 'Applied Informatics'),
      degree: L('Бакалавриат', "Bachelor's degree"),
      studyForm: L('Очная', 'Full-time'),
      group: 'ПИ-23-1',
      studentCard: 'AU-2023-0417',
      email: 'a.sokolova@aurora.edu',
      phone: '+7 900 214-08-63',
      year: 3,
      admissionYear: 2023,
      curator: L('доц. Е. А. Мельникова', 'Assoc. Prof. E. Melnikova'),
    },
    courses: annaCourses,
    schedule: annaSchedule,
    notifications: [
      {
        id: 'n-anna-election', category: 'deadline', pinned: true, ageHours: 5, dueInDays: 7,
        title: L('Выбор элективных дисциплин', 'Elective course selection'),
        body: L('До 25 ноября выберите две дисциплины на весенний семестр в разделе «Документы». Если выбор не сделан, деканат распределит вас автоматически.', 'Choose two spring courses by 25 November in Documents. If you do not choose, the dean’s office will assign you automatically.'),
        action: { label: L('Выбрать дисциплины', 'Choose courses'), target: '/documents' },
      },
      {
        id: 'n-anna-schedule', category: 'schedule', ageHours: 26,
        title: L('Изменения в расписании', 'Schedule changes this week'),
        body: L('Практика по искусственному интеллекту во вторник отменена, лабораторная в среду перенесена в A-401. Обновлённая неделя уже в расписании.', 'Tuesday’s AI practice is cancelled and Wednesday’s lab moved to A-401. The updated week is already in the timetable.'),
        action: { label: L('Открыть расписание', 'Open schedule'), target: '/schedule' },
      },
      {
        id: 'n-anna-dean', category: 'dean', ageHours: 30,
        title: L('Открытый диалог с деканом', 'Open dialogue with the dean'),
        body: L('20 ноября в 17:00, ауд. A-100. Тема — выбор профиля на четвёртом курсе и международные стажировки. Прийти может любой студент факультета.', '20 November, 17:00, room A-100. Topic: fourth-year specialisations and international internships. Open to every student of the faculty.'),
      },
      {
        id: 'n-anna-rank', category: 'news', ageHours: 52,
        title: L('Вы в топ-15% потока', 'You are in the top 15% of your cohort'),
        body: L('Стипендиальный рейтинг обновлён по итогам летней сессии. Ваш средний балл — 4,65. Поздравляем!', 'The scholarship ranking has been updated after the summer session. Your average is 4.65. Congratulations!'),
      },
      {
        id: 'n-anna-aid', category: 'deadline', ageHours: 73, dueInDays: 13,
        title: L('Материальная помощь до 1 декабря', 'Financial aid closes 1 December'),
        body: L('Приём заявлений на единовременную выплату — до 1 декабря. Нужны заявление и подтверждающие документы.', 'Applications for a one-time payment close on 1 December. You will need a statement and supporting documents.'),
        action: { label: L('Подать заявление', 'Submit application'), target: '/documents' },
      },
      {
        id: 'n-anna-grades', category: 'grades', ageHours: 96,
        title: L('Ведомость летней сессии закрыта', 'Summer session record is closed'),
        body: L('Все результаты прошедшей сессии загружены в раздел «Оценки». Итоги: 4 экзамена, 2 зачёта, средний балл 4,67.', 'All results of the last session are now in Grades. Totals: 4 exams, 2 pass/fail courses, average 4.67.'),
        action: { label: L('Смотреть оценки', 'View grades'), target: '/grades' },
      },
      {
        id: 'n-anna-library', category: 'news', ageHours: 120,
        title: L('Ночная библиотека в сессию', 'Late-night library during exams'),
        body: L('С 15 декабря читальный зал в корпусе B работает до 02:00. Бронирование мест — через приложение библиотеки.', 'From 15 December the reading hall in Building B is open until 02:00. Seat booking is available in the library app.'),
      },
    ],
    demos: [
      {
        typeCode: 'enrollment', reference: 'ATL-26-0417', status: 'issued', copies: 2, delivery: 'digital', urgency: 'normal',
        createdDaysAgo: 9, reviewMinutes: 45, readyMinutes: 120, updatedDaysAgo: 6, comment: 'Для оформления банковской карты.',
      },
      {
        typeCode: 'stipend', reference: 'ATL-26-0522', status: 'ready', copies: 1, delivery: 'digital', urgency: 'normal',
        createdDaysAgo: 2, reviewMinutes: 45, readyMinutes: 150, updatedDaysAgo: 1, comment: '',
      },
      {
        typeCode: 'session_extension', reference: 'ATL-26-0531', status: 'in_review', copies: 1, delivery: 'digital', urgency: 'urgent',
        createdDaysAgo: 1, reviewMinutes: 60, readyMinutes: 300, updatedDaysAgo: 0.2, comment: 'Болезнь, есть медицинская справка. Прошу продлить сессию до 25 декабря.',
      },
    ],
  },

  'm.orlov': {
    id: '22222222-2222-4222-8222-222222222222',
    login: 'm.orlov',
    password: 'Aurora#2026',
    hue: 268,
    rank: { position: 9, total: 28 },
    creditsTotal: 240,
    profile: {
      fullName: L('Орлов Максим Сергеевич', 'Maxim Orlov'),
      shortName: L('Максим Орлов', 'Maxim Orlov'),
      faculty: L('Факультет экономики и права', 'Faculty of Economics and Law'),
      program: L('Экономика', 'Economics'),
      degree: L('Бакалавриат', "Bachelor's degree"),
      studyForm: L('Очная', 'Full-time'),
      group: 'ЭК-24-2',
      studentCard: 'AU-2024-1183',
      email: 'm.orlov@aurora.edu',
      phone: '+7 900 872-19-40',
      year: 2,
      admissionYear: 2024,
      curator: L('ст. преп. Д. Р. Валиев', 'Sr. Lecturer D. Valiev'),
    },
    courses: maximCourses,
    schedule: maximSchedule,
    notifications: [
      {
        id: 'n-max-case', category: 'deadline', pinned: true, ageHours: 3, dueInDays: 2,
        title: L('Кейс-чемпионат: заявка до 20 ноября', 'Case championship: apply by 20 Nov'),
        body: L('Команда факультета набирает участников на всероссийский кейс-чемпионат по корпоративным финансам. Нужно 2 человека.', 'The faculty team is recruiting for the national corporate finance case championship. Two places left.'),
        action: { label: L('Подать заявку', 'Apply'), target: '/documents' },
      },
      {
        id: 'n-max-schedule', category: 'schedule', ageHours: 20,
        title: L('Лекция в среду отменена', 'Wednesday lecture cancelled'),
        body: L('Международная экономика в среду перенесена на следующую неделю. Материалы и задание — в LMS.', 'Wednesday’s International Economics lecture is postponed to next week. Materials and assignment are in LMS.'),
        action: { label: L('Открыть расписание', 'Open schedule'), target: '/schedule' },
      },
      {
        id: 'n-max-dean', category: 'dean', ageHours: 44,
        title: L('Собрание по практике', 'Internship meeting'),
        body: L('21 ноября в 15:00, ауд. D-118. Расскажем, как согласовать место летней практики и оформить договор.', '21 November, 15:00, room D-118. We will explain how to arrange a summer internship placement and contract.'),
      },
      {
        id: 'n-max-grades', category: 'grades', ageHours: 78,
        title: L('Оценки за контрольную', 'Test results are in'),
        body: L('Результаты контрольной по эконометрике опубликованы. Ваша оценка — 5.', 'Econometrics test results are published. Your grade is 5.'),
        action: { label: L('Смотреть оценки', 'View grades'), target: '/grades' },
      },
      {
        id: 'n-max-aid', category: 'deadline', ageHours: 100, dueInDays: 4,
        title: L('Заявка на стипендию', 'Scholarship application'),
        body: L('Приём документов на повышенную академическую стипендию — до 22 ноября.', 'Applications for the increased academic scholarship close on 22 November.'),
        action: { label: L('Оформить справку', 'Request certificate'), target: '/documents' },
      },
      {
        id: 'n-max-library', category: 'news', ageHours: 130,
        title: L('Новые базы данных в библиотеке', 'New library databases'),
        body: L('Доступ к базам OECD и IMF открыт с университетских аккаунтов до конца года.', 'Access to OECD and IMF databases is open with university accounts until the end of the year.'),
      },
    ],
    demos: [
      {
        typeCode: 'transcript', reference: 'ATL-26-0604', status: 'in_review', copies: 1, delivery: 'paper', urgency: 'normal',
        createdDaysAgo: 1, reviewMinutes: 60, readyMinutes: 240, updatedDaysAgo: 0.3, comment: 'Для конкурса на стипендию.',
      },
    ],
  },
};

export const TEACHERS = {
  'a.gadzhiev': {
    id: '33333333-3333-4333-8333-333333333331',
    login: 'a.gadzhiev',
    password: 'Aurora#2026',
    role: 'teacher',
    hue: 205,
    profile: {
      fullName: L('Гаджиев Артём Рашидович', 'Artem Gadzhiev'),
      shortName: L('Артём Гаджиев', 'Artem Gadzhiev'),
      title: L('Профессор кафедры ИИ', 'Professor, AI Department'),
      faculty: L('Факультет цифровых технологий', 'Faculty of Digital Technologies'),
      email: 'a.gadzhiev@aurora.edu',
    },
    courseCodes: ['AI501', 'CS201', 'CS401'],
  },
  'n.kim': {
    id: '33333333-3333-4333-8333-333333333332',
    login: 'n.kim',
    password: 'Aurora#2026',
    role: 'teacher',
    hue: 322,
    profile: {
      fullName: L('Ким Наталья Олеговна', 'Natalia Kim'),
      shortName: L('Наталья Ким', 'Natalia Kim'),
      title: L('Старший преподаватель, UX', 'Senior Lecturer, UX'),
      faculty: L('Факультет цифровых технологий', 'Faculty of Digital Technologies'),
      email: 'n.kim@aurora.edu',
    },
    courseCodes: ['UX501', 'CS202', 'CS303'],
  },
};

export const DEANS = {
  'e.volkova': {
    id: '44444444-4444-4444-8444-444444444441',
    login: 'e.volkova',
    password: 'Aurora#2026',
    role: 'dean',
    hue: 28,
    profile: {
      fullName: L('Волкова Елена Павловна', 'Elena Volkova'),
      shortName: L('Елена Волкова', 'Elena Volkova'),
      title: L('Специалист деканата', 'Dean’s office specialist'),
      faculty: L('Факультет цифровых технологий', 'Faculty of Digital Technologies'),
      email: 'dean.office@aurora.edu',
    },
  },
};

export const STAFF = { ...TEACHERS, ...DEANS };

export const DEMO_ACCOUNTS = [
  { login: 'a.sokolova', password: 'Aurora#2026', role: 'student', hint: L('Студент · 3 курс, ИТ', 'Student · 3rd year, IT') },
  { login: 'm.orlov', password: 'Aurora#2026', role: 'student', hint: L('Студент · 2 курс, экономика', 'Student · 2nd year, economics') },
  { login: 'a.gadzhiev', password: 'Aurora#2026', role: 'teacher', hint: L('Преподаватель · ИИ', 'Lecturer · AI') },
  { login: 'e.volkova', password: 'Aurora#2026', role: 'dean', hint: L('Сотрудник деканата', 'Dean’s office') },
];

export const STATUS_LABELS = {
  submitted: L('Подана', 'Submitted'),
  in_review: L('На рассмотрении', 'In review'),
  approved: L('Одобрена', 'Approved'),
  ready: L('Документ готов', 'Document ready'),
  issued: L('Выдан', 'Issued'),
  rejected: L('Отклонена', 'Declined'),
  cancelled: L('Отменена', 'Cancelled'),
};
