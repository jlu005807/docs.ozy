# 类的默认成员函数

本章总结构造与析构的规则、初始化列表、拷贝构造/赋值、以及何时需要自定义这些特殊函数。示例采用现代 C++ 风格并给出建议。

## 1 构造函数（构造与初始化）

构造函数用于对象创建时初始化成员。构造函数特点：同名于类，无返回值，为非静态成员函数，可声明为 `explicit` 防止隐式转换。

要点：

- 可以重载多个构造函数；
- 可以设置访问控制（public/private）以实现模式如单例；
- 若没有用户自定义构造函数，编译器会生成默认构造函数（默认构造）；
- C++11 提供 `=default` 和 `=delete` 用于显式控制特殊成员函数的生成。

示例：Meyers 单例（线程安全，自 C++11 起局部静态变量初始化是线程安全的）

```cpp
#include <iostream>
class Singleton {
public:
	static Singleton& instance() {
		static Singleton inst; // 局部静态，延迟初始化且线程安全（C++11+）
		return inst;
	}
	int value() const { return v; }
private:
	Singleton() : v(42) {}
	~Singleton() = default;
	Singleton(const Singleton&) = delete;
	Singleton& operator=(const Singleton&) = delete;
	int v;
};

int main(){
	auto &s = Singleton::instance();
	std::cout << s.value() << '\n';
}
```

### 默认构造、`=default` 与 `=delete`

如果类没有任何用户声明的构造函数，编译器会生成默认构造函数。使用 `=default` 可显式要求编译器生成默认实现；使用 `=delete` 可禁止生成或使用某个特殊函数（例如禁止拷贝）。

```cpp
struct A { A() = default; A(int)=delete; };
```

### 初始化列表（member initializer list）

- 常量成员 (`const`)、引用成员、以及没有默认构造函数的成员对象必须在初始化列表中初始化；
- 成员按声明顺序初始化，与列表顺序无关（以定义顺序为准），因此应按声明顺序写初始化列表以避免混淆；
- 初始化列表可以避免先默认构造再赋值的开销。

示例：

```cpp
struct S {
	const int k;
	std::string &r;
	S(int v, std::string &s): k(v), r(s) {}
};
```

## 2 析构函数

析构函数用于对象销毁时释放资源：析构函数应为 `virtual` 当且仅当类将被作为基类并通过基类指针删除派生对象。

要点：

- 析构函数没有返回值，不能被声明为 `static`；
- 如果基类有虚函数，通常应声明虚析构 `virtual ~Base()`；
- 自动变量（栈上对象）析构由语言自动管理；堆上对象需 `delete` 来释放并调用析构函数。

## 3 拷贝构造与赋值

拷贝构造（copy ctor）用于“从无到有”创建新对象；拷贝赋值（operator=）用于已有对象间的赋值。编译器在未声明时会生成默认的拷贝构造与拷贝赋值，执行成员逐个拷贝（浅拷贝行为）。

签名示例：

```cpp
T(const T& other);      // 拷贝构造
T& operator=(const T&); // 拷贝赋值
```

何时需要自定义：

- 管理资源（裸指针、文件句柄、网络句柄等）时需要深拷贝或移动语义；
- 需要禁止拷贝时使用 `=delete`；

示例：深拷贝

```cpp
struct Buffer {
	Buffer(size_t n): n(n), data(new int[n]){}
	Buffer(const Buffer& o): n(o.n), data(new int[o.n]){
		std::copy(o.data, o.data+o.n, data);
	}
	Buffer& operator=(const Buffer& o){
		if(this==&o) return *this;
		delete[] data;
		n = o.n;
		data = new int[n];
		std::copy(o.data, o.data+o.n, data);
		return *this;
	}
	~Buffer(){ delete[] data; }
private:
	size_t n; int* data;
};
```

### 所有权转移（移动语义）简介

现代 C++ 提倡实现移动构造与移动赋值以高效转移资源：

```cpp
Buffer(Buffer&& o) noexcept : n(o.n), data(o.data){ o.n=0; o.data=nullptr; }
Buffer& operator=(Buffer&& o) noexcept { if(this!=&o){ delete[] data; n=o.n; data=o.data; o.n=0; o.data=nullptr;} return *this; }
```

## 4 规则三/五/零（Rule of Three/Five/Zero）

- 如果需要自定义拷贝构造、拷贝赋值或析构函数，通常需要同时自定义三者（Rule of Three）；
- 在引入移动语义后，扩展为 Rule of Five（拷贝/移动 构造与赋值 + 析构）；
- 如果类不管理资源，尽量遵循 Rule of Zero，依赖编译器生成的特殊函数与 RAII 类型。

## 5 小结与建议

1. 尽量使用初始化列表初始化成员，按声明顺序书写；
2. 使用 `=default`/`=delete` 明确意图；
3. 管理资源时优先使用智能指针（`unique_ptr`/`shared_ptr`），避免手动管理裸指针；
4. 若类管理资源，考虑实现移动构造与移动赋值以提高性能；
5. 对单例使用局部静态（Meyers 单例）并禁止拷贝。



