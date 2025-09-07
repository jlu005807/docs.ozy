# 第20章：类关系

本章整理常见的类之间关系及其与继承的组合使用方式，给出概念解释、设计建议和简单代码示例。图片保留原始引用路径（未改动）。

## 1. 概念回顾
- 依赖（Dependency）：某类在实现或函数参数中暂时使用另一类。
- 关联（Association）：类之间存在长期联系（成员指针或引用）。
- 聚合（Aggregation）：弱拥有关系，整体与部分生命周期可独立（通常用裸指针或智能指针表示）。
- 组合（Composition）：强拥有关系，整体负责部分的生命周期（成员对象作为值或独占智能指针）。
- 继承（Inheritance）：表示“is-a”关系，用于重用行为并表示子类型化（subtyping）。

这些关系可单独使用，也可以与继承组合以表达更丰富的设计。

## 2. 依赖 + 继承（基础形式）
依赖通常出现在函数签名或实现内部，例如：

```cpp
struct Helper { void assist(); };

class Base {
public:
	virtual ~Base() = default;
	virtual void doWork(Helper &h) { h.assist(); }
};

class Derived : public Base {
	void doWork(Helper &h) override { /* 用派生类实现替换行为 */ }
};
```

## 3. 依赖 + 继承（演化/变化）
当设计需要在多处分派以不同方式使用某些辅助类时，可以将依赖项通过参数传入，从而使得派生类可以灵活组合行为。

## 4. 关联 + 继承：委托与代理
示例（委托）：

```cpp
class Worker { public: void work() {/*...*/} };

class Manager {
	Worker *w; // 关联关系：Manager 拥有或引用 Worker
public:
	Manager(Worker *ptr): w(ptr) {}
	void manage() { if (w) w->work(); }
};
```

代理（Proxy）通常在不改变接口的前提下间接控制对真实对象的访问（常见于延迟初始化、访问控制、远程代理等）。

## 5. 关联 + 继承：组合（组合是关联的强所有权形式）
组合示例：

```cpp
class Engine { public: void start(){} };

class Car {
	Engine engine; // 组合：Car 直接包含 Engine 的实例，Engine 的生命周期受 Car 控制
public:
	void start() { engine.start(); }
};
```

如果需要将部件作为指针持有以便共享或延迟创建，可使用 `std::unique_ptr`（独占）或 `std::shared_ptr`（共享），分别对应组合与聚合的不同语义。

## 6. 关联 + 继承（变化示意）
图片展示了在继承结构中使用不同关联模式（弱引用、聚合、组合）的场景与生命周期差异。设计时需注意所有权语义：谁负责销毁对象，是否允许共享，是否允许为空等。

## 7. 设计建议
- 优先使用组合/聚合来重用实现，优先考虑 `has-a` 而非 `is-a`，除非确实满足里氏替换原则（Liskov Substitution Principle）。
- 明确所有权：使用值成员、`unique_ptr`、`shared_ptr` 或裸指针来表达不同语义；尽量避免裸新的返回与裸指针的不明确所有权。
- 接口（抽象基类）应只暴露需要的行为，隐藏实现细节。
- 在需要运行时灵活替换实现时使用多态（虚函数）；在性能敏感、类型已知的情况下优先静态多态（模板、内联）。

