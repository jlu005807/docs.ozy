# dynamic_cast

`dynamic_cast` 是 C++ 中的一个运算符，用于在运行时进行类型安全的向下转换（downcasting）或横向转换（cross-casting）。它主要用于处理含有继承关系的类对象。`dynamic_cast` 的使用主要集中在以下几个方面：

### 主要用途
1. **向下转换（Downcasting）**：
   - 从基类指针或引用转换为派生类指针或引用。
2. **横向转换（Cross-casting）**：
   - 在同一个继承体系内，从一个指向基类的指针或引用转换为另一个派生类的指针或引用。

### 语法
```cpp
dynamic_cast<new_type>(expression)
```
- `new_type`：目标类型，必须是指针或引用类型。
- `expression`：要转换的表达式。

### 使用示例
#### 向下转换
```cpp
class Base {
public:
    virtual ~Base() {} // 必须有虚函数，通常是虚析构函数
};

class Derived : public Base {
public:
    void derivedFunction() {
        std::cout << "Derived function called." << std::endl;
    }
};

Base* basePtr = new Derived();
Derived* derivedPtr = dynamic_cast<Derived*>(basePtr);

if (derivedPtr) {
    derivedPtr->derivedFunction();
} else {
    std::cout << "Dynamic cast failed." << std::endl;
}
```

#### 横向转换
```cpp
class AnotherDerived : public Base {
public:
    void anotherFunction() {
        std::cout << "Another function called." << std::endl;
    }
};

Base* basePtr = new Derived();
AnotherDerived* anotherPtr = dynamic_cast<AnotherDerived*>(basePtr);

# dynamic_cast（与类型转换概览）

`dynamic_cast` 是 C++ 中用于在运行时进行安全的多态类型转换的运算符，常用于：

- 向下转换（downcast）：从基类指针/引用转换为派生类指针/引用；
- 横向转换（cross-cast）：在同一多态继承体系内，通过基类指针/引用转换为其他派生类指针/引用（当类型关系允许时）。

注意：`dynamic_cast` 只适用于多态类型（即类中至少有一个虚函数），因为它依赖 RTTI（运行时类型信息）。

## 语法与行为

```cpp
dynamic_cast<new_type>(expression);
```

- `new_type` 必须是指针或引用类型（或 `void*` 指针）；
- 对指针的转换失败返回 `nullptr`；对引用的转换失败会抛出 `std::bad_cast`；
- 要求被转换的类型是多态类型（类中含虚函数），否则对指针的 `dynamic_cast` 在编译期对基类指针向派生类指针的转换会被拒绝。

## 示例：向下转换（指针与引用）

```cpp
#include <iostream>
#include <typeinfo>

struct Base { virtual ~Base() = default; };
struct Derived : Base { void foo(){ std::cout<<"Derived::foo\n"; } };

int main(){
    Base* p = new Derived;
    if(auto d = dynamic_cast<Derived*>(p)) {
        d->foo(); // 安全
    }
    try {
        Base &r = *p;
        Derived &dr = dynamic_cast<Derived&>(r); // 成功
        (void)dr;
    } catch(const std::bad_cast &e){
        std::cerr<<"bad_cast: "<< e.what() <<"\n";
    }
    delete p;
}
```

如果 `p` 指向的是非 `Derived` 对象，指针转换将返回 `nullptr`，引用转换将抛出 `std::bad_cast`。

## 示例：横向转换（通过基类进行）

```cpp
struct Another : Base { void bar(){ std::cout<<"Another::bar\n";} };

Base* p = new Derived;
// 不能直接 dynamic_cast<Another*>(p) 成功，除非 p 实际指向 Another 对象
Another* a = dynamic_cast<Another*>(p);
if (!a) std::cout<<"convert to Another failed\n";

delete p;
```

## 多重继承与 dynamic_cast

`dynamic_cast` 可以处理带有虚继承或非虚继承的复杂继承图，但行为依赖于对象的真实动态类型和类的多态性。对于跨子层次结构的转换，RTTI 提供了必要信息来判断是否允许转换并计算正确的偏移。

## 何时使用 dynamic_cast

- 当只在运行时才能确定对象的实际类型时；
- 在需要安全检查并根据对象动态类型执行特定操作时；
- 在使用第三方库或大型继承体系时，为了防止未定义行为而选择安全转换。

注意：`dynamic_cast` 会带来运行时开销（RTTI 查询与指针偏移计算），应权衡性能与安全性。

## 类型转换操作符概览（简要）

- `static_cast<T>(expr)`：编译期转换，速度快，但不做运行时类型检查；
- `const_cast<T>(expr)`：移除或添加 `const`/`volatile` 修饰；
- `reinterpret_cast<T>(expr)`：重新解释位模式，一般不可移植，应慎用；
- `dynamic_cast<T>(expr)`：运行时类型安全转换，需多态类型支持（虚函数/RTTI）。

## 继承与类型转换（要点）

- 向上转换（derived -> base）：在 `public` 继承下总是安全且隐式可行；
- 向下转换（base -> derived）：只有在运行时确认对象真实类型时才安全，使用 `dynamic_cast` 可进行检查；
- `protected`/`private` 继承会影响访问权限，决定是否允许隐式转换（编译期规则）。

## 抽象类与接口注意事项

- 抽象类用于定义接口（含纯虚函数）；
- 基类应提供虚析构函数以确保通过基类指针删除派生类对象时能正确析构。

----

