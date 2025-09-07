# nullptr 和 NULL

`nullptr` 在 C++11 中被引入，相比传统的 `NULL`，它在语义和类型安全上更清晰。下面概述了两者的主要差别及为什么推荐使用 `nullptr`：

- 类型安全：`nullptr` 的类型是 `std::nullptr_t`，可以隐式转换为任意指针类型，但不能转换为整数类型（除 bool）。而 `NULL` 常被定义为整数字面量 `0`，在重载或模板上下文中可能被误解为整数，从而造成歧义或错误。
- 模板与重载友好：在模板或重载决议中，`nullptr` 能明确表示空指针意图，而 `NULL`（`0`）可能更倾向于匹配整数重载或导致歧义。
- 可读性：`nullptr` 明确表意，表明这是一个空指针，而不是整数常量。

下面给出一个清晰且可编译的例子，展示 `NULL`（或 `0`）与 `nullptr` 在重载解析上的不同表现：

```cpp
#include <iostream>

void func(char* /*ptr*/) {
    std::cout << "char* 版本\n";
}

void func(int /*i*/) {
    std::cout << "int 版本\n";
}

int main() {
    // 如果使用 0 或者某些实现下的 NULL，可能会调用 func(int)
    // 因为 0 更容易匹配整数参数。例如：
    // func(0); // 通常会选择 func(int)

    // 使用 nullptr 可以保证选择指针重载（char*）
    func(nullptr); // 调用 func(char*)

    return 0;
}
```

说明：示例中通过为 `func` 提供一个接受 `int` 的重载来模拟 `NULL` 作为整数时可能触发的情况；使用 `nullptr` 能保证调用指针重载，从而避免歧义或错误。

小结：在现代 C++ 中，优先使用 `nullptr` 替代 `NULL`，以提高类型安全与可读性。