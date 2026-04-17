# 平台抽象与驱动系统

## 目录

1. [OS 单例与平台实现](#1-os-单例与平台实现)
2. [DisplayServer 抽象系统](#2-displayserver-抽象系统)
3. [RenderingDeviceDriver 架构](#3-renderingdevicedriver-架构)
4. [AudioDriver 实现](#4-audiodriver-实现)
5. [平台检测与条件编译](#5-平台检测与条件编译)
6. [驱动系统扩展](#6-驱动系统扩展)
7. [实战案例分析](#7-实战案例分析)
8. [总结](#总结)

---

## 1. OS 单例与平台实现

### 1.1 OS 类架构

`OS` 类是 Godot 引擎平台抽象的核心，作为单例提供所有平台相关的系统级功能。它位于 `core/os/` 目录，是整个引擎与操作系统交互的桥梁。

```cpp
// core/os/os.h (简化版)

class OS {
public:
    // ========== 初始化与主循环 ==========
    virtual void initialize() = 0;
    virtual void finalize() = 0;
    virtual void main_loop_begin() = 0;
    virtual bool main_loop_iterate() = 0;
    virtual void main_loop_end() = 0;
    
    // ========== 窗口管理 ==========
    virtual void initialize_video() = 0;
    virtual void set_window_size(const Size2 &p_size) = 0;
    virtual Size2 get_window_size() const = 0;
    virtual void set_window_position(const Point2 &p_position) = 0;
    virtual Point2 get_window_position() const = 0;
    virtual void set_window_title(const String &p_title) = 0;
    virtual void set_window_fullscreen(bool p_enabled) = 0;
    virtual bool is_window_fullscreen() const = 0;
    virtual void set_window_resizable(bool p_enabled) = 0;
    
    // ========== 显示与屏幕 ==========
    virtual int get_screen_count() const = 0;
    virtual int get_primary_screen() const = 0;
    virtual Point2i screen_get_position(int p_screen) const = 0;
    virtual Size2i screen_get_size(int p_screen) const = 0;
    virtual int screen_get_dpi(int p_screen) const = 0;
    virtual void screen_set_orientation(ScreenOrientation p_orientation) = 0;
    
    // ========== 时间与计时器 ==========
    virtual uint64_t get_ticks_usec() const = 0;
    virtual uint64_t get_ticks_msec() const = 0;
    virtual uint64_t get_unix_time() const = 0;
    virtual DateTime get_datetime(bool p_utc) const = 0;
    virtual void delay_usec(uint32_t p_usec) const = 0;
    virtual void delay_ms(uint32_t p_ms) const = 0;
    
    // ========== 文件系统 ==========
    virtual bool file_exists(const String &p_path) const = 0;
    virtual bool dir_exists(const String &p_path) const = 0;
    virtual Error file_copy(const String &p_from, const String &p_to) = 0;
    virtual Error file_rename(const String &p_from, const String &p_to) = 0;
    virtual Error file_remove(const String &p_path) = 0;
    virtual Error dir_create(const String &p_path) = 0;
    virtual String get_data_dir() const = 0;
    virtual String get_config_dir() const = 0;
    virtual String get_cache_dir() const = 0;
    virtual String get_temp_dir() const = 0;
    
    // ========== 进程与线程 ==========
    virtual int get_processor_count() const = 0;
    virtual String get_processor_name() const = 0;
    virtual ThreadID get_thread_caller_id() const = 0;
    virtual Error execute(const String &p_path, const List<String> &p_arguments, String *r_output = nullptr) = 0;
    virtual Error kill(const ProcessID &p_pid) = 0;
    virtual int get_process_id() const = 0;
    
    // ========== 线程同步原语 ==========
    virtual Mutex *mutex_create() = 0;
    virtual Semaphore *semaphore_create(int p_initial_count = 0) = 0;
    virtual ConditionVariable *condition_variable_create() = 0;
    
    // ========== 输入 ==========
    virtual bool is_joy_known(int p_device) const = 0;
    virtual String get_joy_name(int p_device) const = 0;
    virtual float get_joy_axis(int p_device, JoyAxis p_axis) const = 0;
    virtual bool is_joy_button_pressed(int p_device, JoyButton p_button) const = 0;
    
    // ========== 网络 ==========
    virtual IP *create_ip() const = 0;
    virtual int get_socket_count() const = 0;
    
    // ========== 平台信息 ==========
    virtual String get_name() const = 0;
    virtual String get_model_name() const = 0;
    virtual String get_unique_id() const = 0;
    virtual bool is_debug_build() const = 0;
    virtual String get_locale() const = 0;
    
    // ========== 环境变量 ==========
    virtual String get_environment(const String &p_variable) const = 0;
    virtual void set_environment(const String &p_variable, const String &p_value) = 0;
    virtual void unset_environment(const String &p_variable) = 0;
    
    // ========== 单例访问 ==========
    static OS *get_singleton() { return singleton; }
    
protected:
    static OS *singleton;
};
```

### 1.2 Windows 平台实现

Windows 平台的 OS 实现位于 `platform/windows/os_windows.cpp`：

```cpp
// platform/windows/os_windows.cpp

class OS_Windows : public OS {
    HINSTANCE hInstance;
    HWND mainWindow;
    
    // 计时器相关
    LARGE_INTEGER frequency;
    LARGE_INTEGER counter_at_start;
    
    // 系统信息
    DWORD system_cid;
    
public:
    // ========== 初始化 ==========
    virtual void initialize() override {
        // 初始化 COM
        CoInitialize(nullptr);
        
        // 初始化计时器
        QueryPerformanceFrequency(&frequency);
        QueryPerformanceCounter(&counter_at_start);
        
        // 获取系统信息
        system_cid = GetCurrentProcessId();
        
        // 初始化窗口
        initialize_video();
        
        // 初始化输入系统
        initialize_joysticks();
    }
    
    // ========== 时间实现 ==========
    virtual uint64_t get_ticks_usec() const override {
        LARGE_INTEGER counter;
        QueryPerformanceCounter(&counter);
        
        // 转换为微秒
        uint64_t elapsed = counter.QuadPart - counter_at_start.QuadPart;
        return (elapsed * 1000000) / frequency.QuadPart;
    }
    
    virtual uint64_t get_unix_time() const override {
        FILETIME ft;
        GetSystemTimeAsFileTime(&ft);
        
        // FILETIME 是从 1601 年开始的 100 纳秒间隔
        // 转换为 Unix 时间戳（从 1970 年开始的秒数）
        ULARGE_INTEGER uli;
        uli.LowPart = ft.dwLowDateTime;
        uli.HighPart = ft.dwHighDateTime;
        
        return (uli.QuadPart / 10000000ULL) - 11644473600ULL;
    }
    
    virtual void delay_usec(uint32_t p_usec) const override {
        if (p_usec < 1000) {
            // 小于 1ms，使用自旋等待
            uint64_t start = get_ticks_usec();
            while ((get_ticks_usec() - start) < p_usec) {
                // CPU 空转
            }
        } else {
            // 大于等于 1ms，使用 Sleep
            Sleep(p_usec / 1000);
        }
    }
    
    // ========== 文件系统实现 ==========
    virtual bool file_exists(const String &p_path) const override {
        DWORD attributes = GetFileAttributesW(p_path.c_str());
        return (attributes != INVALID_FILE_ATTRIBUTES) && 
               !(attributes & FILE_ATTRIBUTE_DIRECTORY);
    }
    
    virtual bool dir_exists(const String &p_path) const override {
        DWORD attributes = GetFileAttributesW(p_path.c_str());
        return (attributes != INVALID_FILE_ATTRIBUTES) && 
               (attributes & FILE_ATTRIBUTE_DIRECTORY);
    }
    
    virtual String get_data_dir() const override {
        // Windows 使用 %APPDATA%
        WCHAR path[MAX_PATH];
        if (SUCCEEDED(SHGetFolderPathW(nullptr, CSIDL_APPDATA, nullptr, 0, path))) {
            return String(path);
        }
        return ".";
    }
    
    virtual String get_temp_dir() const override {
        WCHAR path[MAX_PATH];
        GetTempPathW(MAX_PATH, path);
        return String(path);
    }
    
    // ========== 进程与线程 ==========
    virtual int get_processor_count() const override {
        SYSTEM_INFO sysinfo;
        GetSystemInfo(&sysinfo);
        return sysinfo.dwNumberOfProcessors;
    }
    
    virtual ThreadID get_thread_caller_id() const override {
        return GetCurrentThreadId();
    }
    
    virtual Error execute(const String &p_path, const List<String> &p_arguments, String *r_output) override {
        // 构建命令行
        String command_line = p_path;
        for (const String &arg : p_arguments) {
            command_line += " \"" + arg + "\"";
        }
        
        // 创建进程
        STARTUPINFOW si;
        PROCESS_INFORMATION pi;
        ZeroMemory(&si, sizeof(si));
        si.cb = sizeof(si);
        ZeroMemory(&pi, sizeof(pi));
        
        BOOL result = CreateProcessW(
            nullptr,
            (LPWSTR)command_line.c_str(),
            nullptr,
            nullptr,
            FALSE,
            CREATE_NO_WINDOW,
            nullptr,
            nullptr,
            &si,
            &pi
        );
        
        if (!result) {
            return ERR_CANT_CREATE;
        }
        
        // 等待进程完成
        WaitForSingleObject(pi.hProcess, INFINITE);
        
        // 获取退出码
        DWORD exit_code;
        GetExitCodeProcess(pi.hProcess, &exit_code);
        
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        
        return (exit_code == 0) ? OK : FAILED;
    }
    
    // ========== 环境变量 ==========
    virtual String get_environment(const String &p_variable) const override {
        DWORD size = GetEnvironmentVariableW(p_variable.c_str(), nullptr, 0);
        if (size == 0) {
            return "";
        }
        
        WCHAR *buffer = (WCHAR *)memalloc(sizeof(WCHAR) * size);
        GetEnvironmentVariableW(p_variable.c_str(), buffer, size);
        
        String result(buffer);
        memfree(buffer);
        return result;
    }
    
    virtual void set_environment(const String &p_variable, const String &p_value) override {
        SetEnvironmentVariableW(p_variable.c_str(), p_value.c_str());
    }
    
    // ========== 平台信息 ==========
    virtual String get_name() const override {
        return "Windows";
    }
    
    virtual String get_model_name() const override {
        // 获取计算机名
        WCHAR computer_name[MAX_COMPUTERNAME_LENGTH + 1];
        DWORD size = MAX_COMPUTERNAME_LENGTH + 1;
        
        if (GetComputerNameW(computer_name, &size)) {
            return String(computer_name);
        }
        return "Windows PC";
    }
    
    virtual String get_unique_id() const override {
        // 使用机器 GUID
        String guid;
        
        // 从注册表读取
        HKEY key;
        if (RegOpenKeyExW(HKEY_LOCAL_MACHINE, 
                         L"SOFTWARE\\Microsoft\\Cryptography", 
                         0, KEY_READ, &key) == ERROR_SUCCESS) {
            WCHAR buffer[256];
            DWORD size = sizeof(buffer);
            
            if (RegQueryValueExW(key, L"MachineGuid", nullptr, nullptr, 
                               (LPBYTE)buffer, &size) == ERROR_SUCCESS) {
                guid = String(buffer);
            }
            
            RegCloseKey(key);
        }
        
        return guid;
    }
    
    virtual String get_locale() const override {
        WCHAR locale[LOCALE_NAME_MAX_LENGTH];
        if (GetUserDefaultLocaleName(locale, LOCALE_NAME_MAX_LENGTH)) {
            return String(locale);
        }
        return "en_US";
    }
    
    // ========== 同步原语 ==========
    virtual Mutex *mutex_create() override {
        return memnew(MutexWindows);
    }
    
    virtual Semaphore *semaphore_create(int p_initial_count) override {
        return memnew(SemaphoreWindows(p_initial_count));
    }
    
    virtual ConditionVariable *condition_variable_create() override {
        return memnew(ConditionVariableWindows);
    }
};
```

### 1.3 Linux 平台实现

Linux 平台的 OS 实现位于 `platform/linuxbsd/os_linuxbsd.cpp`：

```cpp
// platform/linuxbsd/os_linuxbsd.cpp

class OS_LinuxBSD : public OS {
    Display *x11_display;
    
public:
    // ========== 初始化 ==========
    virtual void initialize() override {
        // 初始化 X11 显示
        x11_display = XOpenDisplay(nullptr);
        
        // 初始化手柄系统
        initialize_joysticks();
    }
    
    // ========== 时间实现 ==========
    virtual uint64_t get_ticks_usec() const override {
        struct timespec ts;
        clock_gettime(CLOCK_MONOTONIC, &ts);
        return ts.tv_sec * 1000000 + ts.tv_nsec / 1000;
    }
    
    virtual uint64_t get_unix_time() const override {
        struct timeval tv;
        gettimeofday(&tv, nullptr);
        return tv.tv_sec;
    }
    
    virtual void delay_usec(uint32_t p_usec) const override {
        struct timespec req = {
            .tv_sec = p_usec / 1000000,
            .tv_nsec = (p_usec % 1000000) * 1000
        };
        
        nanosleep(&req, nullptr);
    }
    
    // ========== 文件系统实现 ==========
    virtual bool file_exists(const String &p_path) const override {
        struct stat st;
        return (stat(p_path.utf8().get_data(), &st) == 0) && S_ISREG(st.st_mode);
    }
    
    virtual bool dir_exists(const String &p_path) const override {
        struct stat st;
        return (stat(p_path.utf8().get_data(), &st) == 0) && S_ISDIR(st.st_mode);
    }
    
    virtual String get_data_dir() const override {
        // 遵循 XDG 基础目录规范
        const char *data_home = getenv("XDG_DATA_HOME");
        
        if (data_home && data_home[0]) {
            return String(data_home);
        }
        
        // 默认为 ~/.local/share
        String home = get_environment("HOME");
        return home.plus_file(".local/share");
    }
    
    virtual String get_config_dir() const override {
        const char *config_home = getenv("XDG_CONFIG_HOME");
        
        if (config_home && config_home[0]) {
            return String(config_home);
        }
        
        // 默认为 ~/.config
        String home = get_environment("HOME");
        return home.plus_file(".config");
    }
    
    virtual String get_cache_dir() const override {
        const char *cache_home = getenv("XDG_CACHE_HOME");
        
        if (cache_home && cache_home[0]) {
            return String(cache_home);
        }
        
        // 默认为 ~/.cache
        String home = get_environment("HOME");
        return home.plus_file(".cache");
    }
    
    virtual String get_temp_dir() const override {
        const char *tmpdir = getenv("TMPDIR");
        
        if (tmpdir && tmpdir[0]) {
            return String(tmpdir);
        }
        
        return "/tmp";
    }
    
    // ========== 进程与线程 ==========
    virtual int get_processor_count() const override {
        return sysconf(_SC_NPROCESSORS_ONLN);
    }
    
    virtual ThreadID get_thread_caller_id() const override {
        return (ThreadID)pthread_self();
    }
    
    virtual Error execute(const String &p_path, const List<String> &p_arguments, String *r_output) override {
        // 构建 argv 数组
        Vector<char *> argv;
        argv.push_back((char *)p_path.utf8().get_data());
        
        for (const String &arg : p_arguments) {
            argv.push_back((char *)arg.utf8().get_data());
        }
        argv.push_back(nullptr);
        
        // fork 子进程
        pid_t pid = fork();
        
        if (pid == 0) {
            // 子进程
            execvp(p_path.utf8().get_data(), argv.ptr());
            _exit(127); // execv 失败
        } else if (pid > 0) {
            // 父进程，等待子进程
            int status;
            waitpid(pid, &status, 0);
            
            return (WIFEXITED(status) && WEXITSTATUS(status) == 0) ? OK : FAILED;
        } else {
            return ERR_CANT_CREATE;
        }
    }
    
    // ========== 环境变量 ==========
    virtual String get_environment(const String &p_variable) const override {
        const char *value = getenv(p_variable.utf8().get_data());
        return value ? String(value) : "";
    }
    
    virtual void set_environment(const String &p_variable, const String &p_value) override {
        setenv(p_variable.utf8().get_data(), p_value.utf8().get_data(), 1);
    }
    
    virtual void unset_environment(const String &p_variable) override {
        unsetenv(p_variable.utf8().get_data());
    }
    
    // ========== 平台信息 ==========
    virtual String get_name() const override {
        return "LinuxBSD";
    }
    
    virtual String get_model_name() const override {
        // 从 /sys/class/dmi/id/product_name 读取
        String model_name;
        
        FILE *f = fopen("/sys/class/dmi/id/product_name", "r");
        if (f) {
            char buffer[256];
            if (fgets(buffer, sizeof(buffer), f)) {
                // 移除换行符
                buffer[strcspn(buffer, "\n")] = 0;
                model_name = String(buffer);
            }
            fclose(f);
        }
        
        return model_name;
    }
    
    virtual String get_unique_id() const override {
        // 使用机器 ID（通常在 /etc/machine-id）
        String machine_id;
        
        FILE *f = fopen("/etc/machine-id", "r");
        if (f) {
            char buffer[256];
            if (fgets(buffer, sizeof(buffer), f)) {
                buffer[strcspn(buffer, "\n")] = 0;
                machine_id = String(buffer);
            }
            fclose(f);
        }
        
        return machine_id;
    }
    
    virtual String get_locale() const override {
        const char *lang = getenv("LANG");
        if (lang) {
            String locale(lang);
            // lang 格式通常为 "en_US.UTF-8"
            int dot_pos = locale.find(".");
            if (dot_pos >= 0) {
                return locale.substr(0, dot_pos);
            }
            return locale;
        }
        return "en_US";
    }
    
    // ========== 同步原语 ==========
    virtual Mutex *mutex_create() override {
        return memnew(MutexPosix);
    }
    
    virtual Semaphore *semaphore_create(int p_initial_count) override {
        return memnew(SemaphorePosix(p_initial_count));
    }
    
    virtual ConditionVariable *condition_variable_create() override {
        return memnew(ConditionVariablePosix);
    }
};
```

### 1.4 macOS 平台实现

macOS 平台的 OS 实现位于 `platform/macos/os_macos.mm`：

```cpp
// platform/macos/os_macos.mm

class OS_MacOS : public OS {
    id autorelease_pool;
    
public:
    // ========== 初始化 ==========
    virtual void initialize() override {
        // 创建自动释放池
        autorelease_pool = [[NSAutoreleasePool alloc] init];
        
        // 初始化应用
        [NSApplication sharedApplication];
        
        // 初始化手柄系统
        initialize_joysticks();
    }
    
    // ========== 时间实现 ==========
    virtual uint64_t get_ticks_usec() const override {
        // 使用 mach_absolute_time
        static mach_timebase_info_data_t timebase;
        static bool initialized = false;
        
        if (!initialized) {
            mach_timebase_info(&timebase);
            initialized = true;
        }
        
        uint64_t elapsed = mach_absolute_time();
        return (elapsed * timebase.numer) / timebase.denom / 1000;
    }
    
    virtual uint64_t get_unix_time() const override {
        struct timeval tv;
        gettimeofday(&tv, nullptr);
        return tv.tv_sec;
    }
    
    virtual void delay_usec(uint32_t p_usec) const override {
        struct timespec req = {
            .tv_sec = p_usec / 1000000,
            .tv_nsec = (p_usec % 1000000) * 1000
        };
        nanosleep(&req, nullptr);
    }
    
    // ========== 文件系统实现 ==========
    virtual String get_data_dir() const override {
        // macOS 使用 ~/Library/Application Support
        NSString *path = [NSSearchPathForDirectoriesInDomains(
            NSApplicationSupportDirectory, NSUserDomainMask, YES
        ) firstObject];
        
        return String([path UTF8String]);
    }
    
    virtual String get_config_dir() const override {
        // macOS 使用 ~/Library/Preferences
        NSString *path = [NSSearchPathForDirectoriesInDomains(
            NSPreferencePanesDirectory, NSUserDomainMask, YES
        ) firstObject];
        
        return String([path UTF8String]);
    }
    
    virtual String get_cache_dir() const override {
        // macOS 使用 ~/Library/Caches
        NSString *path = [NSSearchPathForDirectoriesInDomains(
            NSCachesDirectory, NSUserDomainMask, YES
        ) firstObject];
        
        return String([path UTF8String]);
    }
    
    // ========== 进程与线程 ==========
    virtual int get_processor_count() const override {
        return [NSProcessInfo processInfo].processorCount;
    }
    
    virtual ThreadID get_thread_caller_id() const override {
        return (ThreadID)pthread_mach_thread_np(pthread_self());
    }
    
    // ========== 环境变量 ==========
    virtual String get_environment(const String &p_variable) const override {
        NSString *ns_var = [NSString stringWithUTF8String:p_variable.utf8().get_data()];
        NSString *ns_value = [[NSProcessInfo processInfo] environment][ns_var];
        
        return ns_value ? String([ns_value UTF8String]) : "";
    }
    
    virtual void set_environment(const String &p_variable, const String &p_value) override {
        setenv(p_variable.utf8().get_data(), p_value.utf8().get_data(), 1);
    }
    
    // ========== 平台信息 ==========
    virtual String get_name() const override {
        return "macOS";
    }
    
    virtual String get_model_name() const override {
        // 从系统配置获取
        NSString *model = @"Mac";
        
        size_t len;
        sysctlbyname("hw.model", nullptr, &len, nullptr, 0);
        char *model_str = (char *)malloc(len);
        sysctlbyname("hw.model", model_str, &len, nullptr, 0);
        
        model = [NSString stringWithUTF8String:model_str];
        free(model_str);
        
        return String([model UTF8String]);
    }
    
    virtual String get_unique_id() const override {
        // 使用硬件 UUID
        io_service_t platformExpert = IOServiceGetMatchingService(
            kIOMasterPortDefault,
            IOServiceMatching("IOPlatformExpertDevice")
        );
        
        if (platformExpert) {
            CFTypeRef uuid = IORegistryEntryCreateCFProperty(
                platformExpert,
                CFSTR(kIOPlatformUUIDKey),
                kCFAllocatorDefault,
                0
            );
            
            if (uuid) {
                NSString *uuidStr = (NSString *)uuid;
                String result = String([uuidStr UTF8String]);
                
                CFRelease(uuid);
                IOObjectRelease(platformExpert);
                
                return result;
            }
            
            IOObjectRelease(platformExpert);
        }
        
        return "";
    }
    
    virtual String get_locale() const override {
        NSLocale *locale = [NSLocale currentLocale];
        NSString *localeId = [locale localeIdentifier];
        
        return String([localeId UTF8String]);
    }
};
```

### 1.5 平台特定功能对比

| 功能 | Windows | Linux | macOS |
|------|---------|-------|-------|
| **计时器** | QueryPerformanceCounter | clock_gettime(CLOCK_MONOTONIC) | mach_absolute_time |
| **数据目录** | %APPDATA% | ~/.local/share (XDG) | ~/Library/Application Support |
| **配置目录** | %APPDATA% | ~/.config (XDG) | ~/Library/Preferences |
| **缓存目录** | %TEMP% | ~/.cache (XDG) | ~/Library/Caches |
| **临时目录** | GetTempPathW | /tmp 或 $TMPDIR | NSTemporaryDirectory() |
| **唯一 ID** | 机器 GUID (注册表) | /etc/machine-id | 硬件 UUID (IOKit) |
| **语言环境** | GetUserDefaultLocaleName | $LANG | NSLocale.currentLocale |

---

## 2. DisplayServer 抽象系统

### 2.1 DisplayServer 架构

`DisplayServer` 是 Godot 4.x 引入的统一显示服务器抽象，负责处理所有平台相关的图形操作：

```
DisplayServer (抽象基类)
    │
    ├── DisplayServerWindows (Win32 API)
    ├── DisplayServerX11 (X11)
    ├── DisplayServerWayland (Wayland)
    ├── DisplayServerMacOS (Cocoa)
    ├── DisplayServerAndroid (Android NDK)
    ├── DisplayServerIOS (UIKit)
    └── DisplayServerWeb (WebGL)
```

```cpp
// servers/display_server.h

class DisplayServer {
public:
    // ========== 窗口管理 ==========
    enum WindowFlags {
        WINDOW_FLAG_RESIZE_DISABLED,
        WINDOW_FLAG_BORDERLESS,
        WINDOW_FLAG_ALWAYS_ON_TOP,
        WINDOW_FLAG_TRANSPARENT,
        WINDOW_FLAG_NO_FOCUS,
        WINDOW_FLAG_MAXIMIZE,
        WINDOW_FLAG_MINIMIZE
    };
    
    enum WindowMode {
        WINDOW_MODE_WINDOWED,
        WINDOW_MODE_MINIMIZED,
        WINDOW_MODE_MAXIMIZED,
        WINDOW_MODE_FULLSCREEN,
        WINDOW_MODE_EXCLUSIVE_FULLSCREEN
    };
    
    virtual void window_set_title(const String &p_title) = 0;
    virtual void window_set_position(const Point2i &p_position) = 0;
    virtual void window_set_size(const Size2i &p_size) = 0;
    virtual void window_set_mode(WindowMode p_mode) = 0;
    virtual void window_set_flag(WindowFlags p_flag, bool p_enabled) = 0;
    virtual void window_set_rect(const Rect2i &p_rect) = 0;
    
    virtual String window_get_title() const = 0;
    virtual Point2i window_get_position() const = 0;
    virtual Size2i window_get_size() const = 0;
    virtual WindowMode window_get_mode() const = 0;
    virtual bool window_get_flag(WindowFlags p_flag) const = 0;
    virtual Rect2i window_get_rect() const = 0;
    
    // ========== 屏幕 ==========
    virtual int get_screen_count() const = 0;
    virtual int get_primary_screen() const = 0;
    virtual Point2i screen_get_position(int p_screen) const = 0;
    virtual Size2i screen_get_size(int p_screen) const = 0;
    virtual int screen_get_dpi(int p_screen) const = 0;
    virtual float screen_get_scale(int p_screen) const = 0;
    virtual Rect2i screen_get_usable_rect(int p_screen) const = 0;
    
    // ========== 剪贴板 ==========
    virtual void clipboard_set(const String &p_text) = 0;
    virtual String clipboard_get() const = 0;
    virtual bool clipboard_has() const = 0;
    virtual void clipboard_set_primary(const String &p_text) = 0;
    virtual String clipboard_get_primary() const = 0;
    
    // ========== 光标 ==========
    enum CursorShape {
        CURSOR_ARROW,
        CURSOR_IBEAM,
        CURSOR_POINTING_HAND,
        CURSOR_CROSS,
        CURSOR_WAIT,
        CURSOR_BUSY,
        CURSOR_DRAG,
        CURSOR_CAN_DROP,
        CURSOR_FORBIDDEN,
        CURSOR_VSIZE,
        CURSOR_HSIZE,
        CURSOR_VSPLIT,
        CURSOR_HSPLIT,
        CURSOR_MOVE
    };
    
    enum MouseMode {
        MOUSE_MODE_VISIBLE,
        MOUSE_MODE_HIDDEN,
        MOUSE_MODE_CAPTURED,
        MOUSE_MODE_CONFINED
    };
    
    virtual void mouse_set_mode(MouseMode p_mode) = 0;
    virtual MouseMode mouse_get_mode() const = 0;
    virtual void cursor_set_shape(CursorShape p_shape) = 0;
    virtual CursorShape cursor_get_shape() const = 0;
    virtual void cursor_set_custom_image(const Ref<Resource> &p_cursor) = 0;
    
    // ========== 输入 ==========
    virtual void process_events() = 0;
    virtual void process_joypads() = 0;
    
    // ========== 渲染 ==========
    virtual bool is_swapchain_ok() const = 0;
    virtual void swap_buffers() = 0;
};
```

### 2.2 Windows DisplayServer 实现

```cpp
// platform/windows/display_server_windows.cpp

class DisplayServerWindows : public DisplayServer {
    HWND hwnd;
    HINSTANCE hInstance;
    HCURSOR cursors[CURSOR_MAX];
    
    // 窗口状态
    WindowMode window_mode;
    Point2i window_position;
    Size2i window_size;
    bool window_flags[WINDOW_FLAG_MAX];
    
    // 鼠标状态
    MouseMode mouse_mode;
    Point2i center;
    
public:
    // ========== 窗口管理 ==========
    virtual void window_set_title(const String &p_title) override {
        SetWindowTextW(hwnd, p_title.c_str());
    }
    
    virtual void window_set_position(const Point2i &p_position) override {
        RECT rect;
        GetWindowRect(hwnd, &rect);
        
        SetWindowPos(
            hwnd, nullptr,
            p_position.x, p_position.y,
            rect.right - rect.left,
            rect.bottom - rect.top,
            SWP_NOZORDER | SWP_NOSIZE
        );
        
        window_position = p_position;
    }
    
    virtual void window_set_size(const Size2i &p_size) override {
        RECT rect;
        GetWindowRect(hwnd, &rect);
        
        SetWindowPos(
            hwnd, nullptr,
            rect.left, rect.top,
            p_size.width, p_size.height,
            SWP_NOZORDER | SWP_NOMOVE
        );
        
        window_size = p_size;
    }
    
    virtual void window_set_mode(WindowMode p_mode) override {
        window_mode = p_mode;
        
        switch (p_mode) {
            case WINDOW_MODE_WINDOWED:
                ShowWindow(hwnd, SW_RESTORE);
                break;
                
            case WINDOW_MODE_MINIMIZED:
                ShowWindow(hwnd, SW_MINIMIZE);
                break;
                
            case WINDOW_MODE_MAXIMIZED:
                ShowWindow(hwnd, SW_MAXIMIZE);
                break;
                
            case WINDOW_MODE_FULLSCREEN:
            case WINDOW_MODE_EXCLUSIVE_FULLSCREEN: {
                DEVMODEW dm;
                dm.dmSize = sizeof(dm);
                dm.dmFields = DM_PELSWIDTH | DM_PELSHEIGHT;
                dm.dmPelsWidth = window_size.width;
                dm.dmPelsHeight = window_size.height;
                
                if (p_mode == WINDOW_MODE_EXCLUSIVE_FULLSCREEN) {
                    ChangeDisplaySettingsW(&dm, CDS_FULLSCREEN);
                }
                
                SetWindowLongW(hwnd, GWL_STYLE, WS_POPUP | WS_CLIPCHILDREN | WS_CLIPSIBLINGS);
                SetWindowPos(hwnd, HWND_TOPMOST, 0, 0, 
                           GetSystemMetrics(SM_CXSCREEN), 
                           GetSystemMetrics(SM_CYSCREEN), SWP_SHOWWINDOW);
                break;
            }
        }
    }
    
    virtual void window_set_flag(WindowFlags p_flag, bool p_enabled) override {
        window_flags[p_flag] = p_enabled;
        
        // 更新窗口样式
        DWORD style = WS_OVERLAPPEDWINDOW;
        
        if (window_flags[WINDOW_FLAG_BORDERLESS]) {
            style = WS_POPUP | WS_CLIPCHILDREN | WS_CLIPSIBLINGS;
        }
        
        if (window_flags[WINDOW_FLAG_RESIZE_DISABLED]) {
            style &= ~WS_THICKFRAME;
        }
        
        SetWindowLongW(hwnd, GWL_STYLE, style);
        SetWindowPos(hwnd, nullptr, 0, 0, 0, 0, 
                   SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
    }
    
    // ========== 屏幕 ==========
    virtual int get_screen_count() const override {
        return GetSystemMetrics(SM_CMONITORS);
    }
    
    virtual int get_primary_screen() const override {
        return 0;
    }
    
    virtual Point2i screen_get_position(int p_screen) const override {
        if (p_screen == 0) {
            return Point2i(0, 0);
        }
        
        // 多显示器支持
        DISPLAY_DEVICEW dd;
        dd.cb = sizeof(dd);
        
        if (EnumDisplayDevicesW(nullptr, p_screen, &dd, 0)) {
            DEVMODEW dm;
            dm.dmSize = sizeof(dm);
            
            if (EnumDisplaySettingsW(dd.DeviceName, ENUM_CURRENT_SETTINGS, &dm)) {
                return Point2i(dm.dmPosition.x, dm.dmPosition.y);
            }
        }
        
        return Point2i(0, 0);
    }
    
    virtual Size2i screen_get_size(int p_screen) const override {
        if (p_screen == 0) {
            return Size2i(GetSystemMetrics(SM_CXSCREEN), 
                         GetSystemMetrics(SM_CYSCREEN));
        }
        
        DISPLAY_DEVICEW dd;
        dd.cb = sizeof(dd);
        
        if (EnumDisplayDevicesW(nullptr, p_screen, &dd, 0)) {
            DEVMODEW dm;
            dm.dmSize = sizeof(dm);
            
            if (EnumDisplaySettingsW(dd.DeviceName, ENUM_CURRENT_SETTINGS, &dm)) {
                return Size2i(dm.dmPelsWidth, dm.dmPelsHeight);
            }
        }
        
        return Size2i(0, 0);
    }
    
    virtual int screen_get_dpi(int p_screen) const override {
        HDC hdc = GetDC(hwnd);
        int dpi = GetDeviceCaps(hdc, LOGPIXELSX);
        ReleaseDC(hwnd, hdc);
        
        return dpi;
    }
    
    // ========== 剪贴板 ==========
    virtual void clipboard_set(const String &p_text) override {
        if (OpenClipboard(hwnd)) {
            EmptyClipboard();
            
            size_t size = (p_text.length() + 1) * sizeof(wchar_t);
            HGLOBAL hglb = GlobalAlloc(GMEM_MOVEABLE, size);
            
            if (hglb) {
                wchar_t *lptstr = (wchar_t *)GlobalLock(hglb);
                memcpy(lptstr, p_text.c_str(), size);
                GlobalUnlock(hglb);
                
                SetClipboardData(CF_UNICODETEXT, hglb);
            }
            
            CloseClipboard();
        }
    }
    
    virtual String clipboard_get() const override {
        String text;
        
        if (IsClipboardFormatAvailable(CF_UNICODETEXT) && OpenClipboard(hwnd)) {
            HGLOBAL hglb = GetClipboardData(CF_UNICODETEXT);
            
            if (hglb) {
                wchar_t *lptstr = (wchar_t *)GlobalLock(hglb);
                if (lptstr) {
                    text = String(lptstr);
                    GlobalUnlock(hglb);
                }
            }
            
            CloseClipboard();
        }
        
        return text;
    }
    
    // ========== 光标 ==========
    virtual void mouse_set_mode(MouseMode p_mode) override {
        mouse_mode = p_mode;
        
        switch (p_mode) {
            case MOUSE_MODE_VISIBLE:
                ShowCursor(TRUE);
                ClipCursor(nullptr);
                break;
                
            case MOUSE_MODE_HIDDEN:
                ShowCursor(FALSE);
                ClipCursor(nullptr);
                break;
                
            case MOUSE_MODE_CAPTURED: {
                ShowCursor(FALSE);
                
                RECT rect;
                GetWindowRect(hwnd, &rect);
                ClipCursor(&rect);
                
                center = Point2i((rect.left + rect.right) / 2, 
                               (rect.top + rect.bottom) / 2);
                SetCursorPos(center.x, center.y);
                break;
            }
            
            case MOUSE_MODE_CONFINED: {
                ShowCursor(TRUE);
                
                RECT rect;
                GetWindowRect(hwnd, &rect);
                ClipCursor(&rect);
                break;
            }
        }
    }
    
    virtual void cursor_set_shape(CursorShape p_shape) override {
        LPWSTR cursor_id = IDC_ARROW;
        
        switch (p_shape) {
            case CURSOR_ARROW:
                cursor_id = IDC_ARROW;
                break;
            case CURSOR_IBEAM:
                cursor_id = IDC_IBEAM;
                break;
            case CURSOR_POINTING_HAND:
                cursor_id = IDC_HAND;
                break;
            case CURSOR_CROSS:
                cursor_id = IDC_CROSS;
                break;
            case CURSOR_WAIT:
                cursor_id = IDC_WAIT;
                break;
            case CURSOR_BUSY:
                cursor_id = IDC_APPSTARTING;
                break;
            case CURSOR_DRAG:
                cursor_id = IDC_SIZEALL;
                break;
            case CURSOR_FORBIDDEN:
                cursor_id = IDC_NO;
                break;
            case CURSOR_VSIZE:
                cursor_id = IDC_SIZENS;
                break;
            case CURSOR_HSIZE:
                cursor_id = IDC_SIZEWE;
                break;
            case CURSOR_VSPLIT:
                cursor_id = IDC_SIZENS;
                break;
            case CURSOR_HSPLIT:
                cursor_id = IDC_SIZEWE;
                break;
            case CURSOR_MOVE:
                cursor_id = IDC_SIZEALL;
                break;
        }
        
        HCURSOR cursor = LoadCursorW(nullptr, cursor_id);
        SetCursor(cursor);
    }
    
    // ========== 输入处理 ==========
    virtual void process_events() override {
        MSG msg;
        
        while (PeekMessageW(&msg, nullptr, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
        
        // 处理捕获的鼠标移动
        if (mouse_mode == MOUSE_MODE_CAPTURED) {
            POINT p;
            GetCursorPos(&p);
            
            Point2i new_pos(p.x, p.y);
            if (new_pos != center) {
                Vector2i rel = new_pos - center;
                
                // 发送鼠标移动事件
                Input::get_singleton()->parse_input_event(
                    InputEventMouseMotion::create_relative(rel.x, rel.y)
                );
                
                SetCursorPos(center.x, center.y);
            }
        }
    }
    
    // ========== 渲染 ==========
    virtual bool is_swapchain_ok() const override {
        return IsWindowVisible(hwnd) != 0;
    }
    
    virtual void swap_buffers() override {
        SwapBuffers(hdc);
    }
    
protected:
    // 窗口过程
    static LRESULT CALLBACK window_proc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
        DisplayServerWindows *ds = (DisplayServerWindows *)GetWindowLongPtr(hwnd, GWLP_USERDATA);
        
        switch (msg) {
            case WM_SIZE: {
                Size2i new_size(LOWORD(lParam), HIWORD(lParam));
                // 通知引擎窗口大小改变
                break;
            }
            
            case WM_MOVE: {
                Point2i new_pos(LOWORD(lParam), HIWORD(lParam));
                break;
            }
            
            case WM_CLOSE: {
                // 发送退出请求
                break;
            }
            
            case WM_KEYDOWN:
            case WM_KEYUP: {
                // 处理键盘输入
                break;
            }
            
            case WM_MOUSEMOVE: {
                // 处理鼠标移动
                break;
            }
            
            case WM_LBUTTONDOWN:
            case WM_LBUTTONUP:
            case WM_RBUTTONDOWN:
            case WM_RBUTTONUP:
            case WM_MBUTTONDOWN:
            case WM_MBUTTONUP: {
                // 处理鼠标按钮
                break;
            }
            
            default:
                return DefWindowProcW(hwnd, msg, wParam, lParam);
        }
        
        return 0;
    }
};
```

### 2.3 X11 DisplayServer 实现

```cpp
// platform/linuxbsd/display_server_x11.cpp

class DisplayServerX11 : public DisplayServer {
    Display *x11_display;
    Window x11_window;
    Atom wm_delete_window;
    Atom net_wm_state;
    Atom net_wm_state_maximized_vert;
    Atom net_wm_state_maximized_horz;
    Atom net_wm_state_fullscreen;
    Atom net_wm_state_hidden;
    Atom net_wm_bypass_compositor;
    
    // 光标
    Cursor cursors[CURSOR_MAX];
    
    // 窗口状态
    WindowMode window_mode;
    Point2i window_position;
    Size2i window_size;
    
public:
    // ========== 窗口管理 ==========
    virtual void window_set_title(const String &p_title) override {
        XStoreName(x11_display, x11_window, p_title.utf8().get_data());
        
        // 设置_NET_WM_NAME（支持 UTF-8）
        XChangeProperty(
            x11_display, x11_window,
            XInternAtom(x11_display, "_NET_WM_NAME", False),
            XInternAtom(x11_display, "UTF8_STRING", False),
            8, PropModeReplace,
            (unsigned char *)p_title.utf8().get_data(),
            p_title.utf8().length()
        );
    }
    
    virtual void window_set_position(const Point2i &p_position) override {
        XWindowChanges changes;
        changes.x = p_position.x;
        changes.y = p_position.y;
        
        XConfigureWindow(
            x11_display, x11_window,
            CWX | CWY, &changes
        );
        
        window_position = p_position;
    }
    
    virtual void window_set_size(const Size2i &p_size) override {
        XResizeWindow(
            x11_display, x11_window,
            p_size.width, p_size.height
        );
        
        window_size = p_size;
    }
    
    virtual void window_set_mode(WindowMode p_mode) override {
        window_mode = p_mode;
        
        XEvent xev;
        memset(&xev, 0, sizeof(xev));
        xev.type = ClientMessage;
        xev.xclient.window = x11_window;
        xev.xclient.message_type = net_wm_state;
        xev.xclient.format = 32;
        
        switch (p_mode) {
            case WINDOW_MODE_WINDOWED: {
                // 取消最大化、全屏、最小化
                xev.xclient.data.l[0] = _NET_WM_STATE_REMOVE;
                xev.xclient.data.l[1] = net_wm_state_maximized_vert;
                xev.xclient.data.l[2] = net_wm_state_maximized_horz;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False, 
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                
                xev.xclient.data.l[0] = _NET_WM_STATE_REMOVE;
                xev.xclient.data.l[1] = net_wm_state_fullscreen;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False,
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                
                xev.xclient.data.l[0] = _NET_WM_STATE_REMOVE;
                xev.xclient.data.l[1] = net_wm_state_hidden;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False,
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                
                XMapRaised(x11_display, x11_window);
                break;
            }
            
            case WINDOW_MODE_MINIMIZED: {
                xev.xclient.data.l[0] = _NET_WM_STATE_ADD;
                xev.xclient.data.l[1] = net_wm_state_hidden;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False,
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                break;
            }
            
            case WINDOW_MODE_MAXIMIZED: {
                xev.xclient.data.l[0] = _NET_WM_STATE_ADD;
                xev.xclient.data.l[1] = net_wm_state_maximized_vert;
                xev.xclient.data.l[2] = net_wm_state_maximized_horz;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False,
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                break;
            }
            
            case WINDOW_MODE_FULLSCREEN:
            case WINDOW_MODE_EXCLUSIVE_FULLSCREEN: {
                xev.xclient.data.l[0] = _NET_WM_STATE_ADD;
                xev.xclient.data.l[1] = net_wm_state_fullscreen;
                XSendEvent(x11_display, DefaultRootWindow(x11_display), False,
                          SubstructureNotifyMask | SubstructureRedirectMask, &xev);
                break;
            }
        }
    }
    
    virtual void window_set_flag(WindowFlags p_flag, bool p_enabled) override {
        if (p_flag == WINDOW_FLAG_BORDERLESS) {
            // 设置 MWM_HINTS
            Atom mwm_hints = XInternAtom(x11_display, "_MOTIF_WM_HINTS", False);
            
            struct {
                unsigned long flags;
                unsigned long functions;
                unsigned long decorations;
                long input_mode;
                unsigned long status;
            } hints;
            
            hints.flags = (1L << 1);  // MWM_HINTS_DECORATIONS
            hints.decorations = p_enabled ? 0 : 1;
            
            XChangeProperty(
                x11_display, x11_window,
                mwm_hints, mwm_hints,
                32, PropModeReplace,
                (unsigned char *)&hints,
                5
            );
        }
    }
    
    // ========== 屏幕 ==========
    virtual int get_screen_count() const override {
        return ScreenCount(x11_display);
    }
    
    virtual int get_primary_screen() const override {
        return 0;
    }
    
    virtual Point2i screen_get_position(int p_screen) const override {
        return Point2i(
            XDisplayWidth(x11_display, p_screen),
            XDisplayHeight(x11_display, p_screen)
        );
    }
    
    virtual Size2i screen_get_size(int p_screen) const override {
        return Size2i(
            XDisplayWidth(x11_display, p_screen),
            XDisplayHeight(x11_display, p_screen)
        );
    }
    
    virtual int screen_get_dpi(int p_screen) const override {
        // X11 的 DPI 计算
        int screen_width_mm = DisplayWidthMM(x11_display, p_screen);
        int screen_width_px = DisplayWidth(x11_display, p_screen);
        
        if (screen_width_mm > 0) {
            return (screen_width_px * 254) / (screen_width_mm * 10);
        }
        
        return 96; // 默认 DPI
    }
    
    // ========== 剪贴板 ==========
    virtual void clipboard_set(const String &p_text) override {
        Window clipboard_owner = XCreateSimpleWindow(
            x11_display, x11_window,
            -1, -1, 1, 1, 0, 0, 0
        );
        
        XSetSelectionOwner(
            x11_display,
            XA_CLIPBOARD,
            clipboard_owner,
            CurrentTime
        );
        
        // 存储剪贴板数据
        clipboard_data = p_text;
    }
    
    virtual String clipboard_get() const override {
        // 请求剪贴板内容
        XConvertSelection(
            x11_display,
            XA_CLIPBOARD,
            XInternAtom(x11_display, "UTF8_STRING", False),
            XInternAtom(x11_display, "GODOT_CLIPBOARD", False),
            x11_window,
            CurrentTime
        );
        
        // 等待 SelectionNotify 事件
        XEvent event;
        while (1) {
            XNextEvent(x11_display, &event);
            if (event.type == SelectionNotify) {
                break;
            }
        }
        
        return clipboard_data;
    }
    
    // ========== 光标 ==========
    virtual void mouse_set_mode(MouseMode p_mode) override {
        switch (p_mode) {
            case MOUSE_MODE_VISIBLE:
                XDefineCursor(x11_display, x11_window, None);
                XUngrabPointer(x11_display, CurrentTime);
                break;
                
            case MOUSE_MODE_HIDDEN:
                // 创建空光标
                static Cursor blank_cursor = None;
                if (blank_cursor == None) {
                    char data[1] = {0};
                    XColor dummy;
                    Pixmap blank = XCreateBitmapFromData(x11_display, x11_window, data, 1, 1);
                    blank_cursor = XCreatePixmapCursor(x11_display, blank, blank, &dummy, &dummy, 0, 0);
                    XFreePixmap(x11_display, blank);
                }
                
                XDefineCursor(x11_display, x11_window, blank_cursor);
                XUngrabPointer(x11_display, CurrentTime);
                break;
                
            case MOUSE_MODE_CAPTURED:
            case MOUSE_MODE_CONFINED: {
                XGrabPointer(
                    x11_display, x11_window, True,
                    ButtonPressMask | ButtonReleaseMask | PointerMotionMask,
                    GrabModeAsync, GrabModeAsync,
                    x11_window, None, CurrentTime
                );
                break;
            }
        }
    }
    
    virtual void cursor_set_shape(CursorShape p_shape) override {
        unsigned int cursor_shape = XC_left_ptr;
        
        switch (p_shape) {
            case CURSOR_ARROW:
                cursor_shape = XC_left_ptr;
                break;
            case CURSOR_IBEAM:
                cursor_shape = XC_xterm;
                break;
            case CURSOR_POINTING_HAND:
                cursor_shape = XC_hand2;
                break;
            case CURSOR_CROSS:
                cursor_shape = XC_crosshair;
                break;
            case CURSOR_WAIT:
                cursor_shape = XC_watch;
                break;
            case CURSOR_DRAG:
                cursor_shape = XC_fleur;
                break;
            case CURSOR_FORBIDDEN:
                cursor_shape = XC_X_cursor;
                break;
            case CURSOR_VSIZE:
                cursor_shape = XC_sb_v_double_arrow;
                break;
            case CURSOR_HSIZE:
                cursor_shape = XC_sb_h_double_arrow;
                break;
            case CURSOR_MOVE:
                cursor_shape = XC_fleur;
                break;
        }
        
        Cursor cursor = XCreateFontCursor(x11_display, cursor_shape);
        XDefineCursor(x11_display, x11_window, cursor);
    }
    
    // ========== 输入处理 ==========
    virtual void process_events() override {
        while (XPending(x11_display)) {
            XEvent xevent;
            XNextEvent(x11_display, &xevent);
            
            process_xevent(xevent);
        }
    }
    
    void process_xevent(XEvent &xevent) {
        switch (xevent.type) {
            case ClientMessage: {
                // 处理窗口关闭
                if ((Atom)xevent.xclient.data.l[0] == wm_delete_window) {
                    // 发送退出请求
                }
                break;
            }
            
            case ConfigureNotify: {
                // 窗口大小或位置改变
                if (xevent.xconfigure.window == x11_window) {
                    window_position = Point2i(xevent.xconfigure.x, xevent.xconfigure.y);
                    window_size = Size2i(xevent.xconfigure.width, xevent.xconfigure.height);
                }
                break;
            }
            
            case KeyPress:
            case KeyRelease: {
                // 处理键盘输入
                KeySym keysym = XLookupKeysym(&xevent.xkey, 0);
                // 转换为 Godot 键码并发送事件
                break;
            }
            
            case ButtonPress:
            case ButtonRelease: {
                // 处理鼠标按钮
                break;
            }
            
            case MotionNotify: {
                // 处理鼠标移动
                Point2i pos(xevent.xmotion.x, xevent.xmotion.y);
                // 发送鼠标移动事件
                break;
            }
            
            case SelectionNotify: {
                // 处理剪贴板响应
                if (xevent.xselection.selection == XA_CLIPBOARD) {
                    // 读取剪贴板数据
                }
                break;
            }
        }
    }
    
    // ========== 渲染 ==========
    virtual bool is_swapchain_ok() const override {
        // X11 通常总是可以交换缓冲
        return true;
    }
    
    virtual void swap_buffers() override {
        // 在 GLX 上下文中交换缓冲
        glXSwapBuffers(x11_display, x11_window);
    }
};
```

---

## 3. RenderingDeviceDriver 架构

### 3.1 RenderingDeviceDriver 接口

`RenderingDeviceDriver` 是 Godot 4.x 图形渲染的底层驱动抽象，统一了不同的图形 API：

```cpp
// drivers/rendering/rendering_device_driver.h

class RenderingDeviceDriver {
public:
    // ========== 设备管理 ==========
    virtual Error initialize() = 0;
    virtual void finalize() = 0;
    
    virtual uint32_t get_device_count() const = 0;
    virtual String get_device_name(uint32_t p_device_index) const = 0;
    virtual String get_device_vendor(uint32_t p_device_index) const = 0;
    virtual DeviceType get_device_type(uint32_t p_device_index) const = 0;
    
    virtual Error select_device(uint32_t p_device_index) = 0;
    
    // ========== 资源创建 ==========
    virtual RID texture_create(
        const TextureFormat &p_format,
        const TextureView &p_view
    ) = 0;
    
    virtual RID texture_create_shared(
        const TextureView &p_view,
        RID p_with_texture
    ) = 0;
    
    virtual RID texture_create_from_extension(
        TextureType p_type,
        TextureFormat p_format,
        uint64_t p_native_texture
    ) = 0;
    
    virtual RID framebuffer_create(
        const Vector<RID> &p_textures,
        uint32_t p_view_count = 1
    ) = 0;
    
    virtual RID sampler_create(
        const SamplerState &p_state
    ) = 0;
    
    virtual RID vertex_buffer_create(
        uint32_t p_size_bytes,
        const Vector<uint8_t> *p_data = nullptr,
        bool p_use_as_storage = false
    ) = 0;
    
    virtual RID index_buffer_create(
        IndexBufferFormat p_format,
        uint32_t p_size_bytes,
        const Vector<uint8_t> *p_data = nullptr,
        bool p_use_as_storage = false
    ) = 0;
    
    // ========== 着色器 ==========
    virtual RID shader_create(
        const ShaderSource &p_source,
        const String &p_shader_name
    ) = 0;
    
    // ========== 渲染管线 ==========
    virtual RID render_pipeline_create(
        RID p_shader,
        FramebufferFormatID p_framebuffer_format,
        VertexFormatID p_vertex_format,
        RenderPrimitive p_render_primitive,
        const PipelineRasterizationState &p_rasterization_state,
        const PipelineMultisampleState &p_multisample_state,
        const PipelineDepthStencilState &p_depth_stencil_state,
        const PipelineColorBlendState &p_blend_state,
        VectorView<int64_t> p_dynamic_state_flags,
        uint32_t p_dynamic_state_count,
        uint32_t p_for_render_pass,
        const Vector<RID> &p_vertex_buffers,
        uint32_t p_vertex_buffer_count
    ) = 0;
    
    // ========== 命令列表 ==========
    virtual CommandQueueID command_queue_get() const = 0;
    virtual CommandPoolID command_pool_create(
        CommandQueueID p_queue,
        CommandPoolType p_type
    ) = 0;
    
    virtual CommandBufferID command_buffer_create(
        CommandPoolID p_pool
    ) = 0;
    
    virtual void command_buffer_begin(
        CommandBufferID p_command_buffer
    ) = 0;
    
    virtual void command_buffer_end(
        CommandBufferID p_command_buffer
    ) = 0;
    
    virtual void command_buffer_submit(
        CommandBufferID p_command_buffer,
        CommandQueueID p_queue,
        bool p_sync_with_swapchain = false
    ) = 0;
    
    // ========== 渲染命令 ==========
    virtual void command_buffer_bind_render_pipeline(
        CommandBufferID p_command_buffer,
        RID p_pipeline
    ) = 0;
    
    virtual void command_buffer_bind_vertex_buffers(
        CommandBufferID p_command_buffer,
        uint32_t p_binding_count,
        const RID *p_buffers,
        const uint64_t *p_offsets
    ) = 0;
    
    virtual void command_buffer_bind_index_buffer(
        CommandBufferID p_command_buffer,
        RID p_buffer,
        uint64_t p_offset,
        IndexBufferFormat p_index_format
    ) = 0;
    
    virtual void command_buffer_bind_uniform_sets(
        CommandBufferID p_command_buffer,
        const UniformSetInfo *p_uniform_sets,
        uint32_t p_uniform_set_count,
        RID p_shader,
        uint32_t p_set_index
    ) = 0;
    
    virtual void command_buffer_draw(
        CommandBufferID p_command_buffer,
        bool p_use_indices,
        uint32_t p_instance_count,
        uint32_t p_vertex_count = 0,
        uint32_t p_index_count = 0
    ) = 0;
    
    // ========== 屏幕空间效果 ==========
    virtual void command_buffer_begin_render_pass(
        CommandBufferID p_command_buffer,
        RID p_framebuffer,
        uint32_t p_clear_values_count,
        const ClearValue *p_clear_values
    ) = 0;
    
    virtual void command_buffer_end_render_pass(
        CommandBufferID p_command_buffer
    ) = 0;
    
    // ========== 同步 ==========
    virtual FenceID fence_create() = 0;
    virtual Error fence_wait(
        FenceID p_fence,
        uint64_t p_timeout_nanoseconds
    ) = 0;
    
    virtual SemaphoreID semaphore_create() = 0;
    virtual Error semaphore_wait(
        SemaphoreID p_semaphore,
        uint64_t p_timeout_nanoseconds
    ) = 0;
};
```

### 3.2 Vulkan 驱动实现

```cpp
// drivers/vulkan/rendering_device_driver_vulkan.cpp

class RenderingDeviceDriverVulkan : public RenderingDeviceDriver {
    // Vulkan 对象
    VkInstance instance;
    VkPhysicalDevice physical_device;
    VkDevice device;
    VkQueue graphics_queue;
    VkQueue present_queue;
    
    // 交换链
    VkSwapchainKHR swapchain;
    VkFormat swapchain_format;
    VkExtent2D swapchain_extent;
    Vector<VkImage> swapchain_images;
    Vector<VkImageView> swapchain_image_views;
    
    // 命令池
    VkCommandPool command_pool;
    
    // 描述符池
    VkDescriptorPool descriptor_pool;
    
    // 验证层
    VkDebugUtilsMessengerEXT debug_messenger;
    
public:
    // ========== 设备管理 ==========
    virtual Error initialize() override {
        // 创建 Vulkan 实例
        VkApplicationInfo app_info = {};
        app_info.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
        app_info.pApplicationName = "Godot Engine";
        app_info.applicationVersion = VK_MAKE_VERSION(4, 0, 0);
        app_info.pEngineName = "Godot Engine";
        app_info.engineVersion = VK_MAKE_VERSION(4, 0, 0);
        app_info.apiVersion = VK_API_VERSION_1_2;
        
        VkInstanceCreateInfo create_info = {};
        create_info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
        create_info.pApplicationInfo = &app_info;
        
        // 启用验证层
        Vector<const char *> validation_layers = {
            "VK_LAYER_KHRONOS_validation"
        };
        
        if (enable_validation_layers) {
            create_info.enabledLayerCount = validation_layers.size();
            create_info.ppEnabledLayerNames = validation_layers.ptr();
            
            // 设置调试回调
            VkDebugUtilsMessengerCreateInfoEXT debug_create_info = {};
            debug_create_info.sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT;
            debug_create_info.messageSeverity = 
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_VERBOSE_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT;
            debug_create_info.messageType = 
                VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT;
            debug_create_info.pfnUserCallback = debug_callback;
            
            create_info.pNext = (VkDebugUtilsMessengerCreateInfoEXT *)&debug_create_info;
        }
        
        // 扩展
        Vector<const char *> extensions = {
            VK_KHR_SURFACE_EXTENSION_NAME,
#ifdef _WIN32
            VK_KHR_WIN32_SURFACE_EXTENSION_NAME,
#elif defined(__linux__)
            VK_KHR_XLIB_SURFACE_EXTENSION_NAME,
#elif defined(__APPLE__)
            VK_EXT_METAL_SURFACE_EXTENSION_NAME,
#endif
        };
        
        if (enable_validation_layers) {
            extensions.push_back(VK_EXT_DEBUG_UTILS_EXTENSION_NAME);
        }
        
        create_info.enabledExtensionCount = extensions.size();
        create_info.ppEnabledExtensionNames = extensions.ptr();
        
        VK_RESULT(vkCreateInstance(&create_info, nullptr, &instance));
        
        // 设置调试回调
        if (enable_validation_layers) {
            VkDebugUtilsMessengerCreateInfoEXT debug_create_info = {};
            debug_create_info.sType = VK_STRUCTURE_TYPE_DEBUG_UTILS_MESSENGER_CREATE_INFO_EXT;
            debug_create_info.messageSeverity = 
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_VERBOSE_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_SEVERITY_ERROR_BIT_EXT;
            debug_create_info.messageType = 
                VK_DEBUG_UTILS_MESSAGE_TYPE_GENERAL_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_TYPE_VALIDATION_BIT_EXT |
                VK_DEBUG_UTILS_MESSAGE_TYPE_PERFORMANCE_BIT_EXT;
            debug_create_info.pfnUserCallback = debug_callback;
            
            auto func = (PFN_vkCreateDebugUtilsMessengerEXT)vkGetInstanceProcAddr(
                instance, "vkCreateDebugUtilsMessengerEXT");
            
            if (func) {
                func(instance, &debug_create_info, nullptr, &debug_messenger);
            }
        }
        
        // 选择物理设备
        uint32_t device_count = 0;
        vkEnumeratePhysicalDevices(instance, &device_count, nullptr);
        Vector<VkPhysicalDevice> devices(device_count);
        vkEnumeratePhysicalDevices(instance, &device_count, devices.ptr());
        
        physical_device = select_physical_device(devices);
        
        // 创建逻辑设备
        QueueFamilyIndices indices = find_queue_families(physical_device);
        
        Vector<VkDeviceQueueCreateInfo> queue_create_infos;
        HashSet<uint32_t> unique_queue_families = {
            indices.graphics_family.value(),
            indices.present_family.value()
        };
        
        float queue_priority = 1.0f;
        for (uint32_t queue_family : unique_queue_families) {
            VkDeviceQueueCreateInfo queue_create_info = {};
            queue_create_info.sType = VK_STRUCTURE_TYPE_DEVICE_QUEUE_CREATE_INFO;
            queue_create_info.queueFamilyIndex = queue_family;
            queue_create_info.queueCount = 1;
            queue_create_info.pQueuePriorities = &queue_priority;
            queue_create_infos.push_back(queue_create_info);
        }
        
        // 设备特性
        VkPhysicalDeviceFeatures device_features = {};
        device_features.samplerAnisotropy = VK_TRUE;
        device_features.fillModeNonSolid = VK_TRUE;
        
        // 扩展
        Vector<const char *> device_extensions = {
            VK_KHR_SWAPCHAIN_EXTENSION_NAME,
        };
        
        VkDeviceCreateInfo device_create_info = {};
        device_create_info.sType = VK_STRUCTURE_TYPE_DEVICE_CREATE_INFO;
        device_create_info.queueCreateInfoCount = queue_create_infos.size();
        device_create_info.pQueueCreateInfos = queue_create_infos.ptr();
        device_create_info.pEnabledFeatures = &device_features;
        device_create_info.enabledExtensionCount = device_extensions.size();
        device_create_info.ppEnabledExtensionNames = device_extensions.ptr();
        
        if (enable_validation_layers) {
            device_create_info.enabledLayerCount = validation_layers.size();
            device_create_info.ppEnabledLayerNames = validation_layers.ptr();
        }
        
        VK_RESULT(vkCreateDevice(physical_device, &device_create_info, nullptr, &device));
        
        vkGetDeviceQueue(device, indices.graphics_family.value(), 0, &graphics_queue);
        vkGetDeviceQueue(device, indices.present_family.value(), 0, &present_queue);
        
        // 创建命令池
        VkCommandPoolCreateInfo pool_info = {};
        pool_info.sType = VK_STRUCTURE_TYPE_COMMAND_POOL_CREATE_INFO;
        pool_info.flags = VK_COMMAND_POOL_CREATE_RESET_COMMAND_BUFFER_BIT;
        pool_info.queueFamilyIndex = indices.graphics_family.value();
        
        VK_RESULT(vkCreateCommandPool(device, &pool_info, nullptr, &command_pool));
        
        return OK;
    }
    
    virtual void finalize() override {
        // 清理 Vulkan 对象
        if (debug_messenger) {
            auto func = (PFN_vkDestroyDebugUtilsMessengerEXT)vkGetInstanceProcAddr(
                instance, "vkDestroyDebugUtilsMessengerEXT");
            if (func) {
                func(instance, debug_messenger, nullptr);
            }
        }
        
        if (command_pool) {
            vkDestroyCommandPool(device, command_pool, nullptr);
        }
        
        if (device) {
            vkDestroyDevice(device, nullptr);
        }
        
        if (instance) {
            vkDestroyInstance(instance, nullptr);
        }
    }
    
    // ========== 资源创建 ==========
    virtual RID texture_create(
        const TextureFormat &p_format,
        const TextureView &p_view
    ) override {
        // 创建 Vulkan 图像
        VkImageCreateInfo image_info = {};
        image_info.sType = VK_STRUCTURE_TYPE_IMAGE_CREATE_INFO;
        image_info.imageType = VK_IMAGE_TYPE_2D;
        image_info.extent.width = p_format.width;
        image_info.extent.height = p_format.height;
        image_info.extent.depth = p_format.depth;
        image_info.mipLevels = p_format.mipmaps;
        image_info.arrayLayers = p_format.array_layers;
        image_info.format = to_vulkan_format(p_format.format);
        image_info.tiling = p_format.usage_bits & TEXTURE_USAGE sampling_BIT ? 
                          VK_IMAGE_TILING_OPTIMAL : VK_IMAGE_TILING_LINEAR;
        image_info.initialLayout = VK_IMAGE_LAYOUT_UNDEFINED;
        image_info.usage = 0;
        image_info.samples = VK_SAMPLE_COUNT_1_BIT;
        image_info.sharingMode = VK_SHARING_MODE_EXCLUSIVE;
        
        if (p_format.usage_bits & TEXTURE_USAGE_SAMPLING_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_SAMPLED_BIT;
        }
        if (p_format.usage_bits & TEXTURE_USAGE_COLOR_ATTACHMENT_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_COLOR_ATTACHMENT_BIT;
        }
        if (p_format.usage_bits & TEXTURE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT;
        }
        if (p_format.usage_bits & TEXTURE_USAGE_STORAGE_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_STORAGE_BIT;
        }
        if (p_format.usage_bits & TEXTURE_USAGE_CAN_COPY_TO_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_TRANSFER_DST_BIT;
        }
        if (p_format.usage_bits & TEXTURE_USAGE_CAN_COPY_FROM_BIT) {
            image_info.usage |= VK_IMAGE_USAGE_TRANSFER_SRC_BIT;
        }
        
        VmaAllocationCreateInfo alloc_info = {};
        alloc_info.usage = VMA_MEMORY_USAGE_GPU_ONLY;
        
        VkImage vk_image;
        VmaAllocation vk_allocation;
        
        VK_RESULT(vmaCreateImage(
            allocator,
            &image_info,
            &alloc_info,
            &vk_image,
            &vk_allocation,
            nullptr
        ));
        
        // 创建图像视图
        VkImageViewCreateInfo view_info = {};
        view_info.sType = VK_STRUCTURE_TYPE_IMAGE_VIEW_CREATE_INFO;
        view_info.image = vk_image;
        view_info.viewType = to_vulkan_image_view_type(p_format.texture_type);
        view_info.format = image_info.format;
        view_info.subresourceRange.aspectMask = VK_IMAGE_ASPECT_COLOR_BIT;
        view_info.subresourceRange.baseMipLevel = 0;
        view_info.subresourceRange.levelCount = p_format.mipmaps;
        view_info.subresourceRange.baseArrayLayer = 0;
        view_info.subresourceRange.layerCount = p_format.array_layers;
        
        VkImageView vk_image_view;
        VK_RESULT(vkCreateImageView(device, &view_info, nullptr, &vk_image_view));
        
        // 创建纹理 RID
        Texture *texture = memnew(Texture);
        texture->vk_image = vk_image;
        texture->vk_image_view = vk_image_view;
        texture->vk_allocation = vk_allocation;
        texture->format = p_format.format;
        texture->width = p_format.width;
        texture->height = p_format.height;
        
        return texture_owner.make_rid(texture);
    }
    
    // ========== 命令缓冲 ==========
    virtual void command_buffer_begin(CommandBufferID p_command_buffer) override {
        VkCommandBuffer cmd_buf = (VkCommandBuffer)p_command_buffer;
        
        VkCommandBufferBeginInfo begin_info = {};
        begin_info.sType = VK_STRUCTURE_TYPE_COMMAND_BUFFER_BEGIN_INFO;
        begin_info.flags = VK_COMMAND_BUFFER_USAGE_ONE_TIME_SUBMIT_BIT;
        
        VK_RESULT(vkBeginCommandBuffer(cmd_buf, &begin_info));
    }
    
    virtual void command_buffer_end(CommandBufferID p_command_buffer) override {
        VkCommandBuffer cmd_buf = (VkCommandBuffer)p_command_buffer;
        VK_RESULT(vkEndCommandBuffer(cmd_buf));
    }
    
    virtual void command_buffer_submit(
        CommandBufferID p_command_buffer,
        CommandQueueID p_queue,
        bool p_sync_with_swapchain
    ) override {
        VkCommandBuffer cmd_buf = (VkCommandBuffer)p_command_buffer;
        VkQueue queue = (VkQueue)p_queue;
        
        VkSubmitInfo submit_info = {};
        submit_info.sType = VK_STRUCTURE_TYPE_SUBMIT_INFO;
        submit_info.commandBufferCount = 1;
        submit_info.pCommandBuffers = &cmd_buf;
        
        VK_RESULT(vkQueueSubmit(queue, 1, &submit_info, VK_NULL_HANDLE));
    }
    
    // ========== 渲染命令 ==========
    virtual void command_buffer_draw(
        CommandBufferID p_command_buffer,
        bool p_use_indices,
        uint32_t p_instance_count,
        uint32_t p_vertex_count,
        uint32_t p_index_count
    ) override {
        VkCommandBuffer cmd_buf = (VkCommandBuffer)p_command_buffer;
        
        if (p_use_indices) {
            vkCmdDrawIndexed(cmd_buf, p_index_count, p_instance_count, 0, 0, 0);
        } else {
            vkCmdDraw(cmd_buf, p_vertex_count, p_instance_count, 0, 0);
        }
    }
    
    // ========== 辅助函数 ==========
private:
    static VKAPI_ATTR VkBool32 VKAPI_CALL debug_callback(
        VkDebugUtilsMessageSeverityFlagBitsEXT p_message_severity,
        VkDebugUtilsMessageTypeFlagsEXT p_message_type,
        const VkDebugUtilsMessengerCallbackDataEXT *p_callback_data,
        void *p_user_data
    ) {
        if (p_message_severity >= VK_DEBUG_UTILS_MESSAGE_SEVERITY_WARNING_BIT_EXT) {
            ERR_PRINT(p_callback_data->pMessage);
        } else {
            print_verbose(p_callback_data->pMessage);
        }
        return VK_FALSE;
    }
    
    struct QueueFamilyIndices {
        Optional<uint32_t> graphics_family;
        Optional<uint32_t> present_family;
        
        bool is_complete() const {
            return graphics_family.has_value() && present_family.has_value();
        }
    };
    
    QueueFamilyIndices find_queue_families(VkPhysicalDevice p_device) {
        QueueFamilyIndices indices;
        
        uint32_t queue_family_count = 0;
        vkGetPhysicalDeviceQueueFamilyProperties(p_device, &queue_family_count, nullptr);
        
        Vector<VkQueueFamilyProperties> queue_families(queue_family_count);
        vkGetPhysicalDeviceQueueFamilyProperties(p_device, &queue_family_count, queue_families.ptr());
        
        int i = 0;
        for (const VkQueueFamilyProperties &queue_family : queue_families) {
            if (queue_family.queueFlags & VK_QUEUE_GRAPHICS_BIT) {
                indices.graphics_family = i;
            }
            
            VkBool32 present_support = false;
            vkGetPhysicalDeviceSurfaceSupportKHR(p_device, i, surface, &present_support);
            
            if (present_support) {
                indices.present_family = i;
            }
            
            if (indices.is_complete()) {
                break;
            }
            
            i++;
        }
        
        return indices;
    }
};
```

---

## 4. AudioDriver 实现

### 4.1 AudioDriver 抽象

```cpp
// drivers/audio/audio_driver.h

class AudioDriver {
public:
    // ========== 初始化 ==========
    virtual Error init() = 0;
    virtual void start() = 0;
    virtual int get_mix_rate() const = 0;
    virtual SpeakerMode get_speaker_mode() const = 0;
    
    // ========== 音频处理 ==========
    virtual void lock() = 0;
    virtual void unlock() = 0;
    
    virtual void mix_audio(int p_frames) = 0;
    
    // ========== 输入（可选） ==========
    virtual Error input_start() { return ERR_UNAVAILABLE; }
    virtual Error input_stop() { return ERR_UNAVAILABLE; }
    
    // ========== 设备管理 ==========
    virtual Vector<String> get_output_device_list() {
        return Vector<String>();
    }
    
    virtual String get_output_device() {
        return "Default";
    }
    
    virtual void set_output_device(const String &p_name) {}
    
    // ========== 清理 ==========
    virtual void finish() = 0;
};
```

### 4.2 WASAPI 驱动

```cpp
// drivers/audio/windows/audio_driver_wasapi.cpp

class AudioDriverWASAPI : public AudioDriver {
    IMMDeviceEnumerator *device_enumerator;
    IMMDevice *device;
    IAudioClient *audio_client;
    IAudioRenderClient *render_client;
    
    UINT32 buffer_frame_count;
    WORD bits_per_sample;
    
    int mix_rate;
    SpeakerMode speaker_mode;
    
public:
    virtual Error init() override {
        mix_rate = 48000;
        speaker_mode = SPEAKER_MODE_STEREO;
        
        CoInitialize(nullptr);
        
        // 创建设备枚举器
        CoCreateInstance(
            __uuidof(MMDeviceEnumerator), nullptr,
            CLSCTX_ALL, __uuidof(IMMDeviceEnumerator),
            (void **)&device_enumerator
        );
        
        // 获取默认输出设备
        device_enumerator->GetDefaultAudioEndpoint(
            eRender, eConsole, &device
        );
        
        // 激活音频客户端
        device->Activate(
            __uuidof(IAudioClient), CLSCTX_ALL,
            nullptr, (void **)&audio_client
        );
        
        // 设置音频格式
        WAVEFORMATEX wave_format = {};
        wave_format.wFormatTag = WAVE_FORMAT_PCM;
        wave_format.nChannels = 2;
        wave_format.nSamplesPerSec = mix_rate;
        wave_format.wBitsPerSample = 16;
        wave_format.nBlockAlign = wave_format.nChannels * 
                                  wave_format.wBitsPerSample / 8;
        wave_format.nAvgBytesPerSec = wave_format.nSamplesPerSec * 
                                      wave_format.nBlockAlign;
        
        // 初始化音频客户端
        audio_client->Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            AUDCLNT_STREAMFLAGS_EVENTCALLBACK,
            10000000, // 1 秒缓冲
            0,
            &wave_format,
            nullptr
        );
        
        // 获取缓冲大小
        audio_client->GetBufferSize(&buffer_frame_count);
        
        // 获取渲染客户端
        audio_client->GetService(
            __uuidof(IAudioRenderClient),
            (void **)&render_client
        );
        
        return OK;
    }
    
    virtual void start() override {
        audio_client->Start();
    }
    
    virtual int get_mix_rate() const override {
        return mix_rate;
    }
    
    virtual SpeakerMode get_speaker_mode() const override {
        return speaker_mode;
    }
    
    virtual void mix_audio(int p_frames) override {
        BYTE *data;
        
        // 获取缓冲
        HRESULT hr = render_client->GetBuffer(p_frames, &data);
        if (FAILED(hr)) {
            return;
        }
        
        // 混合音频数据
        int16_t *out_buffer = (int16_t *)data;
        const float *mix_buffer = AudioServer::get_singleton()->get_mix_buffer();
        
        for (int i = 0; i < p_frames * 2; i++) {
            // 转换为 16 位整数
            float sample = CLAMP(mix_buffer[i], -1.0f, 1.0f);
            out_buffer[i] = (int16_t)(sample * 32767.0f);
        }
        
        // 释放缓冲
        render_client->ReleaseBuffer(p_frames, 0);
    }
    
    virtual void lock() override {
        // Windows 不需要显式锁
    }
    
    virtual void unlock() override {
        // Windows 不需要显式锁
    }
    
    virtual void finish() override {
        if (audio_client) {
            audio_client->Stop();
            audio_client->Release();
        }
        
        if (device) {
            device->Release();
        }
        
        if (device_enumerator) {
            device_enumerator->Release();
        }
        
        CoUninitialize();
    }
};
```

### 4.3 PulseAudio 驱动

```cpp
// drivers/audio/pulseaudio/audio_driver_pulse_audio.cpp

class AudioDriverPulseAudio : public AudioDriver {
    pa_threaded_mainloop *pa_mainloop;
    pa_context *pa_context;
    pa_stream *pa_stream;
    
    int mix_rate;
    SpeakerMode speaker_mode;
    
public:
    virtual Error init() override {
        mix_rate = 48000;
        speaker_mode = SPEAKER_MODE_STEREO;
        
        // 创建主循环
        pa_mainloop = pa_threaded_mainloop_new();
        pa_threaded_mainloop_start(pa_mainloop);
        
        // 创建上下文
        pa_mainloop_api *api = pa_threaded_mainloop_get_api(pa_mainloop);
        pa_context = pa_context_new(api, "Godot Engine");
        
        // 连接到 PulseAudio 服务器
        pa_context_connect(pa_context, nullptr, PA_CONTEXT_NOFLAGS, nullptr);
        
        // 等待连接
        pa_context_state_t state;
        while ((state = pa_context_get_state(pa_context)) != PA_CONTEXT_READY) {
            if (state == PA_CONTEXT_FAILED || state == PA_CONTEXT_TERMINATED) {
                return ERR_CANT_OPEN;
            }
            pa_threaded_mainloop_wait(pa_mainloop);
        }
        
        // 创建音频流
        pa_sample_spec sample_spec = {};
        sample_spec.format = PA_SAMPLE_S16LE;
        sample_spec.channels = 2;
        sample_spec.rate = mix_rate;
        
        pa_stream = pa_stream_new(pa_context, "Audio", &sample_spec, nullptr);
        
        // 连接到输出设备
        pa_stream_connect_playback(
            pa_stream,
            nullptr,  // 默认设备
            nullptr,
            PA_STREAM_NOFLAGS,
            nullptr,
            nullptr
        );
        
        return OK;
    }
    
    virtual void start() override {
        // PulseAudio 在连接时自动开始
    }
    
    virtual int get_mix_rate() const override {
        return mix_rate;
    }
    
    virtual SpeakerMode get_speaker_mode() const override {
        return speaker_mode;
    }
    
    virtual void mix_audio(int p_frames) override {
        size_t write_bytes = p_frames * 2 * sizeof(int16_t);
        
        // 写入音频数据
        const float *mix_buffer = AudioServer::get_singleton()->get_mix_buffer();
        
        // 转换为 16 位整数
        Vector<int16_t> pcm_buffer;
        pcm_buffer.resize(p_frames * 2);
        
        for (int i = 0; i < p_frames * 2; i++) {
            float sample = CLAMP(mix_buffer[i], -1.0f, 1.0f);
            pcm_buffer[i] = (int16_t)(sample * 32767.0f);
        }
        
        pa_stream_write(
            pa_stream,
            pcm_buffer.ptr(),
            write_bytes,
            nullptr,
            0,
            PA_SEEK_RELATIVE
        );
    }
    
    virtual void lock() override {
        pa_threaded_mainloop_lock(pa_mainloop);
    }
    
    virtual void unlock() override {
        pa_threaded_mainloop_unlock(pa_mainloop);
    }
    
    virtual void finish() override {
        if (pa_stream) {
            pa_stream_disconnect(pa_stream);
            pa_stream_unref(pa_stream);
        }
        
        if (pa_context) {
            pa_context_disconnect(pa_context);
            pa_context_unref(pa_context);
        }
        
        if (pa_mainloop) {
            pa_threaded_mainloop_stop(pa_mainloop);
            pa_threaded_mainloop_free(pa_mainloop);
        }
    }
};
```

---

## 5. 平台检测与条件编译

### 5.1 编译时平台检测

Godot 使用 SCons 构建系统进行编译时平台检测：

```python
# platform/detect.py

def configure(env):
    # 检测操作系统
    if env["platform"] == "":
        if sys.platform == "win32" or sys.platform == "cygwin":
            env["platform"] = "windows"
        elif sys.platform.startswith("linux"):
            env["platform"] = "linuxbsd"
        elif sys.platform == "darwin":
            env["platform"] = "macos"
    
    # 添加平台定义
    if env["platform"] == "windows":
        env.Append(CPPDEFINES=["WINDOWS_ENABLED"])
    elif env["platform"] == "linuxbsd":
        env.Append(CPPDEFINES=["LINUXBSD_ENABLED", "UNIX_ENABLED"])
    elif env["platform"] == "macos":
        env.Append(CPPDEFINES=["MACOS_ENABLED", "UNIX_ENABLED"])
    elif env["platform"] == "android":
        env.Append(CPPDEFINES=["ANDROID_ENABLED"])
    elif env["platform"] == "ios":
        env.Append(CPPDEFINES=["IOS_ENABLED"])
```

### 5.2 运行时平台检测

```cpp
// core/os/os.cpp

OS *OS::create_singleton() {
#if defined(WINDOWS_ENABLED)
    return memnew(OS_Windows);
#elif defined(LINUXBSD_ENABLED)
    return memnew(OS_LinuxBSD);
#elif defined(MACOS_ENABLED)
    return memnew(OS_MacOS);
#elif defined(ANDROID_ENABLED)
    return memnew(OS_Android);
#elif defined(IOS_ENABLED)
    return memnew(OS_IOS);
#elif defined(WEB_ENABLED)
    return memnew(OS_Web);
#else
    #error "Unsupported platform"
#endif
}
```

### 5.3 功能检测宏

```cpp
// core/config/engine_config.h

// 图形 API
#if defined(VULKAN_ENABLED)
    // Vulkan 可用
#endif

#if defined(D3D12_ENABLED)
    // Direct3D 12 可用
#endif

#if defined(METAL_ENABLED)
    // Metal 可用
#endif

#if defined(GLES3_ENABLED)
    // OpenGL ES 3.0 可用
#endif

// 音频驱动
#if defined(WASAPI_ENABLED)
    // Windows Audio Session API 可用
#endif

#if defined(PULSEAUDIO_ENABLED)
    // PulseAudio 可用
#endif

#if defined(ALSA_ENABLED)
    // ALSA 可用
#endif

#if defined(COREAUDIO_ENABLED)
    // CoreAudio 可用
#endif
```

### 5.4 平台特定源文件

```python
# core/SCsub

import os

env = env.Clone()

# 添加平台特定源文件
if env["platform"] == "windows":
    env.add_source_files(env.core_sources, "platform/windows/*.cpp")
elif env["platform"] == "linuxbsd":
    env.add_source_files(env.core_sources, "platform/linuxbsd/*.cpp")
elif env["platform"] == "macos":
    # macOS 使用 Objective-C++
    env.add_source_files(env.core_sources, "platform/macos/*.mm")
```

---

## 6. 驱动系统扩展

### 6.1 添加新的图形驱动

要为 Godot 添加新的图形驱动，需要：

1. **实现 RenderingDeviceDriver 接口**
2. **添加平台检测**
3. **集成到构建系统**

```cpp
// drivers/rendering/rendering_device_driver_newapi.h

class RenderingDeviceDriverNewAPI : public RenderingDeviceDriver {
    // 新 API 的特定对象
    NewAPIDevice device;
    NewAPICommandQueue queue;
    
public:
    virtual Error initialize() override {
        // 初始化新 API
        device = NewAPICreateDevice();
        return OK;
    }
    
    virtual RID texture_create(
        const TextureFormat &p_format,
        const TextureView &p_view
    ) override {
        // 使用新 API 创建纹理
        NewAPITexture texture = NewAPICreateTexture(device, ...);
        return texture_owner.make_rid(Texture{texture});
    }
    
    // ... 实现其他接口
};
```

```python
# drivers/SCsub

# 添加新图形驱动
if "newapi" in env["drivers"]:
    env.add_source_files(env.drivers_sources, "rendering/newapi/*.cpp")
    env.Append(CPPDEFINES=["NEWAPI_ENABLED"])
```

### 6.2 添加新的音频驱动

```cpp
// drivers/audio/audio_driver_newaudio.h

class AudioDriverNewAudio : public AudioDriver {
    NewAudioDevice device;
    
public:
    virtual Error init() override {
        // 初始化新音频 API
        return OK;
    }
    
    virtual void mix_audio(int p_frames) override {
        // 混合音频数据
    }
    
    // ... 实现其他接口
};
```

---

## 7. 实战案例分析

### 7.1 案例一：添加窗口透明度支持

**需求**：为 Windows 平台添加窗口透明度支持

**实现步骤**：

1. **修改 OS_Windows**：

```cpp
// platform/windows/os_windows.cpp

void OS_Windows::set_window_per_pixel_transparency_enabled(bool p_enabled) {
    LONG_PTR style = GetWindowLongPtr(hwnd, GWL_EXSTYLE);
    
    if (p_enabled) {
        style |= WS_EX_LAYERED;
    } else {
        style &= ~WS_EX_LAYERED;
    }
    
    SetWindowLongPtr(hwnd, GWL_EXSTYLE, style);
}

void OS_Windows::set_window_alpha(float p_alpha) {
    BYTE alpha = CLAMP(p_alpha * 255, 0, 255);
    
    SetLayeredWindowAttributes(
        hwnd,
        0,  // 不使用色键
        alpha,
        LWA_ALPHA
    );
}
```

2. **修改 DisplayServerWindows**：

```cpp
// platform/windows/display_server_windows.cpp

void DisplayServerWindows::window_set_per_pixel_transparency_enabled(
    bool p_enabled
) {
    OS_Windows *os = static_cast<OS_Windows *>(OS::get_singleton());
    os->set_window_per_pixel_transparency_enabled(p_enabled);
}

void DisplayServerWindows::window_set_alpha(float p_alpha) {
    OS_Windows *os = static_cast<OS_Windows *>(OS::get_singleton());
    os->set_window_alpha(p_alpha);
}
```

3. **添加到 DisplayServer 接口**：

```cpp
// servers/display_server.h

class DisplayServer {
public:
    virtual void window_set_per_pixel_transparency_enabled(bool p_enabled) {}
    virtual void window_set_alpha(float p_alpha) {}
};
```

### 7.2 案例二：添加高 DPI 支持

**需求**：为 Linux 平台添加高 DPI 支持

**实现步骤**：

1. **检测 DPI**：

```cpp
// platform/linuxbsd/os_linuxbsd.cpp

int OS_LinuxBSD::get_screen_dpi(int p_screen) const {
    Display *display = x11_get_display();
    
    // 使用 X11 DPI
    int screen_width_px = DisplayWidth(display, p_screen);
    int screen_width_mm = DisplayWidthMM(display, p_screen);
    
    if (screen_width_mm > 0) {
        return (screen_width_px * 254) / (screen_width_mm * 10);
    }
    
    return 96; // 默认 DPI
}
```

2. **设置 DPI 缩放**：

```cpp
// platform/linuxbsd/display_server_x11.cpp

void DisplayServerX11::set_window_dpi_scale(float p_scale) {
    dpi_scale = p_scale;
    
    // 通知窗口管理器
    XEvent xev;
    memset(&xev, 0, sizeof(xev));
    xev.type = ClientMessage;
    xev.xclient.window = x11_window;
    xev.xclient.message_type = XInternAtom(display, "_NET_WM_WINDOW_SCALE", False);
    xev.xclient.format = 32;
    xev.xclient.data.l[0] = (long)(p_scale * 1000);
    xev.xclient.data.l[1] = 0;
    
    XSendEvent(display, DefaultRootWindow(display), False,
              SubstructureNotifyMask | SubstructureRedirectMask, &xev);
}
```

### 7.3 案例三：添加新的输入设备支持

**需求**：添加 VR 手柄支持

**实现步骤**：

1. **定义手柄接口**：

```cpp
// core/os/joystick.h

class JoystickVR : public Joystick {
    VRDevice *vr_device;
    
public:
    virtual void open(int p_device) override {
        // 打开 VR 设备
        vr_device = VRServer::get_singleton()->get_device(p_device);
    }
    
    virtual float get_axis(int p_axis) const override {
        if (vr_device) {
            return vr_device->get_axis(p_axis);
        }
        return 0.0f;
    }
    
    virtual bool is_button_pressed(int p_button) const override {
        if (vr_device) {
            return vr_device->is_button_pressed(p_button);
        }
        return false;
    }
};
```

2. **注册手柄**：

```cpp
// core/os/os.cpp

void OS::initialize_joysticks() {
    // 标准手柄
    joysticks.push_back(memnew(JoystickStandard));
    
    // VR 手柄
    if (VRServer::get_singleton()->is_initialized()) {
        for (int i = 0; i < VRServer::get_singleton()->get_device_count(); i++) {
            joysticks.push_back(memnew(JoystickVR));
        }
    }
}
```

---

## 8. 总结

### 8.1 核心概念回顾

1. **OS 单例**：提供平台无关的系统级操作接口
2. **DisplayServer**：统一窗口管理和显示操作
3. **RenderingDeviceDriver**：抽象不同图形 API
4. **AudioDriver**：抽象不同音频 API
5. **平台检测**：编译时和运行时平台识别
6. **条件编译**：根据平台选择特定代码

### 8.2 架构优势

```
✅ 平台独立性   - 统一接口，平台隔离
✅ 性能优化     - 最小抽象，直接 API 调用
✅ 易于扩展     - 插件式架构
✅ 代码复用     - 上层平台无关
✅ 可维护性     - 清晰分层
✅ 调试友好     - 平台代码隔离
```

### 8.3 学习路径

1. **基础阶段**：
   - 阅读 OS、DisplayServer 基类
   - 理解平台抽象原理
   - 学习条件编译机制

2. **进阶阶段**：
   - 研究具体平台实现
   - 理解图形驱动架构
   - 学习音频系统设计

3. **专家阶段**：
   - 参与平台移植
   - 贡献驱动改进
   - 扩展平台支持

### 8.4 实用技巧

1. **调试平台代码**：
   - 使用平台特定的调试工具
   - 启用验证层（Vulkan）
   - 添加详细日志

2. **性能优化**：
   - 减少抽象层开销
   - 使用平台特定优化
   - 避免不必要的系统调用

3. **兼容性测试**：
   - 测试多个平台版本
   - 验证驱动程序兼容性
   - 测试边缘情况

---

**参考文献**:
- Godot Engine 源码: https://github.com/godotengine/godot
- Platform Abstraction Design: https://docs.godotengine.org/
- Vulkan Specification: https://www.khronos.org/vulkan/

**下一章**: [02-display-server.md](02-display-server.md) - 显示服务器详解
