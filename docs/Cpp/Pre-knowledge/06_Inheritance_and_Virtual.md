## 



# 继承、类型转换与虚基类

下文将继承相关概念按主题整理：继承语义、派生成员、构造/析构顺序、对象切片、类型转换操作符（四大 cast）以及虚基类的要点。保留原图示位置供参考。

## 15 继承（Inheritance）

目的：代码/行为复用与多态。常见对比：
- 黑盒复用（组合/聚合/依赖）：通过接口使用其他类，而不依赖其内部实现；
- 白盒复用（继承）：子类可访问基类受保护成员并扩展/重用实现。

总体建议：优先使用组合（has-a），仅当存在 true 的 is-a 关系并需要多态行为时才使用公有继承（public）。

### 派生类的成员集合

派生类包含：
- 派生类自己定义的成员（函数/数据）；
- 从基类继承的成员（除构造、析构、拷贝/赋值函数外），其中访问性受 `public/protected/private` 控制；
- 基类静态成员在继承层次间只有一份实例。

### 构造与析构顺序

- 构造顺序：先构造基类子对象（按继承声明顺序），再构造派生类成员，最后派生类本体；
- 析构顺序：与构造相反，先派生类析构，再基类析构。

示例：基类成员应通过初始化列表由基类构造函数初始化，而不是在派生构造体内赋值。

```cpp
struct Base { Base(int v):v(v){} int v; };
struct Derived : Base { Derived(): Base(42) {} };
```

### 成员函数的覆盖与隐藏

- 隐藏（name hiding）：派生类定义与基类同名但不同参数列表的函数，会隐藏基类同名所有重载；可用 `using Base::f;` 将基类重载引入派生类作用域。
- 覆盖（override）：当基类函数为 `virtual`，派生类实现相同签名即为覆盖，推荐在 C++11 之后使用 `override` 关键字以获得编译器检查。

示例：

```cpp
struct B { virtual void f() {} };
struct D : B { void f() override {} }; // 推荐
```

### 对象切片（Object slicing）

当把派生类对象赋值/拷贝到基类对象时，派生部分被裁剪（slicing）。因此应尽量通过指针或引用传递基类类型以保留多态性。

```cpp
struct Base { int b; virtual ~Base()=default; };
struct Derived : Base { int d; };
Derived dd; Base b = dd; // slicing：b 不含 d
```

## 16 类型转换与 C++ 四大 cast

常用转换运算符：`static_cast`、`const_cast`、`reinterpret_cast`、`dynamic_cast`。选择合适的 cast 能提高可读性并限制错误。

- `static_cast<T>(e)`：编译期转换（隐式/显式转换的显式写法），用于上下行转换（在安全可控情形）。
- `const_cast<T>(e)`：用于移除或添加 const/volatile 修饰，仅用于调整限定符，不改变对象实际类型。
- `reinterpret_cast<T>(e)`：低级别的重新解释，通常用于与底层/平台相关代码（指针<->整数等），应谨慎使用。
- `dynamic_cast<T>(e)`：运行时安全的下行转换（基类指针/引用 -> 派生类指针/引用），要求基类具有多态（至少一个虚函数），失败时指针返回 `nullptr`，引用抛出 `std::bad_cast`。

示例：安全的向上与向下转换

```cpp
struct Base { virtual ~Base() = default; };
struct Derived : Base { void only_in_d() {} };

Base* up = new Derived();        // 向上转换（安全）
Derived* down = dynamic_cast<Derived*>(up); // 向下转换（运行时检查）
if(down) down->only_in_d();
delete up;
```

注意：对象型（按值）转换会触发裁剪或调用转换构造，通常不建议用于多态传递。

## 17 虚基类（Virtual inheritance）与多重继承要点

多重继承允许类同时继承自多个基类。问题示例：菱形（diamond）继承会产生重复的虚基子对象，需要虚继承（virtual）解决共享基类实例的问题。

缺点与权衡：
- 虚继承增加对象模型复杂性与运行时开销（可能需要额外指针/偏移来定位共享基子对象）；
- 使基类设计需要提前考虑是否用于多重继承；
- 编译器实现细节（对象布局）平台相关。

替代策略（当多重继承过于昂贵或复杂时）：
- 限定只使用单继承并通过组合实现多态行为；
- 使用接口类（纯虚基类，只有虚函数、无数据）与组合组合实现类似效果，避免数据冲突。
