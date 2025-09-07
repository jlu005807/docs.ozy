# virtual — 虚函数与多态

`virtual` 是实现运行时多态的核心关键词。下文整理常见概念、正确示例和实务建议，便于快速查阅。

## 1 虚函数与动态绑定

当基类的成员函数被声明为 `virtual` 时，通过基类指针或引用调用该函数会在运行时根据对象的实际类型选择具体实现（动态绑定）。

示例：

```cpp
#include <iostream>

struct Base {
    virtual void show() { std::cout << "Base::show\n"; }
    virtual ~Base() = default; // 使 Base 成为多态基类
};

struct Derived : Base {
    void show() override { std::cout << "Derived::show\n"; }
};

int main() {
    Base* b = new Derived();
    b->show();             // 调用 Derived::show
    delete b;              // 正确析构
}
```

使用 `override` 可以让编译器在签名不匹配时给出错误，建议在派生类重写虚函数时总使用。

## 2 纯虚函数与抽象类

纯虚函数使用 `= 0` 声明，含纯虚函数的类称为抽象类，不能被实例化：

```cpp
struct Interface { virtual void f() = 0; };
struct Impl : Interface { void f() override { /* ... */ } };
```

抽象类常用于定义接口或策略。

## 3 虚析构函数

如果一个类有可能通过基类指针被删除，那么基类应声明虚析构函数以保证派生类的析构函数被调用，防止资源泄露。

```cpp
struct B { virtual ~B() = default; };
struct D : B { ~D() { /* 清理 */ } };
```

## 4 名称隐藏与覆盖（hiding vs overriding）

- 覆盖（override）：当基类函数为 `virtual`，派生类提供相同签名的实现；使用 `override` 明确意图。
- 隐藏（hiding）：如果派生类定义了同名但不同签名的函数，会隐藏基类所有同名重载，可用 `using Base::f;` 引入基类重载。

示例（using 引入基类重载）：

```cpp
struct A { virtual void f(int); };
struct B : A { using A::f; void f(double); }; // 保留 A::f(int)
```

## 5 vtable / vptr（实现细节）

大多数实现为每个多态类生成一张虚表（vtable），对象包含一条指向该表的指针（vptr）。这是实现动态分派的常见机制，但具体布局由编译器决定，不要依赖实现细节。

## 6 虚继承（解决菱形继承）

虚继承用于共享菱形继承中的共同基类实例，避免多份基类子对象。但它增加了复杂性与运行时开销：

```cpp
struct A { int x; };
struct B : virtual A { };
struct C : virtual A { };
struct D : B, C { };
```

在 `D` 中只有一份 `A` 子对象（由虚继承保证）。

## 7 性能与设计权衡

- 虚调用会带来一次间接调用（通过 vptr），比非虚函数略慢；
- 对象需要额外存储 vptr（通常为一个指针）；
- 设计时应权衡：使用虚函数以换取可扩展性与清晰的接口，避免在性能敏感的内联小函数上使用虚。对于替代方案，可用模板/CRTP 实现静态多态。

## 8 常见陷阱

- 构造/析构期间不会做动态分派（在基类构造/析构中调用虚函数会按当前构造阶段使用基类版本）；
- 未提供虚析构会导致通过基类指针删除派生对象时发生未定义行为（资源泄漏）；
- 不要依赖 vtable 布局或用 reinterpret_cast 操作 vptr。
