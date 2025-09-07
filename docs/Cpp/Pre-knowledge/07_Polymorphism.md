



# 多态性与虚函数

本章汇总“多态”相关概念、在 C++ 中的实现方式与使用注意点，并给出可编译的示例与设计建议。

## 一、什么是多态
多态（polymorphism）指相同的接口调用在不同类型的对象上产生不同行为的能力。常见分类：静态多态与动态多态。

简要区分：
- 静态多态（compile-time polymorphism）：由模板或函数重载实现，调用的具体代码在编译期决定。常见形式：模板实例化、函数重载、内联等。
- 动态多态（run-time polymorphism）：通过基类指针/引用和虚函数实现，运行时决定调用哪一个覆盖了的实现。

## 二、静态多态示例
1) 模板（template）

```cpp
#include <iostream>
#include <typeinfo>

template<typename T>
class My {
public:
	void f(const T &x) { std::cout << typeid(x).name() << '\n'; }
};

int main() {
	My<int> m1; My<float> m2;
	m1.f(10);   // 输出 int（实现由编译器为 My<int> 生成）
	m2.f(20.0f); // 输出 float
}
```

2) 函数重载（示例略：原则是根据参数的静态类型在编译期选择重载）

> 说明：静态多态在运行时没有虚表开销，但缺乏运行时类型灵活性。

## 三、动态多态（虚函数）
动态多态依赖虚函数表（vtable）来在运行时选择合适的函数实现。重要规则：
- 重载解析（overload resolution）在编译期进行，基于表达式的静态类型和参数的静态类型；
- 一旦选择了某个虚函数签名，虚调用会在运行时根据对象的动态类型进行分派。

下面给出一个常用的示例，展示重载解析与虚调度如何配合工作：

```cpp
#include <iostream>
using namespace std;

class B; // 前向声明

class A {
public:
	virtual ~A() {}
	virtual void f(A*) { cout << 1 << '\n'; }
	virtual void f(B*) { cout << 2 << '\n'; }
};

class B : public A {
public:
	virtual ~B() {}
	void f(A*) override { cout << 3 << '\n'; }
	void f(B*) override { cout << 4 << '\n'; }
};

int main() {
	B b;
	A *pa = &b; // pa 的静态类型是 A*

	pa->f(&b); // 编译期选择 A::f(B*)（因为参数是 B*），运行期分派到 B::f(B*) -> 输出 4
	pa->f(pa); // 编译期选择 A::f(A*)，运行期分派到 B::f(A*) -> 输出 3
	b.f(pa);    // 对象是 B，且表达式的静态类型为 B，编译期选择 B::f(A*) -> 输出 3
}
```

要点回顾：
- 重载解析使用表达式的静态类型（例如 `pa` 是 `A*`），因此决定了将调用哪个重载签名；随后再做虚调度（dynamic dispatch）以选择派生类的实现。
- C++ 默认只做单分派（single dispatch）：虚函数基于调用对象的动态类型进行分派，但参数的动态类型不参与重载选择。如果需要基于参数动态类型（双重分派），常用的解决方案包括 Visitor 模式 或 显式的动态类型检测（dynamic_cast）。

## 四、子类型化与接口设计
通过基类指针/引用访问派生类实现是一种常见模式，示例：

```cpp
Parent *p = new Child1;
p->Func();
delete p; // 基类析构函数应为虚析构，以避免资源泄露

Child2 myObj;
Parent &obj = myObj;
obj.Func();

void Proc(Parent *p) { p->Func(); }
```

设计建议：
- 基类若存在多态删除（delete p），必须声明 `virtual ~Parent()`；
- 将接口（抽象行为）放在基类，把具体实现放在派生类，保持对客户端的透明。

## 五、示例场景：接口与实现分离
![image-20240629202006877](C:\Users\10164\AppData\Roaming\Typora\typora-user-images\image-20240629202006877.png)

示例（更安全的设计：使用虚函数或抽象基类）：

```cpp
class Fruit {
public:
	virtual ~Fruit() = default;
	virtual int Energy() const = 0; // 抽象接口
};

class Apple : public Fruit {
	int m_energy;
public:
	Apple(int e): m_energy(e) {}
	int Energy() const override { return m_energy; }
};

class Mouse {
	int weight = 0;
public:
	void eat(const Fruit &fruit) { weight += static_cast<int>(fruit.Energy() * 0.15); }
};
```

## 六、虚拟拷贝（克隆）与限制
- C++ 中拷贝构造函数不能是虚的；若需要从基类指针复制得到派生类的完整对象，常用做法是定义虚拟 `clone()`：

```cpp
struct Base {
	virtual ~Base() = default;
	virtual Base* clone() const = 0;
};

struct Derived : Base {
	Derived* clone() const override { return new Derived(*this); }
};
```

## 七、使用继承与虚机制的注意事项与不足
常见问题与建议：
- 虚函数会引入运行时开销（vtable），但在大多数场景这是可接受的；
- 过度使用继承会增加耦合，优先考虑组合（composition）和接口设计；
- 需要双分派场景可考虑 Visitor 模式或使用 std::variant + std::visit（在支持的场景下优先考虑类型安全的替代方案）。

----

如果你希望，我可以继续：
- 为本章补充更多可编译的小示例（如 Visitor 模式示例、clone 工厂、线程安全的多态使用注意）；
- 将本章拆成更小的子文件，便于单独维护与阅读。

