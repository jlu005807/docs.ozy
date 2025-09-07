# lambda 表达式的类型

在 C++ 中，lambda 表达式实际上是一个匿名的闭包类型（closure type），每个 lambda 表达式都有自己独特的类型。这种类型是编译器为该 lambda 生成的匿名类，通常无法直接写出它的类型名。可以通过 `decltype` 获得该类型。

### 理解 lambda 表达式的类型

当我们定义一个 lambda 表达式时，编译器会为其生成一个匿名类并在其中定义 `operator()`。例如：

```cpp
auto deleter = [](int* ptr) {
    std::cout << "Lambda deleter called\n";
    delete ptr;
};
```

上述 lambda 在编译器内部等价于：

```cpp
struct __lambda_deleter {
    void operator()(int* ptr) const {
        std::cout << "Lambda deleter called\n";
        delete ptr;
    }
};
```

因此，`deleter` 的类型是一个匿名类，具有 `operator()`。

### 使用 `decltype` 获取 lambda 的类型

如果需要把 lambda 的类型用作模板参数或类型别名，可以使用 `decltype`：

```cpp
using DeleterType = decltype(deleter);
DeleterType d = deleter; // 复制 lambda 对象
```

一个常见场景是为 `std::unique_ptr` 提供自定义删除器：

```cpp
#include <memory>
#include <iostream>

int main() {
    auto del = [](int* p){ std::cout << "delete: " << *p << '\n'; delete p; };
    using DelType = decltype(del);

    std::unique_ptr<int, DelType> p(new int(42), del);
    // 或者直接写成： std::unique_ptr<int, decltype(del)> p(new int(42), del);
}
```

注意：lambda 的类型通常很长且是匿名的，直接把 `decltype(lambda)` 写入模板参数是常见做法。若需要类型擦除或更灵活的传递方式，可使用 `std::function`（有性能开销）：

```cpp
#include <functional>
std::function<void(int*)> f = del;
```

小结：lambda 是匿名类，`decltype(lambda)` 可用于获取其确切类型，常用于需要类型作为模板参数的场景（例如 `unique_ptr` 的自定义删除器）。