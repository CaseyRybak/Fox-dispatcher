# Аудит скиллов для Fox Dispatcher

Дата проверки: 2026-07-16

## Контекст

Fox Dispatcher — интерактивное тестовое приложение «Лисий диспетчер»: редактируемые наблюдения, объяснимый расчёт подозрительности, сводка по локациям и встроенный AI Worklog. Этот документ фиксирует выбор скиллов; он не является планом реализации приложения.

SkillsMP рассматривается как каталог. Источником для проверки и будущей установки служит только upstream-репозиторий владельца скилла, а не зеркало или одноимённая копия из каталога.

## Метод проверки

Для каждого кандидата проверены:

- владелец и upstream-репозиторий;
- полный перечень файлов в папке скилла;
- shell-, Python- и JavaScript-скрипты;
- сетевые команды, загрузка изменяемых инструкций и установка пакетов;
- чтение переменных окружения, ключей, токенов и системных хранилищ;
- упаковка исходников, планов и `git diff` для передачи другим агентам;
- соответствие прогрессивному раскрытию контекста и идеям Harness Engineering.

Скрипты сторонних кандидатов при аудите не запускались. Проверка выполнена по следующим снимкам upstream:

- Anthropic Skills: `9d2f1ae187231d8199c64b5b762e1bdf2244733d`
- obra/superpowers: `d884ae04edebef577e82ff7c4e143debd0bbec99`
- vercel-labs/agent-skills: `f8a72b9603728bb92a217a879b7e62e43ad76c81`
- addyosmani/web-quality-skills: `95d6e255afe1596b557d7a8498517884438f5b3a`
- OpenAI Skills: `49f948faa9258a0c61caceaf225e179651397431`

## Установленный комплект

### Anthropic `frontend-design`

- Источник: <https://github.com/anthropics/skills/tree/main/skills/frontend-design>
- Путь: `.agents/skills/frontend-design`
- Состав: `SKILL.md` и Apache 2.0 `LICENSE.txt`.
- Сверка: локальные файлы полностью совпадают с указанным снимком upstream.
- Безопасность: низкий риск. Исполняемых файлов, сетевых вызовов, чтения окружения, секретов и передачи данных нет.
- Польза: задаёт осмысленное визуальное направление, типографику, композицию, responsive-поведение, фокус и reduced motion без шаблонного «AI-интерфейса».

### OpenAI `playwright`

- Источник: <https://github.com/openai/skills/tree/main/skills/.curated/playwright>
- Путь: `.agents/skills/playwright`
- Состояние: точная официальная curated-копия со снимка `49f948faa9258a0c61caceaf225e179651397431`, лицензией, notices, wrapper-скриптом и references.
- Безопасность: wrapper запускает официальный `@playwright/cli` через `npx`; сетевой доступ возникает только при фактическом вызове wrapper. Скилл используется для локальных браузерных проверок и явных URL.

### Адаптированные Superpowers

Установлены `brainstorming`, `writing-plans`, `subagent-driven-development`, `verification-before-completion`, `test-driven-development`, `requesting-code-review`, `receiving-code-review` и `writing-skills`. Project-local версии сохраняют методику upstream и заменяют browser companion, полный diff, вывод окружения, автоматическую установку зависимостей и директивный язык на короткие позитивные workflows с минимальным контекстом.

### Дополнительные скиллы

Установлены адаптированные `accessibility`, `react-best-practices` и `best-practices`. Команды загрузки пакетов заменены на использование закреплённых зависимостей и repository scripts; скомпилированный React `AGENTS.md` и директивная библиотека правил заменены тремя короткими project-local references.

## Superpowers: основной набор

Источник набора: <https://github.com/obra/superpowers/tree/main/skills>. Страницы SkillsMP следует выбирать только с владельцем `obra/superpowers`.

| Скилл | Зачем проекту | Результат аудита | Решение |
|---|---|---|---|
| `writing-plans` | Материализует требования в версионируемые execution plans | Два Markdown-файла; исполняемого кода и сетевых вызовов нет | Установлен в адаптированной форме |
| `subagent-driven-development` | Реализация задач отдельными агентами с независимыми проверками | Upstream содержит локальные Bash-скрипты и формирование полного `git diff` | Установлен без скриптов, с минимальными review packages и secret-scan |
| `verification-before-completion` | Требует свежего проверяемого результата перед заявлением о готовности | Только Markdown; сетевых вызовов и доступа к данным нет | Установлен |
| `test-driven-development` | Полезен для детерминированного scoring, JSON-валидации и пересчётов | Только Markdown; примеры запускают локальные тесты | Установлен в адаптированной форме |
| `requesting-code-review` | Даёт агенту-рецензенту понятный пакет изменений | Upstream рекомендует передавать полный `git diff` | Установлен с secret-scan и минимизацией контекста |
| `receiving-code-review` | Помогает проверять замечания по фактам и тестам | Только Markdown; прямого доступа к данным и сети нет | Установлен |
| `writing-skills` | Поддерживает развитие репозиторных скиллов из повторяемых рабочих приёмов | Upstream содержит локальный Graphviz renderer | Установлен без исполняемого renderer, с repository-focused процессом |

### Superpowers: условно и позже

| Скилл | Риск или ограничение | Решение |
|---|---|---|
| `systematic-debugging` | Сам `find-polluter.sh` локальный и сети не использует, но инструкция показывает `env`, Keychain и signing diagnostics. Это может вывести секреты в tool output и контекст агента | Не устанавливать как есть; сначала заменить диагностику на факт наличия значения и редактирование вывода |
| `using-git-worktrees` | Автоматически предлагает `npm install`, `pip install`, `cargo build`, `go mod download`. Это расширяет supply-chain поверхность и может запустить lifecycle scripts | Добавить позже с lockfile-first установкой и проверкой зависимостей |
| `dispatching-parallel-agents` | Исполняемого кода нет, но широкая раздача контекста увеличивает число мест, куда попадает diff и проектная информация | Использовать только для действительно независимых задач и передавать минимальные briefs |

### Superpowers: не брать сейчас

- `executing-plans`: дублирует основной subagent-driven процесс.
- `finishing-a-development-branch`: понадобится только на этапе сдачи.
- `using-superpowers`: мета-слой без проектной ценности.

### Конфликт с форматом репозитория

Тексты Superpowers насыщены формулировками `MUST`, `NEVER`, `Iron Law` и запретами. Это расходится с намерением хранить в `AGENTS.md` и репозиторных скиллах карты контекста и полезные процедуры без свода правил. Поэтому подходящие скиллы стоит не копировать дословно, а преобразовать в короткие позитивные project-local workflows с сохранением происхождения и версии upstream.

## Дополнительные SkillsMP-кандидаты

### Рекомендую

#### Addy Osmani `accessibility`

- SkillsMP: <https://skillsmp.com/creators/addyosmani/web-quality-skills/skills-accessibility>
- Upstream: <https://github.com/addyosmani/web-quality-skills/tree/main/skills/accessibility>
- Польза: таблицы, формы редактирования, клавиатура, фокус, контраст, reduced motion, aria-live для пересчитанного результата и WCAG 2.2.
- Состав: три Markdown-файла, без встроенных скриптов.
- Безопасность: низкий риск для чтения. В примерах есть `npx lighthouse` и глобальный `npm install @axe-core/cli`; при внедрении их следует заменить на закреплённые project-local devDependencies. Сам скилл ничего не скачивает автоматически.

#### Vercel `react-best-practices`

- Upstream: <https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices>
- Польза: React rendering, состояние, localStorage schema, bundle size и предотвращение лишних перерисовок.
- Состав: Markdown, JSON и каталог из 70 отдельных правил; собственных исполняемых скриптов нет. Структура поддерживает прогрессивное чтение отдельных правил.
- Безопасность: низкий риск для чтения. Единственная команда выполнения внутри правил — `npx svgo`; использовать закреплённый локальный `svgo`, если он вообще понадобится.
- Ограничение: скомпилированный `AGENTS.md` очень большой. Для project-local варианта лучше сохранить `SKILL.md` и отдельные `rules/`, не подмешивая полный документ в контекст.

#### Addy Osmani `best-practices` — как review-reference

- Upstream: <https://github.com/addyosmani/web-quality-skills/tree/main/skills/best-practices>
- Польза: безопасная обработка редактируемого JSON, защита от DOM XSS, CSP и отсутствие секретов в production artifacts.
- Состав: один Markdown-файл, без исполняемых скриптов.
- Безопасность: низкий риск для чтения; в примерах есть изменяющая зависимости команда `npm audit fix` и внешние online validators. Для проекта использовать только review-часть, а исправления зависимостей выполнять отдельным осознанным шагом.

### Не добавлять или заменить

#### Vercel `web-design-guidelines`

Скилл при каждом запуске требует загрузить изменяемый `command.md` с ветки `main`. Это не отправляет файлы проекта наружу само по себе, но создаёт supply-chain и prompt-injection риск: поведение локального агента меняется без изменения закреплённой копии скилла. Как есть не устанавливать. Допустимый вариант — заранее проверенный snapshot по commit SHA, но он частично дублирует `frontend-design` и `accessibility`.

#### Anthropic `webapp-testing`

Полезен для Playwright-проверок и локального сервера, прямой эксфильтрации не содержит. Его helper запускает переданную строку через `shell=True`, поэтому доверие к команде обязательно. В текущей среде уже доступен проверенный Playwright-скилл, поэтому дубликат из SkillsMP не нужен.

## Итоговый комплект

Минимальный комплект для Fox Dispatcher:

1. `frontend-design` — уже установлен.
2. Адаптированные `brainstorming`, `writing-plans`, `subagent-driven-development`, `verification-before-completion`, `test-driven-development`, `requesting-code-review`, `receiving-code-review`, `writing-skills`.
3. `accessibility`.
4. `react-best-practices`.
5. `best-practices` как узкий security-review reference.
6. Официальный curated OpenAI `playwright`.

Все перечисленные скиллы установлены локально в `.agents/skills`; кандидаты из разделов «условно и позже» и «не добавлять» отсутствуют.

## Связь с Harness Engineering

Выбор поддерживает модель из статьи OpenAI <https://openai.com/index/harness-engineering/>:

- `writing-plans` материализует намерения в versioned execution plans;
- `subagent-driven-development` и review-скиллы дают агентам ограниченные задачи и независимую проверку;
- `verification-before-completion`, TDD и Playwright создают наблюдаемую обратную связь;
- `writing-skills` помогает переносить устойчивые повторяемые процедуры в короткие repo-local skills;
- `AGENTS.md` остаются картами доменов и ссылками на актуальные артефакты, а не хранилищем всей документации.

Репозиторные скиллы стоит создавать только после появления проверенного повторяемого рабочего приёма. Планы, незакрытые решения и намерения остаются отдельными артефактами, а не содержимым скиллов.
