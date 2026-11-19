import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { L, Lang } from "./types";

const dict: Record<string, L> = {
  "nav.home": { ru: "Главная", en: "Home" },
  "nav.schedule": { ru: "Расписание", en: "Schedule" },
  "nav.grades": { ru: "Оценки", en: "Grades" },
  "nav.documents": { ru: "Документы", en: "Documents" },
  "nav.notifications": { ru: "Уведомления", en: "Updates" },
  "nav.profile": { ru: "Профиль", en: "Profile" },

  "common.today": { ru: "Сегодня", en: "Today" },
  "common.tomorrow": { ru: "Завтра", en: "Tomorrow" },
  "common.all": { ru: "Все", en: "All" },
  "common.back": { ru: "Назад", en: "Back" },
  "common.close": { ru: "Закрыть", en: "Close" },
  "common.cancel": { ru: "Отмена", en: "Cancel" },
  "common.loading": { ru: "Загружаем данные…", en: "Loading your data…" },
  "common.retry": { ru: "Повторить", en: "Try again" },
  "common.error": { ru: "Не удалось загрузить данные", en: "Could not load the data" },
  "common.details": { ru: "Подробнее", en: "Details" },
  "common.more": { ru: "Ещё", en: "More" },
  "common.open": { ru: "Открыть", en: "Open" },
  "common.min": { ru: "мин", en: "min" },
  "common.hour": { ru: "ч", en: "h" },
  "common.classes": { ru: "занятия", en: "classes" },
  "common.demo": { ru: "Демо-прототип", en: "Demo prototype" },
  "common.copy": { ru: "Копировать", en: "Copy" },

  "login.eyebrow": { ru: "Университет «Аврора»", en: "Aurora University" },
  "login.tagline": { ru: "Учебный год без беготни за справками. Всё важное — в одном спокойном месте.", en: "A semester without chasing paperwork. Everything important, calmly in one place." },
  "login.quote": { ru: "Деканат, который всегда рядом.", en: "A dean’s office that is always with you." },
  "login.title": { ru: "Вход в Atlas", en: "Sign in to Atlas" },
  "login.subtitle": { ru: "Личный кабинет студента Университета «Аврора»", en: "Student account of Aurora University" },
  "login.login": { ru: "Логин", en: "Login" },
  "login.password": { ru: "Пароль", en: "Password" },
  "login.submit": { ru: "Войти", en: "Sign in" },
  "login.submitting": { ru: "Проверяем…", en: "Signing in…" },
  "login.show": { ru: "Показать пароль", en: "Show password" },
  "login.hide": { ru: "Скрыть пароль", en: "Hide password" },
  "login.demoTitle": { ru: "Демо-доступы", en: "Demo accounts" },
  "login.demoHint": { ru: "Нажмите на аккаунт, чтобы заполнить форму. Пароль одинаковый для всех ролей.", en: "Tap an account to fill the form. Every role uses the same password." },
  "login.footer": { ru: "Демонстрационный прототип. Все студенты, оценки и документы вымышлены.", en: "Demonstration prototype. All students, grades and documents are fictional." },
  "login.demoPassword": { ru: "Пароль для всех: {p}", en: "Password for all: {p}" },
  "login.errorCredentials": { ru: "Неверный логин или пароль.", en: "Incorrect login or password." },
  "login.errorRate": { ru: "Слишком много попыток входа. Попробуйте чуть позже.", en: "Too many sign-in attempts. Please try again later." },
  "login.errorGeneric": { ru: "Не удалось войти. Проверьте соединение.", en: "Could not sign in. Check your connection." },
  "login.sessionSecure": { ru: "Защищённый вход · сессия 12 часов", en: "Secure sign-in · 12-hour session" },

  "home.morning": { ru: "Доброе утро", en: "Good morning" },
  "home.afternoon": { ru: "Добрый день", en: "Good afternoon" },
  "home.evening": { ru: "Добрый вечер", en: "Good evening" },
  "home.subtitle": { ru: "Вот что происходит в вашей учёбе сегодня.", en: "Here is what’s happening with your studies today." },
  "home.live": { ru: "Сейчас идёт", en: "In progress" },
  "home.next": { ru: "Далее", en: "Up next" },
  "home.startsIn": { ru: "через", en: "in" },
  "home.heroEmptyTitle": { ru: "На сегодня всё", en: "That’s all for today" },
  "home.heroEmptySub": { ru: "Занятий больше нет. Хорошего вечера!", en: "No more classes. Have a good evening!" },
  "home.heroEmptyNext": { ru: "Завтра первым делом", en: "First tomorrow" },
  "home.openSchedule": { ru: "Вся неделя", en: "Full week" },
  "home.quickCertificate": { ru: "Справка", en: "Certificate" },
  "home.quickStatement": { ru: "Заявление", en: "Application" },
  "home.quickSchedule": { ru: "Расписание", en: "Schedule" },
  "home.quickGrades": { ru: "Оценки", en: "Grades" },
  "home.todayTitle": { ru: "Сегодняшний день", en: "Today" },
  "home.pulseTitle": { ru: "Академический пульс", en: "Academic pulse" },
  "home.gpa": { ru: "Средний балл", en: "Grade point average" },
  "home.of5": { ru: "из 5,0", en: "out of 5.0" },
  "home.credits": { ru: "Кредиты", en: "Credits" },
  "home.rank": { ru: "В потоке", en: "In cohort" },
  "home.rankValue": { ru: "из", en: "of" },
  "home.pulseDetails": { ru: "Открыть ведомость", en: "Open transcript" },
  "home.deadlinesTitle": { ru: "Ближайшие дедлайны", en: "Upcoming deadlines" },
  "home.deadlinesEmpty": { ru: "Дедлайнов на горизонте нет.", en: "No deadlines on the horizon." },
  "home.newsTitle": { ru: "Новости университета", en: "University news" },
  "home.newsAll": { ru: "Все обновления", en: "All updates" },
  "home.changes": { ru: "изменения в расписании", en: "schedule changes" },
  "home.changesTitle": { ru: "Изменения в расписании", en: "Schedule changes" },
  "home.changesSub": { ru: "Только актуальные: сегодня и далее", en: "Current and upcoming only" },
  "home.left": { ru: "осталось {time}", en: "{time} left" },
  "home.through": { ru: "до {time}", en: "until {time}" },
  "home.classesToday": { ru: "Занятий сегодня: {n}", en: "Classes today: {n}" },
  "home.noMore": { ru: "Свободный день", en: "A free day" },
  "home.freeDay": { ru: "Занятий нет", en: "No classes" },

  "schedule.title": { ru: "Расписание", en: "Schedule" },
  "schedule.subtitle": { ru: "Неделя {n} · {dates}", en: "Week {n} · {dates}" },
  "schedule.today": { ru: "Сегодня", en: "Today" },
  "schedule.changes": { ru: "изменения", en: "changes" },
  "schedule.changesBanner": { ru: "Изменения в расписании: {n}. Подробности — ниже.", en: "Schedule changes: {n}. Details below." },
  "schedule.noClasses": { ru: "Занятий нет", en: "No classes" },
  "schedule.emptyDay": { ru: "Свободный день", en: "A free day" },
  "schedule.emptyDaySub": { ru: "Можно выдохнуть, дочитать статью или прогуляться.", en: "Take a breath, finish that article or go for a walk." },
  "schedule.emptyWeek": { ru: "На этой неделе занятий нет", en: "No classes this week" },
  "schedule.moved": { ru: "Перенесено", en: "Moved" },
  "schedule.cancelled": { ru: "Отменено", en: "Cancelled" },
  "schedule.added": { ru: "Доп. занятие", en: "Extra class" },
  "schedule.was": { ru: "Было", en: "Was" },
  "schedule.classesCount": { ru: "{n} занятие|{n} занятия|{n} занятий", en: "{n} class|{n} classes" },
  "schedule.now": { ru: "Идёт сейчас", en: "Now" },
  "schedule.searchTitle": { ru: "Найти расписание", en: "Find a schedule" },
  "schedule.searchPlaceholder": { ru: "Группа или преподаватель", en: "Group or teacher" },
  "schedule.searchHint": { ru: "Например, ПИ-23-1 или Гаджиев", en: "Try ПИ-23-1 or Gadzhiev" },
  "schedule.searchEmpty": { ru: "Ничего не найдено", en: "Nothing found" },
  "schedule.searchGroup": { ru: "Учебная группа", en: "Study group" },
  "schedule.searchTeacher": { ru: "Преподаватель", en: "Teacher" },
  "schedule.viewTitle": { ru: "Расписание", en: "Schedule" },
  "schedule.noClassesWeek": { ru: "На этой неделе занятий нет", en: "No classes this week" },
  "schedule.weekOf": { ru: "Неделя {n} · {dates}", en: "Week {n} · {dates}" },

  "grades.title": { ru: "Успеваемость", en: "Academic performance" },
  "grades.subtitle": { ru: "Оценки, баллы, сессии и академический рейтинг", en: "Grades, points, exams and academic standing" },
  "grades.gpa": { ru: "Средний балл", en: "Average grade" },
  "grades.points": { ru: "Баллы", en: "Points" },
  "grades.pointsAvg": { ru: "Баллы · из 100", en: "Points · of 100" },
  "grades.credits": { ru: "Освоено кредитов", en: "Credits earned" },
  "grades.rank": { ru: "Рейтинг в группе", en: "Group ranking" },
  "grades.distribution": { ru: "Распределение оценок", en: "Grade distribution" },
  "grades.session": { ru: "Итоги сессии", en: "Exam session results" },
  "grades.sessionSub": { ru: "Семестр {n} · {period}", en: "Semester {n} · {period}" },
  "grades.passed": { ru: "сдано", en: "passed" },
  "grades.failed": { ru: "не сдано", en: "not passed" },
  "grades.avg": { ru: "средний", en: "average" },
  "grades.place": { ru: "{pos}-е место из {total}", en: "{pos} of {total}" },
  "grades.current": { ru: "Текущий семестр", en: "Current semester" },
  "grades.semester": { ru: "{n} семестр", en: "Semester {n}" },
  "grades.inProgress": { ru: "В процессе", en: "In progress" },
  "grades.chart": { ru: "Средний балл по семестрам", en: "Average by semester" },
  "grades.course": { ru: "Дисциплина", en: "Course" },
  "grades.creditsShort": { ru: "кр.", en: "cr." },
  "grades.excellent": { ru: "Отлично", en: "Excellent" },
  "grades.good": { ru: "Хорошо", en: "Good" },
  "grades.satisfactory": { ru: "Удовлетворительно", en: "Satisfactory" },
  "grades.unsatisfactory": { ru: "Неудовлетворительно", en: "Unsatisfactory" },
  "grades.sessionCert": { ru: "Сертификат сессии", en: "Session certificate" },
  "grades.sessionCertHint": { ru: "PDF или PNG с QR-кодом и подписью декана", en: "PDF or PNG with a QR code and dean’s signature" },
  "grades.pass": { ru: "Зачёты", en: "Passed" },
  "grades.noData": { ru: "Оценок пока нет", en: "No grades yet" },
  "grades.earnedOf": { ru: "{a} из {b}", en: "{a} of {b}" },
  "grades.placeShort": { ru: "{pos} из {total}", en: "{pos} of {total}" },
  "grades.currentHint": { ru: "Дисциплины семестра {n} ещё в работе — оценки появятся после сессии.", en: "Semester {n} courses are in progress — grades appear after the session." },

  "documents.title": { ru: "Документы и заявления", en: "Documents & requests" },
  "documents.subtitle": { ru: "Деканат принимает заявки круглосуточно", en: "The dean’s office takes requests around the clock" },
  "documents.new": { ru: "Новая заявка", en: "New request" },
  "documents.filters.all": { ru: "Все", en: "All" },
  "documents.filters.active": { ru: "В работе", en: "In progress" },
  "documents.filters.ready": { ru: "Готовы", en: "Ready" },
  "documents.myRequests": { ru: "Мои заявки", en: "My requests" },
  "documents.empty": { ru: "Заявок пока нет", en: "No requests yet" },
  "documents.emptySub": { ru: "Выберите документ ниже — это быстрее, чем идти в деканат.", en: "Pick a document below — it is faster than walking to the dean’s office." },
  "documents.catalog": { ru: "Что можно заказать", en: "What you can request" },
  "documents.catalogSub": { ru: "Справки и заявления без очередей", en: "Certificates and statements, no queues" },
  "documents.certificates": { ru: "Справки", en: "Certificates" },
  "documents.statements": { ru: "Заявления", en: "Statements" },
  "documents.order": { ru: "Оформить", en: "Request" },
  "documents.urgent": { ru: "Срочно", en: "Urgent" },
  "documents.eta": { ru: "Срок", en: "Time" },
  "documents.popular": { ru: "Часто заказывают", en: "Popular" },
  "documents.office": { ru: "Деканат · корпус A, ауд. 104 · пн–пт 10:00–18:00", en: "Dean’s office · Building A, room 104 · Mon–Fri 10:00–18:00" },

  "new.title": { ru: "Новая заявка", en: "New request" },
  "new.choose": { ru: "Что нужно оформить?", en: "What do you need?" },
  "new.details": { ru: "Детали заявки", en: "Request details" },
  "new.comment": { ru: "Комментарий для деканата", en: "Comment for the dean’s office" },
  "new.commentPlaceholder": { ru: "Коротко объясните причину или уточните, для чего нужен документ", en: "Briefly explain the reason or where the document is needed" },
  "new.commentRequired": { ru: "Добавьте комментарий — минимум 10 символов.", en: "Add a comment — at least 10 characters." },
  "new.copies": { ru: "Количество копий", en: "Number of copies" },
  "new.copyForms": { ru: "{n} экз.", en: "{n} copy" },
  "new.copyFormsPlural": { ru: "{n} экз.", en: "{n} copies" },
  "new.delivery": { ru: "Формат получения", en: "Delivery" },
  "new.digital": { ru: "Электронно", en: "Digital" },
  "new.digitalHint": { ru: "PDF с электронной подписью в личном кабинете", en: "Signed PDF right in your account" },
  "new.paper": { ru: "Бумажный", en: "Paper" },
  "new.paperHint": { ru: "Заберите в деканате, корпус A, ауд. 104", en: "Collect at the dean’s office, Building A, room 104" },
  "new.urgency": { ru: "Срочность", en: "Urgency" },
  "new.urgent": { ru: "Срочно", en: "Urgent" },
  "new.normal": { ru: "Обычная", en: "Standard" },
  "new.urgentHint": { ru: "Срочные заявки обрабатываются в 3 раза быстрее", en: "Urgent requests are processed 3× faster" },
  "new.summary": { ru: "Проверьте заявку", en: "Review your request" },
  "new.summaryType": { ru: "Документ", en: "Document" },
  "new.summaryCopies": { ru: "Копии", en: "Copies" },
  "new.summaryDelivery": { ru: "Получение", en: "Delivery" },
  "new.summaryUrgency": { ru: "Срочность", en: "Urgency" },
  "new.summaryEta": { ru: "Срок", en: "Time" },
  "new.submit": { ru: "Отправить в деканат", en: "Send to the dean’s office" },
  "new.submitting": { ru: "Отправляем…", en: "Sending…" },
  "new.next": { ru: "Продолжить", en: "Continue" },
  "new.successTitle": { ru: "Заявка отправлена", en: "Request sent" },
  "new.successSub": { ru: "Деканат уже видит её. Статус обновится автоматически — следите в разделе «Документы».", en: "The dean’s office can see it now. The status updates automatically in Documents." },
  "new.openRequest": { ru: "Открыть заявку", en: "Open request" },
  "new.done": { ru: "Готово", en: "Done" },
  "new.demoNote": { ru: "Прототип: статус заявки меняется автоматически, чтобы показать путь документа.", en: "Prototype: the request status progresses automatically to show the document journey." },
  "new.error": { ru: "Не удалось отправить заявку. Попробуйте ещё раз.", en: "Could not send the request. Please try again." },
  "new.duplicate": { ru: "Похожая заявка уже в работе.", en: "A similar request is already in progress." },
  "new.tooMany": { ru: "Слишком много активных заявок. Дождитесь готовности текущих.", en: "Too many active requests. Wait for current ones first." },

  "detail.title": { ru: "Заявка", en: "Request" },
  "detail.reference": { ru: "Номер", en: "Reference" },
  "detail.created": { ru: "Создана", en: "Created" },
  "detail.copies": { ru: "Копии", en: "Copies" },
  "detail.delivery": { ru: "Получение", en: "Delivery" },
  "detail.comment": { ru: "Комментарий", en: "Comment" },
  "detail.timeline": { ru: "Ход заявки", en: "Request timeline" },
  "detail.cancel": { ru: "Отменить заявку", en: "Cancel request" },
  "detail.collect": { ru: "Документ получен", en: "Mark as collected" },
  "detail.download": { ru: "Скачать документ", en: "Download document" },
  "detail.print": { ru: "Печать / PDF", en: "Print / PDF" },
  "detail.readyHint": { ru: "Документ готов. Можно скачать PDF с QR-кодом и электронной подписью.", en: "The document is ready. Download the PDF with a QR code and digital signature." },
  "detail.paperHint": { ru: "Заберите бумажный оригинал в деканате: корпус A, ауд. 104, пн–пт 10:00–18:00.", en: "Collect the paper original at the dean’s office: Building A, room 104, Mon–Fri 10:00–18:00." },
  "detail.issuedHint": { ru: "Документ выдан и заархивирован.", en: "The document has been issued and archived." },
  "detail.cancelTitle": { ru: "Отменить заявку?", en: "Cancel this request?" },
  "detail.cancelBody": { ru: "Заявка исчезнет из очереди деканата. Вы сможете создать новую в любой момент.", en: "The request leaves the dean’s office queue. You can create a new one at any time." },
  "detail.keep": { ru: "Оставить", en: "Keep it" },
  "detail.cancelConfirm": { ru: "Да, отменить", en: "Yes, cancel" },
  "detail.notFound": { ru: "Заявка не найдена", en: "Request not found" },
  "detail.back": { ru: "К заявкам", en: "Back to requests" },
  "detail.eta": { ru: "Ожидаемый срок", en: "Expected time" },
  "detail.qr": { ru: "QR проверки документа", en: "Document verification QR" },
  "detail.issuedAt": { ru: "Выдан", en: "Issued" },
  "detail.copyShort": { ru: "{n} экз.", en: "{n} copies" },
  "detail.cancelledToast": { ru: "Заявка отменена", en: "Request cancelled" },
  "detail.collectedToast": { ru: "Отмечено как полученное", en: "Marked as collected" },

  "status.submitted": { ru: "Подана", en: "Submitted" },
  "status.in_review": { ru: "На рассмотрении", en: "In review" },
  "status.approved": { ru: "Одобрена", en: "Approved" },
  "status.ready": { ru: "Документ готов", en: "Document ready" },
  "status.issued": { ru: "Выдан", en: "Issued" },
  "status.rejected": { ru: "Отклонена", en: "Declined" },
  "status.cancelled": { ru: "Отменена", en: "Cancelled" },
  "statusHint.submitted": { ru: "Деканат получил заявку", en: "The dean’s office received it" },
  "statusHint.in_review": { ru: "Проверяем данные и готовим документ", en: "We are verifying details and preparing it" },
  "statusHint.approved": { ru: "Заявление одобрено", en: "The statement is approved" },
  "statusHint.ready": { ru: "Можно скачать или забрать", en: "Ready to download or collect" },
  "statusHint.issued": { ru: "Документ у вас", en: "Delivered to you" },
  "statusHint.rejected": { ru: "Свяжитесь с деканатом", en: "Please contact the dean’s office" },
  "statusHint.cancelled": { ru: "Заявка отменена", en: "Request cancelled" },

  "notifications.title": { ru: "Уведомления", en: "Updates" },
  "notifications.subtitle": { ru: "Деканат, дедлайны и новости", en: "Dean’s office, deadlines and news" },
  "notifications.markAll": { ru: "Прочитать все", en: "Mark all read" },
  "notifications.all": { ru: "Все", en: "All" },
  "notifications.dean": { ru: "Деканат", en: "Dean’s office" },
  "notifications.deadline": { ru: "Дедлайны", en: "Deadlines" },
  "notifications.schedule": { ru: "Расписание", en: "Schedule" },
  "notifications.news": { ru: "Новости", en: "News" },
  "notifications.grades": { ru: "Оценки", en: "Grades" },
  "notifications.today": { ru: "Сегодня", en: "Today" },
  "notifications.earlier": { ru: "Ранее", en: "Earlier" },
  "notifications.empty": { ru: "Здесь пока тихо", en: "Nothing here yet" },
  "notifications.emptySub": { ru: "Новые объявления появятся в этом разделе.", en: "New announcements will appear here." },
  "notifications.pinned": { ru: "Закреплено", en: "Pinned" },
  "notifications.due": { ru: "До", en: "Due" },
  "notifications.go": { ru: "Перейти", en: "Go" },
  "notifications.marked": { ru: "Все уведомления прочитаны", en: "All updates marked read" },
  "notifications.unread": { ru: "непрочитанных", en: "unread" },
  "notifications.todayAt": { ru: "сегодня", en: "today" },
  "notifications.yesterday": { ru: "вчера", en: "yesterday" },

  "profile.title": { ru: "Профиль", en: "Profile" },
  "profile.subtitle": { ru: "Личные данные и настройки", en: "Personal details and settings" },
  "profile.idCard": { ru: "Цифровой студенческий", en: "Digital student ID" },
  "profile.flip": { ru: "Нажмите на карту, чтобы показать QR", en: "Tap the card to show the QR code" },
  "profile.personal": { ru: "Личные данные", en: "Personal details" },
  "profile.fullName": { ru: "ФИО", en: "Full name" },
  "profile.faculty": { ru: "Факультет", en: "Faculty" },
  "profile.program": { ru: "Образовательная программа", en: "Degree programme" },
  "profile.degree": { ru: "Уровень", en: "Degree" },
  "profile.year": { ru: "Курс", en: "Year" },
  "profile.group": { ru: "Группа", en: "Group" },
  "profile.studentCard": { ru: "Номер студенческого", en: "Student card no." },
  "profile.email": { ru: "Почта", en: "Email" },
  "profile.phone": { ru: "Телефон", en: "Phone" },
  "profile.curator": { ru: "Куратор", en: "Curator" },
  "profile.admission": { ru: "Год поступления", en: "Admission year" },
  "profile.studyForm": { ru: "Форма обучения", en: "Study form" },
  "profile.yearValue": { ru: "{n} курс", en: "Year {n}" },
  "profile.security": { ru: "Безопасность", en: "Security" },
  "profile.securityBody": { ru: "Данные доступны только вам. Пароль хранится в виде PBKDF2-хеша, сессия — в защищённой HttpOnly-cookie и действует 12 часов.", en: "Only you can see this data. The password is stored as a PBKDF2 hash and the session lives in a secure HttpOnly cookie for 12 hours." },
  "profile.session": { ru: "Текущая сессия", en: "Current session" },
  "profile.sessionValue": { ru: "Активна · истекает через {h} ч", en: "Active · expires in {h} h" },
  "profile.revokeAll": { ru: "Выйти на всех устройствах", en: "Sign out everywhere" },
  "profile.revokeTitle": { ru: "Завершить все сессии?", en: "End all sessions?" },
  "profile.revokeBody": { ru: "Все устройства выйдут из аккаунта, включая это. Придётся войти заново.", en: "Every device will be signed out, including this one. You will need to sign in again." },
  "profile.revoked": { ru: "Все сессии завершены", en: "All sessions ended" },
  "profile.settings": { ru: "Настройки", en: "Settings" },
  "profile.language": { ru: "Язык интерфейса", en: "Interface language" },
  "profile.theme": { ru: "Тема", en: "Theme" },
  "profile.light": { ru: "Светлая", en: "Light" },
  "profile.dark": { ru: "Тёмная", en: "Dark" },
  "profile.system": { ru: "Системная", en: "System" },
  "profile.about": { ru: "О прототипе", en: "About the prototype" },
  "profile.aboutBody": { ru: "Atlas — концепт цифрового деканата. Университет, студенты, оценки и документы вымышлены; данные хранятся на защищённом сервере и видны только владельцу аккаунта.", en: "Atlas is a digital dean’s office concept. The university, students, grades and documents are fictional; data lives on a protected server and is visible only to the account owner." },
  "profile.logout": { ru: "Выйти из аккаунта", en: "Sign out" },
  "profile.gpa": { ru: "Средний балл", en: "Average" },
  "profile.credits": { ru: "Кредиты", en: "Credits" },
  "profile.rank": { ru: "Рейтинг", en: "Ranking" },
  "profile.valid": { ru: "Действителен до 31.08.2027", en: "Valid until 31.08.2027" },

  "cert.title": { ru: "Справка", en: "Certificate" },
  "cert.body": { ru: "Настоящая справка выдана {name} в том, что он(а) является студентом(кой) {year} курса {faculty} Университета «Аврора» по образовательной программе «{program}», группа {group}, форма обучения — очная.", en: "This certificate confirms that {name} is a {year}-year student of the {faculty} at Aurora University, enrolled in the {program} programme, group {group}, full-time." },
  "cert.directive": { ru: "Справка выдана для предъявления по месту требования.", en: "Issued for presentation at the place of request." },
  "cert.dean": { ru: "Декан факультета", en: "Dean of the faculty" },
  "cert.seal": { ru: "Университет Аврора · Деканат", en: "Aurora University · Dean’s office" },
  "cert.verify": { ru: "Проверьте подлинность документа по QR-коду или на atlas.aurora.edu/verify", en: "Verify this document via the QR code or at atlas.aurora.edu/verify" },
  "cert.date": { ru: "Дата выдачи", en: "Issued on" },
  "cert.ref": { ru: "Регистрационный номер", en: "Registration number" },

  "toast.readAll": { ru: "Всё прочитано", en: "All caught up" },
  "toast.revoked": { ru: "Все сеансы завершены", en: "All sessions ended" },
  "toast.copied": { ru: "Скопировано", en: "Copied" },
  "toast.requestCreated": { ru: "Заявка отправлена в деканат", en: "Request sent to the dean’s office" },

  "teacher.role": { ru: "Преподаватель", en: "Lecturer" },
  "teacher.eyebrow": { ru: "Кабинет преподавателя", en: "Teacher workspace" },
  "teacher.title": { ru: "Мои дисциплины", en: "My courses" },
  "teacher.subtitle": { ru: "Оценки и баллы — студенты видят изменения сразу", en: "Grades and points — students see updates instantly" },
  "teacher.statCourses": { ru: "Дисциплины", en: "Courses" },
  "teacher.statStudents": { ru: "Студенты", en: "Students" },
  "teacher.statUngraded": { ru: "Без оценки", en: "Awaiting grade" },
  "teacher.semester": { ru: "Семестр {n}", en: "Semester {n}" },
  "teacher.credits": { ru: "{n} з.е.", en: "{n} credits" },
  "teacher.studentsCount": { ru: "Студентов: {n}", en: "Students: {n}" },
  "teacher.avgPoints": { ru: "Средний балл", en: "Average points" },
  "teacher.allGraded": { ru: "Все оценки выставлены", en: "All graded" },
  "teacher.awaiting": { ru: "Без оценки: {n}", en: "Awaiting grade: {n}" },
  "teacher.sheetTitle": { ru: "Ведомость", en: "Grade book" },
  "teacher.sheetHint": { ru: "Изменения сразу появятся в кабинете студента.", en: "Changes appear in the student’s account immediately." },
  "teacher.points": { ru: "Баллы", en: "Points" },
  "teacher.grade": { ru: "Оценка", en: "Grade" },
  "teacher.none": { ru: "Нет", en: "None" },
  "teacher.pass": { ru: "Зачёт", en: "Pass" },
  "teacher.fail": { ru: "Незачёт", en: "Fail" },
  "teacher.save": { ru: "Сохранить", en: "Save" },
  "teacher.saving": { ru: "Сохраняем…", en: "Saving…" },
  "teacher.saved": { ru: "Оценки обновлены", en: "Grades updated" },
  "teacher.changes": { ru: "Изменений: {n}", en: "Changes: {n}" },
  "teacher.noChanges": { ru: "Нет изменений", en: "No changes yet" },
  "teacher.error": { ru: "Не удалось сохранить изменения", en: "Could not save the changes" },
  "teacher.empty": { ru: "Пока нет дисциплин для выставления оценок", en: "No courses to grade yet" },
  "teacher.updated": { ru: "Обновлено {time}", en: "Updated {time}" },
  "teacher.tabGrades": { ru: "Оценки", en: "Grades" },
  "teacher.tabSchedule": { ru: "Расписание", en: "Schedule" },
  "teacher.scheduleSubtitle": { ru: "Занятия с учётом изменений деканата", en: "Classes including dean’s office changes" },
  "teacher.scheduleTitle": { ru: "Моё расписание", en: "My schedule" },
  "teacher.groups": { ru: "Группы: {list}", en: "Groups: {list}" },
  "teacher.noSchedule": { ru: "На эту неделю занятий нет", en: "No classes this week" },
  "teacher.scheduleError": { ru: "Не удалось загрузить расписание", en: "Could not load the schedule" },

  "dean.role": { ru: "Деканат", en: "Dean’s office" },
  "dean.eyebrow": { ru: "Кабинет деканата", en: "Dean’s office workspace" },
  "dean.workspaceTitle": { ru: "Кабинет деканата", en: "Dean’s office" },
  "dean.workspaceSubtitle": { ru: "Заявки студентов и расписание занятий", en: "Student requests and the class schedule" },
  "dean.tabRequests": { ru: "Заявки", en: "Requests" },
  "dean.tabSchedule": { ru: "Расписание", en: "Schedule" },
  "dean.scheduleHint": { ru: "Выберите группу и неделю. Изменения сразу появятся у студентов.", en: "Pick a group and a week. Changes appear in student accounts right away." },
  "dean.week": { ru: "Неделя {n}", en: "Week {n}" },
  "dean.thisWeek": { ru: "Текущая неделя", en: "This week" },
  "dean.prevWeek": { ru: "Предыдущая неделя", en: "Previous week" },
  "dean.nextWeek": { ru: "Следующая неделя", en: "Next week" },
  "dean.addClass": { ru: "Добавить занятие", en: "Add class" },
  "dean.noClasses": { ru: "Занятий нет", en: "No classes" },
  "dean.cancelClass": { ru: "Отменить занятие", en: "Cancel class" },
  "dean.reschedule": { ru: "Перенести занятие", en: "Reschedule" },
  "dean.createTitle": { ru: "Новое занятие", en: "New class" },
  "dean.course": { ru: "Дисциплина", en: "Course" },
  "dean.classKind": { ru: "Тип занятия", en: "Class type" },
  "dean.date": { ru: "Дата", en: "Date" },
  "dean.start": { ru: "Начало", en: "Start" },
  "dean.end": { ru: "Конец", en: "End" },
  "dean.room": { ru: "Аудитория", en: "Room" },
  "dean.building": { ru: "Корпус", en: "Building" },
  "dean.roomPlaceholder": { ru: "Например, 244", en: "e.g. 244" },
  "dean.buildingPlaceholder": { ru: "Например, Главный корпус", en: "e.g. Main building" },
  "dean.note": { ru: "Комментарий для студентов", en: "Note for students" },
  "dean.notePlaceholder": { ru: "Необязательно", en: "Optional" },
  "dean.createAction": { ru: "Добавить в расписание", en: "Add to schedule" },
  "dean.moveTitle": { ru: "Перенос занятия", en: "Reschedule class" },
  "dean.moveAction": { ru: "Перенести занятие", en: "Move class" },
  "dean.newDate": { ru: "Новая дата", en: "New date" },
  "dean.newRoom": { ru: "Новая аудитория", en: "New room" },
  "dean.original": { ru: "Было", en: "Was" },
  "dean.currentPlacement": { ru: "Сейчас в расписании", en: "Currently scheduled" },
  "dean.moveHint": { ru: "Занятие можно переносить повторно — действует последний вариант.", en: "You can reschedule again — the latest placement applies." },
  "dean.resetMove": { ru: "Вернуть в исходное время", en: "Restore original slot" },
  "dean.cancelTitle": { ru: "Отменить занятие?", en: "Cancel this class?" },
  "dean.cancelBody": { ru: "Студенты увидят занятие отменённым вместе с вашим комментарием.", en: "Students will see the class as cancelled, together with your note." },
  "dean.confirmCancel": { ru: "Да, отменить", en: "Yes, cancel" },
  "dean.keepClass": { ru: "Оставить занятие", en: "Keep the class" },
  "dean.saving": { ru: "Сохраняем…", en: "Saving…" },
  "dean.scheduleSaved": { ru: "Расписание обновлено", en: "Schedule updated" },
  "dean.scheduleError": { ru: "Не удалось изменить расписание", en: "Could not update the schedule" },
  "dean.duplicateChange": { ru: "Это занятие уже изменено", en: "This class has already been changed" },
  "dean.restoreClass": { ru: "Восстановить занятие", en: "Restore class" },
  "dean.deleteClass": { ru: "Удалить занятие", en: "Delete class" },
  "dean.deleteTitle": { ru: "Удалить дополнительное занятие?", en: "Delete the extra class?" },
  "dean.deleteBody": { ru: "Занятие исчезнет из расписания группы и из уведомлений студентов.", en: "The class will be removed from the group’s schedule and student notifications." },
  "dean.confirmDelete": { ru: "Да, удалить", en: "Yes, delete" },
  "dean.keepDelete": { ru: "Оставить", en: "Keep" },
  "dean.statNew": { ru: "Новые", en: "New" },
  "dean.statReview": { ru: "В работе", en: "In review" },
  "dean.statReady": { ru: "Готовы к выдаче", en: "Ready" },
  "dean.statDone": { ru: "Завершены", en: "Completed" },
  "dean.filterAll": { ru: "Все", en: "All" },
  "dean.empty": { ru: "Здесь пусто", en: "Nothing here" },
  "dean.emptySub": { ru: "В этой категории пока нет заявок.", en: "No requests in this category yet." },
  "dean.student": { ru: "Студент", en: "Student" },
  "dean.year": { ru: "{n} курс", en: "Year {n}" },
  "dean.program": { ru: "Программа", en: "Programme" },
  "dean.group": { ru: "Группа", en: "Group" },
  "dean.email": { ru: "Почта", en: "Email" },
  "dean.reference": { ru: "Номер", en: "Reference" },
  "dean.created": { ru: "Создана", en: "Created" },
  "dean.comment": { ru: "Комментарий", en: "Comment" },
  "dean.noComment": { ru: "Без комментария", en: "No comment" },
  "dean.copies": { ru: "Копии", en: "Copies" },
  "dean.delivery": { ru: "Получение", en: "Delivery" },
  "dean.urgency": { ru: "Срочность", en: "Urgency" },
  "dean.digital": { ru: "Электронно", en: "Digital" },
  "dean.paper": { ru: "Бумажный", en: "Paper" },
  "dean.urgent": { ru: "Срочно", en: "Urgent" },
  "dean.normal": { ru: "Обычная", en: "Standard" },
  "dean.take": { ru: "Взять в работу", en: "Take in review" },
  "dean.ready": { ru: "Документ готов", en: "Mark ready" },
  "dean.approve": { ru: "Одобрить", en: "Approve" },
  "dean.issue": { ru: "Выдать документ", en: "Mark issued" },
  "dean.reject": { ru: "Отклонить", en: "Decline" },
  "dean.rejectTitle": { ru: "Отклонить заявку?", en: "Decline this request?" },
  "dean.rejectBody": { ru: "Студент увидит отказ в своём кабинете.", en: "The student will see the decline in their account." },
  "dean.rejectYes": { ru: "Да, отклонить", en: "Yes, decline" },
  "dean.keep": { ru: "Оставить", en: "Keep it" },
  "dean.revise": { ru: "Изменить решение", en: "Change decision" },
  "dean.reviseTitle": { ru: "Пересмотреть решение", en: "Revise the decision" },
  "dean.reviseHint": { ru: "Студент увидит новый статус сразу. Решение можно менять сколько угодно раз.", en: "The student sees the new status right away. You can change it as many times as needed." },
  "dean.reopen": { ru: "Вернуть в работу", en: "Reopen" },
  "dean.updated": { ru: "Статус обновлён", en: "Status updated" },
  "dean.error": { ru: "Не удалось обновить статус", en: "Could not update the status" },
  "dean.timeline": { ru: "Ход заявки", en: "Request timeline" },
  "dean.count": { ru: "Заявок: {n}", en: "Requests: {n}" },
};

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  pick: (value: L | string | null | undefined) => string;
  date: (value: string | Date, opts?: Intl.DateTimeFormatOptions) => string;
  relTime: (value: string | Date) => string;
  relDays: (value: string | Date) => string;
};

const I18nContext = createContext<I18nValue | null>(null);
const LANG_KEY = "atlas.lang";

function readLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "ru" || stored === "en") return stored;
  } catch { /* ignore */ }
  return "ru";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const value = useMemo<I18nValue>(() => {
    const locale = lang === "ru" ? "ru-RU" : "en-GB";
    const t = (key: string, vars?: Record<string, string | number>) => {
      const entry = dict[key];
      let text = entry ? entry[lang] : key;
      const count = typeof vars?.n === "number" ? vars.n : null;
      if (count !== null && text.includes("|")) {
        const forms = text.split("|");
        if (lang === "en") {
          text = forms[count === 1 ? 0 : 1] ?? forms[0];
        } else {
          const mod10 = count % 10;
          const mod100 = count % 100;
          const index = mod10 === 1 && mod100 !== 11 ? 0
            : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 1
            : 2;
          text = forms[index] ?? forms[forms.length - 1];
        }
      }
      if (vars) {
        for (const [name, val] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(val));
      }
      return text;
    };
    const pick = (input: L | string | null | undefined) => {
      if (input == null) return "";
      if (typeof input === "string") return input;
      return input[lang] || input.ru || input.en || "";
    };
    const date = (input: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) =>
      new Intl.DateTimeFormat(locale, opts).format(new Date(input));
    const relTime = (input: string | Date) => {
      const diffMs = new Date(input).getTime() - Date.now();
      const abs = Math.abs(diffMs);
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      if (abs < 60_000) return rtf.format(Math.round(diffMs / 1000), "second");
      if (abs < 3_600_000) return rtf.format(Math.round(diffMs / 60_000), "minute");
      if (abs < 86_400_000) return rtf.format(Math.round(diffMs / 3_600_000), "hour");
      return rtf.format(Math.round(diffMs / 86_400_000), "day");
    };
    const relDays = (input: string | Date) => {
      const diff = new Date(input).getTime() - Date.now();
      const days = Math.ceil(diff / 86_400_000);
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      if (days <= 0) return rtf.format(0, "day");
      return rtf.format(days, "day");
    };
    return { lang, setLang, t, pick, date, relTime, relDays };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}

export function useFirstName() {
  const { pick } = useI18n();
  return (name: L) => pick(name).split(" ")[0] ?? "";
}
