# 第1周: 现代C++基础

> **学习目标**: 掌握现代C++核心特性，为引擎开发打基础
>
> **时间安排**: 2026-02-18 ~ 2026-02-25
> **学习时长**: 每天2-3小时

---

## 本周学习重点

### 1. 现代C++核心特性
- [ ] 智能指针：`std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`
- [ ] RAII惯用法和资源管理
- [ ] 右值引用与移动语义（`std::move`, `std::forward`）
- [ ] Lambda表达式和函数对象
- [ ] 模板基础（函数模板、类模板）

### 2. C++标准库
- [ ] STL容器（`vector`, `map`, `unordered_map`, `string`）
- [ ] 算法库（`std::sort`, `std::find`, `std::transform`）
- [ ] `std::optional`, `std::variant`, `std::any`

---

## 学习资源

### 必读内容
- **《C++ Primer》第5版** - 第12、13、16章
- **《Effective Modern C++》** - Scott Meyers
  - 条款1-15：类型推导
  - 条款20-26：移动语义
  - 条款29-33：智能指针

### 在线资源
- https://en.cppreference.com/ - C++参考文档
- https://github.com/isocpp/CppCoreGuidelines - C++核心指南

---

## 核心知识点详解

### 智能指针

#### std::unique_ptr
独占所有权，无法复制，只能移动。

```cpp
// 创建unique_ptr
std::unique_ptr<MyClass> ptr1(new MyClass());
// 或使用make_unique (C++14)
auto ptr2 = std::make_unique<MyClass>();

// 转移所有权
std::unique_ptr<MyClass> ptr3 = std::move(ptr1);  // ptr1变为nullptr

// 自定义删除器
std::unique_ptr<FILE, decltype(&fclose)> fp(fopen("test.txt", "r"), fclose);
```

#### std::shared_ptr
共享所有权，使用引用计数。

```cpp
// 创建shared_ptr
std::shared_ptr<MyClass> ptr1 = std::make_shared<MyClass>();
std::shared_ptr<MyClass> ptr2 = ptr1;  // 引用计数+1

// 检查引用计数
std::cout << ptr1.use_count() << std::endl;

// 避免循环引用
class B;  // 前向声明

class A {
    std::shared_ptr<B> b_ptr;
};

class B {
    std::weak_ptr<A> a_ptr;  // 使用weak_ptr打破循环
};
```

#### std::weak_ptr
弱引用，不影响shared_ptr的引用计数。

```cpp
std::weak_ptr<MyClass> weak_ptr = shared_ptr;

// 使用前需要lock()
if (auto ptr = weak_ptr.lock()) {
    // 使用ptr
} else {
    // 对象已被销毁
}
```

---

### RAII惯用法

**Resource Acquisition Is Initialization** - 资源获取即初始化

```cpp
// 传统方式（容易出错）
FILE* fp = fopen("test.txt", "r");
if (fp) {
    // 使用fp
    if (error) {
        fclose(fp);  // 多处需要记得关闭
        return;
    }
    fclose(fp);
}

// RAII方式（自动管理）
class FileGuard {
    FILE* fp;
public:
    FileGuard(const char* filename) : fp(fopen(filename, "r")) {}
    ~FileGuard() { if (fp) fclose(fp); }
    operator FILE*() { return fp; }
};

FileGuard fp("test.txt");  // 自动关闭
```

---

### 移动语义

```cpp
class BigObject {
    int* data;
    size_t size;

public:
    // 构造函数
    BigObject(size_t n) : data(new int[n]), size(n) {}

    // 拷贝构造（深拷贝）
    BigObject(const BigObject& other)
        : data(new int[other.size]), size(other.size) {
        std::copy(other.data, other.data + size, data);
    }

    // 移动构造（窃取资源）
    BigObject(BigObject&& other) noexcept
        : data(other.data), size(other.size) {
        other.data = nullptr;  // 置空，避免析构时释放
        other.size = 0;
    }

    ~BigObject() {
        delete[] data;  // nullptr安全
    }
};

// 使用
BigObject obj1(1000);
BigObject obj2 = std::move(obj1);  // 移动，不拷贝
```

---

### Lambda表达式

```cpp
// 基本语法
auto lambda = [](int x, int y) { return x + y; };

// 捕获变量
int a = 10;
auto f1 = [a](int x) { return x + a; };        // 按值捕获
auto f2 = [&a](int x) { return x + a; };       // 按引用捕获
auto f3 = [=](int x) { return x + a; };        // 全部按值
auto f4 = [&](int x) { return x + a; };       // 全部按引用

// 可变lambda
auto f5 = [a](int x) mutable { a++; return x + a; };

// 与STL算法结合
std::vector<int> v = {1, 2, 3, 4, 5};
std::for_each(v.begin(), v.end(), [](int& n) { n *= 2; });

// 排序
std::sort(v.begin(), v.end(), [](int a, int b) {
    return a > b;  // 降序
});
```

---

### 模板基础

```cpp
// 函数模板
template<typename T>
T add(T a, T b) {
    return a + b;
}

// 类型推导
auto result = add(1, 2);        // int
auto result2 = add(1.0, 2.0);   // double

// 类模板
template<typename T>
class Stack {
    std::vector<T> data;
public:
    void push(const T& item) { data.push_back(item); }
    T pop() {
        T val = data.back();
        data.pop_back();
        return val;
    }
};

// 模板特化
template<>
class Stack<bool> {
    // 特殊实现
};
```

---

### STL容器

```cpp
// vector - 动态数组
std::vector<int> v = {1, 2, 3};
v.push_back(4);
v.emplace_back(5);  // 就地构造，更高效

// map - 有序映射
std::map<std::string, int> m;
m["apple"] = 5;
m["banana"] = 3;

for (const auto& [key, value] : m) {
    std::cout << key << ": " << value << std::endl;
}

// unordered_map - 哈希表
std::unordered_map<std::string, int> um;
um["orange"] = 7;

// string操作
std::string str = "Hello, World!";
str.append(" How are you?");
auto pos = str.find("World");
if (pos != std::string::npos) {
    str.replace(pos, 5, "C++");
}
```

---

### std::optional, std::variant

```cpp
// std::optional - 可选值
std::optional<int> divide(int a, int b) {
    if (b == 0) return std::nullopt;
    return a / b;
}

auto result = divide(10, 2);
if (result) {
    std::cout << *result << std::endl;
}

// std::variant - 类型安全的联合
std::variant<int, float, std::string> value;

value = 42;
value = 3.14f;
value = "hello";

std::visit([](auto&& arg) {
    std::cout << arg << std::endl;
}, value);
```

---

## 实践练习

### 练习1: 智能指针使用场景

创建一个简单的图形对象管理器，使用智能指针管理对象生命周期。

```cpp
class Texture {
    int width, height;
    unsigned char* data;
public:
    Texture(int w, int h) : width(w), height(h) {
        data = new unsigned char[w * h * 4];
        std::cout << "Texture created\n";
    }
    ~Texture() {
        delete[] data;
        std::cout << "Texture destroyed\n";
    }
};

// TODO: 实现TextureManager类
// - 使用unique_ptr管理独占纹理
// - 使用shared_ptr管理共享纹理
// - 提供加载、释放、查询接口
```

### 练习2: RAII资源管理

实现以下RAII包装器：
- `MutexLock` - 自动加锁/解锁
- `Timer` - 计时作用域
- `ScopedCall` - 作用域结束时调用回调

### 练习3: 移动语义优化

实现一个`DynamicArray`类，支持移动语义以避免不必要的拷贝。

```cpp
template<typename T>
class DynamicArray {
    T* data;
    size_t size;
    size_t capacity;

public:
    DynamicArray();
    ~DynamicArray();

    // TODO: 实现拷贝构造/赋值
    // TODO: 实现移动构造/赋值
    // TODO: 实现 push_back 和 emplace_back
};
```

---

## 验证标准

- [ ] 理解智能指针的使用场景
  - [ ] 能解释何时使用unique_ptr vs shared_ptr
  - [ ] 理解weak_ptr如何解决循环引用
  - [ ] 能正确使用make_unique和make_shared

- [ ] 能解释移动语义的作用
  - [ ] 理解左值 vs 右值
  - [ ] 能实现移动构造函数
  - [ ] 理解 noexcept 的重要性

- [ ] 熟练使用常用STL容器
  - [ ] vector的push_back vs emplace_back
  - [ ] map vs unordered_map的性能差异
  - [ ] 范围for循环和结构化绑定

---

## 学习笔记

### 重点总结
<!-- 在此记录本周学习的重点内容 -->

### 疑问记录
<!-- 在此记录学习过程中的疑问 -->

### 代码实践记录
<!-- 在此记录编写的练习代码和遇到的问题 -->

---

## 下周预告

第2周将进行环境搭建与图形学基础学习：
- 安装开发工具（Visual Studio / CMake）
- 克隆Piccolo引擎仓库
- 学习渲染管线基础
- 复习线性代数知识

**准备事项**:
- [ ] 确保C++开发环境可用
- [ ] 安装Git和CMake
- [ ] 准备图形学学习资料
