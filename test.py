import psutil

def find_processes_by_name(search_term):
    """
    Находит все процессы, где search_term присутствует
    в имени процесса или в его командной строке.
    """
    search_term_lower = search_term.lower()
    found_processes = []

    # psutil.process_iter() - итератор по всем процессам
    # ['pid', 'name', 'cmdline'] - атрибуты, которые мы хотим получить
    # Это работает быстрее, чем получать их по одному в цикле
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            proc_info = proc.info

            # 1. Проверяем имя процесса (например, "Lumi.exe" или "java")
            if proc_info['name'] and search_term_lower in proc_info['name'].lower():
                found_processes.append(proc_info)
                continue  # Процесс найден, переходим к следующему

            # 2. Проверяем аргументы командной строки (например, ['java', '-jar', 'Lumi.jar'])
            # Это ваш случай, когда "Lumi" - это не сам процесс, а то, что он запустил
            if proc_info['cmdline']:
                # Объединяем все аргументы в одну строку для поиска
                cmdline_full = ' '.join(proc_info['cmdline'])
                if search_term_lower in cmdline_full.lower():
                    found_processes.append(proc_info)

        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            # Процесс мог завершиться, пока мы его анализировали
            # или у нас нет к нему доступа
            pass

    return found_processes

# --- Запуск ---
search_name = "lumi"
processes = find_processes_by_name(search_name)

if processes:
    print(f"✅ Найдены процессы, содержащие '{search_name}':\n")
    for proc in processes:
        print(f"  PID: {proc['pid']}")
        print(f"  Name: {proc['name']}")
        print(f"  Cmdline: {' '.join(proc['cmdline']) if proc['cmdline'] else 'N/A'}")
        print("-" * 20)
else:
    print(f"❌ Процессы, содержащие '{search_name}', не найдены.")