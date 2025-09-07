[TOC]

# [第2章 `auto`](https://cntransgroup.github.io/EffectiveModernCppChinese/2.Auto/item5.html#第2章-auto)

## **Item 5: Prefer `auto` to explicit type declarations**

- `auto`变量从初始化表达式中推导出类型，所以我们必须初始化。

```cpp
int x1;                         //潜在的未初始化的变量
    
auto x2;                        //错误！必须要初始化

auto x3 = 0;                    //没问题，x已经定义了

//使用解引用迭代器初始化局部变量
template<typename It>           //如之前一样
void dwim(It b,It e)
{
    while (b != e) {
        auto currValue = *b;
        …
    }
}
```

- 使用C++14，lambda*表达式中的形参也可以使用`auto`：

```cpp
auto derefLess =                                //C++14版本
    [](const auto& p1,                          //被任何像指针一样的东西
       const auto& p2)                          //指向的值的比较函数
    { return *p1 < *p2; };
```

### std::function

- `std::function`是一个C++11标准模板库中的一个模板，泛化了函数指针的概念。
- `std::function`可以指向任何可调用对象，创建`std::function`对象时你也需要提供函数签名，由于它是一个模板所以你需要在它的模板参数里面提供。

```cpp
bool(const std::unique_ptr<Widget> &,           //C++11
     const std::unique_ptr<Widget> &)           //std::unique_ptr<Widget>
                                                //比较函数的签名
std::function<bool(const std::unique_ptr<Widget> &,
                   const std::unique_ptr<Widget> &)> func;
```

*lambda*表达式能产生一个可调用对象，所以我们现在可以把闭包存放到`std::function`对象中。

```cpp
//不使用auto写出C++11版的derefUPLess
std::function<bool(const std::unique_ptr<Widget> &,
                   const std::unique_ptr<Widget> &)>
derefUPLess = [](const std::unique_ptr<Widget> &p1,
                 const std::unique_ptr<Widget> &p2)
                { return *p1 < *p2; };

```

具体实现我们得知通过`std::function`调用一个闭包几乎无疑比`auto`声明的对象调用要慢。`std::function`方法比`auto`方法要更耗空间且更慢，还可能有*out-of-memory*异常。

- `auto`除了可以避免未初始化的无效变量，省略冗长的声明类型，直接保存闭包外，可以实现类型快捷方式转变

```cpp
auto sz =v.size();                      //sz的类型是std::vector<int>::size_type
```



### 总结

> [!note]
>
> - **`auto`变量必须初始化**，通常它可以避免一些移植性和效率性的问题，也使得重构更方便，还能让你少打几个字。
> - 正如[Item2](https://cntransgroup.github.io/EffectiveModernCppChinese/1.DeducingTypes/item2.html)和[6](https://cntransgroup.github.io/EffectiveModernCppChinese/2.Auto/item6.html)讨论的，`auto`类型的变量可能会踩到一些陷阱。

---

## **Item 6: Use the explicitly typed initializer idiom when `auto` deduces undesired types**



- 假如我有一个函数，参数为`Widget`，返回一个`std::vector<bool>`，这里的`bool`表示`Widget`是否提供一个独有的特性。

```cpp
std::vector<bool> features(const Widget& w);
Widget w;
//假设第5个bit表示Widget是否具有高优先级
…
bool highPriority = features(w)[5];     //w高优先级吗？
…
processWidget(w, highPriority);         //根据它的优先级处理w

```

- 对`std::vector<bool>`的`operator[]`运算符返回的是一个`std::vector<bool>::reference`对象（是一个在`std::vector<bool>`中内嵌的class）

```cpp
bool highPriority = features(w)[5];     //显式的声明highPriority的类型
```

- 这里，`features`返回一个`std::vector<bool>`对象后再调用`operator[]`，`operator[]`将会返回一个`std::vector<bool>::reference`对象，然后再通过隐式转换赋值给`bool`变量`highPriority`。`highPriority`因此表示的是`features`返回的`std::vector<bool>`中的第五个*bit*，这也正如我们所期待的那样。

```cpp
auto highPriority = features(w)[5];     //推导highPriority的类型
```

- 同样的，`features`返回一个`std::vector<bool>`对象，再调用`operator[]`，`operator[]`将会返回一个`std::vector<bool>::reference`对象，但是现在这里有一点变化了，`auto`推导`highPriority`的类型为`std::vector<bool>::reference`，但是`highPriority`对象没有第五*bit*的值。

原因：`std::vector<bool>::reference`是一个代理类

> [!note]
>
> 所谓代理类就是以模仿和增强一些类型的行为为目的而存在的类。

- 作为一个通则，**不可见的代理类通常不适用于`auto`**。

- 解决：强制使用一个不同的类型推导形式，这种方法我通常称之为显式类型初始器惯用法（*the explicitly typed initialized idiom*)。

  > ```cpp
  > auto highPriority = static_cast<bool>(features(w)[5]);
  > ```
  >
  > 这里，`features(w)[5]`还是返回一个`std::vector<bool>::reference`对象，就像之前那样，但是这个转型使得表达式类型为`bool`，然后`auto`才被用于推导`highPriority`。在运行时，对`std::vector<bool>::operator[]`返回的`std::vector<bool>::reference`执行它支持的向`bool`的转型，在这个过程中指向`std::vector<bool>`的指针已经被解引用。这就避开了我们之前的未定义行为。然后5将被用于指向*bit*的指针，`bool`值被用于初始化`highPriority`。

### 总结

> [!note]
>
> - 不可见的代理类可能会使`auto`从表达式中推导出“错误的”类型
> - **显式类型初始器惯用法**(`static_cast<T>`)强制`auto`推导出你想要的结果

