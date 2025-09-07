## 

# 转换、名字空间、友元与嵌套类

本章摘取常用要点并给出安全的示例，重点在于可读性与现代 C++ 的建议用法（C++11 及以后）。

## 1 转换函数（Conversion）

1) 内置 -> 自定义：通过构造函数实现。

```cpp
struct A {
	explicit A(int x) : a(x) {} // 推荐 explicit 避免不必要的隐式转换
	int a;
};

// 显式构造
int main() {
	A a1{42};      // 直接列表初始化
	// A a2 = 42;   // 若构造函数不是 explicit，则允许隐式转换
}
```

2) 自定义 -> 内置 或 自定义 -> 自定义：通过 `operator T()` 定义。推荐：
- 标注为 `explicit`（C++11）以防止意外的隐式转换；
- 对于不会修改对象状态的操作，声明为 `const`；
- 避免模糊/二义性的多重转换。

示例：

```cpp
struct B {
	B(int v = 0) : v(v) {}
	explicit operator int() const { return v; } // 需要显式转换
	explicit operator std::string() const { return std::to_string(v); }
private:
	int v;
};

int main() {
	B b(7);
	int x = static_cast<int>(b);        // OK
	// int y = b;                      // 错误（explicit）
	std::string s = static_cast<std::string>(b);
}
```

示例：类型间转换（类到类）

```cpp
struct A { A(int, std::string) {} };
struct C {
	operator A() const { return A(1, "ok"); } // 将 C 转换为 A
};

void f(A){ }
int main(){ C c; f(c); /* 隐式可行，若不希望隐式转换请加 explicit */ }
```

注意：若定义多个转换函数可能引起二义性，尽量只提供必要的转换，并 prefer `explicit`。

## 2 名字空间（namespace）

命名空间用于组织符号并避免命名冲突。常见用法：嵌套命名空间、别名、匿名命名空间。

```cpp
namespace lib { namespace detail {
	void impl() {}
}}

namespace ld = lib::detail; // 别名

int main(){ ld::impl(); }
```

匿名命名空间等价于将符号限定为当前翻译单元的内部链接（比 `static` 更现代）：

// 在 my.h 中不要放匿名命名空间（会导致每个包含者有不同实体）

using 声明与 using 指令：
- `using std::string;`（把单个名字引入）更安全；
- `using namespace std;`（把整个命名空间引入）在头文件中应避免，以免污染所有包含者。

示例（using 的坑）：若两个命名空间都有同名符号，`using namespace` 会导致二义性。

## 3 嵌套类（Nested classes）

嵌套类的访问权限遵循 C++ 的成员访问规则：嵌套类本身的可见性依赖于声明位置。

```cpp
struct Outer {
	struct PublicInner { int v; };
private:
	struct PrivateInner { int v; };
};

int main() {
	Outer::PublicInner pi{42};
	// Outer::PrivateInner x; // 错误：PrivateInner 对外不可见
}
```

嵌套类并不是自动成为外层类的成员函数或友元；需要显式声明。

## 4 友元（friend）

友元可以是自由函数、类的成员函数或整个类。友元使其能够访问类的私有/受保护成员。

要点：
- 友元声明不改变被声明实体的位置或所有权；
- 友元关系是单向且不传递；
- 友元应谨慎使用——它破坏封装，但在需要测试或紧密耦合实现时很实用。

示例：

```cpp
class Box {
	int secret = 42;
	friend int get_secret(const Box& b); // 自由函数成为友元
};

int get_secret(const Box& b) { return b.secret; }

class Owner {
	friend class Inspector; // Inspector 的所有成员都是 Box 的友元
};
```

注意：友元声明常放在类定义内部，若友元为函数，需要在使用前确保名称已声明或前向声明。

## 5 简短笔记：第13、14 章

- chapter13（类间关系）：通常讨论组合/聚合/依赖/关联与生命周期管理，常配合 smart pointer 讨论所有权；
- chapter14（类的设计）：关注接口与实现分离、构造/析构语义、拷贝/移动与异常安全、最小暴露原则等。

